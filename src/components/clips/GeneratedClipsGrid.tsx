import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { 
  Play, Pause, Download, Film, Zap, 
  Smartphone, Square, Monitor, Maximize2,
  Copy, ExternalLink, FolderOpen, Share2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import type { Clip } from "@/hooks/useClipGeneration";
import { SocialPublishModal } from "./SocialPublishModal";

interface GeneratedClipsGridProps {
  clips: Clip[];
  sourceMediaId?: string;
}

const formatDuration = (seconds: number | null) => {
  if (!seconds) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const getAspectRatioIcon = (ratio: string | null) => {
  switch (ratio) {
    case "9:16": return Smartphone;
    case "1:1": return Square;
    case "16:9": return Monitor;
    default: return Film;
  }
};

const getAspectRatioLabel = (ratio: string | null) => {
  switch (ratio) {
    case "9:16": return "Vertical";
    case "1:1": return "Square";
    case "16:9": return "Horizontal";
    case "4:5": return "Portrait";
    default: return ratio || "Video";
  }
};

export function GeneratedClipsGrid({ clips, sourceMediaId }: GeneratedClipsGridProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [playingClipId, setPlayingClipId] = useState<string | null>(null);
  const [selectedClip, setSelectedClip] = useState<Clip | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showSocialModal, setShowSocialModal] = useState(false);
  const [clipToPublish, setClipToPublish] = useState<Clip | null>(null);

  const handlePublishToSocial = (clip: Clip) => {
    setClipToPublish(clip);
    setShowSocialModal(true);
  };

  if (!clips || clips.length === 0) {
    return null;
  }

  // Group clips by their segment (based on start_seconds)
  const clipGroups = clips.reduce((groups, clip) => {
    const key = `${clip.start_seconds}-${clip.end_seconds}`;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(clip);
    return groups;
  }, {} as Record<string, Clip[]>);

  const getClipVideoUrl = (clip: Clip) => {
    return clip.vertical_url || clip.storage_path || null;
  };

  const handleDownload = async (clip: Clip) => {
    const url = getClipVideoUrl(clip);
    if (!url) {
      toast({
        title: "Download unavailable",
        description: "This clip doesn't have a downloadable file yet.",
        variant: "destructive",
      });
      return;
    }

    // Open in new tab for download
    window.open(url, "_blank");
    toast({
      title: "Download started",
      description: "Your clip is downloading...",
    });
  };

  const handleCopyLink = async (clip: Clip) => {
    const url = getClipVideoUrl(clip);
    if (!url) return;

    await navigator.clipboard.writeText(url);
    toast({
      title: "Link copied",
      description: "Clip link copied to clipboard",
    });
  };

  const handleViewInLibrary = () => {
    navigate("/media-vault?tab=clips");
  };

  const openClipDetail = (clip: Clip) => {
    setSelectedClip(clip);
    setShowDetailModal(true);
  };

  // Get primary clips (one per segment, highest score)
  const primaryClips = Object.values(clipGroups).map(group => {
    return group.reduce((best, clip) => 
      (clip.virality_score || 0) > (best.virality_score || 0) ? clip : best
    , group[0]);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Film className="h-5 w-5 text-[#2C6BED]" />
          Generated Clips ({clips.length})
        </h2>
        <Button variant="outline" size="sm" onClick={handleViewInLibrary}>
          <FolderOpen className="h-4 w-4 mr-2" />
          View in Media Library
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {primaryClips.map((clip) => {
          const videoUrl = getClipVideoUrl(clip);
          const isPlaying = playingClipId === clip.id;
          const AspectIcon = getAspectRatioIcon(clip.aspect_ratio);
          const duration = clip.end_seconds - clip.start_seconds;
          const allFormats = clipGroups[`${clip.start_seconds}-${clip.end_seconds}`];

          return (
            <Card key={clip.id} className="overflow-hidden group hover:shadow-lg transition-shadow">
              <div 
                className={cn(
                  "relative bg-muted",
                  clip.aspect_ratio === "9:16" ? "aspect-[9/16]" : 
                  clip.aspect_ratio === "1:1" ? "aspect-square" : 
                  "aspect-video"
                )}
              >
                {isPlaying && videoUrl ? (
                  <video
                    src={videoUrl}
                    className="w-full h-full object-cover"
                    autoPlay
                    controls
                    onEnded={() => setPlayingClipId(null)}
                  />
                ) : clip.thumbnail_url ? (
                  <img 
                    src={clip.thumbnail_url} 
                    alt={clip.title || "Clip"} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#053877]/20 to-[#2C6BED]/20">
                    <Film className="h-12 w-12 text-muted-foreground/30" />
                  </div>
                )}

                {/* Play button overlay */}
                {!isPlaying && videoUrl && (
                  <button
                    onClick={() => setPlayingClipId(clip.id)}
                    className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                      <Play className="h-6 w-6 text-[#2C6BED] ml-1" />
                    </div>
                  </button>
                )}

                {/* Score badge */}
                {clip.virality_score && (
                  <Badge 
                    className="absolute top-2 right-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-lg"
                  >
                    <Zap className="h-3 w-3 mr-1" />
                    {clip.virality_score}
                  </Badge>
                )}

                {/* Duration & format badges */}
                <div className="absolute bottom-2 left-2 right-2 flex justify-between">
                  <Badge variant="secondary" className="text-[10px] bg-black/60 text-white border-0">
                    {formatDuration(duration)}
                  </Badge>
                  <Badge variant="secondary" className="text-[10px] bg-black/60 text-white border-0">
                    <AspectIcon className="h-3 w-3 mr-1" />
                    {getAspectRatioLabel(clip.aspect_ratio)}
                  </Badge>
                </div>
              </div>

              <CardContent className="p-3 space-y-2">
                <p className="font-medium text-sm truncate">
                  {clip.title || `Clip ${clip.start_seconds?.toFixed(0)}s`}
                </p>
                {clip.suggested_caption && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {clip.suggested_caption}
                  </p>
                )}

                <div className="flex gap-2 pt-1">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleDownload(clip)}
                  >
                    <Download className="h-3.5 w-3.5 mr-1" />
                    Download
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1 bg-gradient-to-r from-[#053877] to-[#2C6BED]"
                    onClick={() => handlePublishToSocial(clip)}
                  >
                    <Share2 className="h-3.5 w-3.5 mr-1" />
                    Publish
                  </Button>
                  {allFormats.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openClipDetail(clip)}
                    >
                      <Maximize2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Clip Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedClip?.title || "Clip Details"}</DialogTitle>
          </DialogHeader>
          
          {selectedClip && (
            <div className="space-y-4">
              {/* Main preview */}
              <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                {getClipVideoUrl(selectedClip) ? (
                  <video
                    src={getClipVideoUrl(selectedClip)!}
                    className="w-full h-full object-contain bg-black"
                    controls
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Film className="h-16 w-16 text-muted-foreground/30" />
                  </div>
                )}
              </div>

              {/* Clip info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="ml-2 font-medium">
                    {formatDuration(selectedClip.end_seconds - selectedClip.start_seconds)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Score:</span>
                  <span className="ml-2 font-medium">{selectedClip.virality_score || "N/A"}</span>
                </div>
              </div>

              {/* Available formats */}
              <div>
                <p className="text-sm font-medium mb-2">Available Formats:</p>
                <div className="grid grid-cols-3 gap-2">
                  {clipGroups[`${selectedClip.start_seconds}-${selectedClip.end_seconds}`]?.map((formatClip) => {
                    const FormatIcon = getAspectRatioIcon(formatClip.aspect_ratio);
                    return (
                      <Button
                        key={formatClip.id}
                        variant="outline"
                        size="sm"
                        className="justify-start"
                        onClick={() => handleDownload(formatClip)}
                      >
                        <FormatIcon className="h-4 w-4 mr-2" />
                        {getAspectRatioLabel(formatClip.aspect_ratio)}
                        <Download className="h-3 w-3 ml-auto" />
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => handleCopyLink(selectedClip)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Link
                </Button>
                <Button variant="outline" className="flex-1" onClick={handleViewInLibrary}>
                  <FolderOpen className="h-4 w-4 mr-2" />
                  View in Library
                </Button>
                <Button 
                  className="flex-1 bg-gradient-to-r from-[#053877] to-[#2C6BED]"
                  onClick={() => {
                    setShowDetailModal(false);
                    handlePublishToSocial(selectedClip);
                  }}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Publish to Social
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Social Publish Modal */}
      <SocialPublishModal
        open={showSocialModal}
        onOpenChange={setShowSocialModal}
        clip={clipToPublish ? {
          id: clipToPublish.id,
          title: clipToPublish.title || `Clip ${clipToPublish.start_seconds?.toFixed(0)}s`,
          thumbnail_url: clipToPublish.thumbnail_url,
          file_url: clipToPublish.vertical_url || clipToPublish.storage_path,
          duration_seconds: clipToPublish.end_seconds - clipToPublish.start_seconds,
          aspect_ratio: clipToPublish.aspect_ratio || "9:16"
        } : null}
      />
    </div>
  );
}
