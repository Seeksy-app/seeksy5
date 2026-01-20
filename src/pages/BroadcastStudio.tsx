import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useVoiceFingerprint } from "@/hooks/useVoiceFingerprint";
import { Button } from "@/components/ui/button";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BroadcastTimeline } from "@/components/studio-broadcast/BroadcastTimeline";
import { ChannelsDialog } from "@/components/studio-broadcast/ChannelsDialog";
import { AdIntegrationPanel } from "@/components/studio-broadcast/AdIntegrationPanel";
import { AIToolsPanel } from "@/components/studio-broadcast/AIToolsPanel";
import { StudioLeftSidebar } from "@/components/studio/StudioLeftSidebar";
import { StudioRightSidebar } from "@/components/studio-broadcast/StudioRightSidebar";
import { SceneDialog } from "@/components/studio-broadcast/SceneDialog";
import { Video, Mic, MicOff, VideoOff, Monitor, UserPlus, Radio, ArrowLeft, DollarSign, Scissors, Plus, Settings, Film, FileText, Users, Youtube, Music } from "lucide-react";
import { cn } from "@/lib/utils";

export default function BroadcastStudio() {
  const { id: sessionId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { captureVoiceFingerprint, isCapturing: isCapturingFingerprint } = useVoiceFingerprint();

  // Broadcast State
  const [broadcastId, setBroadcastId] = useState<string | null>(null);
  const [voiceFingerprintId, setVoiceFingerprintId] = useState<string | null>(null);
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [isLive, setIsLive] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);

  // Media Controls
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [micEnabled, setMicEnabled] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // Timeline
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Multi-Platform Settings
  const [audioOnlyMode, setAudioOnlyMode] = useState(false);
  const [platforms, setPlatforms] = useState({
    myPage: { enabled: true, paired: true, title: 'My Page', icon: 'Users' },
    youtube: { enabled: false, paired: false, title: 'YouTube', icon: 'Youtube' },
    spotify: { enabled: false, paired: false, title: 'Spotify', icon: 'Music' }
  });
  const [showChannelsDialog, setShowChannelsDialog] = useState(false);
  
  // Host Read Script
  const [showHostScript, setShowHostScript] = useState(false);
  const [currentScript, setCurrentScript] = useState("");
  
  // Scene Dialog
  const [showSceneDialog, setShowSceneDialog] = useState(false);

  // AI Features
  const [aiFeatures, setAIFeatures] = useState({
    liveTranscription: true,
    noiseReduction: true,
    chapterDetection: true,
    autoIntroOutro: false
  });

  // Data
  const [markers, setMarkers] = useState<any[]>([]);
  const [adSlots, setAdSlots] = useState<any[]>([]);
  const [transcriptions, setTranscriptions] = useState<any[]>([]);
  const [clipSuggestions, setClipSuggestions] = useState<any[]>([]);

  useEffect(() => {
    checkAuth();
    loadBroadcastData();
    startPreview();

    return () => {
      stopAllStreams();
    };
  }, [sessionId]);

  useEffect(() => {
    if (isLive) {
      const timer = setInterval(() => {
        setCurrentTime(prev => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isLive]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/');
      return;
    }
  };

  const loadBroadcastData = async () => {
    if (!sessionId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      
      if (!uuidRegex.test(sessionId)) {
        // Invalid UUID - create a new session with required daily_room_url
        const { data: newSession, error: sessionError } = await supabase
          .from('studio_sessions')
          .insert({
            user_id: user.id,
            room_name: broadcastTitle || 'New Broadcast',
            daily_room_url: `https://broadcast.seeksy.live/${Date.now()}`,
            status: 'active'
          })
          .select()
          .single();

        if (sessionError || !newSession) {
          console.error('Error creating session:', sessionError);
          toast({
            title: "Error",
            description: "Failed to create broadcast session",
            variant: "destructive"
          });
          return;
        }

        // Navigate to the new session
        navigate(`/broadcast/${newSession.id}`, { replace: true });
        return;
      }

      // Load existing session
      const { data: session } = await supabase
        .from('studio_sessions')
        .select('*')
        .eq('id', sessionId)
        .maybeSingle();

      if (session) {
        setBroadcastTitle(session.room_name || 'Untitled Broadcast');

        // Check for existing broadcast
        const { data: broadcast } = await supabase
          .from('studio_broadcasts')
          .select('*')
          .eq('session_id', sessionId)
          .eq('is_live', true)
          .maybeSingle();

        if (broadcast) {
          setBroadcastId(broadcast.id);
          setIsLive(broadcast.is_live);
          loadBroadcastContent(broadcast.id);
        }
      }
    } catch (error) {
      console.error('Error loading broadcast:', error);
      toast({
        title: "Error",
        description: "Failed to load broadcast data",
        variant: "destructive"
      });
    }
  };

  const loadBroadcastContent = async (broadcastId: string) => {
    try {
      // Load markers
      const { data: markersData } = await supabase
        .from('studio_timeline_markers')
        .select('*')
        .eq('broadcast_id', broadcastId)
        .order('timestamp_seconds');
      
      if (markersData) setMarkers(markersData);

      // Load ad slots
      const { data: adSlotsData } = await supabase
        .from('studio_ad_slots')
        .select('*, assigned_campaign:ad_campaigns(*)')
        .eq('broadcast_id', broadcastId);
      
      if (adSlotsData) setAdSlots(adSlotsData);

      // Load transcriptions
      const { data: transcriptData } = await supabase
        .from('studio_ai_transcriptions')
        .select('*')
        .eq('broadcast_id', broadcastId)
        .order('timestamp_seconds');
      
      if (transcriptData) setTranscriptions(transcriptData);

      // Load clip suggestions
      const { data: clipsData } = await supabase
        .from('studio_clip_suggestions')
        .select('*')
        .eq('broadcast_id', broadcastId)
        .eq('accepted', false);
      
      if (clipsData) setClipSuggestions(clipsData);

    } catch (error) {
      console.error('Error loading broadcast content:', error);
    }
  };

  const startPreview = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      streamRef.current = stream;
      
      // Start with both enabled for preview
      setCameraEnabled(true);
      setMicEnabled(true);
      
      // Initialize MediaRecorder for capturing
      if (stream) {
        const options = { mimeType: 'video/webm;codecs=vp9,opus' };
        mediaRecorderRef.current = new MediaRecorder(stream, options);
        
        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            setRecordedChunks(prev => [...prev, event.data]);
          }
        };
      }
    } catch (error) {
      console.error('Error starting preview:', error);
      toast({
        title: "Camera/Mic Access",
        description: "Could not access camera or microphone",
        variant: "destructive"
      });
    }
  };

  const stopAllStreams = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const toggleCamera = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCameraEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleMicrophone = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicEnabled(audioTrack.enabled);
      }
    }
  };

  const shareScreen = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = screenStream;
      }
      
      setScreenSharing(true);

      screenStream.getVideoTracks()[0].onended = () => {
        setScreenSharing(false);
        startPreview();
      };
    } catch (error) {
      console.error('Error sharing screen:', error);
      toast({
        title: "Screen Share Failed",
        description: "Could not start screen sharing",
        variant: "destructive"
      });
    }
  };

  const handleGoLive = async () => {
    if (!sessionId) {
      toast({
        title: "Error",
        description: "No session ID found",
        variant: "destructive"
      });
      return;
    }

    setIsPreparing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to broadcast",
          variant: "destructive"
        });
        return;
      }

      // Check if media stream is ready
      if (!streamRef.current) {
        toast({
          title: "Error",
          description: "Camera/microphone not ready. Please allow access.",
          variant: "destructive"
        });
        return;
      }

      // Create broadcast record
      const { data: newBroadcast, error: broadcastError } = await supabase
        .from('studio_broadcasts')
        .insert({
          session_id: sessionId,
          user_id: user.id,
          title: broadcastTitle || 'Untitled Broadcast',
          is_live: true,
          started_at: new Date().toISOString(),
          broadcast_to_my_page: platforms.myPage.enabled,
          broadcast_to_youtube: platforms.youtube.enabled,
          broadcast_to_spotify: platforms.spotify.enabled,
          audio_only_mode: audioOnlyMode
        })
        .select()
        .single();

      if (broadcastError) {
        console.error('Broadcast creation error:', broadcastError);
        throw new Error(broadcastError.message || 'Failed to create broadcast');
      }

      if (!newBroadcast) {
        throw new Error('No broadcast data returned');
      }

      setBroadcastId(newBroadcast.id);
      setIsLive(true);
      setCurrentTime(0);
      setRecordedChunks([]); // Reset chunks

      // Update profile to show live on My Page
      if (platforms.myPage.enabled) {
        await supabase
          .from('profiles')
          .update({
            is_live_on_profile: true,
            live_stream_title: broadcastTitle || 'Untitled Broadcast',
            live_video_url: 'live' // Placeholder - in production this would be actual stream URL
          })
          .eq('id', user.id);
      }

      // Capture voice fingerprint at start of broadcast
      if (streamRef.current) {
        try {
          const fingerprint = await captureVoiceFingerprint(
            streamRef.current,
            'livestream',
            newBroadcast.id,
            10 // 10-second capture during broadcast start
          );
          setVoiceFingerprintId(fingerprint.id);
          
          console.log('Voice fingerprint captured:', fingerprint.id);
        } catch (fpError) {
          console.error('Voice fingerprint capture failed:', fpError);
          // Continue broadcast even if fingerprint fails
        }
      }

      // Start recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'inactive') {
        try {
          mediaRecorderRef.current.start(1000); // Capture data every second
        } catch (recError) {
          console.error('Recording start error:', recError);
        }
      }

      toast({
        title: "🎉 You're Live!",
        description: "Broadcasting to My Page. Voice authentication active.",
      });

      // Start real-time features
      subscribeToChat(newBroadcast.id);
      
    } catch (error: any) {
      console.error('Error going live:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to start broadcast",
        variant: "destructive"
      });
    } finally {
      setIsPreparing(false);
    }
  };

  const handleStopBroadcast = async () => {
    if (!broadcastId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Stop the broadcast
      await supabase
        .from('studio_broadcasts')
        .update({
          is_live: false,
          ended_at: new Date().toISOString()
        })
        .eq('id', broadcastId);

      // Update profile to remove live status
      await supabase
        .from('profiles')
        .update({
          is_live_on_profile: false,
          live_stream_title: null,
          live_video_url: null
        })
        .eq('id', user.id);

      setIsLive(false);
      
      toast({
        title: "Processing broadcast...",
        description: "Saving recording and generating clips"
      });

      // Save recording to media library with markers and metadata
      const recordingBlob = await captureRecording();
      if (recordingBlob && streamRef.current) {
        const fileName = `broadcast-${broadcastTitle || 'recording'}-${Date.now()}.webm`;
        
        // Upload to Supabase Storage
        const filePath = `${user.id}/${fileName}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('media')
          .upload(filePath, recordingBlob);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('media')
          .getPublicUrl(filePath);

        // Create media file record with broadcast metadata
        const { data: mediaFile, error: mediaError } = await supabase
          .from('media_files')
          .insert({
            user_id: user.id,
            file_url: publicUrl,
            file_name: fileName,
            file_type: 'video/webm',
            duration_seconds: currentTime,
            file_size_bytes: recordingBlob.size,
            broadcast_id: broadcastId,
            metadata: {
              broadcast_title: broadcastTitle,
              platforms: platforms,
              markers: markers,
              transcriptions: transcriptions,
              clip_suggestions: clipSuggestions
            }
          })
          .select()
          .single();

        if (mediaError) throw mediaError;

        // Auto-generate clips from AI suggestions
        if (clipSuggestions.length > 0) {
          await generateClipsWithText(mediaFile.id, clipSuggestions, transcriptions);
        }

        // Auto-transcription (if enabled)
        const { data: preferences } = await supabase
          .from('user_preferences')
          .select('auto_transcribe_enabled')
          .eq('user_id', user.id)
          .single();

        if (preferences?.auto_transcribe_enabled) {
          supabase.functions.invoke('transcribe-audio', {
            body: {
              asset_id: mediaFile.id,
              audio_url: publicUrl,
              language: 'en',
              source_type: 'video_recording',
            },
          }).then(({ data, error }) => {
            if (error) {
              console.error('Transcription error:', error);
            } else {
              console.log('Transcription started:', data);
            }
          });
        }

        toast({
          title: "Broadcast Saved! 🎉",
          description: `Recording and ${clipSuggestions.length} clips saved to Media Library`,
          duration: 5000
        });

        // Navigate to media library
        setTimeout(() => {
          navigate(`/media-library`);
        }, 2000);
      }
    } catch (error) {
      console.error('Error stopping broadcast:', error);
      toast({
        title: "Error",
        description: "Failed to save broadcast",
        variant: "destructive"
      });
    }
  };

  const captureRecording = async (): Promise<Blob | null> => {
    if (recordedChunks.length === 0) return null;
    
    // Stop the MediaRecorder if still recording
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    // Create blob from recorded chunks
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    return blob;
  };

  const generateClipsWithText = async (
    mediaFileId: string,
    suggestions: any[],
    transcripts: any[]
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      for (const suggestion of suggestions) {
        const startTime = suggestion.start_timestamp_seconds;
        const endTime = suggestion.end_timestamp_seconds;
        
        // Get transcription text for this time range
        const clipTranscripts = transcripts.filter(t => 
          t.timestamp_seconds >= startTime && 
          t.timestamp_seconds <= endTime
        );
        const transcriptText = clipTranscripts.map(t => t.text).join(' ');

        // Create clip record with text overlay
        await supabase
          .from('media_clips')
          .insert({
            user_id: user.id,
            source_media_id: mediaFileId,
            title: suggestion.title || `Clip: ${suggestion.reason}`,
            start_time: startTime,
            end_time: endTime,
            duration_seconds: endTime - startTime,
            clip_type: 'ai_generated',
            text_overlay: transcriptText,
            metadata: {
              reason: suggestion.reason,
              engagement_score: suggestion.engagement_score,
              has_captions: true
            }
          });
      }

      console.log(`Generated ${suggestions.length} clips with text overlays`);
    } catch (error) {
      console.error('Error generating clips:', error);
    }
  };

  const subscribeToChat = (broadcastId: string) => {
    // Subscribe to real-time chat messages
    const channel = supabase
      .channel(`broadcast:${broadcastId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'studio_live_chat',
          filter: `broadcast_id=eq.${broadcastId}`
        },
        (payload) => {
          console.log('New chat message:', payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleAddMarker = async (type: any, timestamp: number) => {
    if (!broadcastId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('studio_timeline_markers')
        .insert({
          broadcast_id: broadcastId,
          user_id: user.id,
          marker_type: type,
          timestamp_seconds: Math.floor(timestamp),
          triggered: false,
          completed: false
        })
        .select()
        .single();

      if (error) throw error;
      if (data) setMarkers(prev => [...prev, data]);

      toast({
        title: "Marker Added",
        description: `${type} marker added at ${Math.floor(timestamp)}s`,
        duration: 2000
      });
    } catch (error) {
      console.error('Error adding marker:', error);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top Bar */}
      <div className="h-16 border-b border-border flex items-center justify-between px-4 bg-card">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/studio')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-lg font-semibold">{broadcastTitle || 'Broadcast Studio'}</h1>
            <p className="text-xs text-muted-foreground">Multi-Platform Live Streaming</p>
          </div>
        </div>
        
        {/* Channels & Go Live Section */}
        <div className="flex items-center gap-3">
          {/* Active Channel Icons */}
          {Object.entries(platforms)
            .filter(([_, p]) => p.enabled)
            .map(([key, platform]) => {
              const iconMap: Record<string, any> = { Users, Youtube, Music };
              const Icon = iconMap[platform.icon] || Radio;
              return (
                <div key={key} className="flex items-center gap-1">
                  <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                </div>
              );
            })}
          
          {/* Channels Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowChannelsDialog(true)}
            disabled={isLive}
          >
            <Settings className="h-4 w-4 mr-2" />
            Channels
            <Badge variant="secondary" className="ml-2 text-xs">
              {Object.values(platforms).filter(p => p.enabled).length} of {Object.keys(platforms).length}
            </Badge>
          </Button>

          {/* Go Live Button */}
          {!isLive ? (
            <Button
              onClick={handleGoLive}
              disabled={isPreparing || Object.values(platforms).filter(p => p.enabled).length === 0}
              className="bg-red-600 hover:bg-red-700 text-white"
              size="lg"
            >
              <Radio className="h-5 w-5 mr-2" />
              GO LIVE
            </Button>
          ) : (
            <Button
              onClick={handleStopBroadcast}
              variant="destructive"
              size="lg"
            >
              STOP BROADCAST
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Left Sidebar - Scenes */}
        <ResizablePanel defaultSize={18} minSize={15} maxSize={22}>
          <div className="h-full p-4 space-y-3 overflow-y-auto bg-card/50">
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => setShowSceneDialog(true)}
            >
              <Plus className="h-4 w-4" />
              Add Scene
            </Button>
            
            <div className="space-y-2">
              <div className="text-xs font-semibold text-muted-foreground mb-2">Scenes</div>
              {['Welcome', 'Demo'].map((scene) => (
                <Card key={scene} className="p-3 hover:bg-accent cursor-pointer transition-colors">
                  <div className="text-sm font-medium">{scene}</div>
                  <div className="text-xs text-muted-foreground mt-1">720p</div>
                </Card>
              ))}
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle />

        {/* Main Content - Video Preview */}
        <ResizablePanel defaultSize={77} minSize={55}>
          <div className="h-full flex flex-col">
          {/* Video Preview */}
          <div className="h-[calc(100vh-220px)] bg-black relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-contain"
              />
              
              {/* Resolution Badge */}
              <div className="absolute top-4 left-4">
                <Badge variant="secondary" className="bg-black/60 backdrop-blur-sm">
                  1080p
                </Badge>
              </div>

              {/* Marker Buttons - Above Controls - More Visible */}
              <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-3">
                <Button
                  size="lg"
                  variant="secondary"
                  className="bg-gradient-to-r from-blue-600/90 to-blue-700/90 hover:from-blue-700 hover:to-blue-800 backdrop-blur-md border border-white/20 shadow-lg gap-2 px-4 py-2 text-white"
                  onClick={() => handleAddMarker('broll', currentTime)}
                  disabled={!isLive}
                >
                  <Film className="h-5 w-5" />
                  <span className="text-sm font-semibold">B-roll</span>
                </Button>
                <Button
                  size="lg"
                  variant="secondary"
                  className="bg-gradient-to-r from-purple-600/90 to-purple-700/90 hover:from-purple-700 hover:to-purple-800 backdrop-blur-md border border-white/20 shadow-lg gap-2 px-4 py-2 text-white"
                  onClick={() => handleAddMarker('clip', currentTime)}
                  disabled={!isLive}
                >
                  <Scissors className="h-5 w-5" />
                  <span className="text-sm font-semibold">Clip</span>
                </Button>
                <Button
                  size="lg"
                  variant="secondary"
                  className="bg-gradient-to-r from-green-600/90 to-green-700/90 hover:from-green-700 hover:to-green-800 backdrop-blur-md border border-white/20 shadow-lg gap-2 px-4 py-2 text-white"
                  onClick={() => handleAddMarker('ad', currentTime)}
                  disabled={!isLive}
                >
                  <DollarSign className="h-5 w-5" />
                  <span className="text-sm font-semibold">Ad</span>
                </Button>
                <Button
                  size="lg"
                  variant="secondary"
                  className="bg-gradient-to-r from-orange-600/90 to-orange-700/90 hover:from-orange-700 hover:to-orange-800 backdrop-blur-md border border-white/20 shadow-lg gap-2 px-4 py-2 text-white"
                  onClick={() => {
                    setCurrentScript("This is your host-read ad script. Read this to your audience during the live broadcast.");
                    setShowHostScript(true);
                  }}
                  disabled={!isLive}
                >
                  <FileText className="h-5 w-5" />
                  <span className="text-sm font-semibold">Script</span>
                </Button>
              </div>

              {/* Control Bar (Bottom) */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/80 backdrop-blur-sm rounded-lg p-2">
                <Button
                  size="sm"
                  variant={micEnabled ? "ghost" : "destructive"}
                  onClick={toggleMicrophone}
                  className="hover:bg-white/10"
                >
                  {micEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                </Button>
                <Button
                  size="sm"
                  variant={cameraEnabled ? "ghost" : "destructive"}
                  onClick={toggleCamera}
                  className="hover:bg-white/10"
                >
                  {cameraEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                </Button>
                <Button size="sm" variant="ghost" onClick={shareScreen} className="hover:bg-white/10">
                  <Monitor className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" className="hover:bg-white/10">
                  <UserPlus className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" className="hover:bg-white/10">
                  <Plus className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" className="hover:bg-white/10">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Timeline */}
            <div className="p-4 border-t border-border bg-card/50">
              <BroadcastTimeline
                broadcastId={broadcastId || ''}
                currentTime={currentTime}
                duration={isLive ? currentTime + 300 : duration}
                isPlaying={isLive}
                markers={markers}
                onTimeSeek={(time) => setCurrentTime(time)}
                onPlayPause={() => setIsPlaying(!isPlaying)}
                onAddMarker={handleAddMarker}
                onMarkerClick={(marker) => setCurrentTime(marker.timestamp_seconds)}
              />
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle />

        {/* Right Sidebar - Studio Tools */}
        <ResizablePanel defaultSize={6} minSize={5} maxSize={8}>
          <StudioRightSidebar
            broadcastId={broadcastId || ''}
            sessionId={sessionId || ''}
            onAddMedia={(type) => {
              toast({
                title: "Add Media",
                description: `Add ${type} to your stream`,
                duration: 2000
              });
            }}
            onAddCaption={(type) => {
              toast({
                title: "Add Caption",
                description: `Add ${type} caption`,
                duration: 2000
              });
            }}
            onThemeChange={(theme) => {
              toast({
                title: "Theme Changed",
                description: `Switched to ${theme} theme`,
                duration: 2000
              });
            }}
            onVideoAdSelect={(ad) => {
              toast({
                title: "Video Ad Selected",
                description: `${ad.title} ready to insert`,
                duration: 2000
              });
            }}
            onIntroOutroSelect={(item) => {
              toast({
                title: `${item.type === 'intro' ? 'Intro' : 'Outro'} Selected`,
                description: `Ready to use: ${item.title}`,
                duration: 2000
              });
            }}
          />
        </ResizablePanel>

      </ResizablePanelGroup>

      {/* Scene Dialog */}
      <SceneDialog
        open={showSceneDialog}
        onOpenChange={setShowSceneDialog}
        onSelectScene={(type) => {
          toast({
            title: "Scene Added",
            description: `${type} scene added to your studio`,
            duration: 2000
          });
        }}
      />

      {/* Channels Dialog */}
      <ChannelsDialog
        open={showChannelsDialog}
        onOpenChange={setShowChannelsDialog}
        platforms={platforms}
        onPlatformToggle={(key) => {
          const platform = platforms[key as keyof typeof platforms];
          if (!platform.paired && key !== 'myPage') {
            toast({
              title: "Not Paired",
              description: `Please pair ${platform.title} first`,
              variant: "destructive"
            });
            return;
          }
          setPlatforms(prev => ({
            ...prev,
            [key]: { ...prev[key as keyof typeof prev], enabled: !prev[key as keyof typeof prev].enabled }
          }));
        }}
        onPlatformPair={(key) => {
          setPlatforms(prev => ({
            ...prev,
            [key]: { ...prev[key as keyof typeof prev], paired: true }
          }));
          toast({
            title: "Connected",
            description: `${platforms[key as keyof typeof platforms].title} paired successfully`
          });
        }}
        onToggleAll={() => {
          const allEnabled = Object.values(platforms).every(p => p.enabled);
          setPlatforms(prev => {
            const updated = { ...prev };
            Object.keys(updated).forEach(key => {
              const k = key as keyof typeof updated;
              updated[k] = { ...updated[k], enabled: !allEnabled };
            });
            return updated;
          });
        }}
      />

      {/* Host Read Script Popup */}
      {showHostScript && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowHostScript(false)}>
          <Card className="w-full max-w-2xl m-4" onClick={(e) => e.stopPropagation()}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Host Read Script</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowHostScript(false)}>
                  ×
                </Button>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm leading-relaxed">{currentScript}</p>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowHostScript(false)}>
                  Close
                </Button>
                <Button onClick={() => {
                  toast({ title: "Marked as Read", description: "Ad spot marked as completed" });
                  setShowHostScript(false);
                }}>
                  Mark as Read
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
