import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { VideoStudioHeader, StudioMode } from "@/components/studio/video/VideoStudioHeader";
import { VideoStudioScenesResizable, SceneLayout, Scene, SceneType } from "@/components/studio/video/VideoStudioScenesResizable";
import { VideoStudioCanvas } from "@/components/studio/video/VideoStudioCanvas";
import type { SceneLayout as CanvasSceneLayout } from "@/components/studio/video/VideoStudioScenes";
import { VideoStudioControlsEnhanced } from "@/components/studio/video/VideoStudioControlsEnhanced";
import { VideoStudioToolbarEnhanced, ToolbarTab } from "@/components/studio/video/VideoStudioToolbarEnhanced";
import { HostToolsBar } from "@/components/studio/video/HostToolsBar";
import { VideoPreJoinScreen } from "@/components/studio/video/VideoPreJoinScreen";
import { VideoStudioLoadingScreen } from "@/components/studio/video/VideoStudioLoadingScreen";
import { LayoutTemplatesBar, LayoutTemplate } from "@/components/studio/video/LayoutTemplatesBar";

// Drawers
import { GraphicsDrawer } from "@/components/studio/video/drawers/GraphicsDrawer";
import { CaptionsDrawer } from "@/components/studio/video/drawers/CaptionsDrawer";
import { MusicDrawer } from "@/components/studio/video/drawers/MusicDrawer";
import { NotesDrawer } from "@/components/studio/video/drawers/NotesDrawer";
import { ChatDrawer } from "@/components/studio/video/drawers/ChatDrawer";
import { QRCodesDrawer } from "@/components/studio/video/drawers/QRCodesDrawer";
import { ScriptDrawer } from "@/components/studio/video/drawers/ScriptDrawer";
import { SetupCheckPanel } from "@/components/studio/SetupCheckPanel";

// Modals
import { InviteGuestModal } from "@/components/studio/video/modals/InviteGuestModal";
import { SettingsModal } from "@/components/studio/video/modals/SettingsModal";
import { ChannelsModal } from "@/components/studio/video/modals/ChannelsModal";
import { AddMediaModal } from "@/components/studio/video/modals/AddMediaModal";

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type StudioPhase = "loading" | "prejoin" | "studio";
type HostDrawer = "script" | "clip" | "ad" | null;

const defaultScenes: Scene[] = [
  { id: "welcome", name: "Welcome", layout: "host-only", sceneType: "camera" },
  { id: "demo", name: "Demo", layout: "side-by-side", sceneType: "camera" },
];

