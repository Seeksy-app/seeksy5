import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Mic, MicOff, Video, VideoOff, Settings, 
  ChevronDown, Copy, Users, Volume2, Monitor,
  Sparkles, Check, Headphones
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface MediaDevice {
  deviceId: string;
  label: string;
}

interface VideoPreJoinScreenProps {
  sessionTitle: string;
  hostName: string;
  hostAvatar?: string;
  onEnterStudio: (name: string, title: string, sessionTitle: string, stream: MediaStream | null) => void;
  onBack: () => void;
}

export function VideoPreJoinScreen({
  sessionTitle,
  hostName,
  hostAvatar,
  onEnterStudio,
  onBack,
}: VideoPreJoinScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<"pending" | "granted" | "denied">("pending");
  
  // Form state
  const [name, setName] = useState(hostName);
  const [editableSessionTitle, setEditableSessionTitle] = useState(sessionTitle);
  const [title, setTitle] = useState("");
  
  // Device state
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isAudioOnly, setIsAudioOnly] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Device lists
  const [microphones, setMicrophones] = useState<MediaDevice[]>([]);
  const [cameras, setCameras] = useState<MediaDevice[]>([]);
  const [speakers, setSpeakers] = useState<MediaDevice[]>([]);
  
  // Selected devices
  const [selectedMic, setSelectedMic] = useState<string>("");
  const [selectedCamera, setSelectedCamera] = useState<string>("");
  const [selectedSpeaker, setSelectedSpeaker] = useState<string>("");
  const [resolution, setResolution] = useState<string>("720p");
  
  // Enhancements
  const [noiseReduction, setNoiseReduction] = useState(true);
  const [backgroundBlur, setBackgroundBlur] = useState(false);
  const [echoCancellation, setEchoCancellation] = useState(true);

  // Mic/Camera test status
  const [micLevel, setMicLevel] = useState(0);
  const [profileImage, setProfileImage] = useState<string | null>(hostAvatar || null);

  // Fetch user profile image
  useEffect(() => {
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', user.id)
          .single();
        if (profile?.avatar_url) {
          setProfileImage(profile.avatar_url);
        }
      }
    }
    if (!hostAvatar) {
      fetchProfile();
    }
  }, [hostAvatar]);

  // Load devices and request permissions
  useEffect(() => {
    async function loadDevices() {
      try {
        setPermissionStatus("pending");
        
        // Request permissions with clear user prompt
        const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        setPermissionStatus("granted");
        
        // Set initial stream for preview
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        
        const devices = await navigator.mediaDevices.enumerateDevices();
        
        const mics = devices
          .filter(d => d.kind === "audioinput")
          .map(d => ({ deviceId: d.deviceId, label: d.label || `Microphone ${d.deviceId.slice(0, 4)}` }));
        
        const cams = devices
          .filter(d => d.kind === "videoinput")
          .map(d => ({ deviceId: d.deviceId, label: d.label || `Camera ${d.deviceId.slice(0, 4)}` }));
        
        const spkrs = devices
          .filter(d => d.kind === "audiooutput")
          .map(d => ({ deviceId: d.deviceId, label: d.label || `Speaker ${d.deviceId.slice(0, 4)}` }));
        
        setMicrophones(mics);
        setCameras(cams);
        setSpeakers(spkrs);
        
        if (mics.length > 0) setSelectedMic(mics[0].deviceId);
        if (cams.length > 0) setSelectedCamera(cams[0].deviceId);
        if (spkrs.length > 0) setSelectedSpeaker(spkrs[0].deviceId);
      } catch (err) {
        console.error("Error loading devices:", err);
        setPermissionStatus("denied");
        toast.error("Please allow camera and microphone access to continue");
      }
    }
    
    loadDevices();
  }, []);

  // Start camera preview
  useEffect(() => {
    async function startCamera() {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      if (isVideoOff || isAudioOnly) {
        setStream(null);
        return;
      }
      
      try {
        const constraints: MediaStreamConstraints = {
          video: selectedCamera ? {
            deviceId: selectedCamera,
            width: resolution === "1080p" ? 1920 : 1280,
            height: resolution === "1080p" ? 1080 : 720,
          } : true,
          audio: selectedMic ? { deviceId: selectedMic } : true,
        };
        
        const newStream = await navigator.mediaDevices.getUserMedia(constraints);
        setStream(newStream);
        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
        }
      } catch (err) {
        console.error("Error starting camera:", err);
      }
    }
    
    startCamera();
    
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [selectedCamera, selectedMic, resolution, isVideoOff, isAudioOnly]);

  const handleCopyInviteLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Invite link copied!");
  };

  const handleEnter = () => {
    // Pass stream to studio instead of stopping it
    onEnterStudio(name, title, editableSessionTitle, stream);
  };

  const handleTestSpeaker = () => {
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 440;
    gainNode.gain.value = 0.1;
    
    oscillator.start();
    setTimeout(() => oscillator.stop(), 500);
    toast.success("Speaker test played!");
  };

  return (
    <div className="h-screen bg-[#1a1d21] flex items-center justify-center p-8">
      <div className="w-full max-w-5xl flex gap-16 items-center">
        {/* Left Side - Session Info */}
        <div className="flex-1 space-y-6">
          <div className="flex items-center gap-3">
            {hostAvatar ? (
              <img 
                src={hostAvatar} 
                alt={hostName}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
                <span className="text-white font-bold">{hostName.charAt(0)}</span>
              </div>
            )}
            <div>
              <span className="text-white font-medium">{hostName}</span>
              <span className="text-white/50">, you're hosting this stream</span>
            </div>
          </div>

          <Input
            value={editableSessionTitle}
            onChange={(e) => setEditableSessionTitle(e.target.value)}
            className="text-3xl font-bold text-white bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto"
            placeholder="Enter session title..."
          />
          
          <p className="text-white/60 text-lg italic">
            "Seeking a new way to connect."
          </p>

          <Button
            variant="outline"
            onClick={handleCopyInviteLink}
            className="border-white/20 text-white hover:bg-white/10 gap-2 rounded-lg"
          >
            <Users className="w-4 h-4" />
            Copy Invite Link
          </Button>
        </div>

        {/* Right Side - Ready to Join Card */}
        <div className="w-[420px] bg-white rounded-2xl p-6 shadow-2xl">
          <h2 className="text-xl font-bold text-center text-gray-900 mb-6">
            Ready to join?
          </h2>

          {/* Video Preview */}
          <div className="aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-orange-900/80 to-red-900/80 relative mb-4">
            {permissionStatus === "pending" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
                <div className="text-center space-y-3">
                  <div className="w-12 h-12 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                  <p className="text-white text-sm">Requesting camera access...</p>
                </div>
              </div>
            )}
            {permissionStatus === "denied" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
                <div className="text-center space-y-3 p-4">
                  <VideoOff className="w-12 h-12 text-red-400 mx-auto" />
                  <p className="text-white text-sm">Camera access denied</p>
                  <Button
                    size="sm"
                    onClick={() => window.location.reload()}
                    className="bg-blue-500 hover:bg-blue-600"
                  >
                    Retry Permissions
                  </Button>
                </div>
              </div>
            )}
            {!isVideoOff && !isAudioOnly && stream ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                {isAudioOnly ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center">
                      <Headphones className="w-10 h-10 text-white" />
                    </div>
                    <span className="text-white/70 text-sm">Audio Only Mode</span>
                  </div>
                ) : profileImage ? (
                  <div className="flex flex-col items-center gap-2">
                    <img 
                      src={profileImage} 
                      alt="Profile" 
                      className="w-20 h-20 rounded-full object-cover border-2 border-white/20"
                    />
                    <span className="text-white/70 text-sm">Camera Off</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center">
                      <span className="text-white font-bold text-2xl">{name.charAt(0).toUpperCase() || "?"}</span>
                    </div>
                    <span className="text-white/70 text-sm">Camera Off</span>
                  </div>
                )}
              </div>
            )}
            
            {/* Mic indicator */}
            {!isMuted && (
              <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/50 rounded-full px-2 py-1">
                <Mic className="w-3 h-3 text-green-400" />
                <div className="flex gap-0.5">
                  {[1,2,3,4].map(i => (
                    <div key={i} className={cn(
                      "w-1 h-2 rounded-full transition-all",
                      micLevel > i * 25 ? "bg-green-400" : "bg-white/30"
                    )} />
                  ))}
                </div>
              </div>
            )}

            {/* Name/Title Overlay */}
            <div className="absolute bottom-3 left-3">
              <p className="text-white font-semibold text-sm">{name || "Your Name"}</p>
              {title && <p className="text-white/70 text-xs">{title}</p>}
            </div>
          </div>

          {/* Device Controls */}
          <div className="flex items-center justify-center gap-2 mb-4">
            {/* Mic Toggle with Dropdown */}
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMuted(!isMuted)}
                className={cn(
                  "h-10 w-10 rounded-full rounded-r-none",
                  isMuted ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-700"
                )}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </Button>
              <Select value={selectedMic} onValueChange={setSelectedMic}>
                <SelectTrigger 
                  className={cn(
                    "h-10 w-8 rounded-full rounded-l-none border-l border-white p-0 justify-center",
                    isMuted ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-700"
                  )}
                >
                  <ChevronDown className="w-3 h-3" />
                </SelectTrigger>
                <SelectContent>
                  {microphones.map(mic => (
                    <SelectItem key={mic.deviceId} value={mic.deviceId}>
                      {mic.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Camera Toggle with Dropdown */}
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsVideoOff(!isVideoOff)}
                disabled={isAudioOnly}
                className={cn(
                  "h-10 w-10 rounded-full rounded-r-none",
                  isVideoOff || isAudioOnly ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-700"
                )}
              >
                {isVideoOff || isAudioOnly ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
              </Button>
              <Select value={selectedCamera} onValueChange={setSelectedCamera} disabled={isAudioOnly}>
                <SelectTrigger 
                  className={cn(
                    "h-10 w-8 rounded-full rounded-l-none border-l border-white p-0 justify-center",
                    isVideoOff || isAudioOnly ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-700"
                  )}
                >
                  <ChevronDown className="w-3 h-3" />
                </SelectTrigger>
                <SelectContent>
                  {cameras.map(cam => (
                    <SelectItem key={cam.deviceId} value={cam.deviceId}>
                      {cam.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Settings */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSettings(true)}
              className="h-10 w-10 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>

          {/* Audio Only Toggle */}
          <div className="flex items-center justify-center gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
            <Headphones className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-700">Audio Only</span>
            <Switch
              checked={isAudioOnly}
              onCheckedChange={setIsAudioOnly}
            />
          </div>

          {/* Name & Title Inputs */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="space-y-1.5">
              <Label className="text-gray-700 text-sm">Your name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="bg-white border-gray-200"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-gray-500 text-sm">Title <span className="text-gray-400">(optional)</span></Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Host"
                className="bg-white border-gray-200"
              />
            </div>
          </div>

          {/* Enter Studio Button */}
          <Button
            onClick={handleEnter}
            disabled={!name.trim()}
            className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white font-semibold text-base rounded-lg"
          >
            Enter Studio
          </Button>
        </div>
      </div>

      {/* Settings Modal */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-[500px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Studio Settings</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Resolution */}
            <div className="space-y-2">
              <Label className="text-gray-700 flex items-center gap-2">
                <Monitor className="w-4 h-4" /> Video Resolution
              </Label>
              <Select value={resolution} onValueChange={setResolution}>
                <SelectTrigger className="bg-white border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="720p">720p HD</SelectItem>
                  <SelectItem value="1080p">1080p Full HD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Speaker */}
            <div className="space-y-2">
              <Label className="text-gray-700 flex items-center gap-2">
                <Volume2 className="w-4 h-4" /> Speaker
              </Label>
              <div className="flex gap-2">
                <Select value={selectedSpeaker} onValueChange={setSelectedSpeaker}>
                  <SelectTrigger className="flex-1 bg-white border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {speakers.map(spkr => (
                      <SelectItem key={spkr.deviceId} value={spkr.deviceId}>
                        {spkr.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleTestSpeaker}
                  className="border-gray-200"
                >
                  Test
                </Button>
              </div>
            </div>

            {/* Audio Enhancements */}
            <div className="space-y-3">
              <Label className="text-gray-700">Audio Enhancements</Label>
              
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">Noise Reduction</span>
                </div>
                <Switch 
                  checked={noiseReduction} 
                  onCheckedChange={setNoiseReduction}
                />
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">Echo Cancellation</span>
                </div>
                <Switch 
                  checked={echoCancellation} 
                  onCheckedChange={setEchoCancellation}
                />
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">Background Blur</span>
                </div>
                <Switch 
                  checked={backgroundBlur} 
                  onCheckedChange={setBackgroundBlur}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => setShowSettings(false)}>
              <Check className="w-4 h-4 mr-2" />
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
