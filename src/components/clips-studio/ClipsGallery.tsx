import { ClipData, SourceMedia } from "@/pages/ClipsStudio";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, Zap, BarChart3, Flame, Play, Clock, 
  Smartphone, Youtube, Instagram, Film
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ClipsGalleryProps {
  clips: ClipData[];
  selectedClipId: string | null;
  onSelectClip: (clipId: string) => void;
  sourceMedia: SourceMedia;
  viewMode: 'grid' | 'list';
}

export function ClipsGallery({ 
  clips, 
  selectedClipId, 
  onSelectClip, 
  sourceMedia,
  viewMode 
}: ClipsGalleryProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-500";
    if (score >= 75) return "text-yellow-500";
    if (score >= 60) return "text-orange-500";
    return "text-red-500";
  };

  const getScoreBg = (score: number) => {
    if (score >= 90) return "bg-green-500";
    if (score >= 75) return "bg-yellow-500";
    if (score >= 60) return "bg-orange-500";
    return "bg-red-500";
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'tiktok': return <Smartphone className="h-3 w-3" />;
      case 'reels': return <Instagram className="h-3 w-3" />;
      case 'shorts': return <Youtube className="h-3 w-3" />;
      default: return null;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'tiktok': return 'bg-pink-500';
      case 'reels': return 'bg-purple-500';
      case 'shorts': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  // Get thumbnail URL - use clip thumbnail, source media thumbnail, or generate from video
  const getThumbnailUrl = (clip: ClipData) => {
    if (clip.thumbnail_url) return clip.thumbnail_url;
    if (sourceMedia.thumbnail_url) return sourceMedia.thumbnail_url;
    return null;
  };

  return (
    <div className="w-64 border-r bg-card/30 flex flex-col h-full overflow-hidden">
      {/* Header - fixed */}
      <div className="flex-shrink-0 p-4 border-b bg-card/50">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-lg">AI Clips</h2>
          <Badge className="bg-[#2C6BED]/20 text-[#2C6BED] border-0 font-semibold">
            {clips.length} found
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Ranked by virality potential • Click to preview
        </p>
      </div>

      {/* Clips list - scrollable independently */}
      <ScrollArea className="flex-1">
        <div className={cn(
          "p-3",
          viewMode === 'grid' ? 'space-y-3' : 'space-y-2'
        )}>
          {clips.map((clip, index) => (
            <motion.div
              key={clip.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onSelectClip(clip.id)}
              className={cn(
                "rounded-xl border-2 cursor-pointer transition-all group overflow-hidden",
                selectedClipId === clip.id
                  ? "border-[#2C6BED] bg-[#2C6BED]/5 shadow-lg"
                  : "border-border hover:border-[#2C6BED]/50 hover:bg-muted/30"
              )}
            >
              {/* Thumbnail with overlays - smaller for compact cards */}
              <div className="relative aspect-[4/3] bg-black">
                {getThumbnailUrl(clip) ? (
                  <img
                    src={getThumbnailUrl(clip)!}
                    alt={clip.title || `Clip ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                ) : sourceMedia.cloudflare_download_url || sourceMedia.file_url ? (
                  <video
                    src={`${sourceMedia.cloudflare_download_url || sourceMedia.file_url}#t=${clip.start_seconds}`}
                    className="w-full h-full object-cover"
                    muted
                    preload="metadata"
                    onLoadedData={(e) => {
                      // Seek to clip start for thumbnail
                      const video = e.target as HTMLVideoElement;
                      video.currentTime = clip.start_seconds;
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <Film className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                
                {/* Transcript text overlay on thumbnail - like Opus Clips */}
                {clip.transcript_snippet && (
                  <div className="absolute bottom-8 left-1 right-1 pointer-events-none">
                    <div className="bg-black/70 backdrop-blur-sm px-2 py-1 rounded">
                      <p className="text-white text-[10px] font-bold text-center uppercase leading-tight line-clamp-2">
                        {clip.transcript_snippet.split(' ').slice(0, 6).join(' ')}
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Play overlay on hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                  <Play className="h-10 w-10 text-white opacity-0 group-hover:opacity-100 transition-opacity fill-white" />
                </div>
                
                {/* Virality score badge - top left */}
                <div className={cn(
                  "absolute top-2 left-2 px-2 py-1 rounded-lg text-white text-sm font-bold flex items-center gap-1",
                  getScoreBg(clip.virality_score || 0)
                )}>
                  <TrendingUp className="h-3 w-3" />
                  {clip.virality_score || 0}%
                </div>

                {/* Duration - bottom right */}
                <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-0.5 rounded-md text-xs text-white font-medium flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatTime(clip.end_seconds - clip.start_seconds)}
                </div>

                {/* Platform badges - bottom left */}
                <div className="absolute bottom-2 left-2 flex gap-1">
                  {(clip.platforms || ['tiktok', 'reels', 'shorts']).slice(0, 3).map((platform) => (
                    <div
                      key={platform}
                      className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center text-white",
                        getPlatformColor(platform)
                      )}
                    >
                      {getPlatformIcon(platform)}
                    </div>
                  ))}
                </div>
              </div>

              {/* Content - compact */}
              <div className="p-2">
                {/* Title */}
                <p className="font-medium text-xs line-clamp-1 mb-2">
                  {clip.title || `Clip ${index + 1}`}
                </p>

                {/* Score grid - compact */}
                <div className="grid grid-cols-4 gap-1">
                  <div className="text-center p-1 rounded bg-muted/50">
                    <Zap className="h-3 w-3 mx-auto text-yellow-500" />
                    <p className={cn("text-[10px] font-bold", getScoreColor(clip.hook_score || clip.virality_score || 0))}>
                      {clip.hook_score || clip.virality_score || 0}
                    </p>
                  </div>
                  <div className="text-center p-1 rounded bg-muted/50">
                    <BarChart3 className="h-3 w-3 mx-auto text-blue-500" />
                    <p className={cn("text-[10px] font-bold", getScoreColor(clip.flow_score || clip.virality_score || 0))}>
                      {clip.flow_score || clip.virality_score || 0}
                    </p>
                  </div>
                  <div className="text-center p-1 rounded bg-muted/50">
                    <TrendingUp className="h-3 w-3 mx-auto text-green-500" />
                    <p className={cn("text-[10px] font-bold", getScoreColor(clip.value_score || clip.virality_score || 0))}>
                      {clip.value_score || clip.virality_score || 0}
                    </p>
                  </div>
                  <div className="text-center p-1 rounded bg-muted/50">
                    <Flame className="h-3 w-3 mx-auto text-orange-500" />
                    <p className={cn("text-[10px] font-bold", getScoreColor(clip.trend_score || clip.virality_score || 0))}>
                      {clip.trend_score || clip.virality_score || 0}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
