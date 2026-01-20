import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { 
  Mic, MicOff, Video, VideoOff, 
  PhoneOff, Settings, Volume2, Pause, 
  Play, Square, CircleDot
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RecordingControlsProps {
  isRecording: boolean;
  isPaused: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  micLevel: number;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onPauseRecording: () => void;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onEndSession: () => void;
  onOpenSettings: () => void;
  onMicLevelChange: (value: number) => void;
}

export function RecordingControls({
  isRecording,
  isPaused,
  isMuted,
  isVideoOff,
  micLevel,
  onStartRecording,
  onStopRecording,
  onPauseRecording,
  onToggleMute,
  onToggleVideo,
  onEndSession,
  onOpenSettings,
  onMicLevelChange,
}: RecordingControlsProps) {
  return (
    <div className="flex items-center justify-center gap-3">
      {/* Mic control with level */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleMute}
          className={cn(
            "w-10 h-10 rounded-xl transition-all",
            isMuted 
              ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" 
              : "bg-white/10 text-white hover:bg-white/20"
          )}
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </Button>
        <div className="w-20 hidden sm:block">
          <Slider
            value={[micLevel]}
            onValueChange={(v) => onMicLevelChange(v[0])}
            max={100}
            step={1}
            className="cursor-pointer"
          />
        </div>
      </div>

      {/* Video toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleVideo}
        className={cn(
          "w-12 h-12 rounded-xl transition-all",
          isVideoOff 
            ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" 
            : "bg-white/10 text-white hover:bg-white/20"
        )}
      >
        {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
      </Button>

      {/* Main record button */}
      <div className="mx-2">
        {!isRecording ? (
          <Button
            onClick={onStartRecording}
            className={cn(
              "w-16 h-16 rounded-full",
              "bg-gradient-to-br from-red-500 to-red-600",
              "hover:from-red-400 hover:to-red-500",
              "shadow-lg shadow-red-500/30",
              "transition-all hover:scale-105"
            )}
          >
            <CircleDot className="w-7 h-7 text-white" />
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              onClick={onPauseRecording}
              className={cn(
                "w-12 h-12 rounded-full",
                isPaused 
                  ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
                  : "bg-white/10 text-white hover:bg-white/20"
              )}
            >
              {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
            </Button>
            <Button
              onClick={onStopRecording}
              className={cn(
                "w-14 h-14 rounded-full",
                "bg-gradient-to-br from-red-500 to-red-600",
                "hover:from-red-400 hover:to-red-500",
                "shadow-lg shadow-red-500/30",
                "transition-all hover:scale-105 animate-pulse"
              )}
            >
              <Square className="w-6 h-6 text-white fill-white" />
            </Button>
          </div>
        )}
      </div>

      {/* Settings */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onOpenSettings}
        className="w-12 h-12 rounded-xl bg-white/10 text-white hover:bg-white/20"
      >
        <Settings className="w-5 h-5" />
      </Button>

      {/* End session */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onEndSession}
        className="w-12 h-12 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20"
      >
        <PhoneOff className="w-5 h-5" />
      </Button>
    </div>
  );
}
