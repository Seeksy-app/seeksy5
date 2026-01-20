import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Camera, 
  Monitor, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Circle, 
  Square, 
  Pause, 
  Play,
  UserPlus,
  Radio,
  Copy,
  Send,
  Layout,
  Image,
  Type,
  Users,
  Check
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type SessionMode = "record" | "stream";
type RecordingMode = "webcam" | "screen" | "both";
type LayoutOption = "fullscreen" | "pip-br" | "pip-bl" | "pip-tr" | "pip-tl" | "split";
type BackgroundOption = "none" | "blur" | "gradient-purple" | "gradient-gold" | "solid-dark" | "solid-light";
type TeleprompterSpeed = "slow" | "normal" | "fast";

interface Guest {
  id: string;
  name: string;
  email: string;
  status: "pending" | "joined";
}

interface StreamDestination {
  id: string;
  name: string;
  enabled: boolean;
  rtmpUrl: string;
  streamKey: string;
}

const LAYOUT_OPTIONS: { id: LayoutOption; label: string; description: string }[] = [
  { id: "fullscreen", label: "Fullscreen", description: "Single source fills the frame" },
  { id: "pip-br", label: "PiP Bottom Right", description: "Webcam overlay bottom right" },
  { id: "pip-bl", label: "PiP Bottom Left", description: "Webcam overlay bottom left" },
  { id: "pip-tr", label: "PiP Top Right", description: "Webcam overlay top right" },
  { id: "pip-tl", label: "PiP Top Left", description: "Webcam overlay top left" },
  { id: "split", label: "Split Screen", description: "Side by side view" },
];

const BACKGROUND_OPTIONS: { id: BackgroundOption; label: string; className: string }[] = [
  { id: "none", label: "None", className: "bg-muted" },
  { id: "blur", label: "Blur", className: "bg-muted/50 backdrop-blur" },
  { id: "gradient-purple", label: "Gradient Purple", className: "bg-gradient-to-br from-purple-600 to-indigo-800" },
  { id: "gradient-gold", label: "Gradient Gold", className: "bg-gradient-to-br from-amber-500 to-orange-600" },
  { id: "solid-dark", label: "Solid Dark", className: "bg-zinc-900" },
  { id: "solid-light", label: "Solid Light", className: "bg-zinc-100" },
];

