import { cn } from "@/lib/utils";
import { Star, MessageSquareQuote, TrendingUp, Flame, Laugh, Pin } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface TimelineMarker {
  id: string;
  type: string;
  timestamp: number;
  label: string;
}

interface TimelineMarkersProps {
  markers: TimelineMarker[];
  duration: number;
  currentTime: number;
  onSeekTo: (time: number) => void;
}

const markerIcons: Record<string, React.ElementType> = {
  highlight: Star,
  quote: MessageSquareQuote,
  "ad-break": TrendingUp,
  viral: Flame,
  funny: Laugh,
  topic: Pin,
};

const markerColors: Record<string, string> = {
  highlight: "bg-amber-400",
  quote: "bg-blue-400",
  "ad-break": "bg-green-400",
  viral: "bg-orange-400",
  funny: "bg-pink-400",
  topic: "bg-purple-400",
};

export function TimelineMarkers({ markers, duration, currentTime, onSeekTo }: TimelineMarkersProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="relative w-full">
      {/* Timeline track */}
      <div className="relative h-12 bg-white/5 rounded-lg border border-white/10 overflow-hidden">
        {/* Progress */}
        <div 
          className="absolute inset-y-0 left-0 bg-white/10"
          style={{ width: `${(currentTime / duration) * 100}%` }}
        />
        
        {/* Markers */}
        <TooltipProvider>
          {markers.map((marker) => {
            const Icon = markerIcons[marker.type] || Star;
            const position = (marker.timestamp / duration) * 100;
            
            return (
              <Tooltip key={marker.id}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onSeekTo(marker.timestamp)}
                    className={cn(
                      "absolute top-1/2 -translate-y-1/2 -translate-x-1/2",
                      "w-6 h-6 rounded-full flex items-center justify-center",
                      "transition-transform hover:scale-125 z-10",
                      markerColors[marker.type] || "bg-white/30"
                    )}
                    style={{ left: `${position}%` }}
                  >
                    <Icon className="w-3 h-3 text-white" />
                  </button>
                </TooltipTrigger>
                <TooltipContent 
                  side="top" 
                  className="bg-[#1a1f2e] border-white/10 text-white"
                >
                  <p className="font-medium">{marker.label}</p>
                  <p className="text-xs text-white/60">{formatTime(marker.timestamp)}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </TooltipProvider>

        {/* Current time indicator */}
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-glow"
          style={{ left: `${(currentTime / duration) * 100}%` }}
        />
      </div>

      {/* Time labels */}
      <div className="flex justify-between mt-2 text-xs text-white/40">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      {/* Marker list */}
      {markers.length > 0 && (
        <div className="mt-4">
          <p className="text-xs text-white/50 mb-2">{markers.length} markers</p>
          <div className="flex flex-wrap gap-1.5">
            {markers.map((marker) => {
              const Icon = markerIcons[marker.type] || Star;
              return (
                <button
                  key={marker.id}
                  onClick={() => onSeekTo(marker.timestamp)}
                  className={cn(
                    "flex items-center gap-1.5 px-2 py-1 rounded-md",
                    "bg-white/5 hover:bg-white/10 transition-colors",
                    "text-xs text-white/70 hover:text-white"
                  )}
                >
                  <Icon className={cn("w-3 h-3", markerColors[marker.type]?.replace("bg-", "text-"))} />
                  {formatTime(marker.timestamp)}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
