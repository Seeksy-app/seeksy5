import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Mic, MicOff, Video, VideoOff, Monitor, 
  UserPlus, Plus, Settings, ChevronDown,
  MessageSquare, Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoStudioControlsProps {
  isMuted: boolean;
  isVideoOff: boolean;
  onToggleMic: () => void;
  onToggleVideo: () => void;
  onScreenShare: () => void;
  onInviteGuest: () => void;
  onAddMedia: () => void;
  onSettings: () => void;
  onGreenRoom?: () => void;
}

export function VideoStudioControls({
  isMuted,
  isVideoOff,
  onToggleMic,
  onToggleVideo,
  onScreenShare,
  onInviteGuest,
  onAddMedia,
  onSettings,
  onGreenRoom,
}: VideoStudioControlsProps) {
  return (
    <div className="h-16 bg-[#16181c] border-t border-white/10 flex items-center justify-between px-4">
      {/* Left - Private Chat */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          className="text-white/70 hover:text-white hover:bg-white/10 gap-2"
        >
          <MessageSquare className="w-4 h-4" />
          Private Chat
          <ChevronDown className="w-3 h-3" />
        </Button>
      </div>

      {/* Center - Main Controls */}
      <div className="flex items-center gap-2">
        {/* Mic with Dropdown */}
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleMic}
            className={cn(
              "h-10 w-10 rounded-full rounded-r-none",
              isMuted 
                ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" 
                : "bg-white/10 text-white hover:bg-white/20"
            )}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-10 w-6 rounded-full rounded-l-none border-l border-white/10",
              isMuted 
                ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" 
                : "bg-white/10 text-white hover:bg-white/20"
            )}
          >
            <ChevronDown className="w-3 h-3" />
          </Button>
        </div>

        {/* Camera with Dropdown */}
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleVideo}
            className={cn(
              "h-10 w-10 rounded-full rounded-r-none",
              isVideoOff 
                ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" 
                : "bg-white/10 text-white hover:bg-white/20"
            )}
          >
            {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-10 w-6 rounded-full rounded-l-none border-l border-white/10",
              isVideoOff 
                ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" 
                : "bg-white/10 text-white hover:bg-white/20"
            )}
          >
            <ChevronDown className="w-3 h-3" />
          </Button>
        </div>

        {/* Screen Share */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onScreenShare}
          className="h-10 w-10 rounded-full bg-white/10 text-white hover:bg-white/20"
        >
          <Monitor className="w-5 h-5" />
        </Button>

        {/* Invite Guest */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onInviteGuest}
          className="h-10 w-10 rounded-full bg-white/10 text-white hover:bg-white/20"
        >
          <UserPlus className="w-5 h-5" />
        </Button>

        {/* Add Media */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onAddMedia}
          className="h-10 w-10 rounded-full bg-white/10 text-white hover:bg-white/20"
        >
          <Plus className="w-5 h-5" />
        </Button>

        {/* Settings */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onSettings}
          className="h-10 w-10 rounded-full bg-white/10 text-white hover:bg-white/20"
        >
          <Settings className="w-5 h-5" />
        </Button>

        {/* Green Room / AI Check */}
        {onGreenRoom && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onGreenRoom}
            className="h-10 w-10 rounded-full bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
            title="Green Room"
          >
            <Sparkles className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* Right - Device Toggle */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded bg-white/10 text-white hover:bg-white/20"
        >
          <Monitor className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded text-white/40 hover:text-white hover:bg-white/10"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <rect x="7" y="4" width="10" height="16" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
          </svg>
        </Button>
      </div>
    </div>
  );
}
