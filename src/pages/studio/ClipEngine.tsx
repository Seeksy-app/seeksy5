import { useState, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Upload, Film, Sparkles, ArrowLeft, Play, Pause,
  Download, Loader2, Clock, Folder, Scissors, X, 
  CheckCircle2, Zap, Users, FileVideo, Link2, 
  Volume2, Wand2, LayoutGrid, Square, Smartphone
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCredits } from "@/hooks/useCredits";
import * as tus from "tus-js-client";

// Cloudflare Stream customer subdomain
const CLOUDFLARE_CUSTOMER_SUBDOMAIN = "customer-typiggwc4l6lm7r2.cloudflarestream.com";

// Processing steps
const PROCESSING_STEPS = [
  { id: 'transcribe', label: 'Transcribing', icon: Volume2 },
  { id: 'detect', label: 'Detecting Hooks', icon: Zap },
  { id: 'score', label: 'Scoring Moments', icon: Sparkles },
  { id: 'generate', label: 'Generating Clips', icon: Scissors },
  { id: 'finalize', label: 'Finalizing', icon: CheckCircle2 },
];

interface Clip {
  id: string;
  user_id: string;
  source_media_id: string;
  ai_job_id: string | null;
  start_seconds: number;
  end_seconds: number;
  duration_seconds: number | null;
  storage_path: string | null;
  title: string | null;
  suggested_caption: string | null;
  virality_score: number | null;
  status: string;
  vertical_url: string | null;
  thumbnail_url: string | null;
  error_message: string | null;
  created_at: string;
}

interface MediaFile {
  id: string;
  file_name: string | null;
  file_url: string | null;
  cloudflare_download_url: string | null;
  cloudflare_uid: string | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  file_size_bytes: number | null;
}

// Helper to get thumbnail URL with Cloudflare fallback
const getThumbnailUrl = (media: MediaFile | null, timeSeconds = 5): string | null => {
  if (!media) return null;
  if (media.thumbnail_url) return media.thumbnail_url;
  if (media.cloudflare_uid) {
    return `https://${CLOUDFLARE_CUSTOMER_SUBDOMAIN}/${media.cloudflare_uid}/thumbnails/thumbnail.jpg?time=${timeSeconds}s&width=320`;
  }
  return null;
};

