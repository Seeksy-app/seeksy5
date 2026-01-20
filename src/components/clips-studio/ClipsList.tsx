import { ClipData, SourceMedia } from "@/pages/ClipsStudio";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Zap, BarChart3, Flame, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ClipsListProps {
  clips: ClipData[];
  selectedClipId: string | null;
  onSelectClip: (clipId: string) => void;
  sourceMedia: SourceMedia;
}

export function ClipsList({ clips, selectedClipId, onSelectClip, sourceMedia }: ClipsListProps) {
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

  const getScoreGrade = (score: number) => {
    if (score >= 95) return "A+";
    if (score >= 90) return "A";
    if (score >= 85) return "A-";
    if (score >= 80) return "B+";
    if (score >= 75) return "B";
    if (score >= 70) return "B-";
    if (score >= 65) return "C+";
    if (score >= 60) return "C";
    return "D";
  };

  return (
    <div className="w-80 border-r bg-card/50 flex flex-col h-full overflow-hidden">
      {/* Header - fixed */}
      <div className="flex-shrink-0 p-4 border-b">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-semibold">AI Clips</h2>
          <Badge variant="secondary" className="text-xs">
            {clips.length} found
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Ranked by virality potential • Click to preview
        </p>
      </div>

      {/* Scrollable clips list */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3 space-y-3">
          {clips.map((clip, index) => (
            <motion.div
              key={clip.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onSelectClip(clip.id)}
              className={cn(
                "p-3 rounded-xl border-2 cursor-pointer transition-all group",
                selectedClipId === clip.id
                  ? "border-primary bg-primary/5 shadow-lg"
                  : "border-border hover:border-primary/50 hover:bg-muted/50"
              )}
            >
              {/* Thumbnail with score overlay */}
              <div className="relative mb-3">
                <div className="w-full aspect-video bg-black rounded-lg overflow-hidden">
                  {clip.thumbnail_url ? (
                    <img 
                      src={clip.thumbnail_url} 
                      alt={clip.title || `Clip ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <video
                      src={`${sourceMedia.file_url}#t=${clip.start_seconds}`}
                      className="w-full h-full object-cover"
                      muted
                    />
                  )}
                </div>
                
                {/* Score badge */}
                <div className={cn(
                  "absolute top-2 left-2 px-2.5 py-1 rounded-full text-sm font-bold flex items-center gap-1",
                  "bg-green-500 text-white shadow-lg"
                )}>
                  <TrendingUp className="h-3 w-3" />
                  {clip.virality_score || 0}%
                </div>

                {/* Platform icons */}
                <div className="absolute bottom-2 left-2 flex gap-1">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
                    <Smartphone className="h-3 w-3 text-white" />
                  </div>
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <svg className="h-3 w-3 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069z"/>
                    </svg>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center">
                    <svg className="h-3 w-3 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </div>
                </div>

                {/* Duration */}
                <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-0.5 rounded-full text-xs text-white font-medium flex items-center gap-1">
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  {formatTime(clip.end_seconds - clip.start_seconds)}
                </div>
              </div>

              {/* Title */}
              <p className="font-semibold text-sm line-clamp-2 mb-3">
                {clip.title || `Clip ${index + 1}`}
              </p>

              {/* Mini scores */}
              <div className="grid grid-cols-4 gap-1.5">
                <div className="text-center p-1.5 rounded-lg bg-muted/50">
                  <Zap className="h-4 w-4 mx-auto mb-0.5 text-yellow-500" />
                  <p className={cn("text-xs font-bold", getScoreColor(clip.hook_score || clip.virality_score || 0))}>
                    {clip.hook_score || clip.virality_score || 0}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Hook</p>
                </div>
                <div className="text-center p-1.5 rounded-lg bg-muted/50">
                  <BarChart3 className="h-4 w-4 mx-auto mb-0.5 text-blue-500" />
                  <p className={cn("text-xs font-bold", getScoreColor(clip.flow_score || clip.virality_score || 0))}>
                    {clip.flow_score || clip.virality_score || 0}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Flow</p>
                </div>
                <div className="text-center p-1.5 rounded-lg bg-muted/50">
                  <TrendingUp className="h-4 w-4 mx-auto mb-0.5 text-green-500" />
                  <p className={cn("text-xs font-bold", getScoreColor(clip.value_score || clip.virality_score || 0))}>
                    {clip.value_score || clip.virality_score || 0}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Value</p>
                </div>
                <div className="text-center p-1.5 rounded-lg bg-muted/50">
                  <Flame className="h-4 w-4 mx-auto mb-0.5 text-orange-500" />
                  <p className={cn("text-xs font-bold", getScoreColor(clip.trend_score || clip.virality_score || 0))}>
                    {clip.trend_score || clip.virality_score || 0}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Trend</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
