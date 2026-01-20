import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft, Mic, MicOff, Volume2, FileText, Bookmark, 
  Sparkles, Settings, Headphones, Waves, CircleDot, Square,
  Play, Pause, RefreshCw, Zap, MessageSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MarkerButton, MarkerType } from "@/components/studio/premium/MarkerButton";
import { ScriptPanel } from "@/components/studio/premium/ScriptPanel";
import { TimelineMarkers, TimelineMarker } from "@/components/studio/premium/TimelineMarkers";
import { AutoClipBanner } from "@/components/studio/premium/AutoClipBanner";

const micPresets = [
  { id: "shure-sm7b", name: "Shure SM7B", type: "Dynamic" },
  { id: "rode-podmic", name: "Rode PodMic", type: "Dynamic" },
  { id: "audio-technica-at2020", name: "Audio-Technica AT2020", type: "Condenser" },
  { id: "blue-yeti", name: "Blue Yeti", type: "USB Condenser" },
  { id: "custom", name: "Custom Settings", type: "Manual" },
];

export default function AudioStudioPremium() {
  const navigate = useNavigate();
  
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  
  // Audio settings
  const [micLevel, setMicLevel] = useState(75);
  const [selectedPreset, setSelectedPreset] = useState("shure-sm7b");
  const [noiseReduction, setNoiseReduction] = useState(true);
  const [voiceEnhancement, setVoiceEnhancement] = useState(true);
  const [deSibilance, setDeSibilance] = useState(false);
  
  // Studio state
  const [markers, setMarkers] = useState<TimelineMarker[]>([]);
  const [autoClips, setAutoClips] = useState<any[]>([]);
  const [rightPanelTab, setRightPanelTab] = useState("scripts");
  const [waveformBars, setWaveformBars] = useState<number[]>(Array(60).fill(0.2));

  // Recording timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording && !isPaused) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording, isPaused]);

  // Waveform animation
  useEffect(() => {
    if (!isRecording || isPaused) {
      setWaveformBars(Array(60).fill(0.2));
      return;
    }

    const interval = setInterval(() => {
      setWaveformBars(prev => {
        const newBars = [...prev.slice(1), Math.random() * 0.8 + 0.2];
        return newBars;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isRecording, isPaused]);

  // Simulate auto-clips
  useEffect(() => {
    if (isRecording && !isPaused && recordingTime > 0 && recordingTime % 60 === 0) {
      const newClip = {
        id: `clip-${Date.now()}`,
        timestamp: formatTime(recordingTime - 30),
        duration: "30s",
        type: ["energy", "insight", "quote"][Math.floor(Math.random() * 3)] as any,
        confidence: 0.85 + Math.random() * 0.15,
      };
      setAutoClips(prev => [...prev, newClip]);
    }
  }, [recordingTime, isRecording, isPaused]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return hrs > 0 
      ? `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
      : `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAddMarker = (type: MarkerType, timestamp: number) => {
    const newMarker: TimelineMarker = {
      id: `marker-${Date.now()}`,
      type: type.id,
      timestamp,
      label: type.label,
    };
    setMarkers(prev => [...prev, newMarker]);
  };

  return (
    <div className="h-screen bg-[#0B0F14] flex flex-col overflow-hidden">
      {/* Top Bar */}
      <header className="flex-shrink-0 h-14 border-b border-white/10 bg-[#0B0F14]/80 backdrop-blur-xl px-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/studio")}
            className="text-white/60 hover:text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-sm font-semibold text-white">Audio Podcast Studio</h1>
            <p className="text-xs text-white/50">Professional Audio Recording</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isRecording && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/20 border border-red-500/30">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm font-mono text-red-400">{formatTime(recordingTime)}</span>
              {isPaused && (
                <Badge className="bg-amber-500/20 text-amber-400 border-0 text-[10px]">PAUSED</Badge>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Audio Controls */}
        <aside className="w-72 border-r border-white/10 p-4 flex-shrink-0 hidden lg:block overflow-y-auto">
          <div className="space-y-6">
            {/* Microphone */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-white flex items-center gap-2">
                <Mic className="w-4 h-4" />
                Microphone
              </h4>
              
              <Button
                variant="ghost"
                onClick={() => setIsMuted(!isMuted)}
                className={cn(
                  "w-full h-14 rounded-xl justify-start gap-3 transition-all",
                  isMuted 
                    ? "bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30" 
                    : "bg-white/5 text-white hover:bg-white/10 border border-white/10"
                )}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                <span>{isMuted ? "Unmute" : "Mute"}</span>
              </Button>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-white/50">Input Level</span>
                  <span className="text-white/70">{micLevel}%</span>
                </div>
                <Slider
                  value={[micLevel]}
                  onValueChange={(v) => setMicLevel(v[0])}
                  max={100}
                  step={1}
                  className="cursor-pointer"
                />
              </div>
            </div>

            {/* Mic Preset */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-white flex items-center gap-2">
                <Headphones className="w-4 h-4" />
                Microphone Preset
              </h4>
              <Select value={selectedPreset} onValueChange={setSelectedPreset}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1f2e] border-white/10">
                  {micPresets.map((preset) => (
                    <SelectItem key={preset.id} value={preset.id} className="text-white/80 focus:text-white focus:bg-white/10">
                      <div>
                        <span>{preset.name}</span>
                        <span className="text-xs text-white/40 ml-2">{preset.type}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Audio Processing */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-white flex items-center gap-2">
                <Zap className="w-4 h-4" />
                AI Audio Processing
              </h4>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                  <Label htmlFor="noise" className="text-sm text-white/70 cursor-pointer">
                    Noise Reduction
                  </Label>
                  <Switch 
                    id="noise" 
                    checked={noiseReduction} 
                    onCheckedChange={setNoiseReduction}
                  />
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                  <Label htmlFor="enhance" className="text-sm text-white/70 cursor-pointer">
                    Voice Enhancement
                  </Label>
                  <Switch 
                    id="enhance" 
                    checked={voiceEnhancement} 
                    onCheckedChange={setVoiceEnhancement}
                  />
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                  <Label htmlFor="sibilance" className="text-sm text-white/70 cursor-pointer">
                    De-Sibilance
                  </Label>
                  <Switch 
                    id="sibilance" 
                    checked={deSibilance} 
                    onCheckedChange={setDeSibilance}
                  />
                </div>
              </div>
            </div>

            {/* Markers summary */}
            {markers.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-white flex items-center gap-2">
                  <Bookmark className="w-4 h-4" />
                  Markers ({markers.length})
                </h4>
                <div className="space-y-2">
                  {markers.slice(-4).map((marker) => (
                    <div 
                      key={marker.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-white/5 text-sm"
                    >
                      <span className="text-white/70">{marker.label}</span>
                      <span className="text-xs text-white/40">{formatTime(marker.timestamp)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Center - Waveform */}
        <main className="flex-1 flex flex-col p-4 lg:p-6">
          {/* Waveform visualizer */}
          <div className="flex-1 flex flex-col items-center justify-center">
            <Card className="w-full max-w-3xl p-8 bg-gradient-to-br from-violet-500/5 via-purple-500/5 to-blue-500/5 border-white/10">
              {/* Waveform bars */}
              <div className="flex items-center justify-center h-40 gap-1 mb-6">
                {waveformBars.map((height, index) => (
                  <div
                    key={index}
                    className="flex-1 max-w-2 bg-gradient-to-t from-violet-500 to-purple-400 rounded-full transition-all duration-75"
                    style={{
                      height: `${height * 100}%`,
                      opacity: isRecording && !isPaused ? 1 : 0.3,
                    }}
                  />
                ))}
              </div>
              
              {/* Status text */}
              <p className="text-center text-sm text-white/60">
                {isRecording 
                  ? isPaused 
                    ? "Recording paused" 
                    : "Recording in progress..."
                  : "Ready to record"
                }
              </p>
            </Card>

            {/* Timeline */}
            {isRecording && (
              <div className="w-full max-w-3xl mt-6">
                <TimelineMarkers
                  markers={markers}
                  duration={Math.max(recordingTime, 60)}
                  currentTime={recordingTime}
                  onSeekTo={() => {}}
                />
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <MarkerButton 
              onAddMarker={handleAddMarker}
              currentTime={recordingTime}
              disabled={!isRecording}
            />
            
            <div className="flex items-center gap-3">
              {!isRecording ? (
                <Button
                  onClick={() => { setIsRecording(true); setRecordingTime(0); }}
                  className={cn(
                    "w-16 h-16 rounded-full",
                    "bg-gradient-to-br from-red-500 to-red-600",
                    "hover:from-red-400 hover:to-red-500",
                    "shadow-lg shadow-red-500/30",
                    "transition-all hover:scale-105"
                  )}
                >
                  <CircleDot className="w-7 h-7 text-white" />
                </Button>
              ) : (
                <>
                  <Button
                    onClick={() => setIsPaused(!isPaused)}
                    className={cn(
                      "w-12 h-12 rounded-full",
                      isPaused 
                        ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
                        : "bg-white/10 text-white hover:bg-white/20"
                    )}
                  >
                    {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                  </Button>
                  <Button
                    onClick={() => { setIsRecording(false); setIsPaused(false); }}
                    className={cn(
                      "w-16 h-16 rounded-full",
                      "bg-gradient-to-br from-red-500 to-red-600",
                      "hover:from-red-400 hover:to-red-500",
                      "shadow-lg shadow-red-500/30 animate-pulse"
                    )}
                  >
                    <Square className="w-6 h-6 text-white fill-white" />
                  </Button>
                </>
              )}
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="w-12 h-12 rounded-xl bg-white/10 text-white hover:bg-white/20"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </main>

        {/* Right Panel */}
        <aside className="w-80 border-l border-white/10 flex flex-col flex-shrink-0 hidden lg:flex">
          <Tabs value={rightPanelTab} onValueChange={setRightPanelTab} className="flex-1 flex flex-col">
            <TabsList className="flex-shrink-0 bg-transparent border-b border-white/10 rounded-none h-12 p-0">
              <TabsTrigger 
                value="scripts" 
                className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:bg-transparent"
              >
                <FileText className="w-4 h-4 mr-2" />
                Scripts
              </TabsTrigger>
              <TabsTrigger 
                value="transcript" 
                className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:bg-transparent"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Transcript
              </TabsTrigger>
            </TabsList>

            <TabsContent value="scripts" className="flex-1 p-4 m-0">
              <ScriptPanel 
                onMarkComplete={() => {}}
                onGenerateVariation={() => {}}
              />
            </TabsContent>

            <TabsContent value="transcript" className="flex-1 p-4 m-0">
              <div className="h-full flex flex-col items-center justify-center text-center">
                <MessageSquare className="w-12 h-12 text-white/20 mb-4" />
                <p className="text-white/60 mb-2">Real-time Transcript</p>
                <p className="text-xs text-white/40">
                  {isRecording ? "Transcribing..." : "Start recording to see live transcript"}
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </aside>
      </div>

      {/* Auto-clip banner */}
      <AutoClipBanner
        clips={autoClips}
        onViewClips={() => {}}
        onDismiss={() => {}}
        isRecording={isRecording}
      />
    </div>
  );
}
