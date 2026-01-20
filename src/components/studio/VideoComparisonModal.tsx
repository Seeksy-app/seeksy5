import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { X, Play, Pause, Volume2, VolumeX, AlertCircle, Mic, Zap, VolumeX as VolumeOff, Clock, Layers, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalyticsData {
  fillerWordsRemoved: number;
  pausesRemoved: number;
  silencesTrimmed: number;
  noiseReduced: number;
  totalTimeSaved: number;
  chaptersDetected: number;
  originalDuration: number;
  finalDuration: number;
}

interface VideoComparisonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  originalUrl: string | null;
  enhancedUrl: string | null;
  originalTitle?: string;
  enhancedTitle?: string;
  analytics?: AnalyticsData | null;
}

const formatDuration = (seconds: number) => {
  if (!seconds) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

interface AnalyticCardProps {
  icon: React.ElementType;
  label: string;
  value: number | string;
  unit: string;
  color: string;
  notAvailable?: boolean;
}

function AnalyticCard({ icon: Icon, label, value, unit, color, notAvailable }: AnalyticCardProps) {
  return (
    <div className="p-2 rounded-lg border bg-card text-center min-w-[90px]">
      <Icon className={cn("h-4 w-4 mx-auto mb-1", color)} />
      <div className="text-lg font-bold">
        {notAvailable ? "—" : value}
      </div>
      <div className="text-[10px] text-muted-foreground">{notAvailable ? "Not available" : unit}</div>
      <div className="text-[9px] text-muted-foreground uppercase tracking-wide">{label}</div>
    </div>
  );
}

export function VideoComparisonModal({
  open,
  onOpenChange,
  originalUrl,
  enhancedUrl,
  originalTitle = "Original",
  enhancedTitle = "Enhanced",
  analytics
}: VideoComparisonModalProps) {
  const [comparisonPosition, setComparisonPosition] = useState(50);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const originalRef = useRef<HTMLVideoElement>(null);
  const enhancedRef = useRef<HTMLVideoElement>(null);

  // Sync playback
  useEffect(() => {
    if (!originalRef.current || !enhancedRef.current) return;
    
    const syncTime = () => {
      if (enhancedRef.current && originalRef.current) {
        originalRef.current.currentTime = enhancedRef.current.currentTime;
      }
    };

    enhancedRef.current.addEventListener('timeupdate', syncTime);
    return () => {
      enhancedRef.current?.removeEventListener('timeupdate', syncTime);
    };
  }, [open]);

  const togglePlayback = () => {
    if (originalRef.current && enhancedRef.current) {
      if (isPlaying) {
        originalRef.current.pause();
        enhancedRef.current.pause();
      } else {
        originalRef.current.play();
        enhancedRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (originalRef.current && enhancedRef.current) {
      originalRef.current.muted = !isMuted;
      enhancedRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const hasOriginal = !!originalUrl;
  const hasEnhanced = !!enhancedUrl;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[95vw] h-[85vh] p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-0 flex-row items-center justify-between">
          <DialogTitle className="text-lg font-semibold">
            Compare Original vs Enhanced
          </DialogTitle>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="flex-1 p-4 flex flex-col gap-4">
          {/* Video Comparison Area */}
          <div className="relative flex-1 bg-black rounded-xl overflow-hidden">
            {/* Labels */}
            <div className="absolute top-4 left-4 z-20">
              <span className="px-3 py-1 bg-black/70 text-white text-sm font-medium rounded-full">
                {originalTitle}
              </span>
            </div>
            <div className="absolute top-4 right-4 z-20">
              <span className="px-3 py-1 bg-[#2C6BED]/90 text-white text-sm font-medium rounded-full">
                {enhancedTitle}
              </span>
            </div>

            {/* Split View Container */}
            <div className="relative w-full h-full">
              {/* Enhanced (Right/Full) */}
              <div className="absolute inset-0">
                {hasEnhanced ? (
                  <video
                    ref={enhancedRef}
                    src={enhancedUrl}
                    className="w-full h-full object-contain"
                    muted={isMuted}
                    loop
                    playsInline
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/50">
                    <AlertCircle className="h-8 w-8 mr-2" />
                    Enhanced preview not available
                  </div>
                )}
              </div>

              {/* Original (Left - Clipped) */}
              <div 
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${comparisonPosition}%` }}
              >
                {hasOriginal ? (
                  <video
                    ref={originalRef}
                    src={originalUrl}
                    className="w-full h-full object-contain"
                    style={{ 
                      width: `${100 / (comparisonPosition / 100)}%`,
                      maxWidth: 'none'
                    }}
                    muted
                    loop
                    playsInline
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-900 text-white/50">
                    <AlertCircle className="h-8 w-8 mr-2" />
                    Original not available for preview
                  </div>
                )}
              </div>

              {/* Slider Handle */}
              <div 
                className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-10"
                style={{ left: `${comparisonPosition}%`, transform: 'translateX(-50%)' }}
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center">
                  <div className="flex gap-0.5">
                    <div className="w-0.5 h-3 bg-gray-400 rounded-full" />
                    <div className="w-0.5 h-3 bg-gray-400 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={togglePlayback}>
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="icon" onClick={toggleMute}>
              {isMuted ? <VolumeOff className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            
            <div className="flex-1 flex items-center gap-3">
              <span className="text-sm text-muted-foreground whitespace-nowrap">Original</span>
              <Slider
                value={[comparisonPosition]}
                onValueChange={([value]) => setComparisonPosition(value)}
                min={0}
                max={100}
                step={1}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground whitespace-nowrap">Enhanced</span>
            </div>
          </div>

          {/* AI Processing Analytics Strip */}
          {analytics && (
            <div className="p-3 rounded-lg border bg-muted/30">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-[#2C6BED]" />
                <span className="text-sm font-medium">AI Processing Analytics</span>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                <AnalyticCard 
                  icon={Mic} 
                  label="Filler Words" 
                  value={analytics.fillerWordsRemoved} 
                  unit="removed" 
                  color="text-orange-500"
                  notAvailable={analytics.fillerWordsRemoved === 0 && analytics.totalTimeSaved === 0}
                />
                <AnalyticCard 
                  icon={Zap} 
                  label="Pauses" 
                  value={analytics.pausesRemoved} 
                  unit="trimmed" 
                  color="text-yellow-500"
                  notAvailable={analytics.pausesRemoved === 0 && analytics.totalTimeSaved === 0}
                />
                <AnalyticCard 
                  icon={VolumeOff} 
                  label="Silences" 
                  value={analytics.silencesTrimmed} 
                  unit="cut" 
                  color="text-blue-500"
                  notAvailable={analytics.silencesTrimmed === 0 && analytics.totalTimeSaved === 0}
                />
                <AnalyticCard 
                  icon={Volume2} 
                  label="Noise Reduced" 
                  value={analytics.noiseReduced} 
                  unit="%" 
                  color="text-green-500"
                  notAvailable={analytics.noiseReduced === 0}
                />
                <AnalyticCard 
                  icon={Clock} 
                  label="Time Saved" 
                  value={Math.round(analytics.totalTimeSaved)} 
                  unit="sec" 
                  color="text-purple-500"
                  notAvailable={analytics.totalTimeSaved === 0}
                />
                <AnalyticCard 
                  icon={Layers} 
                  label="Chapters" 
                  value={analytics.chaptersDetected} 
                  unit="detected" 
                  color="text-pink-500"
                  notAvailable={analytics.chaptersDetected === 0}
                />
              </div>
              
              {/* Duration Comparison */}
              {analytics.totalTimeSaved > 0 && (
                <div className="mt-3 p-2 bg-green-50 dark:bg-green-500/10 rounded-lg border border-green-200 dark:border-green-500/20 flex flex-wrap items-center justify-center gap-2 text-sm">
                  <span className="text-green-700 dark:text-green-400">
                    Original: {formatDuration(analytics.originalDuration)} → Enhanced: {formatDuration(analytics.finalDuration)}
                  </span>
                  <span className="px-2 py-0.5 bg-green-500 text-white rounded text-xs font-medium">
                    {Math.round((analytics.totalTimeSaved / analytics.originalDuration) * 100)}% shorter
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
