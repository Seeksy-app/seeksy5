import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { 
  ArrowLeft, Calendar, Edit2, ChevronDown, 
  Circle, Radio, MonitorPlay, Sparkles, Focus
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type StudioMode = "record" | "live";

interface VideoStudioHeaderProps {
  sessionTitle: string;
  onBack: () => void;
  isRecording: boolean;
  studioMode: StudioMode;
  onModeChange: (mode: StudioMode) => void;
  onStartSession: () => void;
  onStopSession: () => void;
  onChannels: () => void;
  onSchedule: () => void;
  onEditTitle: () => void;
  recordingTime?: number;
  channelCount?: number;
  activeChannelCount?: number;
  realtimeAIClips?: boolean;
  onRealtimeAIClipsChange?: (value: boolean) => void;
  aiCameraFocus?: boolean;
  onAiCameraFocusChange?: (value: boolean) => void;
}

export function VideoStudioHeader({
  sessionTitle,
  onBack,
  isRecording,
  studioMode,
  onModeChange,
  onStartSession,
  onStopSession,
  onChannels,
  onSchedule,
  onEditTitle,
  recordingTime = 0,
  channelCount = 0,
  activeChannelCount = 0,
  realtimeAIClips = false,
  onRealtimeAIClipsChange,
  aiCameraFocus = false,
  onAiCameraFocusChange,
}: VideoStudioHeaderProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(sessionTitle);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    onEditTitle();
  };

  return (
    <header className="h-14 bg-[#1a1d21] border-b border-white/10 px-4 flex items-center justify-between shrink-0">
      {/* Left Section: Exit + AI Toggles */}
      <div className="flex items-center gap-3">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onBack} 
          className="text-white/70 hover:text-white hover:bg-white/10 gap-1.5 font-medium h-8 px-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Exit Studio
        </Button>
        
        <div className="h-5 w-px bg-white/20" />
        
        {/* AI Toggles */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/5 border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
            <span className="text-[11px] text-white/70 whitespace-nowrap">AI Clips</span>
            <Switch 
              checked={realtimeAIClips} 
              onCheckedChange={onRealtimeAIClipsChange}
              className="scale-[0.65] data-[state=checked]:bg-pink-500"
            />
          </div>
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/5 border border-white/10">
            <Focus className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[11px] text-white/70 whitespace-nowrap">AI Focus</span>
            <Switch 
              checked={aiCameraFocus} 
              onCheckedChange={onAiCameraFocusChange}
              className="scale-[0.65] data-[state=checked]:bg-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Center Section: Session Title + Recording */}
      <div className="flex items-center gap-3 flex-1 justify-center max-w-md">
        {isRecording && (
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-red-500/20 border border-red-500/30">
            <Circle className="w-2 h-2 fill-red-500 text-red-500 animate-pulse" />
            <span className="text-red-400 text-xs font-medium tabular-nums">
              {formatTime(recordingTime)}
            </span>
          </div>
        )}
        
        {isEditingTitle ? (
          <Input 
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
            className="h-7 w-56 text-sm font-medium bg-white/10 border-white/20 text-white"
            autoFocus
          />
        ) : (
          <div className="flex items-center gap-1.5">
            <span className="text-white text-sm font-medium truncate max-w-[200px]">
              {sessionTitle}
            </span>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsEditingTitle(true)}
              className="text-white/40 hover:text-white hover:bg-white/10 h-5 w-5"
              disabled={isRecording}
            >
              <Edit2 className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Right Section: Channels + Schedule + Mode + Go Live */}
      <div className="flex items-center gap-2">
        {/* Channels Button */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onChannels}
          className="text-white/80 hover:text-white hover:bg-white/10 gap-1.5 h-8 px-3 text-sm"
          disabled={isRecording}
        >
          <span className="text-base leading-none">+</span>
          Channels
          {channelCount > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] rounded bg-white/10 text-white/70 ml-1">
              {activeChannelCount}/{channelCount}
            </span>
          )}
        </Button>

        {/* Schedule Button */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onSchedule}
          className="text-white/80 hover:text-white hover:bg-white/10 h-8 px-2.5"
          disabled={isRecording}
        >
          <Calendar className="w-4 h-4" />
        </Button>

        {/* Mode Selector Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-white/80 hover:text-white hover:bg-white/10 h-8 px-3 gap-1.5 text-sm"
              disabled={isRecording}
            >
              {studioMode === "record" ? (
                <>
                  <MonitorPlay className="w-3.5 h-3.5" />
                  Record only
                </>
              ) : (
                <>
                  <Radio className="w-3.5 h-3.5" />
                  Live streaming
                </>
              )}
              <ChevronDown className="w-3 h-3 ml-1 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-[#1a1d21] border-white/10">
            <DropdownMenuItem
              onClick={() => onModeChange("record")}
              className={cn(
                "gap-2 text-sm cursor-pointer",
                studioMode === "record" ? "text-white bg-white/10" : "text-white/70 hover:text-white"
              )}
            >
              <MonitorPlay className="w-4 h-4" />
              Record only
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onModeChange("live")}
              className={cn(
                "gap-2 text-sm cursor-pointer",
                studioMode === "live" ? "text-white bg-white/10" : "text-white/70 hover:text-white"
              )}
            >
              <Radio className="w-4 h-4" />
              Live streaming
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Go Live / Stop Button */}
        {isRecording ? (
          <Button 
            onClick={onStopSession}
            className="gap-1.5 px-4 h-8 rounded-md bg-red-600 hover:bg-red-700 text-white font-semibold text-sm"
          >
            <Circle className="w-3 h-3 fill-current" />
            Stop
          </Button>
        ) : (
          <Button 
            onClick={onStartSession}
            className={cn(
              "gap-1.5 px-4 h-8 rounded-md font-semibold text-white text-sm",
              studioMode === "live"
                ? "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                : "bg-primary hover:bg-primary/90"
            )}
          >
            {studioMode === "live" ? (
              <>
                <Radio className="w-3.5 h-3.5" />
                Go Live
              </>
            ) : (
              <>
                <Circle className="w-3 h-3 fill-current" />
                Start Recording
              </>
            )}
          </Button>
        )}
      </div>
    </header>
  );
}
