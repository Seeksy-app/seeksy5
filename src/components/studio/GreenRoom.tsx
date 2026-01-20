import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mic, Volume2, Video, ArrowLeft, Monitor, Play, FlipHorizontal, Wifi, WifiOff, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { SetupCheckPanel } from "./SetupCheckPanel";

interface GreenRoomProps {
  mode: "audio" | "video";
  onJoin: () => void;
}

interface MediaDevice {
  deviceId: string;
  label: string;
}

export function GreenRoom({ mode, onJoin }: GreenRoomProps) {
  const navigate = useNavigate();
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  
  const [microphones, setMicrophones] = useState<MediaDevice[]>([]);
  const [speakers, setSpeakers] = useState<MediaDevice[]>([]);
  const [cameras, setCameras] = useState<MediaDevice[]>([]);
  
  const [selectedMic, setSelectedMic] = useState<string>("");
  const [selectedSpeaker, setSelectedSpeaker] = useState<string>("");
  const [selectedCamera, setSelectedCamera] = useState<string>("");
  
  const [noiseReduction, setNoiseReduction] = useState(true);
  const [voiceEnhancement, setVoiceEnhancement] = useState(true);
  const [autoLeveling, setAutoLeveling] = useState(true);
  const [echoCancellation, setEchoCancellation] = useState(true);
  
  const [isMirrored, setIsMirrored] = useState(true);
  const [isHD, setIsHD] = useState(true);
  
  const [connectionStatus, setConnectionStatus] = useState<"good" | "fair" | "poor">("good");
  const [isTestingSound, setIsTestingSound] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [showSetupCheck, setShowSetupCheck] = useState(false);

  useEffect(() => {
    async function getDevices() {
      try {
        // Request permissions first
        await navigator.mediaDevices.getUserMedia({ audio: true, video: mode === "video" });
        
        const devices = await navigator.mediaDevices.enumerateDevices();
        
        const mics = devices
          .filter(d => d.kind === "audioinput")
          .map(d => ({ deviceId: d.deviceId, label: d.label || `Microphone ${d.deviceId.slice(0, 4)}` }));
        
        const spkrs = devices
          .filter(d => d.kind === "audiooutput")
          .map(d => ({ deviceId: d.deviceId, label: d.label || `Speaker ${d.deviceId.slice(0, 4)}` }));
        
        const cams = devices
          .filter(d => d.kind === "videoinput")
          .map(d => ({ deviceId: d.deviceId, label: d.label || `Camera ${d.deviceId.slice(0, 4)}` }));
        
        setMicrophones(mics);
        setSpeakers(spkrs);
        setCameras(cams);
        
        if (mics.length > 0) setSelectedMic(mics[0].deviceId);
        if (spkrs.length > 0) setSelectedSpeaker(spkrs[0].deviceId);
        if (cams.length > 0) setSelectedCamera(cams[0].deviceId);
      } catch (err) {
        console.error("Error accessing devices:", err);
      }
    }
    
    getDevices();
    
    // Simulate connection check
    const interval = setInterval(() => {
      const statuses: ("good" | "fair" | "poor")[] = ["good", "good", "good", "fair"];
      setConnectionStatus(statuses[Math.floor(Math.random() * statuses.length)]);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [mode]);

  // Start camera preview for video mode
  useEffect(() => {
    if (mode !== "video" || !selectedCamera) return;
    
    async function startPreview() {
      try {
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: selectedCamera,
            width: isHD ? 1920 : 1280,
            height: isHD ? 1080 : 720,
          },
        });
        
        setStream(newStream);
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = newStream;
        }
      } catch (err) {
        console.error("Error starting camera:", err);
      }
    }
    
    startPreview();
    
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [selectedCamera, isHD, mode]);

  const handleTestSound = () => {
    setIsTestingSound(true);
    // Play a test sound
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 440;
    gainNode.gain.value = 0.1;
    
    oscillator.start();
    
    setTimeout(() => {
      oscillator.stop();
      setIsTestingSound(false);
    }, 1000);
  };

  const getConnectionColor = () => {
    switch (connectionStatus) {
      case "good": return "text-emerald-400";
      case "fair": return "text-amber-400";
      case "poor": return "text-red-400";
    }
  };

  const getConnectionIcon = () => {
    return connectionStatus === "poor" ? WifiOff : Wifi;
  };

  const ConnectionIcon = getConnectionIcon();

  return (
    <div className="h-screen bg-[#0B0F14] flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b border-white/10 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/studio")} className="text-white/60 hover:text-white hover:bg-white/10">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <span className="text-white/40">‹</span>
          <span className="text-white/60 text-sm cursor-pointer hover:text-white" onClick={() => navigate("/studio")}>Back to Studio</span>
        </div>
        <h1 className="font-semibold text-white">Green Room</h1>
        <div className={cn("flex items-center gap-2", getConnectionColor())}>
          <ConnectionIcon className="w-4 h-4" />
          <span className="text-sm capitalize">{connectionStatus}</span>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-2xl space-y-6">
          {/* Video Preview (Video mode only) */}
          {mode === "video" && (
            <div className="aspect-video rounded-xl bg-[#1a1f2e] border border-white/10 overflow-hidden relative">
              <video
                ref={videoPreviewRef}
                autoPlay
                playsInline
                muted
                className={cn("w-full h-full object-cover", isMirrored && "scale-x-[-1]")}
              />
              {!stream && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-white/40 text-sm">Camera preview</p>
                </div>
              )}
              {/* AI Setup Check Button */}
              {stream && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSetupCheck(!showSetupCheck)}
                  className={cn(
                    "absolute top-3 right-3 border-white/20 text-white hover:bg-white/10",
                    showSetupCheck && "bg-violet-500/20 border-violet-400/50"
                  )}
                >
                  <Sparkles className="w-4 h-4 mr-1" />
                  AI Check
                </Button>
              )}
            </div>
          )}

          {/* AI Setup Check Panel */}
          {mode === "video" && showSetupCheck && stream && (
            <SetupCheckPanel 
              videoRef={videoPreviewRef} 
              onClose={() => setShowSetupCheck(false)} 
            />
          )}

          {/* Device Selection */}
          <div className="grid grid-cols-2 gap-4">
            {/* Microphone */}
            <div className="space-y-2">
              <Label className="text-white/70 flex items-center gap-2">
                <Mic className="w-4 h-4" /> Microphone
              </Label>
              <Select value={selectedMic} onValueChange={setSelectedMic}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Select microphone" />
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

            {/* Speaker */}
            <div className="space-y-2">
              <Label className="text-white/70 flex items-center gap-2">
                <Volume2 className="w-4 h-4" /> Speaker
              </Label>
              <div className="flex gap-2">
                <Select value={selectedSpeaker} onValueChange={setSelectedSpeaker}>
                  <SelectTrigger className="flex-1 bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select speaker" />
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
                  onClick={handleTestSound}
                  disabled={isTestingSound}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <Play className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Camera (Video mode only) */}
            {mode === "video" && (
              <>
                <div className="space-y-2">
                  <Label className="text-white/70 flex items-center gap-2">
                    <Video className="w-4 h-4" /> Camera
                  </Label>
                  <Select value={selectedCamera} onValueChange={setSelectedCamera}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Select camera" />
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

                {/* Camera toggles */}
                <div className="space-y-2">
                  <Label className="text-white/70 flex items-center gap-2">
                    <Monitor className="w-4 h-4" /> Camera Settings
                  </Label>
                  <div className="flex items-center gap-4 p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="flex items-center gap-2">
                      <Switch checked={isMirrored} onCheckedChange={setIsMirrored} />
                      <span className="text-sm text-white/70">
                        <FlipHorizontal className="w-4 h-4 inline mr-1" />
                        Mirror
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={isHD} onCheckedChange={setIsHD} />
                      <span className="text-sm text-white/70">HD</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Audio Enhancements */}
          <div className="space-y-3">
            <Label className="text-white/70">Audio Enhancements</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                <span className="text-sm text-white/70">Noise Reduction</span>
                <Switch checked={noiseReduction} onCheckedChange={setNoiseReduction} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                <span className="text-sm text-white/70">Voice Enhancement</span>
                <Switch checked={voiceEnhancement} onCheckedChange={setVoiceEnhancement} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                <span className="text-sm text-white/70">Auto-Leveling</span>
                <Switch checked={autoLeveling} onCheckedChange={setAutoLeveling} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                <span className="text-sm text-white/70">Echo Cancellation</span>
                <Switch checked={echoCancellation} onCheckedChange={setEchoCancellation} />
              </div>
            </div>
          </div>

          {/* Join Button */}
          <Button
            onClick={onJoin}
            className="w-full h-14 text-lg bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 shadow-lg"
          >
            Join Studio
          </Button>
        </div>
      </div>
    </div>
  );
}
