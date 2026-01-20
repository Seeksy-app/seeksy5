import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useCredits } from "@/hooks/useCredits";
import { useClipGeneration } from "@/hooks/useClipGeneration";
import { ClipGenerationProgress } from "@/components/clips/ClipGenerationProgress";
import { GeneratedClipsGrid } from "@/components/clips/GeneratedClipsGrid";
import { SocialPublishModal } from "@/components/clips/SocialPublishModal";
import { SelectedMediaHeader } from "@/components/studio/SelectedMediaHeader";
import { cn } from "@/lib/utils";
import { 
  ArrowLeft, Film, Sparkles, Upload, Folder, 
  Clock, FileVideo, Zap, Users, Volume2,
  Smartphone, Square, Monitor, Loader2,
  CheckCircle2, Share2
} from "lucide-react";

// Cloudflare Stream customer subdomain
const CLOUDFLARE_CUSTOMER_SUBDOMAIN = "customer-typiggwc4l6lm7r2.cloudflarestream.com";

interface MediaFile {
  id: string;
  file_name: string | null;
  file_url: string | null;
  cloudflare_download_url: string | null;
  cloudflare_uid: string | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  file_size_bytes: number | null;
  edit_status: string | null;
  source: string | null;
}

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

const getThumbnailUrl = (media: MediaFile | null, timeSeconds = 5): string | null => {
  if (!media) return null;
  if (media.thumbnail_url) return media.thumbnail_url;
  if (media.cloudflare_uid) {
    return `https://${CLOUDFLARE_CUSTOMER_SUBDOMAIN}/${media.cloudflare_uid}/thumbnails/thumbnail.jpg?time=${timeSeconds}s&width=320`;
  }
  return null;
};

