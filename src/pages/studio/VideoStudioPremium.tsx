import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ArrowLeft, Users, FileText, Bookmark, Sparkles, 
  Wifi, Clock, MoreVertical, MessageSquare, Settings2,
  Maximize, Minimize
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MarkerButton, markerTypes, MarkerType } from "@/components/studio/premium/MarkerButton";
import { ScriptPanel } from "@/components/studio/premium/ScriptPanel";
import { AutoClipBanner } from "@/components/studio/premium/AutoClipBanner";
import { TimelineMarkers, TimelineMarker } from "@/components/studio/premium/TimelineMarkers";
import { RecordingControls } from "@/components/studio/premium/RecordingControls";
import { ScenePresets, ScenePreset } from "@/components/studio/premium/ScenePresets";

export default function VideoStudioPremium() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [micLevel, setMicLevel] = useState(75);
  
  // Studio state
  const [currentScene, setCurrentScene] = useState<ScenePreset>("host-only");
  const [markers, setMarkers] = useState<TimelineMarker[]>([]);
  const [autoClips, setAutoClips] = useState<any[]>([]);
  const [rightPanelTab, setRightPanelTab] = useState("scripts");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [networkQuality, setNetworkQuality] = useState<"excellent" | "good" | "poor">("excellent");

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

  // Simulate auto-clips during recording
  useEffect(() => {
    if (isRecording && !isPaused && recordingTime > 0 && recordingTime % 45 === 0) {
      const newClip = {
        id: `clip-${Date.now()}`,
        timestamp: formatTime(recordingTime - 30),
        duration: "30s",
        type: ["energy", "reaction", "insight", "laughter", "quote"][Math.floor(Math.random() * 5)] as any,
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

  const handleStartRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    setIsPaused(false);
    // Navigate to post-session
  };

  const handlePauseRecording = () => {
    setIsPaused(!isPaused);
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
            <h1 className="text-sm font-semibold text-white">Video Podcast Studio</h1>
            <p className="text-xs text-white/50">New Recording Session</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Recording indicator */}
          {isRecording && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/20 border border-red-500/30">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm font-mono text-red-400">{formatTime(recordingTime)}</span>
              {isPaused && (
                <Badge className="bg-amber-500/20 text-amber-400 border-0 text-[10px]">PAUSED</Badge>
              )}
            </div>
          )}

          {/* Network quality */}
          <div className="flex items-center gap-1.5 text-white/50">
            <Wifi className={cn(
              "w-4 h-4",
              networkQuality === "excellent" && "text-emerald-400",
              networkQuality === "good" && "text-amber-400",
              networkQuality === "poor" && "text-red-400"
            )} />
            <span className="text-xs capitalize">{networkQuality}</span>
          </div>

          {/* Participants */}
          <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/10">
            <Users className="w-4 h-4 mr-2" />
            <span>1</span>
          </Button>

          <Button variant="ghost" size="icon" className="text-white/60 hover:text-white hover:bg-white/10">
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Scenes */}
        <aside className="w-64 border-r border-white/10 p-4 flex-shrink-0 hidden lg:block">
          <ScenePresets
            currentScene={currentScene}
            onSceneChange={setCurrentScene}
            participantCount={1}
          />

          {/* Timeline markers */}
          {markers.length > 0 && (
            <div className="mt-6 pt-6 border-t border-white/10">
              <h4 className="text-sm font-medium text-white mb-3">Session Markers</h4>
              <div className="space-y-2">
                {markers.slice(-5).map((marker) => {
                  const markerType = markerTypes.find(m => m.id === marker.type);
                  const Icon = markerType?.icon;
                  return (
                    <div 
                      key={marker.id}
                      className="flex items-center gap-2 p-2 rounded-lg bg-white/5 text-sm"
                    >
                      {Icon && <Icon className={cn("w-4 h-4", markerType?.color)} />}
                      <span className="text-white/70">{marker.label}</span>
                      <span className="ml-auto text-xs text-white/40">{formatTime(marker.timestamp)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </aside>

        {/* Center - Video Canvas */}
        <main className="flex-1 flex flex-col p-4 lg:p-6">
          {/* Video preview */}
          <div className={cn(
            "flex-1 relative rounded-2xl overflow-hidden",
            "bg-gradient-to-br from-[#1a1f2e] to-[#0d1117]",
            "border border-white/10"
          )}>
            {/* Placeholder for video */}
            <div className="absolute inset-0 flex items-center justify-center">
              {isVideoOff ? (
                <div className="text-center">
                  <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl font-bold text-white/60">Y</span>
                  </div>
                  <p className="text-white/50">Camera Off</p>
                </div>
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-violet-500/10 to-blue-500/10 flex items-center justify-center">
                  <p className="text-white/30 text-sm">Camera preview</p>
                </div>
              )}
            </div>

            {/* Fullscreen toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="absolute top-4 right-4 bg-black/40 text-white hover:bg-black/60"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </Button>

            {/* Live transcript overlay */}
            {isRecording && (
              <div className="absolute bottom-4 left-4 right-4">
                <div className="bg-black/60 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                  <p className="text-white/80 text-sm">
                    <span className="text-white/40">[Live Transcript]</span>{" "}
                    AI is transcribing in real-time...
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Timeline */}
          {isRecording && (
            <div className="mt-4">
              <TimelineMarkers
                markers={markers}
                duration={Math.max(recordingTime, 60)}
                currentTime={recordingTime}
                onSeekTo={() => {}}
              />
            </div>
          )}

          {/* Controls */}
          <div className="mt-4 flex items-center justify-center gap-4">
            <MarkerButton 
              onAddMarker={handleAddMarker}
              currentTime={recordingTime}
              disabled={!isRecording}
            />
            
            <RecordingControls
              isRecording={isRecording}
              isPaused={isPaused}
              isMuted={isMuted}
              isVideoOff={isVideoOff}
              micLevel={micLevel}
              onStartRecording={handleStartRecording}
              onStopRecording={handleStopRecording}
              onPauseRecording={handlePauseRecording}
              onToggleMute={() => setIsMuted(!isMuted)}
              onToggleVideo={() => setIsVideoOff(!isVideoOff)}
              onEndSession={() => navigate("/studio")}
              onOpenSettings={() => {}}
              onMicLevelChange={setMicLevel}
            />
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
              <TabsTrigger 
                value="clips" 
                className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:bg-transparent"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Clips
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

            <TabsContent value="clips" className="flex-1 p-4 m-0">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-white">Auto-Clips</h3>
                  <Badge className="bg-violet-500/20 text-violet-400 border-0">
                    {autoClips.length} captured
                  </Badge>
                </div>
                
                {autoClips.length === 0 ? (
                  <div className="text-center py-12">
                    <Sparkles className="w-12 h-12 text-white/20 mx-auto mb-4" />
                    <p className="text-white/60 mb-2">AI Auto-Clips</p>
                    <p className="text-xs text-white/40">
                      AI will automatically capture hot moments during recording
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2 pr-4">
                      {autoClips.map((clip) => (
                        <div 
                          key={clip.id}
                          className="p-3 rounded-lg bg-white/5 border border-white/10"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-white capitalize">{clip.type}</span>
                            <span className="text-xs text-white/40">{clip.timestamp}</span>
                          </div>
                          <p className="text-xs text-white/50">{clip.duration}</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </aside>
      </div>

      {/* Auto-clip banner */}
      <AutoClipBanner
        clips={autoClips}
        onViewClips={() => setRightPanelTab("clips")}
        onDismiss={() => {}}
        isRecording={isRecording}
      />
    </div>
  );
}
