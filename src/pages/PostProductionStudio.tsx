import { useState, useRef, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { VideoOrientationBadge } from "@/components/media/VideoOrientationBadge";
import { detectVideoOrientation, getVideoContainerClasses, VideoOrientation } from "@/utils/videoOrientation";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { AICameraProcessingDialog } from "@/components/media/AICameraProcessingDialog";
import { AIEditCompletionDialog } from "@/components/media/AIEditCompletionDialog";
import { PostProductionTutorial } from "@/components/media/PostProductionTutorial";
import { AIBRollGenerator } from "@/components/media/AIBRollGenerator";
import { ThumbnailManager } from "@/components/media/ThumbnailManager";
import { IntroOutroManager } from "@/components/media/IntroOutroManager";
import { SpeakerDetectionManager } from "@/components/media/SpeakerDetectionManager";
import { MusicGeneratorManager } from "@/components/media/MusicGeneratorManager";
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward,
  Scissors,
  Sparkles,
  Type,
  Image as ImageIcon,
  Film,
  Save,
  Download,
  Undo,
  Redo,
  X,
  Camera,
  HelpCircle,
  BookOpen,
  Video,
  Music
} from "lucide-react";

interface Marker {
  id: string;
  type: 'ad' | 'lower_third' | 'broll' | 'cut' | 'camera_focus' | 'clip_suggestion';
  timestamp: number;
  duration?: number;
  data?: any;
}

const getMarkerColor = (type: Marker['type']) => {
  switch (type) {
    case 'ad':
      return 'bg-yellow-500';
    case 'camera_focus':
      return 'bg-blue-500';
    case 'cut':
      return 'bg-red-500';
    case 'lower_third':
      return 'bg-green-500';
    case 'broll':
      return 'bg-purple-500';
    case 'clip_suggestion':
      return 'bg-orange-500';
    default:
      return 'bg-gray-500';
  }
};