export default function AIClipGeneration() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const mediaIdParam = searchParams.get("media");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(mediaIdParam);
  const [showMediaSelector, setShowMediaSelector] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFileName, setUploadingFileName] = useState("");
  const [showSocialModal, setShowSocialModal] = useState(false);
  const [clipToPublish, setClipToPublish] = useState<any>(null);
  
  // Options
  const [options, setOptions] = useState({
    hookDetection: true,
    speakerDetection: true,
    highEnergyMoments: true,
    exportFormats: ["9:16", "1:1", "16:9"] as string[],
  });

  // Clip generation hook
  const { 
    generateClips, 
    fetchClipsForMedia,
    isGenerating, 
    currentJob, 
    generatedClips 
  } = useClipGeneration();

  // Existing clips for selected media
  const [existingClips, setExistingClips] = useState<any[]>([]);

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
    queryKey: ["media-files-for-clips"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data } = await supabase
        .from("media_files")
        .select("id, file_name, file_url, cloudflare_download_url, cloudflare_uid, thumbnail_url, duration_seconds, file_size_bytes, edit_status, source")
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(50);
      
      return (data || []) as MediaFile[];
    },
  });

  // Fetch selected media details
  const { data: selectedMedia, refetch: refetchSelectedMedia } = useQuery({
    queryKey: ["selected-media-clip", selectedMediaId],
    queryFn: async () => {
      if (!selectedMediaId) return null;
      const { data } = await supabase
        .from("media_files")
        .select("id, file_name, file_url, cloudflare_download_url, cloudflare_uid, thumbnail_url, duration_seconds, file_size_bytes, edit_status, source")
        .eq("id", selectedMediaId)
        .single();
      return data as MediaFile | null;
    },
    enabled: !!selectedMediaId,
  });

  // Load existing clips when media is selected
  useEffect(() => {
    if (selectedMediaId && !isGenerating) {
      fetchClipsForMedia(selectedMediaId).then(setExistingClips);
    }
  }, [selectedMediaId, isGenerating, fetchClipsForMedia]);

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      toast({ 
        title: "Invalid file type", 
        description: "Please upload a video file.", 
        variant: "destructive" 
      });
      return;
    }

    setIsUploading(true);
    setUploadingFileName(file.name);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", file.name);

      const { data, error } = await supabase.functions.invoke("cloudflare-stream-upload", {
        body: formData,
      });

      if (error) throw error;

      setSelectedMediaId(data.mediaFileId);
      await refetchMedia();
      await refetchSelectedMedia();
      
      toast({ 
        title: "Upload complete!", 
        description: "Your video is ready for clip generation." 
      });
    } catch (err: any) {
      console.error("Upload error:", err);
      toast({ 
        title: "Upload failed", 
        description: err.message || "Please try again.", 
        variant: "destructive" 
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Handle generate clips
  const handleGenerateClips = async () => {
    if (!selectedMediaId || !selectedMedia) {
      toast({ 
        title: "Please select a video first", 
        variant: "destructive" 
      });
      return;
    }

    // Check credits
    if (userCredits && userCredits.balance < 15) {
      toast({ 
        title: "Insufficient credits", 
        description: "You need at least 15 credits.", 
        variant: "destructive" 
      });
      navigate("/credits");
      return;
    }

    try {
      await generateClips(selectedMediaId, {
        autoHookDetection: options.hookDetection,
        speakerDetection: options.speakerDetection,
        highEnergyMoments: options.highEnergyMoments,
        exportFormats: options.exportFormats,
      });
    } catch (error) {
      console.error("Generation error:", error);
    }
  };

  const handleSelectMedia = (media: MediaFile) => {
    setSelectedMediaId(media.id);
    setShowMediaSelector(false);
  };

  const handleChangeMedia = () => {
    setShowMediaSelector(true);
  };

  const thumbnailUrl = getThumbnailUrl(selectedMedia);
  const estimatedCredits = 15;
  const hasMediaSelected = !!selectedMedia;
  const allClips = [...generatedClips, ...existingClips.filter(
    ec => !generatedClips.find(gc => gc.id === ec.id)
  )];

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

        {/* Selected Media Header (sticky when media selected) */}
        {hasMediaSelected && !showMediaSelector && (
          <SelectedMediaHeader
            fileName={selectedMedia?.file_name || "Selected Video"}
            duration={selectedMedia?.duration_seconds}
            thumbnail={thumbnailUrl}
            fileType="video"
            isImporting={false}
            onChangeMedia={handleChangeMedia}
            source={selectedMedia?.edit_status === "edited" ? "AI Enhanced" : selectedMedia?.source}
          />
        )}

        <div className="grid lg:grid-cols-3 gap-6 mt-6">
          {/* Left Column: Media Selection + Options */}
          <div className="lg:col-span-2 space-y-6">
            {/* Section A: Select Media */}
            {!hasMediaSelected && (
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
                        </div>
                      </div>
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
                </CardContent>
              </Card>
            )}

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
                    <Monitor className="h-4 w-4 text-[#2C6BED]" />
                  </div>
                  <p className="text-sm">
                    <span className="font-medium text-[#2C6BED]">Multi-Format Export:</span>
                    {' '}Clips auto-generated in 9:16, 1:1, 16:9, and 4:5
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Generate + Progress */}
          <div className="space-y-6">
            {/* Generate Button */}
            <Card className="border-[#2C6BED]/30">
              <CardContent className="pt-6">
                <Button
                  onClick={handleGenerateClips}
                  disabled={!selectedMediaId || isGenerating || isUploading}
                  className="w-full h-14 text-lg font-semibold text-white"
                  style={{
                    background: 'linear-gradient(90deg, #053877 0%, #2C6BED 100%)',
                  }}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Generating Clips...
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

            {/* Processing Progress */}
            {isGenerating && (
              <ClipGenerationProgress
                job={currentJob}
                thumbnailUrl={thumbnailUrl}
                isGenerating={isGenerating}
              />
            )}

            {/* Quick stats when complete */}
            {!isGenerating && currentJob?.status === "completed" && (
              <Card className="border-green-500/30 bg-green-50/50">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-green-700">Generation Complete!</p>
                      <p className="text-sm text-green-600">
                        {currentJob.total_clips} clips are ready to view
                      </p>
                    </div>
                  </div>
                  
                  {/* Publish to Social CTA */}
                  {allClips.length > 0 && (
                    <Button
                      className="w-full bg-gradient-to-r from-[#053877] to-[#2C6BED] text-white"
                      onClick={() => {
                        const firstClip = allClips[0];
                        setClipToPublish({
                          id: firstClip.id,
                          title: firstClip.title || `Clip`,
                          thumbnail_url: firstClip.thumbnail_url,
                          file_url: firstClip.vertical_url || firstClip.storage_path,
                          duration_seconds: firstClip.end_seconds - firstClip.start_seconds,
                          aspect_ratio: firstClip.aspect_ratio || "9:16"
                        });
                        setShowSocialModal(true);
                      }}
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Publish Clip to Social
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Generated Clips Section */}
        {!isGenerating && allClips.length > 0 && (
          <div className="mt-8">
            <GeneratedClipsGrid 
              clips={allClips} 
              sourceMediaId={selectedMediaId || undefined}
            />
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
                    const isEnhanced = media.edit_status === "edited";
                    return (
                      <button
                        key={media.id}
                        onClick={() => handleSelectMedia(media)}
                        className={cn(
                          "flex items-start gap-3 p-3 rounded-lg border text-left transition-colors hover:bg-muted/50",
                          selectedMediaId === media.id && "border-[#2C6BED] bg-[#2C6BED]/5"
                        )}
                      >
                        <div className="w-20 h-14 bg-muted rounded overflow-hidden flex-shrink-0 relative">
                          {thumb ? (
                            <img src={thumb} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <FileVideo className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                          {isEnhanced && (
                            <Badge className="absolute top-0.5 left-0.5 text-[8px] px-1 py-0 bg-green-500">
                              Enhanced
                            </Badge>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{media.file_name || 'Untitled'}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDuration(media.duration_seconds)}
                            </span>
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

        {/* Social Publish Modal */}
        <SocialPublishModal
          open={showSocialModal}
          onOpenChange={setShowSocialModal}
          clip={clipToPublish}
        />
      </div>
    </div>
  );
}
