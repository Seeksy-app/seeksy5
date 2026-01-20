import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Monitor, 
  UserPlus, 
  Circle,
  Play
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StudioBrandingOverlay } from "./StudioBrandingOverlay";
import { BrandingSettings } from "./StudioBrandingMenu";
import { LowerThirdOverlay } from "./LowerThirdOverlay";

interface StudioMainViewProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  isRecording: boolean;
  isLiveOnProfile: boolean;
  recordingTime: number;
  cameraEnabled: boolean;
  micEnabled: boolean;
  onToggleCamera: () => void;
  onToggleMic: () => void;
  onScreenShare: () => void;
  onInviteGuests: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  brandingSettings: BrandingSettings;
  profileImageUrl: string;
  userName: string;
  formatTime: (seconds: number) => string;
  onPlayVideo: () => void;
  onAddAdMarker: () => void;
  onAddClipMarker: () => void;
  onReadScript: () => void;
  onOpenHostNotes: () => void;
  studioSessionId?: string;
  showLowerThird?: boolean;
  currentGuestIndex?: number;
}

export function StudioMainView({
  videoRef,
  isRecording,
  isLiveOnProfile,
  recordingTime,
  cameraEnabled,
  micEnabled,
  onToggleCamera,
  onToggleMic,
  onScreenShare,
  onInviteGuests,
  onStartRecording,
  onStopRecording,
  brandingSettings,
  profileImageUrl,
  userName,
  formatTime,
  onPlayVideo,
  onAddAdMarker,
  onAddClipMarker,
  onReadScript,
  onOpenHostNotes,
  studioSessionId,
  showLowerThird = false,
  currentGuestIndex = 0,
}: StudioMainViewProps) {
  return (
    <div className="relative flex flex-col h-full bg-muted">
      {/* Quality Badge */}
      <div className="absolute top-4 left-4 z-20">
        <Badge className="bg-background/80 border-border backdrop-blur-sm">
          1080p
        </Badge>
      </div>

      {/* Recording/Live Indicator */}
      {isRecording && (
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-red-600 text-white px-3 py-1.5 rounded-full shadow-lg">
          <Circle className="h-2 w-2 fill-current animate-pulse" />
          <span className="font-mono text-sm font-medium">{formatTime(recordingTime)}</span>
        </div>
      )}

      {isLiveOnProfile && (
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-brand-red text-white px-3 py-1.5 rounded-full shadow-lg">
          <span className="h-2 w-2 bg-white rounded-full animate-pulse" />
          <span className="text-sm font-bold">LIVE</span>
        </div>
      )}

      {/* Video Preview */}
      <div className="relative flex-1 bg-muted overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          controls
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Branding Overlays */}
        <StudioBrandingOverlay
          settings={brandingSettings}
          cameraEnabled={cameraEnabled}
          profileImageUrl={profileImageUrl}
          userName={userName}
        />

        {/* Lower Third Overlay */}
        {studioSessionId && (
          <LowerThirdOverlay
            studioSessionId={studioSessionId}
            isVisible={showLowerThird}
            currentGuestIndex={currentGuestIndex}
          />
        )}
      </div>


      {/* Bottom Controls - Fixed Position */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-border/20 bg-background/95 backdrop-blur-sm">
        <div className="flex items-center justify-center px-4 py-3">

          {/* Main Controls - Centered */}
          <div className="flex items-center gap-3 justify-center">
            <Button
              onClick={onToggleMic}
              size="lg"
              variant={micEnabled ? "default" : "destructive"}
              className={cn(
                "h-12 w-12 rounded-full p-0 flex-shrink-0",
                micEnabled ? "bg-brand-blue hover:bg-brand-blue/90" : ""
              )}
            >
              {micEnabled ? (
                <Mic className="h-5 w-5" />
              ) : (
                <MicOff className="h-5 w-5" />
              )}
            </Button>

            <Button
              onClick={onToggleCamera}
              size="lg"
              variant={cameraEnabled ? "default" : "destructive"}
              className={cn(
                "h-12 w-12 rounded-full p-0 flex-shrink-0",
                cameraEnabled ? "bg-brand-blue hover:bg-brand-blue/90" : ""
              )}
            >
              {cameraEnabled ? (
                <Video className="h-5 w-5" />
              ) : (
                <VideoOff className="h-5 w-5" />
              )}
            </Button>

            {/* Start/Stop Button */}
            <Button
              onClick={isRecording ? onStopRecording : onStartRecording}
              size="lg"
              variant={isRecording ? "destructive" : "default"}
              className={cn(
                "h-14 w-14 rounded-full p-0 flex-shrink-0",
                isRecording ? "" : "bg-red-600 hover:bg-red-700"
              )}
            >
              <Circle className={cn(
                "h-6 w-6",
                isRecording ? "" : "fill-current"
              )} />
            </Button>

            <Button
              onClick={onScreenShare}
              size="lg"
              variant="outline"
              className="h-12 w-12 rounded-full p-0 flex-shrink-0"
            >
              <Monitor className="h-5 w-5" />
            </Button>

            <Button
              onClick={onInviteGuests}
              size="lg"
              variant="outline"
              className="h-12 w-12 rounded-full p-0 flex-shrink-0"
            >
              <UserPlus className="h-5 w-5" />
            </Button>

            <Button
              onClick={onPlayVideo}
              size="lg"
              variant="outline"
              className="h-12 w-12 rounded-full p-0 flex-shrink-0 bg-primary/10 hover:bg-primary/20"
              title="Stream Video to My Page"
            >
              <Play className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
