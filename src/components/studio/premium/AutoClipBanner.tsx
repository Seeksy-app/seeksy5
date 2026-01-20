import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, X, ChevronRight, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface AutoClip {
  id: string;
  timestamp: string;
  duration: string;
  type: "energy" | "reaction" | "insight" | "laughter" | "quote";
  confidence: number;
  preview?: string;
}

interface AutoClipBannerProps {
  clips: AutoClip[];
  onViewClips: () => void;
  onDismiss: () => void;
  isRecording: boolean;
}

export function AutoClipBanner({ clips, onViewClips, onDismiss, isRecording }: AutoClipBannerProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [latestClip, setLatestClip] = useState<AutoClip | null>(null);

  useEffect(() => {
    if (clips.length > 0) {
      setLatestClip(clips[clips.length - 1]);
      setIsMinimized(false);
      
      // Auto-minimize after 5 seconds
      const timer = setTimeout(() => {
        setIsMinimized(true);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [clips.length]);

  if (!isRecording || clips.length === 0) return null;

  const getClipTypeLabel = (type: AutoClip["type"]) => {
    switch (type) {
      case "energy": return "Peak Energy";
      case "reaction": return "Big Reaction";
      case "insight": return "Clear Insight";
      case "laughter": return "Laughter";
      case "quote": return "Great Quote";
      default: return "Hot Moment";
    }
  };

  return (
    <AnimatePresence mode="wait">
      {isMinimized ? (
        <motion.button
          key="minimized"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          onClick={() => setIsMinimized(false)}
          className={cn(
            "fixed bottom-24 right-6 z-50",
            "flex items-center gap-2 px-4 py-2.5",
            "bg-gradient-to-r from-violet-600/90 to-purple-600/90 backdrop-blur-xl",
            "rounded-full shadow-lg shadow-violet-500/20",
            "border border-white/20 text-white",
            "hover:scale-105 transition-transform"
          )}
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span className="font-medium">{clips.length}</span>
          <span className="text-sm text-white/80">clips</span>
        </motion.button>
      ) : (
        <motion.div
          key="expanded"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className={cn(
            "fixed bottom-24 right-6 z-50 w-80",
            "bg-[#1a1f2e]/95 backdrop-blur-xl",
            "rounded-2xl shadow-2xl shadow-black/40",
            "border border-white/10 overflow-hidden"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Auto-Clips</p>
                <p className="text-xs text-white/50">AI is capturing moments</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMinimized(true)}
                className="w-7 h-7 text-white/40 hover:text-white hover:bg-white/10"
              >
                <span className="text-lg">−</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onDismiss}
                className="w-7 h-7 text-white/40 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Latest Clip */}
          {latestClip && (
            <div className="p-4 border-b border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-white/50">Just captured</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">
                    {getClipTypeLabel(latestClip.type)}
                  </p>
                  <p className="text-xs text-white/40">
                    {latestClip.timestamp} · {latestClip.duration}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white"
                >
                  <Play className="w-3 h-3 mr-1.5" />
                  Preview
                </Button>
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-white/50">
                ✨ {clips.length} clips auto-created
              </p>
            </div>
            
            {/* Clip type breakdown */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {["energy", "reaction", "insight", "laughter", "quote"].map((type) => {
                const count = clips.filter(c => c.type === type).length;
                if (count === 0) return null;
                return (
                  <span
                    key={type}
                    className="px-2 py-1 text-[10px] bg-white/5 rounded text-white/60"
                  >
                    {count} {type}
                  </span>
                );
              })}
            </div>

            <Button
              onClick={onViewClips}
              className="w-full bg-white/10 hover:bg-white/15 text-white border-0"
            >
              View All Clips
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
