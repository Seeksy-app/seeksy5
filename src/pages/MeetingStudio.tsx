import { useParams, useNavigate } from "react-router-dom";
import { StudioRightSidebar } from "@/components/studio/StudioRightSidebar";
import { Button } from "@/components/ui/button";
import { Video, VideoOff, Mic, MicOff, PhoneOff, Moon, Users, Sparkles, UserPlus, Monitor, MessageSquare, ExternalLink } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { toast } from "sonner";
import { DeviceTestDialog } from "@/components/meeting/DeviceTestDialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { InviteGuestModal } from "@/components/studio/video/modals/InviteGuestModal";

const MeetingStudio = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [showDeviceTest, setShowDeviceTest] = useState(true);
  const [showAINotes, setShowAINotes] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedDevices, setSelectedDevices] = useState<{
    videoDeviceId: string | null;
    audioInputDeviceId: string | null;
    audioOutputDeviceId: string | null;
  } | null>(null);

  const handleDeviceTestComplete = (devices: {
    videoDeviceId: string | null;
    audioInputDeviceId: string | null;
    audioOutputDeviceId: string | null;
  }) => {
    setSelectedDevices(devices);
    setShowDeviceTest(false);
  };

  // Request camera and microphone permissions and display stream
  useEffect(() => {
    if (!selectedDevices || showDeviceTest) return;

    let mounted = true;
    
    const startMediaStream = async () => {
      try {
        const constraints: MediaStreamConstraints = {
          video: selectedDevices.videoDeviceId 
            ? { deviceId: { exact: selectedDevices.videoDeviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
            : { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: selectedDevices.audioInputDeviceId
            ? { 
                deviceId: { exact: selectedDevices.audioInputDeviceId },
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
              }
            : {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
              }
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        if (!mounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        
        streamRef.current = stream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        
        // Apply initial mute states
        const videoTrack = stream.getVideoTracks()[0];
        const audioTrack = stream.getAudioTracks()[0];
        if (videoTrack) videoTrack.enabled = isVideoOn;
        if (audioTrack) audioTrack.enabled = isMicOn;
        
        localStorage.setItem('mediaPermissionsGranted', 'true');
      } catch (error) {
        console.error("Media permission error:", error);
        if (mounted) {
          toast.error("Unable to access camera or microphone. Please check your browser permissions.");
        }
      }
    };

    startMediaStream();

    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [selectedDevices, showDeviceTest]);

  // Toggle video track
  useEffect(() => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = isVideoOn;
        console.log('Video track enabled:', isVideoOn);
      }
    }
  }, [isVideoOn]);

  // Toggle audio track
  useEffect(() => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isMicOn;
        console.log('Audio track enabled:', isMicOn, 'Track state:', audioTrack.enabled);
      }
    }
  }, [isMicOn]);

  const handleEndCall = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    navigate('/meetings');
  };

  const handleOpenInNewTab = () => {
    window.open(window.location.href, '_blank');
  };

  return (
    <>
      <DeviceTestDialog 
        open={showDeviceTest} 
        onContinue={handleDeviceTestComplete}
      />
      
      <InviteGuestModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        sessionId={id}
      />
      
      {/* Full screen container - fixed position, no scroll */}
      <div className="fixed inset-0 flex flex-col bg-zinc-900 overflow-hidden">
        {/* Header */}
        <div className="h-14 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-white">
              <span className="text-lg font-semibold">Meeting Studio</span>
              <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-medium rounded">Live</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-400">
              <Users className="h-4 w-4" />
              <span className="text-sm">2 participants</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleOpenInNewTab}
              className="text-zinc-400 hover:text-white hover:bg-zinc-800 gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Open in New Tab
            </Button>
            <div className="flex items-center gap-2">
              <Switch
                id="ai-notes"
                checked={showAINotes}
                onCheckedChange={setShowAINotes}
              />
              <Label htmlFor="ai-notes" className="text-white text-sm cursor-pointer flex items-center gap-1">
                <Sparkles className="h-4 w-4" />
                AI Notes
              </Label>
            </div>
            <Button variant="ghost" size="icon" className="text-white hover:bg-zinc-800">
              <Moon className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Main Content with Resizable Panels */}
        <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0">
          {/* Video Area */}
          <ResizablePanel defaultSize={40} minSize={15}>
            <div className="flex flex-col h-full">
              {/* Video Grid */}
              <div className="flex-1 bg-zinc-900 flex items-center justify-center relative min-h-0">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {!isVideoOn && (
                  <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
                    <div className="text-white text-center">
                      <VideoOff className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg opacity-75">Camera Off</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Controls Bar - Fixed at bottom */}
              <div className="h-20 bg-zinc-950 border-t border-zinc-800 flex items-center justify-center gap-3 px-6 flex-shrink-0">
                {/* Mic */}
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-12 w-12 rounded-full ${isMicOn ? 'bg-amber-500 hover:bg-amber-600 text-black' : 'bg-red-500 hover:bg-red-600 text-white'}`}
                  onClick={() => setIsMicOn(!isMicOn)}
                >
                  {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                </Button>

                {/* Video */}
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-12 w-12 rounded-full ${isVideoOn ? 'bg-amber-500 hover:bg-amber-600 text-black' : 'bg-red-500 hover:bg-red-600 text-white'}`}
                  onClick={() => setIsVideoOn(!isVideoOn)}
                >
                  {isVideoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                </Button>

                {/* Screen Share */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-12 w-12 rounded-full bg-amber-500 hover:bg-amber-600 text-black"
                  onClick={() => toast.info("Screen sharing coming soon!")}
                >
                  <Monitor className="h-5 w-5" />
                </Button>

                {/* Chat */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-12 w-12 rounded-full bg-amber-500 hover:bg-amber-600 text-black"
                  onClick={() => toast.info("Chat panel coming soon!")}
                >
                  <MessageSquare className="h-5 w-5" />
                </Button>

                {/* Invite Participant */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-12 w-12 rounded-full bg-blue-500 hover:bg-blue-600 text-white"
                  onClick={() => setShowInviteModal(true)}
                >
                  <UserPlus className="h-5 w-5" />
                </Button>

                {/* End Call */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-12 w-12 rounded-full bg-red-500 hover:bg-red-600 text-white"
                  onClick={handleEndCall}
                >
                  <PhoneOff className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right Sidebar */}
          <ResizablePanel defaultSize={60} minSize={30} maxSize={85}>
            <StudioRightSidebar
              currentViewerCount={2}
              onAdSelect={() => {}}
              selectedAd={null}
              markers={[]}
              onAddMarker={() => {}}
              isRecording={true}
              selectedChannels={{
                myPage: false,
                facebook: false,
                linkedin: false,
                tiktok: false,
                twitch: false,
                youtube: false,
              }}
              onToggleChannel={() => {}}
              channelsExpanded={false}
              onToggleChannelsExpanded={() => {}}
              meetingId={id}
              showAINotes={showAINotes}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </>
  );
};

export default MeetingStudio;