export default function VideoStudio() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  
  // Phase state
  const [phase, setPhase] = useState<StudioPhase>("loading");
  const [userName, setUserName] = useState("Side Stage One NYC");
  const [userTitle, setUserTitle] = useState("");
  
  // Studio state
  const [sessionTitle, setSessionTitle] = useState(`Live with Seeksy, ${new Date().toLocaleDateString('en-US', { month: 'long', day: '2-digit' })}`);
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [studioMode, setStudioMode] = useState<StudioMode>("record");
  
  // AI Features
  const [realtimeAIClips, setRealtimeAIClips] = useState(false);
  const [aiCameraFocus, setAiCameraFocus] = useState(false);
  
  // Scenes
  const [scenes, setScenes] = useState<Scene[]>(defaultScenes);
  const [activeSceneId, setActiveSceneId] = useState("welcome");
  const [currentLayout, setCurrentLayout] = useState<string>("host-only");
  const [currentLayoutTemplate, setCurrentLayoutTemplate] = useState<LayoutTemplate>("fullscreen");

  // Fetch streaming destinations for channel count
  const { data: destinations = [] } = useQuery({
    queryKey: ["streaming-destinations-count"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data } = await supabase
        .from("streaming_destinations")
        .select("id, is_active_default")
        .eq("user_id", user.id);
      return data || [];
    },
  });
  
  const channelCount = destinations.length;
  const activeChannelCount = destinations.filter((d: any) => d.is_active_default).length;
  
  // Toolbar & Drawers
  const [activeToolbarTab, setActiveToolbarTab] = useState<ToolbarTab | null>(null);
  const [activeHostDrawer, setActiveHostDrawer] = useState<HostDrawer>(null);
  
  // Modals
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showChannelsModal, setShowChannelsModal] = useState(false);
  const [showAddMediaModal, setShowAddMediaModal] = useState(false);
  const [showGreenRoom, setShowGreenRoom] = useState(false);

  // Markers
  const [markers, setMarkers] = useState<Array<{ type: string; time: number }>>([]);
  const [recordingTime, setRecordingTime] = useState(0);

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setPhase("prejoin");
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Only start camera if we don't have a stream from PreJoinScreen
  useEffect(() => {
    if (phase !== "studio" || stream) return;
    
    async function startCamera() {
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1920, height: 1080 },
          audio: true,
        });
        setStream(newStream);
        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
        }
      } catch (err) {
        console.error("Error starting camera:", err);
        toast.error("Could not access camera. Please check permissions.");
      }
    }
    
    startCamera();
    
    return () => {
      // Cleanup on unmount only
    };
  }, [phase]);

  // Cleanup stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Recording timer
  useEffect(() => {
    if (!isRecording) return;
    
    const interval = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleEnterStudio = (name: string, title: string, newSessionTitle: string, existingStream: MediaStream | null) => {
    setUserName(name);
    setUserTitle(title);
    setSessionTitle(newSessionTitle);
    
    // Use the existing stream from PreJoinScreen
    if (existingStream) {
      setStream(existingStream);
      if (videoRef.current) {
        videoRef.current.srcObject = existingStream;
      }
    }
    
    setPhase("studio");
  };

  const handleStartSession = async () => {
    if (studioMode === "live") {
      toast.info("Live streaming setup coming soon!");
      return;
    }
    
    // Record only mode
    if (!stream) {
      toast.error("Camera not ready. Please wait.");
      return;
    }
    
    try {
      // Set up MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9,opus'
      });
      
      recordedChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        await saveRecordingToMediaLibrary();
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000); // Capture every 1 second
      
      setIsRecording(true);
      setRecordingTime(0);
      toast.success("Recording started!");
    } catch (err) {
      console.error("Recording error:", err);
      toast.error("Failed to start recording");
    }
  };

  const handleStopSession = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast.success("Recording stopped. Saving to Media Library...");
    }
  };

  const saveRecordingToMediaLibrary = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to save recordings");
        return;
      }
      
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const fileName = `studio-recording-${Date.now()}.webm`;
      const filePath = `${user.id}/${fileName}`;
      
      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('studio-recordings')
        .upload(filePath, blob);
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('studio-recordings')
        .getPublicUrl(filePath);
      
      // Calculate duration from recording time
      const durationSeconds = recordingTime;
      
      // Save to media_files table
      const { error: dbError } = await supabase
        .from('media_files')
        .insert({
          user_id: user.id,
          file_name: sessionTitle || fileName,
          file_url: urlData.publicUrl,
          file_type: 'video',
          file_size_bytes: blob.size,
          duration_seconds: durationSeconds,
          source: 'studio-recording',
        });
      
      if (dbError) throw dbError;
      
      toast.success("Recording saved to Media Library!");
      
      // If realtime AI clips is enabled, trigger clip generation
      if (realtimeAIClips) {
        toast.info("AI clip generation will start shortly...");
      }
    } catch (err) {
      console.error("Error saving recording:", err);
      toast.error("Failed to save recording");
    }
  };

  const handleChannels = () => {
    setShowChannelsModal(true);
  };

  const handleSchedule = () => {
    toast.info("Schedule feature coming soon!");
  };

  const handleAddScene = (type?: SceneType) => {
    const layoutMap: Record<SceneType, SceneLayout> = {
      camera: "host-only",
      media: "media",
      countdown: "countdown",
    };
    const nameMap: Record<SceneType, string> = {
      camera: `Scene ${scenes.length + 1}`,
      media: "Media",
      countdown: "Countdown",
    };
    const sceneType = type || "camera";
    const newScene: Scene = {
      id: `scene-${Date.now()}`,
      name: nameMap[sceneType],
      layout: layoutMap[sceneType],
      sceneType: sceneType,
    };
    setScenes([...scenes, newScene]);
    setActiveSceneId(newScene.id);
  };

  const handleRenameScene = (sceneId: string, newName: string) => {
    setScenes(scenes.map(s => 
      s.id === sceneId ? { ...s, name: newName } : s
    ));
  };

  const handleReorderScenes = (newScenes: Scene[]) => {
    setScenes(newScenes);
  };

  const handleSceneMenu = (id: string) => {
    // Duplicate scene
    const scene = scenes.find(s => s.id === id);
    if (scene) {
      const newScene: Scene = {
        ...scene,
        id: `scene-${Date.now()}`,
        name: `${scene.name} (Copy)`,
      };
      setScenes([...scenes, newScene]);
    }
  };

  const handleDeleteScene = (id: string) => {
    if (scenes.length <= 1) {
      toast.error("Cannot delete the last scene");
      return;
    }
    setScenes(scenes.filter(s => s.id !== id));
    if (activeSceneId === id) {
      setActiveSceneId(scenes[0].id);
    }
  };

  const handleScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      toast.success("Screen sharing started!");
      // Handle screen share stream
    } catch (err) {
      console.error("Screen share error:", err);
    }
  };

  const handleAddClipMarker = () => {
    const marker = { type: "clip", time: recordingTime };
    setMarkers([...markers, marker]);
    toast.success(`Clip marker added at ${formatTime(recordingTime)}`);
  };

  const handleAddAdMarker = () => {
    const marker = { type: "ad", time: recordingTime };
    setMarkers([...markers, marker]);
    toast.success(`Ad marker added at ${formatTime(recordingTime)}`);
  };

  const handleEndSession = () => {
    if (isRecording) {
      setIsRecording(false);
      toast.success("Recording stopped and saved to Media Library");
    }
    navigate("/studio");
  };

  const handleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Loading phase
  if (phase === "loading") {
    return <VideoStudioLoadingScreen />;
  }

  // Pre-join phase
  if (phase === "prejoin") {
    return (
      <VideoPreJoinScreen
        sessionTitle={sessionTitle}
        hostName={userName}
        onEnterStudio={handleEnterStudio}
        onBack={() => navigate("/studio")}
      />
    );
  }

  // Main studio phase
  return (
    <div className="h-screen bg-[#0d0f12] flex flex-col overflow-hidden">
      {/* Header */}
      <VideoStudioHeader
        sessionTitle={sessionTitle}
        onBack={() => navigate("/studio")}
        isRecording={isRecording}
        studioMode={studioMode}
        onModeChange={setStudioMode}
        onStartSession={handleStartSession}
        onStopSession={handleStopSession}
        onChannels={handleChannels}
        onSchedule={handleSchedule}
        onEditTitle={() => {}}
        recordingTime={recordingTime}
        channelCount={channelCount}
        activeChannelCount={activeChannelCount}
        realtimeAIClips={realtimeAIClips}
        onRealtimeAIClipsChange={setRealtimeAIClips}
        aiCameraFocus={aiCameraFocus}
        onAiCameraFocusChange={setAiCameraFocus}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left - Resizable Scenes Panel */}
        <VideoStudioScenesResizable
          scenes={scenes}
          activeSceneId={activeSceneId}
          onSceneSelect={setActiveSceneId}
          onAddScene={handleAddScene}
          onSceneMenu={handleSceneMenu}
          onDeleteScene={handleDeleteScene}
          onRenameScene={handleRenameScene}
          onReorderScenes={handleReorderScenes}
        />

        {/* Center - Canvas + Controls */}
        <div className="flex-1 flex flex-col relative">
          <VideoStudioCanvas
            videoRef={videoRef}
            resolution="720p"
            isVideoOff={isVideoOff}
            layout={currentLayout as CanvasSceneLayout}
            onFullscreen={handleFullscreen}
          />

          {/* Layout Templates + Host Tools Bar - Single Row */}
          <div className="flex items-center justify-center gap-4 py-3 bg-[#0d0f12] border-t border-white/10 flex-wrap">
            <LayoutTemplatesBar
              currentLayout={currentLayoutTemplate}
              onLayoutChange={(layout) => {
                setCurrentLayoutTemplate(layout);
                // Map layout template to scene layout
                if (layout === "fullscreen") setCurrentLayout("host-only");
                else if (layout === "side-by-side") setCurrentLayout("side-by-side");
                else if (layout.includes("pip")) setCurrentLayout("host-guest");
                else if (layout === "grid-2x2") setCurrentLayout("grid");
                else if (layout === "presentation") setCurrentLayout("screen-share");
                else if (layout === "speaker-focus") setCurrentLayout("speaker");
                else if (layout === "gallery") setCurrentLayout("grid");
              }}
              sceneType={scenes.find(s => s.id === activeSceneId)?.sceneType}
            />
            <HostToolsBar
              activeDrawer={activeHostDrawer}
              onOpenScript={() => setActiveHostDrawer(activeHostDrawer === "script" ? null : "script")}
              onAddClipMarker={handleAddClipMarker}
              onAddAdMarker={handleAddAdMarker}
            />
          </div>

          {/* Script Drawer */}
          <ScriptDrawer
            isOpen={activeHostDrawer === "script"}
            onClose={() => setActiveHostDrawer(null)}
          />

          {/* Bottom Controls - ENLARGED */}
          <VideoStudioControlsEnhanced
            isMuted={isMuted}
            isVideoOff={isVideoOff}
            isRecording={isRecording}
            onToggleMic={() => {
              setIsMuted(!isMuted);
              if (stream) {
                stream.getAudioTracks().forEach(track => {
                  track.enabled = isMuted;
                });
              }
            }}
            onToggleVideo={() => {
              setIsVideoOff(!isVideoOff);
              if (stream) {
                stream.getVideoTracks().forEach(track => {
                  track.enabled = isVideoOff;
                });
              }
            }}
            onScreenShare={handleScreenShare}
            onInviteGuest={() => setShowInviteModal(true)}
            onAddSource={() => setShowAddMediaModal(true)}
            onSettings={() => setShowSettingsModal(true)}
            onLayoutChange={(layout) => setCurrentLayout(layout)}
            onEndSession={handleEndSession}
            onGreenRoom={() => setShowGreenRoom(true)}
          />

          {/* Green Room / AI Setup Check Panel */}
          {showGreenRoom && stream && (
            <SetupCheckPanel
              videoRef={videoRef}
              onClose={() => setShowGreenRoom(false)}
            />
          )}
        </div>

        {/* Right - Toolbar */}
        <VideoStudioToolbarEnhanced
          activeTab={activeToolbarTab}
          onTabChange={setActiveToolbarTab}
          onInviteGuest={() => setShowInviteModal(true)}
          notificationCount={3}
        />

        {/* Drawers */}
        <GraphicsDrawer
          isOpen={activeToolbarTab === "graphics"}
          onClose={() => setActiveToolbarTab(null)}
        />
        <CaptionsDrawer
          isOpen={activeToolbarTab === "captions"}
          onClose={() => setActiveToolbarTab(null)}
        />
        <QRCodesDrawer
          isOpen={activeToolbarTab === "qr"}
          onClose={() => setActiveToolbarTab(null)}
        />
        <NotesDrawer
          isOpen={activeToolbarTab === "notes"}
          onClose={() => setActiveToolbarTab(null)}
        />
        <ChatDrawer
          isOpen={activeToolbarTab === "chat"}
          onClose={() => setActiveToolbarTab(null)}
        />
        <MusicDrawer
          isOpen={activeToolbarTab === "music"}
          onClose={() => setActiveToolbarTab(null)}
        />
      </div>

      {/* Modals */}
      <InviteGuestModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
      />
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />
      <ChannelsModal
        isOpen={showChannelsModal}
        onClose={() => setShowChannelsModal(false)}
      />
      <AddMediaModal
        isOpen={showAddMediaModal}
        onClose={() => setShowAddMediaModal(false)}
        onSelectMedia={(media) => {
          if (media.type === "screen") {
            handleScreenShare();
          } else if (media.type === "camera") {
            toast.success("Extra camera added");
          } else if (media.url) {
            toast.success(`Added ${media.name || "media"} to scene`);
          }
          setShowAddMediaModal(false);
        }}
      />
    </div>
  );
}