const formatDuration = (seconds: number | null) => {
  if (!seconds) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const formatFileSize = (bytes: number | null) => {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function ClipEngine() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { deductCredit } = useCredits();
  const [searchParams] = useSearchParams();
  const mediaIdParam = searchParams.get("media");
  
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(mediaIdParam);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [showMediaSelector, setShowMediaSelector] = useState(false);
  const [mediaFilter, setMediaFilter] = useState<"all" | "video">("video");
  
  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepProgress, setStepProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState("");
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  
  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFileName, setUploadingFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Options state
  const [options, setOptions] = useState({
    hookDetection: true,
    speakerDetection: true,
    highEnergyMoments: true,
  });
  
  // Playback state
  const [playingClipId, setPlayingClipId] = useState<string | null>(null);

  // Fetch user credits
  const { data: userCredits } = useQuery({
    queryKey: ["user-credits"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase
        .from("user_credits")
        .select("balance")
        .eq("user_id", user.id)
        .single();
      return data;
    },
  });

  // Fetch media library
  const { data: mediaFiles, refetch: refetchMedia } = useQuery({
    queryKey: ["media-files-for-clips", mediaFilter],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data } = await supabase
        .from("media_files")
        .select("id, file_name, file_url, cloudflare_download_url, cloudflare_uid, thumbnail_url, duration_seconds, file_size_bytes")
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(50);
      
      return (data || []) as MediaFile[];
    },
  });

  // Fetch selected media
  const { data: selectedMedia, refetch: refetchSelectedMedia } = useQuery({
    queryKey: ["selected-media-clip", selectedMediaId],
    queryFn: async () => {
      if (!selectedMediaId) return null;
      const { data } = await supabase
        .from("media_files")
        .select("id, file_name, file_url, cloudflare_download_url, cloudflare_uid, thumbnail_url, duration_seconds, file_size_bytes")
        .eq("id", selectedMediaId)
        .single();
      return data as MediaFile | null;
    },
    enabled: !!selectedMediaId,
  });

  // Fetch clips for selected media
  const { data: clips, refetch: refetchClips } = useQuery({
    queryKey: ["clips-for-media", selectedMediaId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      let query = supabase
        .from("clips")
        .select("*")
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .order("virality_score", { ascending: false });
      
      if (selectedMediaId) {
        query = query.eq("source_media_id", selectedMediaId);
      }
      
      const { data } = await query;
      return (data || []) as Clip[];
    },
    enabled: !isProcessing,
  });

  // Poll job status
  const pollJobStatus = useCallback(async (jobId: string) => {
    let attempts = 0;
    const maxAttempts = 60;
    
    const poll = async () => {
      const { data: job } = await supabase
        .from("ai_jobs")
        .select("id, status, error_message")
        .eq("id", jobId)
        .single();
      
      if (!job) return;
      
      if (job.status === "completed") {
        setCurrentStep(PROCESSING_STEPS.length);
        setStepProgress(100);
        setProcessingStatus("Complete!");
        
        const { count } = await supabase
          .from("clips")
          .select("*", { count: "exact", head: true })
          .eq("ai_job_id", jobId);
        
        const clipCount = count || 0;
        if (clipCount > 0) {
          try {
            await deductCredit("ai_clips", `Generated ${clipCount} AI clips`, { clipCount, jobId });
          } catch (e) {
            console.error("Credit deduction failed:", e);
          }
        }
        
        toast({ title: `${clipCount} clips generated!`, description: "Your clips are ready to view." });
        
        setTimeout(() => {
          setIsProcessing(false);
          refetchClips();
        }, 1500);
        return;
      }
      
      if (job.status === "failed") {
        setIsProcessing(false);
        setProcessingStatus("Failed");
        toast({ 
          title: "Clip generation failed", 
          description: job.error_message || "Please try again",
          variant: "destructive"
        });
        return;
      }
      
      attempts++;
      if (attempts < maxAttempts) {
        const stageIndex = Math.min(
          Math.floor(attempts / (maxAttempts / PROCESSING_STEPS.length)),
          PROCESSING_STEPS.length - 2
        );
        setCurrentStep(stageIndex);
        setStepProgress(Math.min(95, (attempts / maxAttempts) * 100));
        setProcessingStatus(PROCESSING_STEPS[stageIndex].label + "...");
        setTimeout(poll, 2000);
      } else {
        setIsProcessing(false);
        toast({ title: "Processing timed out", variant: "destructive" });
      }
    };
    
    poll();
  }, [toast, deductCredit, refetchClips]);

  // Upload file to Cloudflare Stream
  const uploadToMediaLibrary = async (file: File): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    setUploadingFileName(file.name);
    setUploadProgress(0);

    // Use edge function for upload
    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", file.name);

    const { data, error } = await supabase.functions.invoke("cloudflare-stream-upload", {
      body: formData,
    });

    if (error) throw error;
    return data.mediaFileId;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      toast({ title: "Invalid file type", description: "Please upload a video file.", variant: "destructive" });
      return;
    }

    setIsUploading(true);

    try {
      const mediaFileId = await uploadToMediaLibrary(file);
      setSelectedMediaId(mediaFileId);
      await refetchMedia();
      await refetchSelectedMedia();
      toast({ title: "Upload complete!", description: "Your video is ready for clip generation." });
    } catch (err: any) {
      console.error("Upload error:", err);
      toast({ title: "Upload failed", description: err.message || "Please try again.", variant: "destructive" });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSelectMedia = (media: MediaFile) => {
    setSelectedMediaId(media.id);
    setShowMediaSelector(false);
  };

  const handleGenerateClips = async () => {
    if (!selectedMediaId || !selectedMedia) {
      toast({ title: "Please select a video first", variant: "destructive" });
      return;
    }

    const fileUrl = selectedMedia.cloudflare_download_url || selectedMedia.file_url;
    if (!fileUrl && !selectedMedia.cloudflare_uid) {
      toast({ title: "Video not ready", description: "Please wait a moment and try again.", variant: "destructive" });
      return;
    }

    // Check credits
    if (userCredits && userCredits.balance < 15) {
      toast({ title: "Insufficient credits", description: "You need at least 15 credits.", variant: "destructive" });
      navigate("/credits");
      return;
    }

    setIsProcessing(true);
    setCurrentStep(0);
    setStepProgress(0);
    setProcessingStatus(PROCESSING_STEPS[0].label + "...");

    try {
      let videoUrl = selectedMedia.cloudflare_download_url || selectedMedia.file_url;
      if (!videoUrl && selectedMedia.cloudflare_uid) {
        videoUrl = `https://${CLOUDFLARE_CUSTOMER_SUBDOMAIN}/${selectedMedia.cloudflare_uid}/downloads/default.mp4`;
      }

      const { data, error } = await supabase.functions.invoke("analyze-clips", {
        body: {
          mediaId: selectedMediaId,
          fileUrl: videoUrl,
          duration: selectedMedia.duration_seconds || 0,
          options,
        },
      });

      if (error) throw new Error(error.message);
      
      if (data.jobId) {
        setCurrentJobId(data.jobId);
        pollJobStatus(data.jobId);
      } else if (data.clips) {
        toast({ title: `${data.clips.length} clips generated!` });
        setIsProcessing(false);
        refetchClips();
      }
    } catch (err: any) {
      console.error("Processing error:", err);
      setIsProcessing(false);
      toast({ title: "Clip generation failed", description: err.message, variant: "destructive" });
    }
  };

  const getClipVideoUrl = (clip: Clip) => {
    if (clip.vertical_url) return clip.vertical_url;
    if (clip.storage_path) {
      const { data } = supabase.storage.from("media-vault").getPublicUrl(clip.storage_path);
      return data.publicUrl;
    }
    // Fallback: time-fragment from source
    if (selectedMedia?.cloudflare_uid) {
      return `https://${CLOUDFLARE_CUSTOMER_SUBDOMAIN}/${selectedMedia.cloudflare_uid}/watch`;
    }
    return selectedMedia?.cloudflare_download_url || selectedMedia?.file_url || null;
  };

  const getClipThumbnail = (clip: Clip) => {
    if (clip.thumbnail_url) return clip.thumbnail_url;
    if (selectedMedia?.cloudflare_uid) {
      return `https://${CLOUDFLARE_CUSTOMER_SUBDOMAIN}/${selectedMedia.cloudflare_uid}/thumbnails/thumbnail.jpg?time=${Math.floor(clip.start_seconds)}s&width=320`;
    }
    return getThumbnailUrl(selectedMedia);
  };

  const thumbnailUrl = getThumbnailUrl(selectedMedia);
  const estimatedCredits = 15;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/studio')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">AI Clip Generation</h1>
            <p className="text-muted-foreground">
              Automatically detect and generate viral-worthy clips from your content
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column: Media Selection + Options */}
          <div className="lg:col-span-2 space-y-6">
            {/* Section A: Select Media */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Film className="h-5 w-5 text-[#2C6BED]" />
                  Select Media
                </CardTitle>
                <CardDescription>
                  Choose a video from your Content Library or upload a new one
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isUploading ? (
                  <div className="p-6 border-2 border-dashed rounded-lg bg-muted/30">
                    <div className="flex items-center gap-4">
                      <Loader2 className="h-8 w-8 animate-spin text-[#2C6BED]" />
                      <div className="flex-1">
                        <p className="font-medium">{uploadingFileName}</p>
                        <p className="text-sm text-muted-foreground">Uploading to Content Library...</p>
                        <Progress value={uploadProgress} className="mt-2 h-2" />
                      </div>
                    </div>
                  </div>
                ) : selectedMedia ? (
                  <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg border">
                    <div className="relative w-32 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                      {thumbnailUrl ? (
                        <img src={thumbnailUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FileVideo className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{selectedMedia.file_name || 'Untitled Video'}</p>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {formatDuration(selectedMedia.duration_seconds)}
                        </span>
                        {selectedMedia.file_size_bytes && (
                          <span>{formatFileSize(selectedMedia.file_size_bytes)}</span>
                        )}
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setShowMediaSelector(true)}>
                      Change
                    </Button>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-3">
                    <Button 
                      variant="outline" 
                      className="h-24 border-dashed flex-col gap-2"
                      onClick={() => setShowMediaSelector(true)}
                    >
                      <Folder className="h-6 w-6 text-[#2C6BED]" />
                      <span>Choose from Content Library</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-24 border-dashed flex-col gap-2"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-6 w-6 text-[#2C6BED]" />
                      <span>Upload Video</span>
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </div>
                )}

                {/* YouTube - Coming Soon */}
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-dashed opacity-60">
                  <Link2 className="h-5 w-5 text-muted-foreground" />
                  <Input 
                    placeholder="Paste YouTube URL" 
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    disabled
                    className="flex-1"
                  />
                  <Badge variant="outline" className="text-xs">Coming Soon</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Section B: Clip Generation Options */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-[#A7C7FF]" />
                  Clip Generation Options
                </CardTitle>
                <CardDescription>
                  Customize how AI analyzes and generates your clips
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Zap className="h-5 w-5 text-amber-500" />
                    <div>
                      <Label className="font-medium">Auto Hook Detection</Label>
                      <p className="text-sm text-muted-foreground">Find attention-grabbing moments</p>
                    </div>
                  </div>
                  <Switch 
                    checked={options.hookDetection}
                    onCheckedChange={(checked) => setOptions(o => ({ ...o, hookDetection: checked }))}
                  />
                </div>
                
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-blue-500" />
                    <div>
                      <Label className="font-medium">Speaker Detection</Label>
                      <p className="text-sm text-muted-foreground">Identify speaker changes for cuts</p>
                    </div>
                  </div>
                  <Switch 
                    checked={options.speakerDetection}
                    onCheckedChange={(checked) => setOptions(o => ({ ...o, speakerDetection: checked }))}
                  />
                </div>
                
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Volume2 className="h-5 w-5 text-green-500" />
                    <div>
                      <Label className="font-medium">High-Energy Moments</Label>
                      <p className="text-sm text-muted-foreground">Detect peaks in audio energy</p>
                    </div>
                  </div>
                  <Switch 
                    checked={options.highEnergyMoments}
                    onCheckedChange={(checked) => setOptions(o => ({ ...o, highEnergyMoments: checked }))}
                  />
                </div>

                {/* Multi-Format Export Info */}
                <div className="flex items-center gap-3 p-3 bg-[#2C6BED]/5 border border-[#2C6BED]/20 rounded-lg">
                  <div className="flex gap-1">
                    <Smartphone className="h-4 w-4 text-[#2C6BED]" />
                    <Square className="h-4 w-4 text-[#2C6BED]" />
                    <LayoutGrid className="h-4 w-4 text-[#2C6BED]" />
                  </div>
                  <p className="text-sm">
                    <span className="font-medium text-[#2C6BED]">Multi-Format Export:</span>
                    {' '}Clips auto-generated in 9:16, 1:1, and 16:9
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Generate + Progress + Credits */}
          <div className="space-y-6">
            {/* Section C: Generate Button */}
            <Card className="border-[#2C6BED]/30">
              <CardContent className="pt-6">
                <Button
                  onClick={handleGenerateClips}
                  disabled={!selectedMediaId || isProcessing || isUploading}
                  className="w-full h-14 text-lg font-semibold text-white"
                  style={{
                    background: 'linear-gradient(90deg, #053877 0%, #2C6BED 100%)',
                  }}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5 mr-2" />
                      Generate AI Clips
                    </>
                  )}
                </Button>
                
                <div className="flex items-center justify-center gap-2 mt-3 text-sm text-muted-foreground">
                  <span>Estimated cost:</span>
                  <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                    ~{estimatedCredits} credits
                  </Badge>
                </div>
                
                {userCredits && (
                  <p className="text-center text-sm text-muted-foreground mt-2">
                    Your balance: <span className="font-medium">{userCredits.balance} credits</span>
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Section D: Processing Progress */}
            {isProcessing && (
              <Card className="border-[#2C6BED] bg-[#2C6BED]/5">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Loader2 className="h-5 w-5 animate-spin text-[#2C6BED]" />
                    Creating Your Clips
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Thumbnail Preview */}
                  {thumbnailUrl && (
                    <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                      <img src={thumbnailUrl} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-[#2C6BED]/20 flex items-center justify-center animate-pulse">
                          <Scissors className="h-8 w-8 text-white" />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Progress */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">{processingStatus}</span>
                      <span className="font-medium">{Math.round(stepProgress)}%</span>
                    </div>
                    <Progress value={stepProgress} className="h-2" />
                  </div>
                  
                  {/* Step Indicators */}
                  <div className="grid grid-cols-5 gap-1">
                    {PROCESSING_STEPS.map((step, idx) => {
                      const StepIcon = step.icon;
                      const isActive = idx === currentStep;
                      const isComplete = idx < currentStep;
                      return (
                        <div 
                          key={step.id}
                          className={cn(
                            "flex flex-col items-center p-2 rounded-lg transition-colors",
                            isActive && "bg-[#2C6BED]/10",
                            isComplete && "opacity-50"
                          )}
                        >
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center mb-1",
                            isActive ? "bg-[#2C6BED] text-white" : isComplete ? "bg-green-500 text-white" : "bg-muted"
                          )}>
                            {isComplete ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : (
                              <StepIcon className={cn("h-4 w-4", isActive && "animate-pulse")} />
                            )}
                          </div>
                          <span className="text-[10px] text-center text-muted-foreground leading-tight">
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Section E: Generated Clips Results */}
        {clips && clips.length > 0 && !isProcessing && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Scissors className="h-5 w-5 text-[#2C6BED]" />
                Generated Clips ({clips.length})
              </h2>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {clips.map((clip) => {
                const clipThumbnail = getClipThumbnail(clip);
                const clipVideoUrl = getClipVideoUrl(clip);
                const isPlaying = playingClipId === clip.id;
                
                return (
                  <Card key={clip.id} className="overflow-hidden group">
                    <div className="relative aspect-[9/16] bg-muted">
                      {isPlaying && clipVideoUrl ? (
                        <video
                          src={clipVideoUrl}
                          className="w-full h-full object-cover"
                          autoPlay
                          controls
                          onEnded={() => setPlayingClipId(null)}
                        />
                      ) : clipThumbnail ? (
                        <img src={clipThumbnail} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Film className="h-12 w-12 text-muted-foreground/30" />
                        </div>
                      )}
                      
                      {!isPlaying && clipVideoUrl && (
                        <button
                          onClick={() => setPlayingClipId(clip.id)}
                          className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center">
                            <Play className="h-6 w-6 text-[#2C6BED] ml-1" />
                          </div>
                        </button>
                      )}
                      
                      {clip.virality_score && (
                        <Badge 
                          className="absolute top-2 right-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0"
                        >
                          <Zap className="h-3 w-3 mr-1" />
                          {clip.virality_score}
                        </Badge>
                      )}
                      
                      <div className="absolute bottom-2 left-2 right-2 flex gap-1">
                        <Badge variant="secondary" className="text-[10px] bg-black/60 text-white border-0">
                          {formatDuration((clip.end_seconds || 0) - (clip.start_seconds || 0))}
                        </Badge>
                      </div>
                    </div>
                    
                    <CardContent className="p-3">
                      <p className="font-medium text-sm truncate">
                        {clip.title || `Clip ${clip.start_seconds?.toFixed(0)}s - ${clip.end_seconds?.toFixed(0)}s`}
                      </p>
                      {clip.suggested_caption && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {clip.suggested_caption}
                        </p>
                      )}
                      
                      {clipVideoUrl && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full mt-2"
                          asChild
                        >
                          <a href={clipVideoUrl} download target="_blank" rel="noopener noreferrer">
                            <Download className="h-3.5 w-3.5 mr-1" />
                            Download
                          </a>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Media Selector Dialog */}
        <Dialog open={showMediaSelector} onOpenChange={setShowMediaSelector}>
          <DialogContent className="max-w-2xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Select from Content Library</DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-[60vh] pr-4">
              {mediaFiles && mediaFiles.length > 0 ? (
                <div className="grid sm:grid-cols-2 gap-3">
                  {mediaFiles.map((media) => {
                    const thumb = getThumbnailUrl(media);
                    return (
                      <button
                        key={media.id}
                        onClick={() => handleSelectMedia(media)}
                        className={cn(
                          "flex items-start gap-3 p-3 rounded-lg border text-left transition-colors hover:bg-muted/50",
                          selectedMediaId === media.id && "border-[#2C6BED] bg-[#2C6BED]/5"
                        )}
                      >
                        <div className="w-20 h-14 bg-muted rounded overflow-hidden flex-shrink-0">
                          {thumb ? (
                            <img src={thumb} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <FileVideo className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{media.file_name || 'Untitled'}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <span>{formatDuration(media.duration_seconds)}</span>
                            {media.file_size_bytes && (
                              <span>{formatFileSize(media.file_size_bytes)}</span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileVideo className="h-12 w-12 text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground">No videos in your library yet</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => {
                      setShowMediaSelector(false);
                      fileInputRef.current?.click();
                    }}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Video
                  </Button>
                </div>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
