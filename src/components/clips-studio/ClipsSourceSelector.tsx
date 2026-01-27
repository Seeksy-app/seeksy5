import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Upload, FolderOpen, Sparkles, ArrowLeft, Film, 
  Search, CheckCircle2, Loader2, Clock, Play, Zap,
  TrendingUp, Youtube, Video
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { SourceMedia } from "@/pages/ClipsStudio";
import { motion } from "framer-motion";
import * as tus from "tus-js-client";
import { MediaUploadOptions } from "@/components/media/MediaUploadOptions";

interface ClipsSourceSelectorProps {
  onMediaSelect: (media: SourceMedia) => void;
  onBack: () => void;
}

export function ClipsSourceSelector({ onMediaSelect, onBack }: ClipsSourceSelectorProps) {
  const navigate = useNavigate();
  const [mediaFiles, setMediaFiles] = useState<SourceMedia[]>([]);
  const [selectedFile, setSelectedFile] = useState<SourceMedia | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<'library' | 'upload'>('library');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchMediaFiles();
  }, []);

  const fetchMediaFiles = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await (supabase as any)
        .from("media_files")
        .select("id, file_url, file_type, file_name, duration_seconds, created_at, cloudflare_uid, cloudflare_download_url, edit_transcript, source, thumbnail_url")
        .eq("user_id", user.id)
        .or("file_type.ilike.video%,file_type.eq.video")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      
      const mapped: SourceMedia[] = ((data as any[]) || []).map((item: any) => ({
        id: item.id,
        file_url: item.cloudflare_download_url || item.file_url,
        file_name: item.file_name,
        file_type: item.file_type,
        duration_seconds: item.duration_seconds,
        cloudflare_uid: item.cloudflare_uid || undefined,
        cloudflare_download_url: item.cloudflare_download_url || undefined,
        created_at: item.created_at,
        source: item.source || undefined,
        edit_transcript: item.edit_transcript,
        thumbnail_url: item.thumbnail_url,
      }));
      
      setMediaFiles(mapped);
    } catch (error) {
      console.error("Error fetching media:", error);
      toast({
        title: "Error",
        description: "Failed to load media files",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      toast({
        title: "Invalid file",
        description: "Please select a video file",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const user = session.user;
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '-').replace(/--+/g, '-');
      const filePath = `${user.id}/${Date.now()}-${sanitizedName}`;

      if (file.size > 6 * 1024 * 1024) {
        const projectId = "taxqcioheqdqtlmjeaht";
        
        await new Promise<void>((resolve, reject) => {
          const upload = new tus.Upload(file, {
            endpoint: `https://${projectId}.supabase.co/storage/v1/upload/resumable`,
            retryDelays: [0, 3000, 5000, 10000, 20000],
            headers: {
              authorization: `Bearer ${session.access_token}`,
              "x-upsert": "false",
            },
            uploadDataDuringCreation: true,
            removeFingerprintOnSuccess: true,
            metadata: {
              bucketName: "media-vault",
              objectName: filePath,
              contentType: file.type,
              cacheControl: "3600",
            },
            chunkSize: 6 * 1024 * 1024,
            onError: (error) => {
              console.error("TUS upload error:", error);
              reject(error);
            },
            onProgress: (bytesUploaded, bytesTotal) => {
              const progress = (bytesUploaded / bytesTotal) * 100;
              setUploadProgress(Math.round(progress));
            },
            onSuccess: () => resolve(),
          });

          upload.findPreviousUploads().then((previousUploads) => {
            if (previousUploads.length) {
              upload.resumeFromPreviousUpload(previousUploads[0]);
            }
            upload.start();
          });
        });
      } else {
        const { error: uploadError } = await supabase.storage
          .from("media-vault")
          .upload(filePath, file, { cacheControl: "3600", upsert: false });

        if (uploadError) throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage.from("media-vault").getPublicUrl(filePath);

      const { data: newMedia, error: insertError } = await supabase
        .from("media_files")
        .insert({
          user_id: user.id,
          file_url: publicUrl,
          file_type: 'video',
          file_name: file.name,
          file_size_bytes: file.size,
          source: "upload",
        })
        .select()
        .single();

      if (insertError) throw insertError;

      toast({
        title: "Upload complete!",
        description: "Your video is ready for AI clip generation",
      });

      const mappedMedia: SourceMedia = {
        id: newMedia.id,
        file_url: newMedia.file_url,
        file_name: newMedia.file_name,
        file_type: newMedia.file_type,
        duration_seconds: newMedia.duration_seconds,
        created_at: newMedia.created_at,
        source: 'upload',
      };
      
      setSelectedFile(mappedMedia);
      onMediaSelect(mappedMedia);
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Could not upload video",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleOpenMediaLibrary = () => {
    navigate('/studio/media');
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredMedia = mediaFiles.filter(media =>
    media.file_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getSourceIcon = (source?: string) => {
    switch (source) {
      case 'youtube': return <Youtube className="h-3 w-3" />;
      case 'zoom': return <Video className="h-3 w-3" />;
      default: return <Upload className="h-3 w-3" />;
    }
  };

  const getSourceColor = (source?: string) => {
    switch (source) {
      case 'studio': return 'bg-violet-500/20 text-violet-600 border-violet-300';
      case 'youtube': return 'bg-red-500/20 text-red-600 border-red-300';
      case 'zoom': return 'bg-blue-500/20 text-blue-600 border-blue-300';
      case 'ai_enhanced': return 'bg-amber-500/20 text-amber-600 border-amber-300';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-5xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#053877] to-[#2C6BED] flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              AI Clips Studio
            </h1>
            <p className="text-muted-foreground mt-1">
              Create viral-worthy clips with AI-powered detection and editing
            </p>
          </div>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="p-4 border-[#2C6BED]/20 bg-[#2C6BED]/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#2C6BED]/20 flex items-center justify-center">
                <Zap className="h-5 w-5 text-[#2C6BED]" />
              </div>
              <div>
                <p className="font-semibold text-sm">Hook Detection</p>
                <p className="text-xs text-muted-foreground">Find attention-grabbing moments</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 border-[#DDA3FF]/20 bg-[#DDA3FF]/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#DDA3FF]/20 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-[#DDA3FF]" />
              </div>
              <div>
                <p className="font-semibold text-sm">Virality Scoring</p>
                <p className="text-xs text-muted-foreground">AI-powered viral potential</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 border-[#F5C242]/20 bg-[#F5C242]/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#F5C242]/20 flex items-center justify-center">
                <Film className="h-5 w-5 text-[#F5C242]" />
              </div>
              <div>
                <p className="font-semibold text-sm">Multi-Platform</p>
                <p className="text-xs text-muted-foreground">TikTok, Reels, Shorts ready</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Main content */}
        <Card className="border-2">
          <CardContent className="p-6">
            {/* Tab buttons */}
            <div className="flex gap-2 mb-6">
              <Button
                variant={activeTab === 'library' ? 'default' : 'outline'}
                onClick={() => setActiveTab('library')}
                className={cn(
                  "gap-2",
                  activeTab === 'library' && "bg-[#053877] hover:bg-[#053877]/90"
                )}
              >
                <FolderOpen className="h-4 w-4" />
                Media Library
              </Button>
              <Button
                variant={activeTab === 'upload' ? 'default' : 'outline'}
                onClick={() => setActiveTab('upload')}
                className={cn(
                  "gap-2",
                  activeTab === 'upload' && "bg-[#053877] hover:bg-[#053877]/90"
                )}
              >
                <Upload className="h-4 w-4" />
                Upload New
              </Button>
              <div className="flex-1" />
              <Button
                variant="outline"
                onClick={handleOpenMediaLibrary}
                className="gap-2"
              >
                <Film className="h-4 w-4" />
                Open Full Media Library
              </Button>
            </div>

            {activeTab === 'upload' ? (
              <div className="space-y-6">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                
                {/* Import Options */}
                <MediaUploadOptions
                  onUploadClick={() => !isUploading && fileInputRef.current?.click()}
                  onImportComplete={() => fetchMediaFiles()}
                  className="mb-4"
                />

                {/* Upload Progress */}
                {isUploading && (
                  <motion.div 
                    className="border-2 border-dashed rounded-xl p-8 text-center border-[#2C6BED] bg-[#2C6BED]/5"
                  >
                    <div className="space-y-4">
                      <Loader2 className="h-12 w-12 mx-auto text-[#2C6BED] animate-spin" />
                      <div className="space-y-3 max-w-xs mx-auto">
                        <p className="font-semibold text-lg">Uploading video...</p>
                        <Progress value={uploadProgress} className="h-2" />
                        <p className="text-sm text-muted-foreground">{uploadProgress}% complete</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                <p className="text-center text-sm text-muted-foreground">
                  Supports MP4, MOV, WebM up to 2GB
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Section header */}
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">Recent Videos</h3>
                  <span className="text-sm text-muted-foreground">{filteredMedia.length} videos</span>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search videos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {isLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-[#2C6BED]" />
                  </div>
                ) : filteredMedia.length === 0 ? (
                  <div className="text-center py-12">
                    <Film className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <p className="font-semibold text-lg mb-2">No videos found</p>
                    <p className="text-muted-foreground mb-6">
                      Upload or import a video to get started with AI clip generation
                    </p>
                    <MediaUploadOptions
                      onUploadClick={() => {
                        setActiveTab('upload');
                        setTimeout(() => fileInputRef.current?.click(), 100);
                      }}
                      onImportComplete={() => fetchMediaFiles()}
                    />
                  </div>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <div className="grid gap-3">
                      {filteredMedia.map((media, index) => (
                        <motion.div
                          key={media.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.03 }}
                          onClick={() => setSelectedFile(media)}
                          className={cn(
                            "flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all group",
                            selectedFile?.id === media.id
                              ? "border-[#2C6BED] bg-[#2C6BED]/5"
                              : "border-border hover:border-[#2C6BED]/50 hover:bg-muted/50"
                          )}
                        >
                          {/* Thumbnail */}
                          <div className="relative w-32 h-20 bg-black rounded-lg overflow-hidden flex-shrink-0">
                            {media.thumbnail_url ? (
                              <img
                                src={media.thumbnail_url}
                                alt={media.file_name}
                                className="w-full h-full object-cover"
                              />
                            ) : media.cloudflare_download_url || media.file_url ? (
                              <video
                                src={media.cloudflare_download_url || media.file_url}
                                className="w-full h-full object-cover"
                                muted
                                preload="metadata"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-muted">
                                <Film className="h-8 w-8 text-muted-foreground" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                              <Play className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <div className="absolute bottom-1 right-1 bg-black/80 px-1.5 py-0.5 rounded text-[10px] text-white font-medium">
                              {formatDuration(media.duration_seconds)}
                            </div>
                          </div>

                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate text-lg">
                              {media.file_name.replace(/\.[^/.]+$/, "")}
                            </p>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <Badge variant="outline" className={cn("text-xs gap-1", getSourceColor(media.source))}>
                                {getSourceIcon(media.source)}
                                {media.source === 'studio' ? 'Studio' : 
                                 media.source === 'youtube' ? 'YouTube' :
                                 media.source === 'zoom' ? 'Zoom' :
                                 media.source === 'ai_enhanced' ? 'AI Enhanced' : 'Upload'}
                              </Badge>
                              {media.duration_seconds && (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {formatDuration(media.duration_seconds)}
                                </span>
                              )}
                              {media.created_at && (
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(media.created_at), "MMM d, yyyy")}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Selected indicator */}
                          {selectedFile?.id === media.id && (
                            <CheckCircle2 className="h-6 w-6 text-[#2C6BED] flex-shrink-0" />
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </ScrollArea>
                )}

                {/* Generate AI Clips Button - More visible */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="pt-4 border-t"
                >
                  <Button 
                    onClick={() => selectedFile && onMediaSelect(selectedFile)}
                    disabled={!selectedFile}
                    size="lg"
                    className={cn(
                      "w-full text-lg h-16 gap-3 font-bold transition-all",
                      selectedFile 
                        ? "bg-gradient-to-r from-[#053877] via-[#2C6BED] to-[#DDA3FF] hover:opacity-90 shadow-lg shadow-[#2C6BED]/30"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    <Sparkles className="h-6 w-6" />
                    {selectedFile ? "Generate AI Clips" : "Select a video to continue"}
                  </Button>
                </motion.div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
