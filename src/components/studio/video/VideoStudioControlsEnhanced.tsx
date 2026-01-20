import { Button } from "@/components/ui/button";
import {
  Mic, MicOff, Video, VideoOff, Monitor,
  UserPlus, Plus, Settings, ChevronDown,
  PhoneOff, Upload, Radio, Sparkles
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface VideoStudioControlsEnhancedProps {
  isMuted: boolean;
  isVideoOff: boolean;
  isRecording: boolean;
  onToggleMic: () => void;
  onToggleVideo: () => void;
  onScreenShare: () => void;
  onInviteGuest: () => void;
  onAddSource: () => void;
  onSettings: () => void;
  onLayoutChange: (layout: string) => void;
  onEndSession: () => void;
  onUploadMedia?: () => void;
  onGreenRoom?: () => void;
}

export function VideoStudioControlsEnhanced({
  isMuted,
  isVideoOff,
  isRecording,
  onToggleMic,
  onToggleVideo,
  onScreenShare,
  onInviteGuest,
  onAddSource,
  onSettings,
  onLayoutChange,
  onEndSession,
  onUploadMedia,
  onGreenRoom,
}: VideoStudioControlsEnhancedProps) {
  return (
    <div className="h-20 bg-[#0d0f12] border-t border-white/10 flex items-center justify-center px-6 gap-3">
      {/* Mic with Dropdown */}
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleMic}
          className={cn(
            "h-14 w-14 rounded-full rounded-r-none transition-all",
            isMuted
              ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
              : "bg-white/10 text-white hover:bg-white/20"
          )}
        >
          {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-14 w-8 rounded-full rounded-l-none border-l border-white/20",
                isMuted
                  ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                  : "bg-white/10 text-white hover:bg-white/20"
              )}
            >
              <ChevronDown className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-[#1a1d21] border-white/10">
            <DropdownMenuItem className="text-white hover:bg-white/10">
              Default Microphone
            </DropdownMenuItem>
            <DropdownMenuItem className="text-white hover:bg-white/10">
              External Microphone
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Camera with Dropdown */}
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleVideo}
          className={cn(
            "h-14 w-14 rounded-full rounded-r-none transition-all",
            isVideoOff
              ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
              : "bg-white/10 text-white hover:bg-white/20"
          )}
        >
          {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-14 w-8 rounded-full rounded-l-none border-l border-white/20",
                isVideoOff
                  ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                  : "bg-white/10 text-white hover:bg-white/20"
              )}
            >
              <ChevronDown className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-[#1a1d21] border-white/10">
            <DropdownMenuItem className="text-white hover:bg-white/10">
              Default Camera
            </DropdownMenuItem>
            <DropdownMenuItem className="text-white hover:bg-white/10">
              External Camera
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Screen Share */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onScreenShare}
        className="h-14 w-14 rounded-full bg-white/10 text-white hover:bg-white/20"
        title="Screen Share"
      >
        <Monitor className="w-6 h-6" />
      </Button>

      {/* Invite Guest */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onInviteGuest}
        className="h-14 w-14 rounded-full bg-white/10 text-white hover:bg-white/20 ring-2 ring-blue-500/50"
        title="Invite Guest"
      >
        <UserPlus className="w-6 h-6" />
      </Button>

      {/* Add Source - SIMPLIFIED MENU */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-14 w-14 rounded-full bg-white/10 text-white hover:bg-white/20"
            title="Add Source"
          >
            <Plus className="w-6 h-6" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-[#1a1d21] border-white/10 w-56" align="center">
          <DropdownMenuItem
            className="gap-3 py-3 cursor-pointer text-white hover:bg-white/10"
            onClick={onScreenShare}
          >
            <Monitor className="w-5 h-5 text-blue-400" />
            <div>
              <div className="font-medium">Screen share</div>
              <div className="text-xs text-white/50">Share your screen</div>
            </div>
            <span className="ml-auto text-xs text-white/40">H</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            className="gap-3 py-3 cursor-pointer text-white hover:bg-white/10"
            onClick={onUploadMedia}
          >
            <Upload className="w-5 h-5 text-green-400" />
            <div>
              <div className="font-medium">Upload Media</div>
              <div className="text-xs text-white/50">From Media Library</div>
            </div>
            <span className="ml-auto text-xs text-white/40">U</span>
          </DropdownMenuItem>

          <DropdownMenuItem className="gap-3 py-3 cursor-pointer text-white hover:bg-white/10">
            <Radio className="w-5 h-5 text-purple-400" />
            <div>
              <div className="font-medium">RTMP source</div>
              <div className="text-xs text-white/50">External stream input</div>
            </div>
            <span className="ml-auto text-xs text-white/40">R</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Settings */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onSettings}
        className="h-14 w-14 rounded-full bg-white/10 text-white hover:bg-white/20"
        title="Settings"
      >
        <Settings className="w-6 h-6" />
      </Button>

      {/* Green Room / AI Setup Check */}
      {onGreenRoom && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onGreenRoom}
          className="h-14 w-14 rounded-full bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
          title="Green Room"
        >
          <Sparkles className="w-6 h-6" />
        </Button>
      )}

      {/* End Session */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onEndSession}
        className="h-14 w-14 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 ml-4"
        title="End Session"
      >
        <PhoneOff className="w-6 h-6" />
      </Button>
    </div>
  );
}
