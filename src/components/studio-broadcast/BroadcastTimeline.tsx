import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, Play, Pause, SkipBack, SkipForward, Megaphone, Image, Scissors, MessageSquare, BarChart3, Award } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimelineMarker {
  id: string;
  marker_type: 'ad_spot' | 'broll' | 'clip_highlight' | 'chapter' | 'poll' | 'qa' | 'sponsor_mention' | 'lower_third';
  timestamp_seconds: number;
  duration_seconds?: number;
  title?: string;
  description?: string;
  metadata?: any;
  triggered: boolean;
  completed: boolean;
}

interface BroadcastTimelineProps {
  broadcastId: string;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  markers: TimelineMarker[];
  onTimeSeek: (time: number) => void;
  onPlayPause: () => void;
  onAddMarker: (type: TimelineMarker['marker_type'], timestamp: number) => void;
  onMarkerClick: (marker: TimelineMarker) => void;
}

const markerConfig = {
  ad_spot: { icon: Megaphone, color: "bg-green-500", label: "Ad Spot" },
  broll: { icon: Image, color: "bg-purple-500", label: "B-Roll" },
  clip_highlight: { icon: Scissors, color: "bg-orange-500", label: "Clip" },
  chapter: { icon: Play, color: "bg-blue-500", label: "Chapter" },
  poll: { icon: BarChart3, color: "bg-pink-500", label: "Poll" },
  qa: { icon: MessageSquare, color: "bg-cyan-500", label: "Q&A" },
  sponsor_mention: { icon: Award, color: "bg-yellow-500", label: "Sponsor" },
  lower_third: { icon: Play, color: "bg-indigo-500", label: "Lower Third" },
};

export function BroadcastTimeline({
  broadcastId,
  currentTime,
  duration,
  isPlaying,
  markers,
  onTimeSeek,
  onPlayPause,
  onAddMarker,
  onMarkerClick
}: BroadcastTimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [showMarkerMenu, setShowMarkerMenu] = useState(false);
  const [markerMenuPosition, setMarkerMenuPosition] = useState({ x: 0, y: 0, timestamp: 0 });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;
    onTimeSeek(newTime);
  };

  const handleTimelineRightClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const timestamp = percentage * duration;
    
    setMarkerMenuPosition({ x: e.clientX, y: e.clientY, timestamp });
    setShowMarkerMenu(true);
  };

  const handleAddMarker = (type: TimelineMarker['marker_type']) => {
    onAddMarker(type, markerMenuPosition.timestamp);
    setShowMarkerMenu(false);
  };

  const getMarkerPosition = (timestamp: number) => {
    return (timestamp / duration) * 100;
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-4">
      {/* Playback Controls */}
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={onPlayPause}>
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <Button size="sm" variant="outline" onClick={() => onTimeSeek(Math.max(0, currentTime - 10))}>
          <SkipBack className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="outline" onClick={() => onTimeSeek(Math.min(duration, currentTime + 10))}>
          <SkipForward className="h-4 w-4" />
        </Button>
        <div className="flex-1 text-center text-sm text-muted-foreground">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-2">
        <div
          ref={timelineRef}
          className="relative h-16 bg-muted rounded-lg cursor-pointer overflow-hidden"
          onClick={handleTimelineClick}
          onContextMenu={handleTimelineRightClick}
        >
          {/* Progress Bar */}
          <div
            className="absolute top-0 left-0 h-full bg-primary/30 transition-all"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />

          {/* Current Time Indicator */}
          <div
            className="absolute top-0 h-full w-0.5 bg-primary z-10"
            style={{ left: `${(currentTime / duration) * 100}%` }}
          />

          {/* Markers */}
          {markers.map((marker) => {
            const config = markerConfig[marker.marker_type];
            const Icon = config.icon;
            return (
              <TooltipProvider key={marker.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      className={cn(
                        "absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110",
                        config.color,
                        marker.triggered && "ring-2 ring-white",
                        marker.completed && "opacity-50"
                      )}
                      style={{ left: `${getMarkerPosition(marker.timestamp_seconds)}%` }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onMarkerClick(marker);
                      }}
                    >
                      <Icon className="h-4 w-4 text-white" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-xs">
                      <div className="font-semibold">{marker.title || config.label}</div>
                      <div className="text-muted-foreground">{formatTime(marker.timestamp_seconds)}</div>
                      {marker.description && <div className="mt-1">{marker.description}</div>}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>

        {/* Marker Legend */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(markerConfig).map(([type, config]) => {
            const Icon = config.icon;
            const count = markers.filter(m => m.marker_type === type).length;
            if (count === 0) return null;
            
            return (
              <Badge key={type} variant="outline" className="gap-1">
                <div className={cn("w-2 h-2 rounded-full", config.color)} />
                <Icon className="h-3 w-3" />
                <span className="text-xs">{config.label} ({count})</span>
              </Badge>
            );
          })}
        </div>
      </div>

      {/* Marker Context Menu */}
      {showMarkerMenu && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setShowMarkerMenu(false)}
          />
          <div
            className="fixed z-50 bg-popover border border-border rounded-lg shadow-lg p-2 space-y-1"
            style={{ left: markerMenuPosition.x, top: markerMenuPosition.y }}
          >
            <div className="text-xs text-muted-foreground px-2 py-1">
              Add Marker at {formatTime(markerMenuPosition.timestamp)}
            </div>
            {Object.entries(markerConfig).map(([type, config]) => {
              const Icon = config.icon;
              return (
                <button
                  key={type}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-accent transition-colors"
                  onClick={() => handleAddMarker(type as TimelineMarker['marker_type'])}
                >
                  <div className={cn("w-2 h-2 rounded-full", config.color)} />
                  <Icon className="h-4 w-4" />
                  <span>{config.label}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