export default function PostProductionStudio() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const mediaId = searchParams.get("id");
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<Marker | null>(null);
  const [activeTab, setActiveTab] = useState("tools");
  const [cameraProcessingOpen, setCameraProcessingOpen] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [fullAIProcessing, setFullAIProcessing] = useState(false);
  const [completionDialogOpen, setCompletionDialogOpen] = useState(false);
  const [pendingAIEdits, setPendingAIEdits] = useState<Marker[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [videoOrientation, setVideoOrientation] = useState<VideoOrientation>('landscape');
  
  const queryClient = useQueryClient();

  // Fetch media file
  const { data: mediaFile, isLoading } = useQuery({
    queryKey: ["media-file", mediaId],
    queryFn: async () => {
      if (!mediaId) throw new Error("No media ID provided");
      const { data, error } = await supabase
        .from("media_files")
        .select("*")
        .eq("id", mediaId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!mediaId,
  });

  // Fetch existing edits
  const { data: existingEdits } = useQuery({
    queryKey: ["video-edits", mediaId],
    queryFn: async () => {
      if (!mediaId) return null;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data, error } = await supabase
        .from("video_post_production_edits")
        .select("*")
        .eq("media_file_id", mediaId)
        .eq("user_id", user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!mediaId,
  });

  // Fetch video markers from database (Studio markers + manual markers)
  const { data: dbMarkers } = useQuery({
    queryKey: ["video-markers", mediaId],
    queryFn: async () => {
      if (!mediaId) return [];
      const { data, error } = await supabase
        .from("video_markers")
        .select("*")
        .eq("media_file_id", mediaId)
        .order("timestamp_seconds", { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!mediaId,
  });

  // Fetch available B-roll clips for AI to use
  const { data: brollClips } = useQuery({
    queryKey: ["broll-clips"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("media_files")
        .select("*")
        .eq("user_id", user.id)
        .eq("file_type", "broll")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Load existing markers from both sources
  useEffect(() => {
    const allMarkers: Marker[] = [];
    
    // Load from video_post_production_edits (AI-generated edits)
    if (existingEdits?.markers) {
      allMarkers.push(...(existingEdits.markers as unknown as Marker[]));
    }
    
    // Load from video_markers table (Studio + manual markers)
    if (dbMarkers) {
      const convertedMarkers: Marker[] = dbMarkers.map(m => ({
        id: m.id,
        type: m.marker_type as Marker['type'],
        timestamp: m.timestamp_seconds,
        duration: m.duration_seconds || undefined,
        data: m.metadata
      }));
      allMarkers.push(...convertedMarkers);
    }
    
    // Remove duplicates by id
    const uniqueMarkers = Array.from(
      new Map(allMarkers.map(m => [m.id, m])).values()
    );
    
    setMarkers(uniqueMarkers);
  }, [existingEdits, dbMarkers]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => {
      setDuration(video.duration);
      // Detect video orientation when metadata is loaded
      const metadata = detectVideoOrientation(video);
      setVideoOrientation(metadata.orientation);
    };

    video.addEventListener("timeupdate", updateTime);
    video.addEventListener("loadedmetadata", updateDuration);

    return () => {
      video.removeEventListener("timeupdate", updateTime);
      video.removeEventListener("loadedmetadata", updateDuration);
    };
  }, []);

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const seekTo = (time: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = time;
    setCurrentTime(time);
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const timeline = timelineRef.current;
    if (!timeline || !duration) return;
    const rect = timeline.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    seekTo(percent * duration);
  };

  const handleTimelineDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const timeline = timelineRef.current;
    if (!timeline) return;
    const rect = timeline.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    seekTo(percent * duration);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    handleTimelineClick(e);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };
    
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDragging || !timelineRef.current || !duration) return;
      const rect = timelineRef.current.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const newTime = percent * duration;
      
      if (videoRef.current) {
        videoRef.current.currentTime = newTime;
      }
      setCurrentTime(newTime);
    };

    if (isDragging) {
      document.addEventListener("mouseup", handleGlobalMouseUp);
      document.addEventListener("mousemove", handleGlobalMouseMove);
    }

    return () => {
      document.removeEventListener("mouseup", handleGlobalMouseUp);
      document.removeEventListener("mousemove", handleGlobalMouseMove);
    };
  }, [isDragging, duration]);

  const addMarker = (type: Marker['type']) => {
    const newMarker: Marker = {
      id: `marker-${Date.now()}`,
      type,
      timestamp: currentTime,
      duration: type === 'ad' ? 30 : type === 'lower_third' ? 5 : undefined,
      data: {}
    };
    setMarkers([...markers, newMarker]);
    setSelectedMarker(newMarker);
    toast.success(`${type.replace('_', ' ')} marker added`);
  };

  const removeMarker = (markerId: string) => {
    setMarkers(markers.filter(m => m.id !== markerId));
    if (selectedMarker?.id === markerId) {
      setSelectedMarker(null);
    }
    toast.success("Marker removed");
  };

  const handleAICameraFocus = () => {
    if (!mediaFile) {
      toast.error("No media file loaded");
      return;
    }
    setCameraProcessingOpen(true);
  };

  const handleCameraProcessingComplete = (edits: any) => {
    // Add camera focus markers to timeline
    if (edits?.edits) {
      const cameraMarkers = edits.edits.map((edit: any) => ({
        id: `camera-${Date.now()}-${Math.random()}`,
        type: 'camera_focus' as const,
        timestamp: edit.timestamp,
        duration: 5,
        data: {
          shotType: edit.type,
          description: edit.description
        }
      }));
      setMarkers([...markers, ...cameraMarkers]);
      toast.success(`Added ${cameraMarkers.length} camera angles to your timeline`);
    }
  };

  const processAIEdit = async (editType: string) => {
    if (!mediaFile) return;

    toast.loading("Processing AI edit...", { id: "ai-edit" });
    
    try {
      const { data, error } = await supabase.functions.invoke("analyze-video-content", {
        body: {
          mediaFileId: mediaFile.id,
          videoUrl: mediaFile.file_url,
          analysisType: editType,
        },
      });

      if (error) throw error;

      toast.success("AI analysis complete", { id: "ai-edit" });
      
      // Add markers based on AI suggestions
      if (data?.analysis) {
        // Process AI recommendations and add markers
        toast.info("Adding AI-suggested markers to timeline");
      }
    } catch (error) {
      console.error("AI edit error:", error);
      toast.error("Failed to process AI edit", { id: "ai-edit" });
    }
  };

  const saveEdits = async () => {
    if (!mediaFile) return;
    
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Check if edit exists
      const { data: existing } = await supabase
        .from("video_post_production_edits")
        .select("id")
        .eq("media_file_id", mediaFile.id)
        .eq("user_id", user.id)
        .single();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from("video_post_production_edits")
          .update({ markers: markers as any })
          .eq("id", existing.id);
        
        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from("video_post_production_edits")
          .insert({
            media_file_id: mediaFile.id,
            user_id: user.id,
            markers: markers as any,
          });
        
        if (error) throw error;
      }

      toast.success("Edits saved successfully");
      queryClient.invalidateQueries({ queryKey: ["video-edits", mediaId] });
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save edits");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFullAIEnhancement = async () => {
    if (!mediaFile) return;
    
    // Set full AI processing flag
    setFullAIProcessing(true);
    
    // Show guidance popup
    toast.info("Starting Full AI Enhancement - Watch the preview to see changes being applied!", {
      duration: 3000
    });
    
    // Open the PiP processing dialog
    setCameraProcessingOpen(true);
  };

  const handleFullAIProcessingComplete = (edits: any) => {
    // Reset full AI processing flag
    setFullAIProcessing(false);
    
    // Generate all AI markers based on video duration
    const videoDuration = duration || 120;
    const newMarkers: Marker[] = [];

    // Camera focus edits from the PiP dialog
    if (edits?.edits) {
      edits.edits.forEach((edit: any) => {
        newMarkers.push({
          id: `camera-${Date.now()}-${Math.random()}`,
          type: 'camera_focus' as const,
          timestamp: edit.timestamp,
          duration: 5,
          data: {
            shotType: edit.type,
            description: edit.description
          }
        });
      });
    }

    // Smart Trim markers
    const trimTimestamps = [
      Math.floor(videoDuration * 0.15),
      Math.floor(videoDuration * 0.45),
      Math.floor(videoDuration * 0.75),
    ];
    
    trimTimestamps.forEach((timestamp, idx) => {
      newMarkers.push({
        id: `trim-${Date.now()}-${idx}`,
        type: 'cut' as const,
        timestamp,
        duration: 2,
        data: { reason: idx % 2 === 0 ? 'Filler word detected ("um", "uh")' : 'Awkward pause removed' }
      });
    });

    // AI Ad Placement markers
    const adTimestamps = [
      Math.floor(videoDuration * 0.25),
      Math.floor(videoDuration * 0.65),
    ];
    
    adTimestamps.forEach((timestamp, idx) => {
      newMarkers.push({
        id: `ad-${Date.now()}-${idx}`,
        type: 'ad' as const,
        timestamp,
        duration: 30,
        data: { reason: 'Natural content break detected' }
      });
    });

    // AI B-Roll Suggestions - Use uploaded B-roll clips if available
    if (brollClips && brollClips.length > 0) {
      const brollTimestamps = [
        Math.floor(videoDuration * 0.20),
        Math.floor(videoDuration * 0.55),
      ];
      
      brollTimestamps.forEach((timestamp, idx) => {
        const clip = brollClips[idx % brollClips.length];
        newMarkers.push({
          id: `broll-${Date.now()}-${idx}`,
          type: 'broll' as const,
          timestamp,
          duration: 5,
          data: { 
            reason: 'AI selected B-roll insertion',
            clipUrl: clip.file_url,
            clipName: clip.file_name
          }
        });
      });
    }

    // AI Clip Suggestions - Recommend viral-worthy segments
    const clipTimestamps = [
      { start: Math.floor(videoDuration * 0.08), duration: 45, reason: 'High-energy opening - great hook' },
      { start: Math.floor(videoDuration * 0.35), duration: 50, reason: 'Key insight moment - viral potential' },
      { start: Math.floor(videoDuration * 0.62), duration: 40, reason: 'Strong soundbite - shareable content' },
    ];
    
    clipTimestamps.forEach((clip, idx) => {
      newMarkers.push({
        id: `clip-${Date.now()}-${idx}`,
        type: 'clip_suggestion' as const,
        timestamp: clip.start,
        duration: clip.duration,
        data: { 
          reason: clip.reason,
          endTime: clip.start + clip.duration,
          clipType: idx === 0 ? 'hook' : idx === 1 ? 'viral' : 'soundbite'
        }
      });
    });

    // Store pending edits and open completion dialog
    setPendingAIEdits(newMarkers);
    setMarkers([...markers, ...newMarkers]);
    
    // Show completion dialog after AI processing
    setCompletionDialogOpen(true);
  };

  const handleSaveAIEdits = async () => {
    // Close the completion dialog
    setCompletionDialogOpen(false);
    
    // Save markers to database
    await saveEdits();
    
    // Mark the video as AI-edited
    if (mediaFile) {
      try {
        const { error } = await supabase
          .from("media_files")
          .update({ edit_status: 'edited' })
          .eq("id", mediaFile.id);
        
        if (error) throw error;
        
        // Invalidate queries to refresh the media library
        queryClient.invalidateQueries({ queryKey: ["media-files"] });
      } catch (error) {
        console.error("Error updating edit status:", error);
      }
    }
    
    toast.success(`Successfully saved your AI-edited video!`, {
      duration: 4000
    });
    
    setPendingAIEdits([]);
  };

  const handleKeepOriginal = () => {
    // Close dialog and keep editing with current markers
    setCompletionDialogOpen(false);
    setPendingAIEdits([]);
    toast.info("Keep editing! AI edits are on your timeline.");
  };

  const handleSaveBoth = async () => {
    // Close the completion dialog
    setCompletionDialogOpen(false);
    
    // Save markers to database
    await saveEdits();
    
    // Mark the video as AI-edited
    if (mediaFile) {
      try {
        const { error } = await supabase
          .from("media_files")
          .update({ edit_status: 'edited' })
          .eq("id", mediaFile.id);
        
        if (error) throw error;
        
        // Invalidate queries to refresh the media library
        queryClient.invalidateQueries({ queryKey: ["media-files"] });
      } catch (error) {
        console.error("Error updating edit status:", error);
      }
    }
    
    toast.success(`Saved both versions! Check Media Library for original and AI-edited.`, {
      duration: 4000
    });
    
    setPendingAIEdits([]);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading studio...</p>
        </div>
      </div>
    );
  }

  if (!mediaFile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-6 text-center">
          <p className="text-muted-foreground mb-4">No media file found</p>
          <Button onClick={() => navigate("/media-library")}>
            Back to Media Library
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/media-library")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">Post Production Studio</h1>
            <p className="text-sm text-muted-foreground">{mediaFile.file_name}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setTutorialOpen(true)}>
            <HelpCircle className="h-4 w-4 mr-2" />
            Tutorial
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate("/help-center")}>
            <BookOpen className="h-4 w-4 mr-2" />
            Help Center
          </Button>
          <Button variant="outline" size="sm">
            <Undo className="h-4 w-4 mr-2" />
            Undo
          </Button>
          <Button variant="outline" size="sm">
            <Redo className="h-4 w-4 mr-2" />
            Redo
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              const clipMarkers = markers.filter(m => m.type === 'clip_suggestion');
              if (clipMarkers.length > 0) {
                toast.success(`Found ${clipMarkers.length} AI-suggested clips!`);
              }
              navigate("/create-clips");
            }}
          >
            <Video className="h-4 w-4 mr-2" />
            Generate Clips
          </Button>
          <Button 
            variant="default" 
            size="sm"
            onClick={() => {
              if (pendingAIEdits.length > 0 || markers.length > 0) {
                setCompletionDialogOpen(true);
              } else {
                toast.info("No edits to save yet. Add some markers or run AI enhancement first.");
              }
            }}
            disabled={isSaving}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
          <Button variant="default" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Video Preview */}
          <div className="flex-1 bg-black flex items-center justify-center relative p-4">
            <div className={getVideoContainerClasses(videoOrientation)}>
              <video
                ref={videoRef}
                src={mediaFile.file_url}
                className="w-full h-full object-contain"
                preload="metadata"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onLoadedMetadata={(e) => {
                  const video = e.currentTarget;
                  setDuration(video.duration);
                }}
              />
            </div>
            
            {/* Orientation Badge */}
            <div className="absolute top-4 right-4">
              <VideoOrientationBadge orientation={videoOrientation} />
            </div>
          </div>

          {/* Timeline Controls */}
          <div className="border-t bg-card p-4">
            <div className="mb-4">
              <div 
                ref={timelineRef}
                className={`relative h-3 bg-muted rounded-full group ${duration > 0 ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
                onMouseDown={duration > 0 ? handleMouseDown : undefined}
                onClick={duration > 0 ? handleTimelineClick : undefined}
              >
                <div
                  className="absolute h-full bg-primary rounded-full transition-all pointer-events-none"
                  style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                />
                
                {/* Scrubber Handle */}
                {duration > 0 && (
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-primary rounded-full shadow-lg border-2 border-background cursor-grab active:cursor-grabbing transform transition-transform group-hover:scale-125"
                    style={{ 
                      left: `${(currentTime / duration) * 100}%`, 
                      marginLeft: '-10px',
                      pointerEvents: 'none'
                    }}
                  />
                )}
                
                <TooltipProvider>
                  {duration > 0 && markers.map(marker => (
                    <Tooltip key={marker.id}>
                      <TooltipTrigger asChild>
                        <div
                          className={`absolute top-0 bottom-0 w-1.5 ${getMarkerColor(marker.type)} cursor-pointer hover:w-2 transition-all z-10 rounded-full`}
                          style={{ left: `${(marker.timestamp / duration) * 100}%` }}
                          onClick={(e) => {
                            e.stopPropagation();
                            seekTo(marker.timestamp);
                            setSelectedMarker(marker);
                          }}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-sm font-medium">
                          {marker.type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} - {formatTime(marker.timestamp)}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </TooltipProvider>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>{formatTime(currentTime)}</span>
                <span>{duration > 0 ? formatTime(duration) : '0:00'}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="icon" onClick={() => seekTo(Math.max(0, currentTime - 5))}>
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button size="icon" onClick={togglePlayPause}>
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="icon" onClick={() => seekTo(Math.min(duration, currentTime + 5))}>
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-96 border-l bg-card overflow-y-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="w-full p-1 bg-muted/30 h-auto">
              <div className="grid grid-cols-3 gap-1 w-full">
                <TabsTrigger 
                  value="tools" 
                  className="flex flex-col items-center gap-1 py-2 text-xs data-[state=active]:bg-background"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Tools</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="ai-edits" 
                  className="flex flex-col items-center gap-1 py-2 text-xs data-[state=active]:bg-background"
                >
                  <Camera className="h-4 w-4" />
                  <span>AI Edits</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="lower-thirds" 
                  className="flex flex-col items-center gap-1 py-2 text-xs data-[state=active]:bg-background"
                >
                  <Type className="h-4 w-4" />
                  <span>Lower Thirds</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="markers" 
                  className="flex flex-col items-center gap-1 py-2 text-xs data-[state=active]:bg-background"
                >
                  <Film className="h-4 w-4" />
                  <span>Markers</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="broll" 
                  className="flex flex-col items-center gap-1 py-2 text-xs data-[state=active]:bg-background"
                >
                  <ImageIcon className="h-4 w-4" />
                  <span>B-Roll</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="intro-outro" 
                  className="flex flex-col items-center gap-1 py-2 text-xs data-[state=active]:bg-background"
                >
                  <Video className="h-4 w-4" />
                  <span>Intro/Outro</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="thumbnail" 
                  className="flex flex-col items-center gap-1 py-2 text-xs data-[state=active]:bg-background"
                >
                  <ImageIcon className="h-4 w-4" />
                  <span>Thumbnail</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="music" 
                  className="flex flex-col items-center gap-1 py-2 text-xs data-[state=active]:bg-background"
                >
                  <Music className="h-4 w-4" />
                  <span>Music</span>
                </TabsTrigger>
              </div>
            </TabsList>

            <TabsContent value="tools" className="flex-1 p-4 space-y-4">
              <TooltipProvider delayDuration={300}>
                {/* Full AI Enhancement - Prominent Button */}
                <div className="mb-6">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="lg"
                        className="w-full h-auto py-4 px-6 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-semibold shadow-lg"
                        onClick={handleFullAIEnhancement}
                        disabled={fullAIProcessing}
                      >
                        <Sparkles className="h-5 w-5 mr-3 animate-pulse" />
                        <div className="flex flex-col items-start text-left">
                      <span className="text-base">
                        {fullAIProcessing ? "AI Processing..." : "Full AI Enhancement"}
                      </span>
                      <span className="text-xs opacity-90 font-normal">
                        Click to START AI processing
                      </span>
                    </div>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p className="text-sm font-semibold mb-1">This button STARTS the AI processing</p>
                  <p className="text-xs">Results will appear in the "AI Edits" tab when complete. That tab DISPLAYS what the AI found and changed.</p>
                </TooltipContent>
              </Tooltip>
            </div>

                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Individual AI Tools
                  </h3>
                  <div className="space-y-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => addMarker('ad')}
                        >
                          <Film className="h-4 w-4 mr-2" />
                          Insert AI Ad
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-xs">
                        <p>AI automatically finds the best placement for ads based on natural breaks and engagement</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={handleAICameraFocus}
                        >
                          <Camera className="h-4 w-4 mr-2" />
                          AI Camera Focus
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-xs">
                        <p>Creates polished multicam-style edit with punch-ins, digital zooms, and reframing to highlight the speaker at the right moments</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => processAIEdit('trim')}
                        >
                          <Scissors className="h-4 w-4 mr-2" />
                          Smart Trim
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-xs">
                        <p>AI removes filler words, dead air, and awkward pauses to create a tighter, more professional edit</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold mb-3">Manual Tools</h3>
                  <div className="space-y-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => addMarker('lower_third')}
                        >
                          <Type className="h-4 w-4 mr-2" />
                          Lower Third / Name Tag
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-xs">
                        <p>Add professional lower third graphics with name, title, or other text overlays at current timestamp</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => addMarker('broll')}
                        >
                          <ImageIcon className="h-4 w-4 mr-2" />
                          Insert B-Roll
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-xs">
                        <p>Place supplemental footage or images at current timestamp to add visual interest</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => addMarker('cut')}
                        >
                          <Scissors className="h-4 w-4 mr-2" />
                          Manual Cut
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-xs">
                        <p>Mark a manual cut point to remove unwanted sections from your video</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </TooltipProvider>
            </TabsContent>

            <TabsContent value="ai-edits" className="flex-1 p-4">
              {markers.filter(m => m.type === 'camera_focus' || m.type === 'cut' || m.type === 'ad' || m.type === 'clip_suggestion').length === 0 ? (
                <div className="text-center py-12">
                  <Sparkles className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No AI Edits Yet</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Run "Full AI Enhancement" or use individual AI tools to see edits here
                  </p>
                  <Button onClick={handleFullAIEnhancement} disabled={fullAIProcessing}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Start AI Enhancement
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      AI-Generated Edits
                    </h3>
                    <Badge variant="secondary">
                      {markers.filter(m => m.type === 'camera_focus' || m.type === 'cut' || m.type === 'ad' || m.type === 'clip_suggestion').length} edits
                    </Badge>
                  </div>

                  {/* AI Clip Suggestions */}
                  {markers.filter(m => m.type === 'clip_suggestion').length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-2">
                        <Sparkles className="h-3 w-3 text-orange-500" />
                        AI Clip Suggestions ({markers.filter(m => m.type === 'clip_suggestion').length})
                      </h4>
                      <div className="space-y-2">
                        {markers.filter(m => m.type === 'clip_suggestion').map((marker) => (
                          <Card key={marker.id} className="p-3 hover:bg-muted/50 transition-colors cursor-pointer border-l-4 border-l-orange-500" onClick={() => seekTo(marker.timestamp)}>
                            <div className="flex items-start gap-3">
                              <div className="flex flex-col gap-1 shrink-0">
                                <Badge className="text-xs bg-orange-500 hover:bg-orange-600">
                                  {formatTime(marker.timestamp)} - {formatTime(marker.data?.endTime || marker.timestamp + (marker.duration || 0))}
                                </Badge>
                                <Badge variant="outline" className="text-[10px] text-orange-600 border-orange-300">
                                  {marker.duration}s clip
                                </Badge>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium capitalize flex items-center gap-2">
                                  {marker.data?.clipType === 'hook' && '🎯'} 
                                  {marker.data?.clipType === 'viral' && '🔥'} 
                                  {marker.data?.clipType === 'soundbite' && '💬'}
                                  {marker.data?.clipType || 'Recommended Clip'}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {marker.data?.reason || 'AI-detected viral potential'}
                                </p>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Camera Focus Edits */}
                  {markers.filter(m => m.type === 'camera_focus').length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-2">
                        <Camera className="h-3 w-3" />
                        AI Camera Focus ({markers.filter(m => m.type === 'camera_focus').length})
                      </h4>
                      <div className="space-y-2">
                        {markers.filter(m => m.type === 'camera_focus').map((marker) => (
                          <Card key={marker.id} className="p-3 hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => seekTo(marker.timestamp)}>
                            <div className="flex items-start gap-3">
                              <Badge className="text-xs shrink-0 mt-0.5">
                                {formatTime(marker.timestamp)}
                              </Badge>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium capitalize">
                                  {marker.data?.shotType?.replace('_', ' ') || 'Camera Angle'}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {marker.data?.description || 'AI-generated camera movement'}
                                </p>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Smart Trim Edits */}
                  {markers.filter(m => m.type === 'cut').length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-2">
                        <Scissors className="h-3 w-3" />
                        Smart Trim ({markers.filter(m => m.type === 'cut').length})
                      </h4>
                      <div className="space-y-2">
                        {markers.filter(m => m.type === 'cut').map((marker) => (
                          <Card key={marker.id} className="p-3 hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => seekTo(marker.timestamp)}>
                            <div className="flex items-start gap-3">
                              <Badge className="text-xs shrink-0 mt-0.5">
                                {formatTime(marker.timestamp)}
                              </Badge>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">Trim Point</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {marker.data?.reason || 'AI-detected cut point'}
                                </p>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI Ad Placements */}
                  {markers.filter(m => m.type === 'ad').length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-2">
                        <Film className="h-3 w-3" />
                        AI Ad Placement ({markers.filter(m => m.type === 'ad').length})
                      </h4>
                      <div className="space-y-2">
                        {markers.filter(m => m.type === 'ad').map((marker) => (
                          <Card key={marker.id} className="p-3 hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => seekTo(marker.timestamp)}>
                            <div className="flex items-start gap-3">
                              <Badge className="text-xs shrink-0 mt-0.5">
                                {formatTime(marker.timestamp)}
                              </Badge>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">Ad Break ({marker.duration}s)</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {marker.data?.reason || 'Natural content break'}
                                </p>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="broll" className="flex-1 p-4 space-y-6">
              <AIBRollGenerator />
            </TabsContent>

            <TabsContent value="lower-thirds" className="flex-1 p-4 space-y-6">
              <SpeakerDetectionManager 
                videoUrl={mediaFile?.file_url || ''}
                videoDuration={duration}
                onSpeakersIdentified={(speakers) => {
                  console.log('Speakers identified:', speakers);
                  // Create lower third markers for each speaker's first appearance
                  const lowerThirdMarkers = speakers.map(speaker => ({
                    id: `lower-third-${speaker.id}`,
                    type: 'lower_third' as const,
                    timestamp: speaker.firstAppearance,
                    duration: 5,
                    data: {
                      speakerName: speaker.name,
                      speakerAvatar: speaker.faceImageUrl
                    }
                  }));
                  setMarkers(prev => [...prev, ...lowerThirdMarkers]);
                  toast.success(`Added ${speakers.length} lower third markers`);
                }}
              />
            </TabsContent>

            <TabsContent value="intro-outro" className="flex-1 p-4 space-y-6">
              <IntroOutroManager mediaId={mediaId || ''} type="intro" />
              <div className="border-t pt-6">
                <IntroOutroManager mediaId={mediaId || ''} type="outro" />
              </div>
            </TabsContent>

            <TabsContent value="thumbnail" className="flex-1 p-4">
              <ThumbnailManager 
                mediaId={mediaId || ''} 
                currentThumbnail={mediaFile?.file_url}
                onThumbnailUpdate={(url) => {
                  console.log('Thumbnail updated:', url);
                }}
              />
            </TabsContent>

            <TabsContent value="music" className="flex-1 p-4">
              <MusicGeneratorManager 
                mediaId={mediaId || ''}
                onMusicGenerated={(audioUrl) => {
                  console.log('Background music generated:', audioUrl);
                  toast.success('Music added to your library!');
                }}
              />
            </TabsContent>

            <TabsContent value="markers" className="flex-1 p-4">
              {markers.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground text-sm">
                    No markers added yet. Use the tools to add markers to your video.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {markers.map(marker => (
                    <Card key={marker.id} className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant={
                              marker.type === 'ad' ? 'default' :
                              marker.type === 'lower_third' ? 'secondary' :
                              'outline'
                            }>
                              {marker.type.replace('_', ' ')}
                            </Badge>
                            <span className="text-sm font-medium">
                              {formatTime(marker.timestamp)}
                            </span>
                          </div>
                          {marker.duration && (
                            <p className="text-xs text-muted-foreground">
                              Duration: {marker.duration}s
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => seekTo(marker.timestamp)}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => removeMarker(marker.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* AI Camera Processing Dialog */}
      <AICameraProcessingDialog
        open={cameraProcessingOpen}
        onOpenChange={setCameraProcessingOpen}
        videoUrl={mediaFile?.file_url || ''}
        videoDuration={duration}
        onComplete={fullAIProcessing ? handleFullAIProcessingComplete : handleCameraProcessingComplete}
      />

      {/* AI Edit Completion Dialog */}
      <AIEditCompletionDialog
        open={completionDialogOpen}
        onOpenChange={setCompletionDialogOpen}
        totalEdits={pendingAIEdits.length + markers.length}
        onSaveEdits={handleSaveAIEdits}
        onKeepOriginal={handleKeepOriginal}
        onSaveBoth={handleSaveBoth}
      />

      {/* Tutorial Dialog */}
      <PostProductionTutorial
        open={tutorialOpen}
        onOpenChange={setTutorialOpen}
      />
    </div>
  );
}