export default function RecordingStudio() {
  const navigate = useNavigate();
  
  // Session state
  const [sessionMode, setSessionMode] = useState<SessionMode>("record");
  const [recordingMode, setRecordingMode] = useState<RecordingMode>("webcam");
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  // Media state
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  
  // Settings
  const [layout, setLayout] = useState<LayoutOption>("fullscreen");
  const [background, setBackground] = useState<BackgroundOption>("none");
  const [teleprompterEnabled, setTeleprompterEnabled] = useState(false);
  const [teleprompterText, setTeleprompterText] = useState("");
  const [teleprompterSpeed, setTeleprompterSpeed] = useState<TeleprompterSpeed>("normal");
  
  // Guests & Streaming
  const [guests, setGuests] = useState<Guest[]>([]);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [streamDestinations, setStreamDestinations] = useState<StreamDestination[]>([
    { id: "youtube", name: "YouTube", enabled: false, rtmpUrl: "", streamKey: "" },
    { id: "facebook", name: "Facebook", enabled: false, rtmpUrl: "", streamKey: "" },
    { id: "linkedin", name: "LinkedIn", enabled: false, rtmpUrl: "", streamKey: "" },
    { id: "custom", name: "Custom RTMP", enabled: false, rtmpUrl: "", streamKey: "" },
  ]);
  
  // Refs
  const webcamRef = useRef<HTMLVideoElement>(null);
  const screenRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const webcamStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auth check
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
      }
    };
    checkAuth();
  }, [navigate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAllStreams();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const stopAllStreams = () => {
    if (webcamStreamRef.current) {
      webcamStreamRef.current.getTracks().forEach(track => track.stop());
      webcamStreamRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1920, height: 1080 },
        audio: true,
      });
      webcamStreamRef.current = stream;
      if (webcamRef.current) {
        webcamRef.current.srcObject = stream;
      }
      setIsCameraOn(true);
      toast.success("Camera started");
    } catch (err) {
      toast.error("Failed to access camera");
      console.error(err);
    }
  };

  const stopCamera = () => {
    if (webcamStreamRef.current) {
      webcamStreamRef.current.getTracks().forEach(track => track.stop());
      webcamStreamRef.current = null;
    }
    if (webcamRef.current) {
      webcamRef.current.srcObject = null;
    }
    setIsCameraOn(false);
  };

  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { width: 1920, height: 1080 },
        audio: true,
      });
      screenStreamRef.current = stream;
      if (screenRef.current) {
        screenRef.current.srcObject = stream;
      }
      setIsScreenSharing(true);
      
      // Handle user stopping screen share via browser UI
      stream.getVideoTracks()[0].onended = () => {
        setIsScreenSharing(false);
        screenStreamRef.current = null;
        if (screenRef.current) screenRef.current.srcObject = null;
      };
      
      toast.success("Screen sharing started");
    } catch (err) {
      toast.error("Failed to share screen");
      console.error(err);
    }
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }
    if (screenRef.current) {
      screenRef.current.srcObject = null;
    }
    setIsScreenSharing(false);
  };

  const toggleMic = () => {
    if (webcamStreamRef.current) {
      const audioTrack = webcamStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
      }
    }
  };

  const toggleCamera = () => {
    if (isCameraOn) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  const startRecording = () => {
    const streams: MediaStream[] = [];
    
    if (webcamStreamRef.current) streams.push(webcamStreamRef.current);
    if (screenStreamRef.current) streams.push(screenStreamRef.current);
    
    if (streams.length === 0) {
      toast.error("Please start camera or screen share first");
      return;
    }
    
    // Combine streams for recording
    const combinedStream = new MediaStream();
    streams.forEach(stream => {
      stream.getTracks().forEach(track => combinedStream.addTrack(track));
    });
    
    const mediaRecorder = new MediaRecorder(combinedStream, {
      mimeType: "video/webm;codecs=vp9,opus",
    });
    
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };
    
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `recording-${Date.now()}.webm`;
      a.click();
      URL.revokeObjectURL(url);
      chunksRef.current = [];
      toast.success("Recording saved");
    };
    
    mediaRecorder.start(1000);
    mediaRecorderRef.current = mediaRecorder;
    setIsRecording(true);
    setIsPaused(false);
    
    // Start timer
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
    
    toast.success("Recording started");
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        timerRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1);
        }, 1000);
      } else {
        mediaRecorderRef.current.pause();
        if (timerRef.current) clearInterval(timerRef.current);
      }
      setIsPaused(!isPaused);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);
    setIsPaused(false);
    setRecordingTime(0);
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const generateInviteLink = () => {
    const link = `${window.location.origin}/studio/guest/${crypto.randomUUID()}`;
    setInviteLink(link);
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    toast.success("Link copied to clipboard");
  };

  const sendEmailInvite = () => {
    if (!guestName || !guestEmail) {
      toast.error("Please fill in name and email");
      return;
    }
    const newGuest: Guest = {
      id: crypto.randomUUID(),
      name: guestName,
      email: guestEmail,
      status: "pending",
    };
    setGuests([...guests, newGuest]);
    setGuestName("");
    setGuestEmail("");
    toast.success(`Invite sent to ${guestEmail}`);
  };

  const toggleStreamDestination = (id: string) => {
    setStreamDestinations(prev =>
      prev.map(d => d.id === id ? { ...d, enabled: !d.enabled } : d)
    );
  };

  const updateStreamDestination = (id: string, field: "rtmpUrl" | "streamKey", value: string) => {
    setStreamDestinations(prev =>
      prev.map(d => d.id === id ? { ...d, [field]: value } : d)
    );
  };

  const hasActiveSource = isCameraOn || isScreenSharing;
  const joinedGuests = guests.filter(g => g.status === "joined").length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" onClick={generateInviteLink}>
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Guest
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card">
              <DialogHeader>
                <DialogTitle>Invite Guest</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Shareable Link</Label>
                  <div className="flex gap-2 mt-1">
                    <Input value={inviteLink} readOnly className="flex-1" />
                    <Button size="icon" variant="outline" onClick={copyInviteLink}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <Label>Email Invitation</Label>
                  <div className="space-y-2 mt-2">
                    <Input 
                      placeholder="Guest name" 
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                    />
                    <Input 
                      placeholder="Guest email" 
                      type="email"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                    />
                    <Button onClick={sendEmailInvite} className="w-full">
                      <Send className="h-4 w-4 mr-2" />
                      Send Invite
                    </Button>
                  </div>
                </div>
                {guests.length > 0 && (
                  <div className="border-t pt-4">
                    <Label>Invited Guests</Label>
                    <div className="space-y-2 mt-2">
                      {guests.map(guest => (
                        <div key={guest.id} className="flex items-center justify-between p-2 bg-muted rounded">
                          <span className="text-sm">{guest.name}</span>
                          <Badge variant={guest.status === "joined" ? "default" : "secondary"}>
                            {guest.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Session Mode:</span>
            <div className="flex bg-muted rounded-lg p-1">
              <Button
                variant={sessionMode === "record" ? "default" : "ghost"}
                size="sm"
                onClick={() => setSessionMode("record")}
                className="gap-1"
              >
                <Circle className="h-3 w-3" />
                Record Only
              </Button>
              <Button
                variant={sessionMode === "stream" ? "default" : "ghost"}
                size="sm"
                onClick={() => setSessionMode("stream")}
                className="gap-1"
              >
                <Radio className="h-3 w-3" />
                Stream + Record
              </Button>
            </div>
          </div>
          
          {joinedGuests > 0 && (
            <Badge variant="outline" className="gap-1">
              <Users className="h-3 w-3" />
              {joinedGuests} Guest{joinedGuests !== 1 ? "s" : ""}
            </Badge>
          )}
          
          {isRecording && (
            <Badge variant="destructive" className="gap-1 animate-pulse">
              <Circle className="h-3 w-3 fill-current" />
              REC {formatTime(recordingTime)}
            </Badge>
          )}
        </div>
      </div>

      <div className="flex h-[calc(100vh-57px)]">
        {/* Main Preview Area */}
        <div className="flex-1 p-4 flex flex-col">
          <Card className={cn(
            "flex-1 relative overflow-hidden flex items-center justify-center",
            BACKGROUND_OPTIONS.find(b => b.id === background)?.className
          )}>
            {!hasActiveSource ? (
              <div className="text-center text-muted-foreground">
                <Camera className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium">Select a source to begin</h3>
                <p className="text-sm">Click the buttons below to start your camera or screen share</p>
              </div>
            ) : (
              <div className={cn(
                "w-full h-full",
                layout === "split" && "grid grid-cols-2 gap-2",
                layout === "fullscreen" && "relative"
              )}>
                {/* Screen share (main when PiP) */}
                {isScreenSharing && (
                  <video
                    ref={screenRef}
                    autoPlay
                    playsInline
                    muted
                    className={cn(
                      "bg-black",
                      layout === "fullscreen" && !isCameraOn && "w-full h-full object-contain",
                      layout === "fullscreen" && isCameraOn && "w-full h-full object-contain",
                      layout === "split" && "w-full h-full object-contain",
                      layout.startsWith("pip-") && "w-full h-full object-contain"
                    )}
                  />
                )}
                
                {/* Webcam */}
                {isCameraOn && (
                  <video
                    ref={webcamRef}
                    autoPlay
                    playsInline
                    muted
                    className={cn(
                      "bg-black",
                      layout === "fullscreen" && !isScreenSharing && "w-full h-full object-cover",
                      layout === "fullscreen" && isScreenSharing && "hidden",
                      layout === "split" && "w-full h-full object-cover",
                      layout.startsWith("pip-") && isScreenSharing && cn(
                        "absolute w-48 h-36 rounded-lg shadow-lg border-2 border-background object-cover",
                        layout === "pip-br" && "bottom-4 right-4",
                        layout === "pip-bl" && "bottom-4 left-4",
                        layout === "pip-tr" && "top-4 right-4",
                        layout === "pip-tl" && "top-4 left-4"
                      ),
                      layout.startsWith("pip-") && !isScreenSharing && "w-full h-full object-cover"
                    )}
                  />
                )}
              </div>
            )}
            
            {/* Teleprompter Overlay */}
            {teleprompterEnabled && teleprompterText && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-4 max-h-32 overflow-hidden">
                <p className="text-lg leading-relaxed">{teleprompterText}</p>
              </div>
            )}
          </Card>

          {/* Controls Bar */}
          <Card className="mt-4 p-4 bg-card border">
            <div className="flex items-center justify-between">
              {/* Left: Source controls */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={isCameraOn ? stopCamera : startCamera}
                  className="gap-2"
                >
                  <Users className="h-4 w-4" />
                  {isCameraOn ? "Stop Camera" : "Start Camera"}
                </Button>
                <Button
                  variant="outline"
                  onClick={isScreenSharing ? stopScreenShare : startScreenShare}
                  className="gap-2"
                >
                  <Monitor className="h-4 w-4" />
                  {isScreenSharing ? "Stop Share" : "Share Screen"}
                </Button>
              </div>

              {/* Center: Mic/Camera toggles */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleMic}
                  className={cn(!isMicOn && "text-destructive")}
                >
                  {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleCamera}
                  className={cn(!isCameraOn && "text-destructive")}
                >
                  {isCameraOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                </Button>
              </div>

              {/* Right: Recording controls */}
              <div className="flex items-center gap-2">
                {isRecording ? (
                  <>
                    <Button variant="outline" size="icon" onClick={pauseRecording}>
                      {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                    </Button>
                    <Button variant="destructive" onClick={stopRecording} className="gap-2">
                      <Square className="h-4 w-4" />
                      Stop Recording
                    </Button>
                  </>
                ) : (
                  <Button 
                    onClick={startRecording} 
                    disabled={!hasActiveSource}
                    className="gap-2 bg-red-500 hover:bg-red-600 text-white"
                  >
                    <Circle className="h-4 w-4 fill-current" />
                    {sessionMode === "stream" ? "Go Live" : "Start Recording"}
                  </Button>
                )}
                
                <Select value={recordingMode} onValueChange={(v) => setRecordingMode(v as RecordingMode)}>
                  <SelectTrigger className="w-36 bg-muted">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="webcam">Webcam Only</SelectItem>
                    <SelectItem value="screen">Screen Only</SelectItem>
                    <SelectItem value="both">Screen + Webcam</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="w-80 border-l bg-background p-4">
          <Tabs defaultValue="layout">
            <TabsList className="grid w-full grid-cols-3 bg-muted/50">
              <TabsTrigger value="layout" className="data-[state=active]:bg-background">
                <Layout className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="background" className="data-[state=active]:bg-background">
                <Image className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="teleprompter" className="data-[state=active]:bg-background">
                <Type className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>

            <TabsContent value="layout" className="mt-4 space-y-2">
              <Label className="text-sm font-medium">Layout</Label>
              {LAYOUT_OPTIONS.map(option => (
                <button
                  key={option.id}
                  onClick={() => setLayout(option.id)}
                  className={cn(
                    "w-full p-3 rounded-lg border text-left transition-colors",
                    layout === option.id 
                      ? "border-primary bg-primary/5 text-primary" 
                      : "border-border hover:bg-muted"
                  )}
                >
                  <div className="font-medium text-sm">{option.label}</div>
                  <div className="text-xs text-muted-foreground">{option.description}</div>
                </button>
              ))}
            </TabsContent>

            <TabsContent value="background" className="mt-4 space-y-4">
              <Label className="text-sm font-medium">Virtual Background</Label>
              <div className="grid grid-cols-2 gap-2">
                {BACKGROUND_OPTIONS.map(option => (
                  <button
                    key={option.id}
                    onClick={() => setBackground(option.id)}
                    className={cn(
                      "aspect-video rounded-lg border-2 transition-all flex items-center justify-center text-xs font-medium",
                      option.className,
                      option.id === "solid-light" ? "text-zinc-900" : "text-white",
                      background === option.id 
                        ? "border-primary ring-2 ring-primary/30" 
                        : "border-transparent hover:border-muted-foreground/30"
                    )}
                  >
                    {background === option.id && <Check className="h-4 w-4" />}
                  </button>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="teleprompter" className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Teleprompter</Label>
                <Switch 
                  checked={teleprompterEnabled} 
                  onCheckedChange={setTeleprompterEnabled}
                />
              </div>
              
              {teleprompterEnabled && (
                <>
                  <div>
                    <Label className="text-xs text-muted-foreground">Script</Label>
                    <Textarea 
                      value={teleprompterText}
                      onChange={(e) => setTeleprompterText(e.target.value)}
                      placeholder="Enter your script here..."
                      rows={8}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs text-muted-foreground">Speed</Label>
                    <Select value={teleprompterSpeed} onValueChange={(v) => setTeleprompterSpeed(v as TeleprompterSpeed)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        <SelectItem value="slow">Slow</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="fast">Fast</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>

          {/* Stream Destinations (when in stream mode) */}
          {sessionMode === "stream" && (
            <div className="mt-6 pt-6 border-t space-y-4">
              <Label className="text-sm font-medium">Stream Destinations</Label>
              {streamDestinations.map(dest => (
                <div key={dest.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">{dest.name}</Label>
                    <Switch 
                      checked={dest.enabled}
                      onCheckedChange={() => toggleStreamDestination(dest.id)}
                    />
                  </div>
                  {dest.enabled && (
                    <div className="space-y-2 pl-4 border-l-2 border-primary/30">
                      <Input 
                        placeholder="RTMP URL"
                        value={dest.rtmpUrl}
                        onChange={(e) => updateStreamDestination(dest.id, "rtmpUrl", e.target.value)}
                        className="text-xs"
                      />
                      <Input 
                        placeholder="Stream Key"
                        type="password"
                        value={dest.streamKey}
                        onChange={(e) => updateStreamDestination(dest.id, "streamKey", e.target.value)}
                        className="text-xs"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Ask Seeksy Button - Fixed bottom right */}
      <Button
        className="fixed bottom-6 right-6 gap-2 bg-primary hover:bg-primary/90 shadow-lg z-50"
        onClick={() => toast.info("Ask Seeksy coming soon")}
      >
        <span className="text-lg">⭐</span>
        Ask Seeksy
      </Button>
    </div>
  );
}