import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ArrowLeft, Video, Mic, MicOff, FileText, Bookmark, 
  Sparkles, CircleDot, Square, Play, Pause, MessageSquare,
  Settings, Users, Camera, CameraOff, Monitor, Clock, Wifi, User, Image
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CountdownOverlay } from "@/components/studio/CountdownOverlay";
import { StudioCanvasOverlay } from "@/components/studio/StudioCanvasOverlay";
import { StudioExitConfirmModal } from "@/components/studio/StudioExitConfirmModal";
import { useBackgroundMusic } from "@/hooks/useBackgroundMusic";

type SceneLayout = "side-by-side" | "speaker-auto-focus";

interface LowerThird {
  id: string;
  name: string;
  title?: string;
}

interface Ticker {
  id: string;
  text: string;
}

export default function VideoStudioPremiumNew() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Countdown
  const [showCountdown, setShowCountdown] = useState(false);
  
  // Device state
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [backgroundBlur, setBackgroundBlur] = useState(false);
  const [selectedCamera, setSelectedCamera] = useState("default");
  const [selectedMic, setSelectedMic] = useState("default");
  
  // Layout & scenes
  const [activeLayout, setActiveLayout] = useState<SceneLayout>("side-by-side");
  const [markers, setMarkers] = useState<{id: string; time: number; label: string}[]>([]);
  const [rightTab, setRightTab] = useState("scripts");
  const [scenes, setScenes] = useState([
    { id: "1", name: "Opening", layout: "side-by-side" },
    { id: "2", name: "Interview", layout: "speaker-focus" },
  ]);
  const [activeSceneId, setActiveSceneId] = useState("1");
  const [autoClips, setAutoClips] = useState(0);
  
  // Branding overlays
  const [logoUrl, setLogoUrl] = useState<string | undefined>();
  const [logoPosition, setLogoPosition] = useState<"top-left" | "top-right">("top-left");
  
  // Lower thirds & ticker
  const [lowerThirds] = useState<LowerThird[]>([
    { id: "1", name: "Host Name", title: "Show Host" },
    { id: "2", name: "Guest Name", title: "Special Guest" },
  ]);
  const [activeLowerThird, setActiveLowerThird] = useState<LowerThird | null>(null);
  const [tickers] = useState<Ticker[]>([
    { id: "1", text: "Welcome to the show! Follow us @seeksy" },
  ]);
  const [activeTicker, setActiveTicker] = useState<Ticker | null>(null);
  const [tickerSpeed, setTickerSpeed] = useState<"slow" | "medium" | "fast">("medium");
  const [isTickerRunning, setIsTickerRunning] = useState(true);
  
  // Exit confirmation
  const [showExitModal, setShowExitModal] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Background music
  const backgroundMusic = useBackgroundMusic();

  // Recording timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording && !isPaused) {
      interval = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording, isPaused]);

  // Auto-clip detection simulation
  useEffect(() => {
    if (isRecording && recordingTime > 0 && recordingTime % 30 === 0) {
      setAutoClips(prev => prev + 1);
    }
  }, [recordingTime, isRecording]);

  // Track unsaved changes
  useEffect(() => {
    if (logoUrl || activeLowerThird || activeTicker || markers.length > 0) {
      setHasUnsavedChanges(true);
    }
  }, [logoUrl, activeLowerThird, activeTicker, markers]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const addMarker = (label: string) => {
    setMarkers(prev => [...prev, { id: `m-${Date.now()}`, time: recordingTime, label }]);
    toast({ title: "Marker added", description: `At ${formatTime(recordingTime)}` });
  };

  // Create session in database
  const createSession = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("studio_sessions")
      .insert({
        user_id: user.id,
        room_name: `Video Session – ${new Date().toLocaleString()}`,
        daily_room_url: "",
        status: "active",
        session_type: "video",
      })
      .select()
      .single();

    if (error) throw error;
    return data.id;
  };

  // Start recording with countdown
  const handleStartRecording = () => {
    setShowCountdown(true);
  };

  const onCountdownComplete = async () => {
    setShowCountdown(false);
    
    try {
      // Create session
      const newSessionId = await createSession();
      setSessionId(newSessionId);

      // Get media stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: !isCameraOff,
        audio: !isMuted,
      });
      streamRef.current = stream;

      // Setup MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : "video/webm";
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      setRecordingTime(0);
      setAutoClips(0);
      
      toast({ title: "Recording started", description: "Your session is now being recorded" });
    } catch (err: any) {
      console.error("Failed to start recording:", err);
      toast({
        title: "Recording failed",
        description: err.message || "Could not start recording",
        variant: "destructive",
      });
    }
  };

  // Stop recording and save
  const handleStop = async () => {
    if (!mediaRecorderRef.current || !sessionId) {
      navigate("/studio/session/new");
      return;
    }

    setIsSaving(true);
    
    try {
      // Stop the media recorder
      await new Promise<void>((resolve) => {
        if (!mediaRecorderRef.current) {
          resolve();
          return;
        }
        
        mediaRecorderRef.current.onstop = () => resolve();
        mediaRecorderRef.current.stop();
      });

      // Stop all tracks
      streamRef.current?.getTracks().forEach(track => track.stop());

      // Create blob
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      
      if (blob.size === 0) {
        throw new Error("Recording is empty");
      }

      // Upload to storage
      const fileName = `${sessionId}/${Date.now()}.webm`;
      const { error: uploadError } = await supabase.storage
        .from("studio-recordings")
        .upload(fileName, blob, {
          contentType: "video/webm",
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Update session
      await supabase
        .from("studio_sessions")
        .update({
          duration_seconds: recordingTime,
          recording_status: "completed",
          status: "ended",
          ended_at: new Date().toISOString(),
        })
        .eq("id", sessionId);

      // Also create media_files entry
      const { data: { publicUrl } } = supabase.storage
        .from("studio-recordings")
        .getPublicUrl(fileName);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("media_files").insert({
          user_id: user.id,
          file_name: `Video Recording - ${new Date().toLocaleDateString()}`,
          file_url: publicUrl,
          file_type: "video",
          file_size: blob.size,
          duration_seconds: recordingTime,
          source: "studio",
        });
      }

      toast({ title: "Recording saved", description: "Your recording is now in Media Library" });
      setIsRecording(false);
      setIsPaused(false);
      navigate(`/studio/post-session/${sessionId}`);
    } catch (err: any) {
      console.error("Failed to save recording:", err);
      toast({
        title: "Failed to save recording",
        description: err.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle back/exit
  const handleBack = () => {
    if (isRecording || hasUnsavedChanges) {
      setShowExitModal(true);
    } else {
      navigate("/studio");
    }
  };

  const handleSaveAndExit = async () => {
    if (isRecording) {
      await handleStop();
    }
    navigate("/studio");
  };

  const handleExitWithoutSaving = () => {
    // Stop any recording without saving
    streamRef.current?.getTracks().forEach(track => track.stop());
    backgroundMusic.stop();
    navigate("/studio");
  };

  // Logo upload handler
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setLogoUrl(url);
      setHasUnsavedChanges(true);
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-[#0B0F14] via-[#0D1117] to-[#11151C] flex flex-col overflow-hidden">
      {/* Countdown Overlay */}
      <CountdownOverlay
        isActive={showCountdown}
        onComplete={onCountdownComplete}
        duration={5}
      />

      {/* Exit Confirmation Modal */}
      <StudioExitConfirmModal
        open={showExitModal}
        onOpenChange={setShowExitModal}
        onSaveAndExit={handleSaveAndExit}
        onExitWithoutSaving={handleExitWithoutSaving}
        onCancel={() => setShowExitModal(false)}
      />

      {/* Header */}
      <header className="h-14 border-b border-white/10 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={handleBack} className="text-white/60 hover:text-white hover:bg-white/10">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <span className="text-white/60 text-sm cursor-pointer hover:text-white" onClick={handleBack}>Back to Studio Home</span>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
            <Video className="w-3 h-3 mr-1" /> Video Studio
          </Badge>
          {isRecording && autoClips > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-violet-500/20 border border-violet-500/30"
            >
              <Sparkles className="w-4 h-4 text-violet-400" />
              <span className="text-sm text-violet-300 font-medium">{autoClips} clips ready</span>
            </motion.div>
          )}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5">
            <Wifi className="w-4 h-4 text-green-400" />
            <span className="text-sm text-white/70">Excellent</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isRecording && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/20 border border-red-500/30">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <Clock className="w-4 h-4 text-white/60" />
              <span className="text-sm font-mono text-red-400">{formatTime(recordingTime)}</span>
            </div>
          )}
          <Button variant="ghost" size="icon" className="text-white/60 hover:text-white hover:bg-white/10">
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-64 border-r border-white/10 p-4 space-y-5 overflow-y-auto hidden lg:block bg-black/20">
          {/* Camera */}
          <div className="space-y-3">
            <h4 className="text-xs font-medium text-white/50 uppercase tracking-wider">Camera</h4>
            <Select value={selectedCamera} onValueChange={setSelectedCamera}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Select camera" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default Camera</SelectItem>
                <SelectItem value="built-in">Built-in Webcam</SelectItem>
                <SelectItem value="external">External USB Camera</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              onClick={() => setIsCameraOff(!isCameraOff)}
              className={cn("w-full h-11 rounded-xl justify-start gap-3", 
                isCameraOff ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-white/5 text-white border border-white/10"
              )}
            >
              {isCameraOff ? <CameraOff className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
              {isCameraOff ? "Camera Off" : "Camera On"}
            </Button>
          </div>

          {/* Microphone */}
          <div className="space-y-3">
            <h4 className="text-xs font-medium text-white/50 uppercase tracking-wider">Microphone</h4>
            <Select value={selectedMic} onValueChange={setSelectedMic}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Select microphone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default Microphone</SelectItem>
                <SelectItem value="built-in">Built-in Microphone</SelectItem>
                <SelectItem value="external">External USB Mic</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Logo Upload */}
          <div className="space-y-3">
            <h4 className="text-xs font-medium text-white/50 uppercase tracking-wider">Logo</h4>
            <label className="flex items-center justify-center gap-2 p-3 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
              <Image className="w-4 h-4 text-white/60" />
              <span className="text-sm text-white/70">{logoUrl ? "Change Logo" : "Upload Logo"}</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            </label>
            {logoUrl && (
              <Select value={logoPosition} onValueChange={(v) => setLogoPosition(v as any)}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="top-left">Top Left</SelectItem>
                  <SelectItem value="top-right">Top Right</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Background Blur */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
            <div className="flex items-center gap-2">
              <Monitor className="w-4 h-4 text-white/60" />
              <Label className="text-sm text-white/70">Background Blur</Label>
            </div>
            <Switch checked={backgroundBlur} onCheckedChange={setBackgroundBlur} />
          </div>

          {/* Layout */}
          <div className="space-y-3">
            <h4 className="text-xs font-medium text-white/50 uppercase tracking-wider">Layout</h4>
            <div className="space-y-2">
              <Button
                variant={activeLayout === "side-by-side" ? "default" : "outline"}
                className={cn("w-full justify-start gap-3 h-auto py-3",
                  activeLayout === "side-by-side" 
                    ? "bg-blue-500 hover:bg-blue-600 border-blue-500" 
                    : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                )}
                onClick={() => setActiveLayout("side-by-side")}
              >
                <Users className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-semibold">Side-by-Side</div>
                  <div className={`text-xs ${activeLayout === "side-by-side" ? "opacity-80" : "text-white/60"}`}>
                    Host + Guest equal view
                  </div>
                </div>
              </Button>
              <Button
                variant={activeLayout === "speaker-auto-focus" ? "default" : "outline"}
                className={cn("w-full justify-start gap-3 h-auto py-3",
                  activeLayout === "speaker-auto-focus" 
                    ? "bg-blue-500 hover:bg-blue-600 border-blue-500" 
                    : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                )}
                onClick={() => setActiveLayout("speaker-auto-focus")}
              >
                <Sparkles className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-semibold">Speaker Auto-Focus</div>
                  <div className={`text-xs ${activeLayout === "speaker-auto-focus" ? "opacity-80" : "text-white/60"}`}>
                    AI switches to active speaker
                  </div>
                </div>
              </Button>
            </div>
          </div>
        </aside>

        {/* Center - Video Preview */}
        <main className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-4xl">
            {/* Video Canvas */}
            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black/40 border border-white/10 relative mb-6">
              {/* Canvas Overlays */}
              <StudioCanvasOverlay
                logoUrl={logoUrl}
                logoPosition={logoPosition}
                activeLowerThird={activeLowerThird}
                activeTicker={activeTicker}
                tickerSpeed={tickerSpeed}
                isTickerRunning={isTickerRunning}
              />

              {/* Video frames */}
              <div className={cn(
                "absolute inset-0 p-4 gap-4",
                activeLayout === "side-by-side" && "grid grid-cols-2",
                activeLayout === "speaker-auto-focus" && "flex items-center justify-center"
              )}>
                {/* Host frame */}
                <div className={cn(
                  "rounded-xl overflow-hidden bg-gradient-to-br from-blue-900/30 to-purple-900/30 border border-white/10 flex items-center justify-center relative",
                  activeLayout === "speaker-auto-focus" && "w-full max-w-3xl aspect-video"
                )}>
                  {isCameraOff ? (
                    <div className="text-center">
                      <CameraOff className="w-16 h-16 text-white/20 mx-auto mb-3" />
                      <p className="text-white/40">Camera is off</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="w-20 h-20 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-3">
                        <User className="w-10 h-10 text-blue-400/50" />
                      </div>
                      <p className="text-white/50 text-sm">Host Camera</p>
                    </div>
                  )}
                  <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur">
                    <span className="text-sm text-white font-medium">You (Host)</span>
                  </div>
                </div>

                {/* Guest frame - Only in side-by-side */}
                {activeLayout === "side-by-side" && (
                  <div className="rounded-xl overflow-hidden bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-white/10 flex items-center justify-center relative">
                    <div className="text-center">
                      <div className="w-20 h-20 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-3">
                        <User className="w-10 h-10 text-purple-400/50" />
                      </div>
                      <p className="text-white/50 text-sm">Guest Camera</p>
                    </div>
                    <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur">
                      <span className="text-sm text-white font-medium">Guest</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Recording indicator */}
              {isRecording && (
                <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/20 backdrop-blur z-30">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-sm text-red-400 font-medium">REC</span>
                </div>
              )}

              {/* Layout indicator */}
              <div className="absolute top-4 right-4 z-30">
                <Badge className="bg-black/50 text-white/70 border-white/20 text-xs">
                  {activeLayout === "side-by-side" ? "Side-by-Side" : "Auto-Focus"}
                </Badge>
              </div>
            </div>

            {/* Bottom Controls */}
            <div className="flex items-center justify-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMuted(!isMuted)}
                className={cn("w-11 h-11 rounded-xl", isMuted ? "bg-red-500/20 text-red-400" : "text-white/60 hover:text-white hover:bg-white/10")}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCameraOff(!isCameraOff)}
                className={cn("w-11 h-11 rounded-xl", isCameraOff ? "bg-red-500/20 text-red-400" : "text-white/60 hover:text-white hover:bg-white/10")}
              >
                {isCameraOff ? <CameraOff className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
              </Button>

              {isRecording && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => addMarker("Marker")}
                  className="gap-2 text-white/60 hover:text-white hover:bg-white/10"
                >
                  <Bookmark className="w-4 h-4" />
                </Button>
              )}

              <div className="flex items-center gap-2">
                {!isRecording ? (
                  <Button
                    onClick={handleStartRecording}
                    disabled={showCountdown}
                    className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 shadow-lg shadow-red-500/30"
                  >
                    <CircleDot className="w-7 h-7 text-white" />
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={() => setIsPaused(!isPaused)}
                      className={cn("w-11 h-11 rounded-full", isPaused ? "bg-amber-500/20 text-amber-400" : "bg-white/10 text-white")}
                    >
                      {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                    </Button>
                    {/* RED STOP BUTTON */}
                    <Button
                      onClick={handleStop}
                      disabled={isSaving}
                      className="w-16 h-16 rounded-full bg-gradient-to-br from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 shadow-lg shadow-red-500/30 border-2 border-red-400/50"
                    >
                      {isSaving ? (
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Square className="w-6 h-6 text-white fill-white" />
                      )}
                    </Button>
                  </>
                )}
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="w-11 h-11 rounded-xl text-white/60 hover:text-white hover:bg-white/10"
              >
                <Sparkles className="w-5 h-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="w-11 h-11 rounded-xl text-white/60 hover:text-white hover:bg-white/10"
              >
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </main>

        {/* Right Sidebar */}
        <aside className="w-72 border-l border-white/10 flex flex-col hidden lg:flex bg-black/20">
          <Tabs value={rightTab} onValueChange={setRightTab} className="flex-1 flex flex-col">
            <TabsList className="bg-transparent border-b border-white/10 rounded-none h-12 p-0">
              <TabsTrigger value="scripts" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent text-white/60 data-[state=active]:text-white">
                <FileText className="w-4 h-4 mr-2" /> Scripts
              </TabsTrigger>
              <TabsTrigger value="markers" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent text-white/60 data-[state=active]:text-white">
                <Bookmark className="w-4 h-4 mr-2" /> Markers
              </TabsTrigger>
              <TabsTrigger value="captions" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent text-white/60 data-[state=active]:text-white">
                <MessageSquare className="w-4 h-4 mr-2" /> Captions
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="scripts" className="flex-1 p-4 m-0">
              <div className="h-full flex flex-col items-center justify-center text-center">
                <FileText className="w-12 h-12 text-white/20 mb-4" />
                <p className="text-white/60 mb-2">Episode Scripts</p>
                <p className="text-xs text-white/40 mb-4">Add scripts from Templates</p>
                <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                  Browse Templates
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="markers" className="flex-1 p-4 m-0">
              {markers.length > 0 ? (
                <ScrollArea className="h-full">
                  <div className="space-y-2">
                    {markers.map(m => (
                      <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                        <span className="text-sm text-white/70">{m.label}</span>
                        <span className="text-xs text-white/40">{formatTime(m.time)}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <Bookmark className="w-12 h-12 text-white/20 mb-4" />
                  <p className="text-white/60 mb-2">No Markers</p>
                  <p className="text-xs text-white/40">{isRecording ? "Click marker button to add" : "Start recording to add markers"}</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="captions" className="flex-1 p-4 m-0 overflow-y-auto">
              <div className="space-y-4">
                {/* Lower Thirds */}
                <div>
                  <h4 className="text-xs font-medium text-white/50 uppercase mb-2">Lower Thirds</h4>
                  <div className="space-y-2">
                    {lowerThirds.map(lt => (
                      <button
                        key={lt.id}
                        onClick={() => setActiveLowerThird(activeLowerThird?.id === lt.id ? null : lt)}
                        className={cn(
                          "w-full p-3 rounded-lg text-left transition-all",
                          activeLowerThird?.id === lt.id
                            ? "bg-blue-500/20 border border-blue-500/50"
                            : "bg-white/5 border border-white/10 hover:bg-white/10"
                        )}
                      >
                        <div className="text-white font-medium text-sm">{lt.name}</div>
                        {lt.title && <div className="text-white/60 text-xs">{lt.title}</div>}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tickers */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-medium text-white/50 uppercase">Ticker</h4>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsTickerRunning(!isTickerRunning)}
                      className="text-xs h-6"
                    >
                      {isTickerRunning ? "Stop" : "Start"}
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {tickers.map(t => (
                      <button
                        key={t.id}
                        onClick={() => setActiveTicker(activeTicker?.id === t.id ? null : t)}
                        className={cn(
                          "w-full p-3 rounded-lg text-left transition-all",
                          activeTicker?.id === t.id
                            ? "bg-blue-500/20 border border-blue-500/50"
                            : "bg-white/5 border border-white/10 hover:bg-white/10"
                        )}
                      >
                        <div className="text-white text-sm truncate">{t.text}</div>
                      </button>
                    ))}
                  </div>
                  <div className="mt-2">
                    <Label className="text-xs text-white/50">Speed</Label>
                    <Select value={tickerSpeed} onValueChange={(v) => setTickerSpeed(v as any)}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white h-8 text-xs mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="slow">Slow</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="fast">Fast</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </aside>
      </div>

      {/* Scenes Strip at Bottom */}
      <div className="h-20 border-t border-white/10 bg-black/40 flex items-center px-4 gap-3 overflow-x-auto shrink-0">
        <button
          onClick={() => setScenes(prev => [...prev, { id: `s-${Date.now()}`, name: `Scene ${prev.length + 1}`, layout: "side-by-side" }])}
          className="h-14 w-14 shrink-0 rounded-lg border-2 border-dashed border-white/20 hover:border-white/40 hover:bg-white/5 flex flex-col items-center justify-center gap-1"
        >
          <span className="text-xl text-white/50">+</span>
          <span className="text-[10px] text-white/50">Add</span>
        </button>
        {scenes.map((scene, index) => (
          <button
            key={scene.id}
            onClick={() => setActiveSceneId(scene.id)}
            className={cn(
              "relative h-14 w-24 shrink-0 rounded-lg overflow-hidden border-2 transition-all flex items-center justify-center",
              activeSceneId === scene.id
                ? "border-blue-500 shadow-lg shadow-blue-500/30 bg-blue-500/20"
                : "border-white/20 hover:border-white/40 bg-white/5"
            )}
          >
            <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-[10px] font-bold text-white">{index + 1}</span>
            <span className="text-xs text-white/80">{scene.name}</span>
          </button>
        ))}
        <span className="ml-auto text-xs text-white/40">{scenes.length} scenes • Click to switch</span>
      </div>

      {/* Saving Overlay */}
      {isSaving && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white text-lg font-medium">Saving your recording...</p>
            <p className="text-white/60 text-sm mt-2">Please don't close this window</p>
          </div>
        </div>
      )}
    </div>
  );
}
