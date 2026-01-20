import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Video, AudioWaveform, Clock, Loader2, Film } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectedMediaHeaderProps {
  fileName: string | null;
  thumbnail: string | null;
  duration: number | null;
  fileType: string | null;
  source?: string | null;
  isImporting?: boolean;
  onChangeMedia: () => void;
  sticky?: boolean;
}

const formatDuration = (seconds: number | null) => {
  if (!seconds) return null;
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const getSourceBadge = (source?: string | null) => {
  switch (source) {
    case 'youtube': return { label: 'YouTube', className: 'bg-red-100 text-red-700 border-red-200' };
    case 'zoom': return { label: 'Zoom', className: 'bg-blue-100 text-blue-700 border-blue-200' };
    case 'riverside': return { label: 'Riverside', className: 'bg-purple-100 text-purple-700 border-purple-200' };
    case 'upload': return { label: 'Uploaded', className: 'bg-gray-100 text-gray-700 border-gray-200' };
    default: return null;
  }
};

export function SelectedMediaHeader({
  fileName,
  thumbnail,
  duration,
  fileType,
  source,
  isImporting = false,
  onChangeMedia,
  sticky = false
}: SelectedMediaHeaderProps) {
  const sourceBadge = getSourceBadge(source);
  const durationFormatted = formatDuration(duration);

  return (
    <div 
      className={cn(
        "flex items-center justify-between p-4 bg-muted/50 rounded-lg border transition-all",
        sticky && "sticky top-4 z-20 shadow-sm backdrop-blur-sm bg-background/95"
      )}
      style={{ borderColor: 'rgba(5,56,119,0.2)' }}
    >
      <div className="flex items-center gap-3">
        {/* Thumbnail */}
        <div className="w-14 h-10 bg-muted rounded-lg overflow-hidden flex items-center justify-center relative shrink-0">
          {thumbnail ? (
            <img src={thumbnail} alt="" className="w-full h-full object-cover" />
          ) : fileType === 'video' ? (
            <Video className="h-5 w-5 text-muted-foreground" />
          ) : (
            <AudioWaveform className="h-5 w-5 text-muted-foreground" />
          )}
          {isImporting && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 className="h-4 w-4 text-white animate-spin" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-lg">🎞</span>
          <span className="font-medium">
            Selected: {isImporting ? 'Importing...' : (fileName || 'Untitled')}
          </span>
          
          {durationFormatted && (
            <span className="text-muted-foreground text-sm flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {durationFormatted}
            </span>
          )}
          
          {sourceBadge && (
            <Badge variant="outline" className={cn("text-xs", sourceBadge.className)}>
              {sourceBadge.label}
            </Badge>
          )}
          
          {isImporting && (
            <Badge className="animate-pulse" style={{ backgroundColor: '#FFC857', color: '#053877' }}>
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Importing...
            </Badge>
          )}
        </div>
      </div>

      <Button variant="ghost" size="sm" onClick={onChangeMedia}>
        Change Video
      </Button>
    </div>
  );
}
