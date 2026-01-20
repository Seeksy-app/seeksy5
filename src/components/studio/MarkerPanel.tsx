import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, Scissors, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export interface RecordingMarker {
  id: string;
  type: 'ad' | 'clip';
  timestamp: number;
  label: string;
}

interface MarkerPanelProps {
  markers: RecordingMarker[];
  currentTime: number;
  isRecording: boolean;
  onAddMarker: (type: 'ad' | 'clip') => void;
  onRemoveMarker: (markerId: string) => void;
}

export function MarkerPanel({ 
  markers, 
  currentTime, 
  isRecording, 
  onAddMarker, 
  onRemoveMarker 
}: MarkerPanelProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="border-2">
      <CardContent className="pt-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => onAddMarker('ad')}
            disabled={!isRecording}
            className={cn(
              "h-24 flex flex-col gap-2 bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600",
              "hover:from-emerald-600 hover:via-green-600 hover:to-teal-700",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "shadow-lg hover:shadow-2xl hover:scale-[1.02] transition-all duration-200",
              "border-0 text-white font-semibold"
            )}
          >
            <div className="bg-white/20 rounded-full p-2">
              <DollarSign className="h-6 w-6" />
            </div>
            <div className="text-center">
              <div className="font-bold text-base">Ad Spot</div>
              <div className="text-xs opacity-90 font-normal">Mark insertion point</div>
            </div>
          </Button>
          <Button
            onClick={() => onAddMarker('clip')}
            disabled={!isRecording}
            className={cn(
              "h-24 flex flex-col gap-2 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-600",
              "hover:from-indigo-600 hover:via-purple-600 hover:to-pink-700",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "shadow-lg hover:shadow-2xl hover:scale-[1.02] transition-all duration-200",
              "border-0 text-white font-semibold"
            )}
          >
            <div className="bg-white/20 rounded-full p-2">
              <Scissors className="h-6 w-6" />
            </div>
            <div className="text-center">
              <div className="font-bold text-base">Clip Moment</div>
              <div className="text-xs opacity-90 font-normal">Mark viral-worthy</div>
            </div>
          </Button>
        </div>

        {markers.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold">Markers ({markers.length})</p>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {markers.map((marker) => (
                <div 
                  key={marker.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border-2 transition-all",
                    marker.type === 'ad' 
                      ? "bg-green-50 border-green-300 dark:bg-green-950/20 dark:border-green-800"
                      : "bg-blue-50 border-blue-300 dark:bg-blue-950/20 dark:border-blue-800"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-full",
                      marker.type === 'ad' 
                        ? "bg-green-500 text-white"
                        : "bg-blue-500 text-white"
                    )}>
                      {marker.type === 'ad' ? (
                        <DollarSign className="h-4 w-4" />
                      ) : (
                        <Scissors className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{marker.label}</p>
                      <p className="text-xs text-muted-foreground font-mono">{formatTime(marker.timestamp)}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveMarker(marker.id)}
                    className="hover:bg-destructive/10 hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
