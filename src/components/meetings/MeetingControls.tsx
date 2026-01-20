import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  MonitorOff,
  MessageSquare,
  Settings,
  PhoneOff,
  Circle,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface MeetingControlsProps {
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  isRecording: boolean;
  isHost: boolean;
  isChatOpen: boolean;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onToggleChat: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onEndMeeting: () => void;
}

const MeetingControls: React.FC<MeetingControlsProps> = ({
  isMuted,
  isVideoOff,
  isScreenSharing,
  isRecording,
  isHost,
  isChatOpen,
  onToggleMute,
  onToggleVideo,
  onToggleScreenShare,
  onToggleChat,
  onStartRecording,
  onStopRecording,
  onEndMeeting,
}) => {
  return (
    <TooltipProvider>
      <div className="h-20 bg-slate-800 border-t border-slate-700 flex items-center justify-center gap-2">
        {/* Mute Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isMuted ? 'destructive' : 'secondary'}
              size="lg"
              className="rounded-full w-14 h-14"
              onClick={onToggleMute}
            >
              {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isMuted ? 'Unmute' : 'Mute'}
          </TooltipContent>
        </Tooltip>

        {/* Video Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isVideoOff ? 'destructive' : 'secondary'}
              size="lg"
              className="rounded-full w-14 h-14"
              onClick={onToggleVideo}
            >
              {isVideoOff ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isVideoOff ? 'Start Video' : 'Stop Video'}
          </TooltipContent>
        </Tooltip>

        {/* Screen Share Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isScreenSharing ? 'default' : 'secondary'}
              size="lg"
              className={`rounded-full w-14 h-14 ${isScreenSharing ? 'bg-green-600 hover:bg-green-700' : ''}`}
              onClick={onToggleScreenShare}
            >
              {isScreenSharing ? <MonitorOff className="h-6 w-6" /> : <Monitor className="h-6 w-6" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
          </TooltipContent>
        </Tooltip>

        {/* Chat Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isChatOpen ? 'default' : 'secondary'}
              size="lg"
              className={`rounded-full w-14 h-14 ${isChatOpen ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
              onClick={onToggleChat}
            >
              <MessageSquare className="h-6 w-6" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            Chat
          </TooltipContent>
        </Tooltip>

        {/* Recording Button (Host Only) */}
        {isHost && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isRecording ? 'default' : 'secondary'}
                size="lg"
                className={`rounded-full w-14 h-14 ${isRecording ? 'bg-red-600 hover:bg-red-700 animate-pulse' : ''}`}
                onClick={isRecording ? onStopRecording : onStartRecording}
              >
                <Circle className={`h-6 w-6 ${isRecording ? 'fill-current' : ''}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </TooltipContent>
          </Tooltip>
        )}

        {/* Settings */}
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="lg"
                  className="rounded-full w-14 h-14"
                >
                  <Settings className="h-6 w-6" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
              Settings
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="center" className="w-48">
            <DropdownMenuItem>Audio Settings</DropdownMenuItem>
            <DropdownMenuItem>Video Settings</DropdownMenuItem>
            <DropdownMenuItem>Background Effects</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* End Meeting (Host Only) */}
        {isHost && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="destructive"
                size="lg"
                className="rounded-full w-14 h-14 ml-4"
                onClick={onEndMeeting}
              >
                <PhoneOff className="h-6 w-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              End Meeting for All
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
};

export default MeetingControls;
