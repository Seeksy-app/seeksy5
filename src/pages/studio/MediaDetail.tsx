import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { SocialPublishModal } from "@/components/clips/SocialPublishModal";
import { YouTubePublishModal } from "@/components/studio/YouTubePublishModal";
import { useSidebar } from "@/components/ui/sidebar";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  ChevronLeft, Clock, Calendar, Download, Share2,
  Scissors, Wand2, FileText, Layers, Volume2, Palette, Mic,
  Sparkles, Copy, Instagram, Youtube, Video,
  CheckCircle, AlertCircle, Loader2, Eye, Heart, MessageSquare,
  ThumbsUp, BarChart2, DollarSign, Info, ChevronUp, ChevronDown, Play
} from "lucide-react";

interface MediaFile {
  id: string;
  file_name: string | null;
  file_type: string | null;
  file_url: string | null;
  cloudflare_download_url: string | null;
  duration_seconds: number | null;
  created_at: string | null;
  thumbnail_url: string | null;
  file_size_bytes: number | null;
  source?: string | null;
  external_id?: string | null;
  description?: string | null;
  tags?: string[] | null;
  category?: string | null;
}

interface Clip {
  id: string;
  title: string;
  status: string;
  duration_seconds: number | null;
  vertical_url: string | null;
  thumbnail_url: string | null;
  hook_score: number | null;
  created_at: string;
}

interface TranscriptData {
  id: string;
  raw_text: string | null;
  created_at: string;
}

interface AIJob {
  id: string;
  job_type: string;
  status: string;
  params: Record<string, unknown> | null;
  completed_at: string | null;
  created_at: string;
}

interface EnhancedAsset {
  id: string;
  source_media_id: string;
  ai_job_id: string;
  output_type: string;
  storage_path: string;
  duration_seconds: number | null;
  thumbnail_url: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

// Publish status type
type PublishStatus = 'not_published' | 'published_youtube' | 'published_tiktok' | 'published_instagram';

export default function MediaDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Try to get sidebar context safely
  let sidebar: ReturnType<typeof useSidebar> | null = null;
  try {
    sidebar = useSidebar();
  } catch {
    // Sidebar context not available
  }
  
  const [showSocialModal, setShowSocialModal] = useState(false);
  const [selectedClip, setSelectedClip] = useState<Clip | null>(null);
  const [preSelectedPlatform, setPreSelectedPlatform] = useState<'youtube' | 'instagram' | 'tiktok' | null>(null);
  const [showAdSubmitModal, setShowAdSubmitModal] = useState(false);
  const [showYouTubeModal, setShowYouTubeModal] = useState(false);
  const [showClipStrip, setShowClipStrip] = useState(true);
  const [selectedPreviewClip, setSelectedPreviewClip] = useState<Clip | null>(null);
  
  // Local state for demo publish/ad status
  const [publishStatus, setPublishStatus] = useState<PublishStatus>('not_published');
  const [adStatus, setAdStatus] = useState<'none' | 'pending_review' | 'active'>('none');

  // Auto-collapse sidebar when entering this page
  useEffect(() => {
    if (sidebar && !sidebar.isMobile) {
      sidebar.setOpen(false);
    }
    return () => {
      // Restore sidebar when leaving
      if (sidebar && !sidebar.isMobile) {
        sidebar.setOpen(true);
      }
    };
  }, [sidebar]);

  // Fetch media file
  const { data: media, isLoading: loadingMedia } = useQuery({
    queryKey: ["media-detail", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("media_files")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as MediaFile;
    },
    enabled: !!id,
  });

  // Fetch clips for this media
  const { data: clips } = useQuery({
    queryKey: ["media-clips", id],
    queryFn: async () => {
      if (!id) return [];
      const { data } = await supabase
        .from("clips")
        .select("*")
        .eq("source_media_id", id)
        .order("created_at", { ascending: false });
      return (data || []) as Clip[];
    },
    enabled: !!id,
  });

  // Fetch AI jobs for this media
  const { data: aiJobs } = useQuery({
    queryKey: ["media-ai-jobs", id],
    queryFn: async () => {
      if (!id) return [];
      const { data } = await supabase
        .from("ai_jobs")
        .select("*")
        .eq("source_media_id", id)
        .order("created_at", { ascending: false });
      return (data || []) as AIJob[];
    },
    enabled: !!id,
  });

