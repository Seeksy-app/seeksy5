import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ArrowLeft, Mic, MicOff, FileText, Bookmark, 
  Sparkles, CircleDot, Square, Play, Pause, MessageSquare,
  Settings, Volume2, SlidersHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GreenRoom } from "@/components/studio/GreenRoom";

export default function AudioStudio() {
  const navigate = useNavigate();
  
  const [inGreenRoom, setInGreenRoom] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [noiseReduction, setNoiseReduction] = useState(true);
  const [voiceEnhancement, setVoiceEnhancement] = useState(true);
  const [autoLeveling, setAutoLeveling] = useState(true);
  const [markers, setMarkers] = useState<{id: string; time: number; label: string}[]>([]);
  const [waveformBars, setWaveformBars] = useState<number[]>(Array(60).fill(0.2));
  const [rightTab, setRightTab] = useState("scripts");
  const [selectedMic, setSelectedMic] = useState("default");

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording && !isPaused) {
      interval = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording, isPaused]);

  useEffect(() => {
    if (!isRecording || isPaused) {
      setWaveformBars(Array(60).fill(0.2));
      return;
    }
    const interval = setInterval(() => {
      setWaveformBars(prev => [...prev.slice(1), Math.random() * 0.8 + 0.2]);
    }, 50);
    return () => clearInterval(interval);
  }, [isRecording, isPaused]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const addMarker = (label: string) => {
    setMarkers(prev => [...prev, { id: `m-${Date.now()}`, time: recordingTime, label }]);
  };

  const handleStop = () => {
    setIsRecording(false);
    setIsPaused(false);
    // Navigate to studio post-recording page
    navigate("/studio/complete", { 
      state: { 
        duration: recordingTime, 
        markers: markers.length,
        type: "audio"
      } 
    });
  };

  if (inGreenRoom) {
    return <GreenRoom mode="audio" onJoin={() => setInGreenRoom(false)} />;
  }

  return (
    <div className="h-screen bg-[#0B0F14] flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b border-white/10 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/studio")} className="text-white/60 hover:text-white hover:bg-white/10">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <span className="text-white/60 text-sm cursor-pointer hover:text-white" onClick={() => navigate("/studio")}>Back to Studio Home</span>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30">
            <Mic className="w-3 h-3 mr-1" /> Audio Podcast
          </Badge>
        </div>
        {isRecording && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/20 border border-red-500/30">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-mono text-red-400">{formatTime(recordingTime)}</span>
            {isPaused && <Badge className="bg-amber-500/20 text-amber-400 border-0 text-[10px]">PAUSED</Badge>}
          </div>
        )}
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Mic/Source + Toggles */}
        <aside className="w-64 border-r border-white/10 p-4 space-y-5 overflow-y-auto hidden lg:block">
          {/* Mic Source */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-white flex items-center gap-2">
              <Mic className="w-4 h-4" /> Microphone
            </h4>
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
            <Button
              variant="ghost"
              onClick={() => setIsMuted(!isMuted)}
              className={cn("w-full h-11 rounded-xl justify-start gap-3", 
                isMuted ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-white/5 text-white border border-white/10"
              )}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              {isMuted ? "Unmuted" : "Mute"}
            </Button>
          </div>

          {/* Enhancement Toggles */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-white flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4" /> Enhancements
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                <Label className="text-sm text-white/70">Noise Reduction</Label>
                <Switch checked={noiseReduction} onCheckedChange={setNoiseReduction} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                <Label className="text-sm text-white/70">Voice Enhancement</Label>
                <Switch checked={voiceEnhancement} onCheckedChange={setVoiceEnhancement} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                <Label className="text-sm text-white/70">Auto-Leveling</Label>
                <Switch checked={autoLeveling} onCheckedChange={setAutoLeveling} />
              </div>
            </div>
          </div>

          {/* Markers */}
          {markers.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-white flex items-center gap-2">
                <Bookmark className="w-4 h-4" /> Markers ({markers.length})
              </h4>
              <ScrollArea className="h-32">
                <div className="space-y-2 pr-2">
                  {markers.map(m => (
                    <div key={m.id} className="flex items-center justify-between p-2 rounded-lg bg-white/5 text-sm">
                      <span className="text-white/70">{m.label}</span>
                      <span className="text-xs text-white/40">{formatTime(m.time)}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </aside>

        {/* Center - Waveform */}
        <main className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-2xl p-8 rounded-2xl bg-gradient-to-br from-violet-500/5 via-purple-500/5 to-blue-500/5 border border-white/10">
            {/* Waveform */}
            <div className="flex items-center justify-center h-32 gap-0.5 mb-6">
              {waveformBars.map((height, i) => (
                <div
                  key={i}
                  className="flex-1 max-w-1 bg-gradient-to-t from-violet-500 to-purple-400 rounded-full transition-all duration-75"
                  style={{ height: `${height * 100}%`, opacity: isRecording && !isPaused ? 1 : 0.3 }}
                />
              ))}
            </div>
            <p className="text-center text-sm text-white/60">
              {isRecording ? (isPaused ? "Recording paused" : "Recording in progress...") : "Ready to record"}
            </p>
          </div>

          {/* Bottom Controls */}
          <div className="flex items-center gap-3 mt-8 p-3 rounded-2xl bg-white/5 border border-white/10">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMuted(!isMuted)}
              className={cn("w-11 h-11 rounded-xl", isMuted ? "bg-red-500/20 text-red-400" : "text-white/60 hover:text-white hover:bg-white/10")}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
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
                  onClick={() => { setIsRecording(true); setRecordingTime(0); }}
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
                  <Button
                    onClick={handleStop}
                    className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-500/30"
                  >
                    <Square className="w-6 h-6 text-white fill-white" />
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
        </main>

        {/* Right Drawer - Scripts/Markers/Transcript */}
        <aside className="w-72 border-l border-white/10 flex flex-col hidden lg:flex">
          <Tabs value={rightTab} onValueChange={setRightTab} className="flex-1 flex flex-col">
            <TabsList className="bg-transparent border-b border-white/10 rounded-none h-12 p-0">
              <TabsTrigger value="scripts" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-violet-500 data-[state=active]:bg-transparent text-white/60 data-[state=active]:text-white">
                <FileText className="w-4 h-4 mr-2" /> Scripts
              </TabsTrigger>
              <TabsTrigger value="markers" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-violet-500 data-[state=active]:bg-transparent text-white/60 data-[state=active]:text-white">
                <Bookmark className="w-4 h-4 mr-2" /> Markers
              </TabsTrigger>
              <TabsTrigger value="transcript" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-violet-500 data-[state=active]:bg-transparent text-white/60 data-[state=active]:text-white">
                <MessageSquare className="w-4 h-4 mr-2" /> Transcript
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
            <TabsContent value="transcript" className="flex-1 p-4 m-0">
              <div className="h-full flex flex-col items-center justify-center text-center">
                <MessageSquare className="w-12 h-12 text-white/20 mb-4" />
                <p className="text-white/60 mb-2">Live Transcript</p>
                <p className="text-xs text-white/40">{isRecording ? "Transcript will appear here" : "Available after recording"}</p>
              </div>
            </TabsContent>
          </Tabs>
        </aside>
      </div>
    </div>
  );
}