  // Fetch transcripts
  const { data: transcripts } = useQuery({
    queryKey: ["media-transcripts", id],
    queryFn: async () => {
      if (!id) return [];
      const { data } = await supabase
        .from("transcripts")
        .select("id, raw_text, created_at")
        .eq("asset_id", id)
        .order("created_at", { ascending: false });
      return (data || []) as TranscriptData[];
    },
    enabled: !!id,
  });

  // Fetch enhanced assets from AI processing
  const { data: enhancedAssets, isLoading: loadingEnhanced } = useQuery({
    queryKey: ["media-enhanced-assets", id],
    queryFn: async () => {
      if (!id) return [];
      const { data } = await supabase
        .from("ai_edited_assets")
        .select("*")
        .eq("source_media_id", id)
        .order("created_at", { ascending: false });
      return (data || []) as EnhancedAsset[];
    },
    enabled: !!id,
  });

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "—";
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(1)} MB`;
    const kb = bytes / 1024;
    return `${kb.toFixed(0)} KB`;
  };

  const getSourceLabel = (source: string | null) => {
    const labels: Record<string, { label: string; className: string }> = {
      youtube: { label: "YouTube", className: "bg-red-500/90 text-white" },
      zoom: { label: "Zoom", className: "bg-blue-500/90 text-white" },
      riverside: { label: "Riverside", className: "bg-purple-500/90 text-white" },
      studio: { label: "Studio", className: "bg-green-500/90 text-white" },
      upload: { label: "Upload", className: "bg-muted text-muted-foreground" },
    };
    return labels[source || "upload"] || labels.upload;
  };

  // Check if video has been AI processed
  const hasAIProcessing = aiJobs && aiJobs.length > 0;
  const completedJobs = aiJobs?.filter(j => j.status === "completed") || [];
  const latestTranscript = transcripts?.[0];
  
  // Get enhanced video from AI processing - prioritize over source video
  const enhancedVideo = enhancedAssets?.find(a => a.output_type === 'enhanced_video' || a.output_type === 'processed');
  const enhancedVideoUrl = enhancedVideo?.storage_path || null;
  const enhancedThumbnail = enhancedVideo?.thumbnail_url || null;
  
  // Processing state detection
  const isProcessing = aiJobs?.some(j => j.status === 'pending' || j.status === 'processing') || false;
  const processingFailed = aiJobs?.some(j => j.status === 'failed') && !enhancedVideo;

  // Determine video source priority: Enhanced > Processed > Cloudflare > Original
  // Check if this is a YouTube source without downloaded file
  const isYouTubeSource = media?.source === 'youtube';
  const hasDownloadedFile = media?.cloudflare_download_url || (media?.file_url && !media.file_url.includes('youtube.com'));
  const isYouTubeEmbed = isYouTubeSource && !hasDownloadedFile;
  
  // For YouTube embeds, extract video ID
  const youtubeVideoId = isYouTubeEmbed && media?.external_id ? media.external_id : null;
  
  // Primary video URL - don't use YouTube URL directly
  const primaryVideoUrl = enhancedVideoUrl || (hasDownloadedFile ? (media?.cloudflare_download_url || media?.file_url) : null);
  const primaryThumbnail = enhancedThumbnail || media?.thumbnail_url;

  const handleCopyLink = () => {
    const url = `${window.location.origin}/studio/media/${id}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link copied", description: "Share link copied to clipboard" });
  };

  const handleDownload = () => {
    if (primaryVideoUrl) {
      window.open(primaryVideoUrl, "_blank");
    }
  };

  const handlePublishToSocial = (clip?: Clip, platform?: 'youtube' | 'instagram' | 'tiktok') => {
    setSelectedClip(clip || null);
    setPreSelectedPlatform(platform || null);
    setShowSocialModal(true);
  };

  const handlePostToYouTube = () => {
    // Simulate YouTube publish
    console.log("Simulated YouTube publish", { videoId: id });
    setPublishStatus('published_youtube');
    toast({
      title: "Queued for YouTube",
      description: "Your video has been queued for YouTube. Analytics will start updating once views come in.",
    });
    setShowSocialModal(false);
  };

  const handleSubmitForAds = () => {
    console.log("Video submitted for ads", { videoId: id, slots: 3, estimatedCPM: 18.50 });
    setAdStatus('pending_review');
    setShowAdSubmitModal(false);
    toast({
      title: "Submitted for Ads",
      description: "Your video has been submitted to Seeksy Ads. Our team will review and start serving ads when it's approved.",
    });
  };

  // Check if published
  const isPublished = publishStatus !== 'not_published';
  const isAdEnabled = adStatus !== 'none';

  // Analytics cards - show real data only
  const analyticsCards = [
    { label: "Total Views", value: 0, icon: Eye, noData: true },
    { label: "Likes", value: 0, icon: ThumbsUp, noData: true },
    { label: "Shares", value: 0, icon: Share2, noData: true },
    { label: "Comments", value: 0, icon: MessageSquare, noData: true },
    { label: "Avg Watch Time", value: "—", icon: Clock, noData: true, isTime: true },
    { label: "Completion Rate", value: "—", icon: BarChart2, noData: true, isPercent: true },
    { label: "Engagement Rate", value: "—", icon: Heart, noData: true, isPercent: true },
  ];

  if (loadingMedia) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!media) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Media not found</h2>
        <Button onClick={() => navigate("/studio/media")}>Back to Library</Button>
      </div>
    );
  }

  const sourceInfo = getSourceLabel(media.source);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="h-14 border-b border-border px-6 flex items-center justify-between sticky top-0 bg-background z-10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/studio/media")}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <span className="text-muted-foreground text-sm">Media Library</span>
          <span className="text-muted-foreground">/</span>
          <span className="font-medium truncate max-w-[300px]">{media.file_name || "Untitled"}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCopyLink}>
            <Copy className="w-4 h-4 mr-2" />
            Copy Link
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          <Button size="sm" onClick={() => navigate(`/studio/ai-post-production?media=${id}`)}>
            <Wand2 className="w-4 h-4 mr-2" />
            AI Enhance
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Video Player Section - More compact */}
          <div className="lg:col-span-2 space-y-4">
            {/* Video Player - Reduced height */}
            <Card className="overflow-hidden">
              <div className="aspect-video max-h-[360px] bg-black relative">
                {/* Processing state */}
                {isProcessing && !primaryVideoUrl && !isYouTubeEmbed ? (
                  <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-[#053877]/20 to-[#2C6BED]/20">
                    <Loader2 className="w-10 h-10 text-primary animate-spin mb-3" />
                    <p className="text-white font-medium text-sm">Processing your video...</p>
                  </div>
                ) : processingFailed && !primaryVideoUrl && !isYouTubeEmbed ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <AlertCircle className="w-10 h-10 text-destructive mb-3" />
                    <p className="text-white font-medium text-sm">Processing failed</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-3"
                      onClick={() => navigate(`/studio/ai-post-production?media=${id}`)}
                    >
                      <Wand2 className="w-3 h-3 mr-1" />
                      Retry
                    </Button>
                  </div>
                ) : isYouTubeEmbed && youtubeVideoId ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${youtubeVideoId}`}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={media?.file_name || "YouTube Video"}
                  />
                ) : primaryVideoUrl ? (
                  <video
                    src={primaryVideoUrl}
                    className="w-full h-full"
                    controls
                    poster={primaryThumbnail || undefined}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Video className="w-12 h-12 text-white/20" />
                  </div>
                )}
                
                {/* Enhanced badge overlay */}
                {enhancedVideo && (
                  <Badge className="absolute top-2 left-2 bg-green-500 text-white border-0 text-xs">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Enhanced
                  </Badge>
                )}
              </div>
              <CardContent className="p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-lg font-semibold mb-1">{media.file_name || "Untitled Video"}</h1>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDuration(media.duration_seconds)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {media.created_at ? format(new Date(media.created_at), "MMM d, yyyy") : "—"}
                      </span>
                      <Badge className={cn(sourceInfo.className, "text-xs")}>{sourceInfo.label}</Badge>
                      {hasAIProcessing && completedJobs.length > 0 && (
                        <Badge className="bg-green-500/90 text-white text-xs">Enhanced</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Compact Enhancements Grid - 2 rows */}
            {hasAIProcessing && (
              <div className="grid grid-cols-6 gap-2">
                <div className="p-2 rounded-lg border bg-card text-center">
                  <Layers className="w-4 h-4 mx-auto text-blue-500 mb-1" />
                  <p className="text-xs font-semibold">{completedJobs.find(j => j.job_type === 'chapters') ? '✓' : '—'}</p>
                  <p className="text-[9px] text-muted-foreground">Chapters</p>
                </div>
                <div className="p-2 rounded-lg border bg-card text-center">
                  <FileText className="w-4 h-4 mx-auto text-green-500 mb-1" />
                  <p className="text-xs font-semibold">{latestTranscript ? '✓' : '—'}</p>
                  <p className="text-[9px] text-muted-foreground">Transcript</p>
                </div>
                <div className="p-2 rounded-lg border bg-card text-center">
                  <Mic className="w-4 h-4 mx-auto text-orange-500 mb-1" />
                  <p className="text-xs font-semibold">{completedJobs.find(j => j.job_type === 'filler_removal') ? '✓' : '—'}</p>
                  <p className="text-[9px] text-muted-foreground">Filler</p>
                </div>
                <div className="p-2 rounded-lg border bg-card text-center">
                  <Volume2 className="w-4 h-4 mx-auto text-purple-500 mb-1" />
                  <p className="text-xs font-semibold">{completedJobs.find(j => j.job_type === 'audio_enhancement') ? '✓' : '—'}</p>
                  <p className="text-[9px] text-muted-foreground">Audio</p>
                </div>
                <div className="p-2 rounded-lg border bg-card text-center">
                  <Palette className="w-4 h-4 mx-auto text-pink-500 mb-1" />
                  <p className="text-xs font-semibold">{completedJobs.find(j => j.job_type === 'color_correction') ? '✓' : '—'}</p>
                  <p className="text-[9px] text-muted-foreground">Color</p>
                </div>
                <div className="p-2 rounded-lg border bg-card text-center">
                  <Scissors className="w-4 h-4 mx-auto text-cyan-500 mb-1" />
                  <p className="text-xs font-semibold">{clips?.length || 0}</p>
                  <p className="text-[9px] text-muted-foreground">Clips</p>
                </div>
              </div>
            )}

            {/* Inline Clips as Small Thumbnails */}
            {clips && clips.length > 0 && (
              <Card className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Scissors className="w-4 h-4 text-primary" />
                    <span className="font-medium text-sm">Clips</span>
                    <Badge className="bg-[#2C6BED] text-white text-xs">{clips.length}</Badge>
                  </div>
                  <Button variant="ghost" size="sm" className="text-xs h-6" onClick={() => navigate(`/studio/clips?media=${id}`)}>
                    Generate More
                  </Button>
                </div>
                <ScrollArea className="w-full">
                  <div className="flex items-center gap-2">
                    {clips.map((clip) => (
                      <div
                        key={clip.id}
                        className="flex-shrink-0 group cursor-pointer"
                        onClick={() => handlePublishToSocial(clip)}
                      >
                        <div className="w-20 rounded-md border bg-background overflow-hidden hover:border-primary/50">
                          <div className="aspect-[9/16] h-28 bg-muted relative">
                            {clip.thumbnail_url ? (
                              <img src={clip.thumbnail_url} alt={clip.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Scissors className="w-4 h-4 text-muted-foreground/40" />
                              </div>
                            )}
                            <Badge className="absolute bottom-1 right-1 text-[8px] px-1 py-0 bg-black/70 text-white border-0">
                              {formatDuration(clip.duration_seconds)}
                            </Badge>
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                              <Play className="w-5 h-5 text-white" fill="white" />
                            </div>
                          </div>
                          <div className="p-1">
                            <p className="text-[8px] font-medium truncate">{clip.title || "Untitled"}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </Card>
            )}

            {/* No AI Processing CTA */}
            {!hasAIProcessing && !clips?.length && (
              <Card className="p-4 text-center">
                <Wand2 className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="font-medium text-sm mb-1">No AI enhancements yet</p>
                <p className="text-xs text-muted-foreground mb-3">Enhance your video with AI</p>
                <div className="flex items-center justify-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => navigate(`/studio/clips?media=${id}`)}>
                    <Scissors className="w-3 h-3 mr-1" />
                    Generate Clips
                  </Button>
                  <Button size="sm" onClick={() => navigate(`/studio/ai-post-production?media=${id}`)}>
                    <Wand2 className="w-3 h-3 mr-1" />
                    AI Enhance
                  </Button>
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar - More compact */}
          <div className="space-y-4">
            {/* Export & Share */}
            <Card className="p-3">
              <h3 className="font-medium text-sm mb-2">Export & Share</h3>
              <div className="space-y-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-xs h-8"
                  onClick={() => handlePublishToSocial(undefined, 'instagram')}
                >
                  <Instagram className="w-3 h-3 mr-2 text-pink-500" />
                  Instagram
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-xs h-8"
                  onClick={() => handlePublishToSocial(undefined, 'tiktok')}
                >
                  <Video className="w-3 h-3 mr-2" />
                  TikTok
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-xs h-8"
                  onClick={() => handlePublishToSocial(undefined, 'youtube')}
                >
                  <Youtube className="w-3 h-3 mr-2 text-red-500" />
                  YouTube Shorts
                </Button>
              </div>
            </Card>

            {/* File Details - Compact */}
            <Card className="p-3">
              <h3 className="font-medium text-sm mb-2">File Details</h3>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-medium">{formatDuration(media.duration_seconds)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Size</span>
                  <span className="font-medium">{formatFileSize(media.file_size_bytes)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-medium">{media.file_type || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Source</span>
                  <Badge className={cn(sourceInfo.className, "text-[10px]")}>{sourceInfo.label}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Uploaded</span>
                  <span className="font-medium">
                    {media.created_at
                      ? formatDistanceToNow(new Date(media.created_at), { addSuffix: true })
                      : "—"}
                  </span>
                </div>
              </div>
            </Card>

            {/* Transcript Preview - Compact */}
            {latestTranscript && (
              <Card className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-sm">Transcript</h3>
                  <Button variant="ghost" size="sm" className="h-6 text-xs">
                    <Eye className="w-3 h-3 mr-1" />
                    View
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-4">
                  {latestTranscript.raw_text || "No transcript text available"}
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
      </div>

      {/* Social Publish Modal */}
      <SocialPublishModal
        open={showSocialModal}
        onOpenChange={setShowSocialModal}
        clip={selectedClip ? {
          id: selectedClip.id,
          title: selectedClip.title,
          thumbnail_url: selectedClip.thumbnail_url,
          file_url: selectedClip.vertical_url,
          duration_seconds: selectedClip.duration_seconds,
        } : media ? {
          id: media.id,
          title: media.file_name || "Untitled",
          file_url: primaryVideoUrl,
          thumbnail_url: primaryThumbnail,
          duration_seconds: media.duration_seconds,
        } : null}
      />

      {/* Submit for Ads Modal */}
      <Dialog open={showAdSubmitModal} onOpenChange={setShowAdSubmitModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-[#2C6BED]" />
              Submit this video to Seeksy Ads?
            </DialogTitle>
            <DialogDescription className="pt-4 space-y-4">
              <p>We'll add this video to our ad marketplace.</p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <span><strong>3 ad slots</strong> will be inserted (pre-roll / mid-roll / post-roll)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>Estimated payout: <strong>$18.50</strong> per 1,000 impressions (CPM)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>You'll earn revenue whenever this video is shown with ads</span>
                </li>
              </ul>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowAdSubmitModal(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-gradient-to-r from-[#053877] to-[#2C6BED]"
              onClick={handleSubmitForAds}
            >
              Yes, submit for ads
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* YouTube Publish Modal */}
      <YouTubePublishModal
        open={showYouTubeModal}
        onOpenChange={setShowYouTubeModal}
        video={media ? {
          id: media.id,
          title: media.file_name || "Untitled",
          description: media.description || "",
          file_url: primaryVideoUrl,
          thumbnail_url: primaryThumbnail,
          duration_seconds: media.duration_seconds,
        } : null}
      />
    </div>
  );
}
