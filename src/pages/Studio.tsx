import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Radio, X, Sparkles, Play, Square } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { StudioLobby } from "@/components/studio/StudioLobby";
import { StudioTopBar } from "@/components/studio/StudioTopBar";
import { StudioLeftSidebar } from "@/components/studio/StudioLeftSidebar";
import { StudioMainView } from "@/components/studio/StudioMainView";
import { StudioRightSidebar } from "@/components/studio/StudioRightSidebar";
import { StudioInviteDialog } from "@/components/studio/StudioInviteDialog";
import { StudioBrandingMenu, BrandingSettings } from "@/components/studio/StudioBrandingMenu";
import { RecordingMarker } from "@/components/studio/MarkerPanel";
import { Scene } from "@/components/studio/StudioScenes";
import { SaveSessionDialog, SaveOptions } from "@/components/studio/SaveSessionDialog";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { StudioGuestPanel } from "@/components/studio/StudioGuestPanel";
import { ThemeToggle } from "@/components/ThemeToggle";

function StudioContent() {
  const navigate = useNavigate();
  const { id: sessionId } = useParams();
  const location = useLocation();
  const { toast } = useToast();
  
  // Extract podcast context from URL params
  const searchParams = new URLSearchParams(location.search);
  const podcastId = searchParams.get('podcastId');
  const podcastTitle = searchParams.get('podcastTitle');
  
  const [inLobby, setInLobby] = useState(!location.state?.sessionName);
  const [sessionName, setSessionName] = useState(location.state?.sessionName || "");
  const [isRecording, setIsRecording] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLiveOnProfile, setIsLiveOnProfile] = useState(false);
  const [liveStreamTitle, setLiveStreamTitle] = useState("");
  const [recordingTime, setRecordingTime] = useState(0);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [micEnabled, setMicEnabled] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [recordingName, setRecordingName] = useState("");
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [pendingBlob, setPendingBlob] = useState<Blob | null>(null);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showBrandingMenu, setShowBrandingMenu] = useState(false);
  const [markers, setMarkers] = useState<RecordingMarker[]>([]);
  const [showScriptDialog, setShowScriptDialog] = useState(false);
  const [showHostNotesPanel, setShowHostNotesPanel] = useState(false);
  const [showAINotes, setShowAINotes] = useState(true);
  const [hostNotes] = useState(`Topics to Cover:
• Introduction - Welcome viewers and introduce today's topic
• Guest background - Ask about their journey and experience
• Main discussion points:
  - Current trends in the industry
  - Challenges they've faced
  - Success stories and lessons learned
• Audience questions - Remember to check chat regularly
• Closing remarks - Thank the guest and preview next episode

Key Questions:
1. What inspired you to get started in this field?
2. Can you share a pivotal moment in your career?
3. What advice would you give to someone just starting out?
4. Where do you see the industry heading in the next 5 years?
5. What's one misconception people have about your work?

Technical Reminders:
- Check audio levels before starting
- Remind viewers to like and subscribe
- Mention sponsors at 15-minute mark
- Show lower third graphics for guest
- Display QR code for website during Q&A

Sponsor Mentions:
[TechCorp - 15:00 mark]
[CloudSolutions - 30:00 mark]

Closing Notes:
- Thank sponsors
- Tease next week's episode
- Remind about social media channels`);
  const [profileImageUrl, setProfileImageUrl] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [brandingSettings, setBrandingSettings] = useState<BrandingSettings>({
    showProfileWhenCameraOff: true,
    showCreatorLogo: false,
    creatorLogoUrl: "",
    showSponsorLogo: false,
    sponsorLogoUrl: "",
    showQrCode: false,
    qrCodeUrl: "",
    showLowerThird: false,
    lowerThirdText: "",
  });
  const [showVideoLiveDialog, setShowVideoLiveDialog] = useState(false);
  const [selectedVideoForLive, setSelectedVideoForLive] = useState<string>("");
  const [selectedAdVideoForLive, setSelectedAdVideoForLive] = useState<string>("");
  const [ctaButtonText, setCtaButtonText] = useState<string>("Tip");
  const [ctaPhoneNumber, setCtaPhoneNumber] = useState<string>("");
  const [ctaSmsKeyword, setCtaSmsKeyword] = useState<string>("");
  const [ctaTextKeyword, setCtaTextKeyword] = useState<string>("");
  const [mediaFiles, setMediaFiles] = useState<any[]>([]);
  const [adVideos, setAdVideos] = useState<any[]>([]);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null);
  const [selectedAd, setSelectedAd] = useState<any>(null);
  const [selectedAdType, setSelectedAdType] = useState<'script' | 'audio' | 'video' | null>(null);
  const [showAdScript, setShowAdScript] = useState(false);
  const [currentViewerCount, setCurrentViewerCount] = useState(0);
  const [myPageStreamStatus, setMyPageStreamStatus] = useState<{
    isLive: boolean;
    title: string;
    videoUrl: string | null;
  }>({
    isLive: false,
    title: "",
    videoUrl: null
  });
  const [selectedChannels, setSelectedChannels] = useState<{
    myPage: boolean;
    facebook: boolean;
    linkedin: boolean;
    tiktok: boolean;
    twitch: boolean;
    youtube: boolean;
  }>({
    myPage: false,
    facebook: false,
    linkedin: false,
    tiktok: false,
    twitch: false,
    youtube: false
  });
  const [channelsExpanded, setChannelsExpanded] = useState(true);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    checkAuth();
    loadProfile();
    loadMediaFiles();
    loadAdVideos();
    loadMyPageStatus();
    subscribeToViewerCount();
    // Don't start preview automatically since camera/mic start as disabled
    
    return () => {
      stopStream();
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("account_avatar_url, account_full_name, is_live_on_profile, live_stream_title, live_video_url")
        .eq("id", user.id)
        .single();

      if (profile) {
        setProfileImageUrl(profile.account_avatar_url || "");
        setUserName(profile.account_full_name || "");
        setIsLiveOnProfile(profile.is_live_on_profile || false);
        setLiveStreamTitle(profile.live_stream_title || "");
        setMyPageStreamStatus({
          isLive: profile.is_live_on_profile || false,
          title: profile.live_stream_title || "",
          videoUrl: profile.live_video_url || null
        });
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  const loadMyPageStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_live_on_profile, live_stream_title, live_video_url")
        .eq("id", user.id)
        .single();

      if (profile) {
        setMyPageStreamStatus({
          isLive: profile.is_live_on_profile || false,
          title: profile.live_stream_title || "",
          videoUrl: profile.live_video_url || null
        });
      }
    } catch (error) {
      console.error("Error loading My Page status:", error);
    }
  };

  const subscribeToViewerCount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const channel = supabase
        .channel('viewer-count')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'live_stream_viewers',
            filter: `profile_id=eq.${user.id}`
          },
          async () => {
            const { count } = await supabase
              .from('live_stream_viewers')
              .select('*', { count: 'exact', head: true })
              .eq('profile_id', user.id)
              .eq('is_active', true)
              .gte('last_seen_at', new Date(Date.now() - 60000).toISOString());
            
            setCurrentViewerCount(count || 0);
          }
        )
        .subscribe();

      const { count } = await supabase
        .from('live_stream_viewers')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', user.id)
        .eq('is_active', true)
        .gte('last_seen_at', new Date(Date.now() - 60000).toISOString());
      
      setCurrentViewerCount(count || 0);

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (error) {
      console.error("Error subscribing to viewer count:", error);
    }
  };

  const loadMediaFiles = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("media_files")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMediaFiles(data || []);
    } catch (error) {
      console.error("Error loading media files:", error);
    }
  };

  const loadAdVideos = async () => {
    try {
      // Query audio_ads table with advertiser info
      const { data, error } = await supabase
        .from("audio_ads")
        .select(`
          *,
          advertisers (
            company_name
          )
        `)
        .in("status", ["ready", "completed"])
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Filter for video ads only (mp4, webm, mov)
      const videoAds = (data || []).filter((ad: any) => {
        const url = ad.audio_url?.toLowerCase() || '';
        return url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.mov');
      });

      const transformedAds = videoAds.map((ad: any) => {
        // Better fallback logic for ad names
        let title = ad.campaign_name;
        
        if (!title && ad.script && ad.script !== 'Uploaded pre-made ad') {
          title = ad.script.substring(0, 50) + (ad.script.length > 50 ? '...' : '');
        }
        
        if (!title && ad.advertisers?.company_name) {
          title = `${ad.advertisers.company_name} Video Ad`;
        }
        
        if (!title) {
          title = 'Video Ad';
        }
        
        return {
          id: ad.id,
          title,
          video_url: ad.audio_url,
          duration_seconds: ad.duration_seconds,
          advertiser_company: ad.advertisers?.company_name || null,
          thumbnail_url: ad.thumbnail_url,
          campaign_name: ad.campaign_name
        };
      });
      
      setAdVideos(transformedAds);
    } catch (error) {
      console.error("Error loading ad videos:", error);
    }
  };

  const handleSceneChange = (sceneId: string) => {
    const scene = scenes.find(s => s.id === sceneId);
    if (!scene) return;

    setActiveSceneId(sceneId);

    if (scene.layout === "play-video" && scene.videoUrl) {
      setSelectedVideoForLive(mediaFiles.find(f => f.file_url === scene.videoUrl)?.id || "");
      setShowVideoLiveDialog(true);
    }

    toast({
      title: "Scene activated",
      description: `Switched to "${scene.name}"`,
    });
  };

  const handleGoLiveWithVideo = async () => {
    if (!selectedVideoForLive && !selectedAdVideoForLive) {
      toast({
        title: "Please select a video",
        description: "Choose a video from your library or select an ad video",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let videoUrl = "";
      let videoName = "";

      if (selectedVideoForLive) {
        const selectedFile = mediaFiles.find(f => f.id === selectedVideoForLive);
        videoUrl = selectedFile?.file_url || "";
        videoName = selectedFile?.file_name || "";
      } else if (selectedAdVideoForLive) {
        const selectedAd = adVideos.find(ad => ad.id === selectedAdVideoForLive);
        videoUrl = selectedAd?.video_url || "";
        videoName = selectedAd?.title || "";
      }
      
      const { error } = await supabase
        .from("profiles")
        .update({
          is_live_on_profile: true,
          live_stream_title: liveStreamTitle || sessionName || "Live Video Stream",
          live_video_url: videoUrl,
          my_page_cta_button_text: ctaButtonText,
          my_page_cta_phone_number: ctaPhoneNumber || null,
          my_page_cta_text_keyword: ctaTextKeyword || null,
        })
        .eq("id", user.id);

      if (error) throw error;

      setIsLiveOnProfile(true);
      setShowVideoLiveDialog(false);
      setMyPageStreamStatus({
        isLive: true,
        title: liveStreamTitle || sessionName || "Live Video Stream",
        videoUrl: videoUrl || null
      });
      
      if (selectedAdVideoForLive) {
        toast({
          title: "Now Live with Ad Video! 🎬",
          description: `Your video will loop on your page until stopped. Check your ad revenue in Monetization.`,
          duration: 6000,
        });
      } else {
        toast({
          title: "Now Live with Video! 🎬",
          description: `Your video "${videoName}" is now streaming on your profile`,
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("Error going live with video:", error);
      toast({
        title: "Error",
        description: "Failed to start video stream.",
        variant: "destructive",
      });
    }
  };

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const startPreview = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: cameraEnabled,
        audio: micEnabled
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Error accessing media devices:", error);
      toast({
        title: "Error",
        description: "Could not access camera or microphone",
        variant: "destructive",
      });
    }
  };

  const startRecording = async () => {
    if (!streamRef.current) {
      await startPreview();
    }

    if (!streamRef.current) return;

    try {
      chunksRef.current = [];
      
      const options = { mimeType: 'video/webm;codecs=vp9,opus' };
      mediaRecorderRef.current = new MediaRecorder(streamRef.current, options);
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = async () => {
        await handleRecordingStopped();
      };
      
      mediaRecorderRef.current.start(1000);
      setIsRecording(true);
      setRecordingTime(0);
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      toast({
        title: "Recording started",
        description: "Your session is being recorded",
        duration: 2000,
      });
    } catch (error) {
      console.error("Error starting recording:", error);
      toast({
        title: "Error",
        description: "Could not start recording",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const handleEnterStudio = (name: string) => {
    setSessionName(name);
    setRecordingName(name);
    setInLobby(false);
  };

  const addMarker = (type: 'ad' | 'clip') => {
    const marker: RecordingMarker = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      timestamp: recordingTime,
      label: type === 'ad' ? 'Ad Insertion Point' : 'Clip Moment'
    };
    setMarkers(prev => [...prev, marker]);
    
    if (type === 'ad' && selectedAd && selectedAdType === 'script') {
      setShowAdScript(true);
    }
    
    toast({
      title: `${type === 'ad' ? '💰 Ad spot' : '✂️ Clip moment'} marked`,
      description: `Marked at ${formatTime(recordingTime)}`,
      duration: 2000,
    });
  };

  const handleRecordingStopped = async () => {
    const blob = new Blob(chunksRef.current, { type: 'video/webm' });
    setPendingBlob(blob);
    setShowNameDialog(true);
  };

  const handleSaveSession = async (options: SaveOptions) => {
    if (!pendingBlob) {
      toast({
        title: "Error",
        description: "No recording to save",
        variant: "destructive",
      });
      return;
    }
    
    setIsUploading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Save as Template if selected
      if (options.saveAsTemplate) {
        const { error: templateError } = await supabase
          .from('studio_templates')
          .insert({
            user_id: user.id,
            session_name: options.name,
            description: `Template created from session on ${new Date().toLocaleDateString()}`,
            thumbnail_url: null,
          });

        if (templateError) {
          console.error('Template save error:', templateError);
          toast({
            title: "Template not saved",
            description: "Could not save as template, but recording will continue",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Template saved",
            description: `"${options.name}" is now available as a reusable template`,
            duration: 3000,
          });
        }
      }

      // Save as Recording if selected
      if (options.saveAsRecording) {
        await uploadRecording(pendingBlob, options.name);
      } else {
        // If only template, just close and go back
        setShowNameDialog(false);
        setPendingBlob(null);
        navigate('/studio');
        return;
      }
      
      setShowNameDialog(false);
      setPendingBlob(null);
    } catch (error) {
      console.error("Error saving session:", error);
      toast({
        title: "Save failed",
        description: "Could not save your session",
        variant: "destructive",
      });
      setIsUploading(false);
    }
  };

  const uploadRecording = async (blob: Blob, name: string) => {
    setIsUploading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const fileName = `${name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${Date.now()}.webm`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('studio-recordings')
        .upload(filePath, blob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('studio-recordings')
        .getPublicUrl(filePath);

      const { data: mediaFileData, error: dbError } = await supabase
        .from('media_files')
        .insert({
          user_id: user.id,
          file_name: name,
          file_type: 'video/webm',
          file_url: publicUrl,
          file_size_bytes: blob.size,
          source: 'studio',
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Auto-transcription (if enabled)
      if (mediaFileData) {
        const { data: preferences } = await supabase
          .from('user_preferences')
          .select('auto_transcribe_enabled')
          .eq('user_id', user.id)
          .single();

        if (preferences?.auto_transcribe_enabled) {
          supabase.functions.invoke('transcribe-audio', {
            body: {
              asset_id: mediaFileData.id,
              audio_url: publicUrl,
              language: 'en',
              source_type: 'studio_recording',
            },
          }).then(({ data, error }) => {
            if (error) {
              console.error('Transcription error:', error);
            } else {
              console.log('Transcription started:', data);
              toast({
                title: "Transcription in progress",
                description: "Check Transcript Library shortly",
                duration: 3000,
              });
            }
          });
        }
      }

      toast({
        title: "Recording saved",
        description: "Your recording is now in the Media Library",
        duration: 2000,
      });

      // If recording for a podcast, navigate to episode creation
      if (podcastId && mediaFileData) {
        navigate(`/podcasts/${podcastId}/episodes/new-from-studio`, {
          state: {
            audioUrl: publicUrl,
            mediaFileId: mediaFileData.id,
            title: name,
            duration: Math.floor(blob.size / (128 * 1024)), // Rough estimate
            recordingDate: new Date().toISOString(),
            tracks: [{ audioUrl: publicUrl, name }],
          },
        });
      } else {
        navigate("/media-library");
      }
    } catch (error) {
      console.error("Error uploading recording:", error);
      toast({
        title: "Upload failed",
        description: "Could not save your recording",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const toggleCamera = async () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCameraEnabled(videoTrack.enabled);
      }
    } else {
      // No stream yet - request both audio and video, then enable/disable as needed
      try {
        const newCameraState = !cameraEnabled;
        
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        
        streamRef.current = stream;
        
        // Set the correct enabled states
        const videoTrack = stream.getVideoTracks()[0];
        const audioTrack = stream.getAudioTracks()[0];
        
        if (videoTrack) {
          videoTrack.enabled = newCameraState;
        }
        if (audioTrack) {
          audioTrack.enabled = micEnabled;
        }
        
        setCameraEnabled(newCameraState);
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Error accessing camera:", error);
        setCameraEnabled(false);
        toast({
          title: "Error",
          description: "Could not access camera or microphone",
          variant: "destructive",
        });
      }
    }
  };

  const toggleMicrophone = async () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicEnabled(audioTrack.enabled);
      }
    } else {
      // No stream yet - request both audio and video, then enable/disable as needed
      try {
        const newMicState = !micEnabled;
        
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        
        streamRef.current = stream;
        
        // Set the correct enabled states
        const videoTrack = stream.getVideoTracks()[0];
        const audioTrack = stream.getAudioTracks()[0];
        
        if (videoTrack) {
          videoTrack.enabled = cameraEnabled;
        }
        if (audioTrack) {
          audioTrack.enabled = newMicState;
        }
        
        setMicEnabled(newMicState);
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Error accessing microphone:", error);
        setMicEnabled(false);
        toast({
          title: "Error",
          description: "Could not access camera or microphone",
          variant: "destructive",
        });
      }
    }
  };

  const toggleLiveOnProfile = async () => {
    try {
      const newLiveStatus = !isLiveOnProfile;
      
      // If going live, start recording automatically
      if (newLiveStatus && !isRecording) {
        await startRecording();
        toast({
          title: "Auto-recording enabled",
          description: "Your recording will be saved to Media Library",
          duration: 2000,
        });
      }
      
      // If stopping live and was recording, stop and auto-save
      if (!newLiveStatus && isRecording) {
        stopRecording();
        // Recording will be auto-saved via handleRecordingStopped
      }
      
      setIsLiveOnProfile(newLiveStatus);
      
      toast({
        title: newLiveStatus ? "Stream Started" : "Stream Ended",
        description: newLiveStatus 
          ? "Your stream is now live"
          : "Stream has been saved to Media Library",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error toggling live status:", error);
      toast({
        title: "Error",
        description: "Failed to update stream status",
        variant: "destructive",
      });
    }
  };

  const shareScreen = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });

      if (streamRef.current && videoRef.current) {
        const videoTrack = screenStream.getVideoTracks()[0];
        
        const audioTracks = streamRef.current.getAudioTracks();
        const newStream = new MediaStream([videoTrack, ...audioTracks]);
        
        streamRef.current = newStream;
        videoRef.current.srcObject = newStream;
        
        toast({
          title: "Screen sharing started",
          duration: 2000,
        });
      }
    } catch (error) {
      console.error("Error sharing screen:", error);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggleChannel = (channel: string) => {
    setSelectedChannels(prev => ({
      ...prev,
      [channel]: !prev[channel as keyof typeof prev]
    }));
  };

  const handlePlayVideo = () => {
    setShowVideoLiveDialog(true);
  };

  if (inLobby) {
    return (
      <div className="min-h-screen bg-background">
        {podcastId && podcastTitle && (
          <div className="bg-primary/10 border-b border-primary/20 px-6 py-3">
            <div className="max-w-7xl mx-auto flex items-center gap-2 text-sm">
              <Radio className="w-4 h-4 text-primary" />
              <span className="font-medium">Recording for podcast:</span>
              <span className="text-muted-foreground">{decodeURIComponent(podcastTitle)}</span>
              <span className="text-muted-foreground">– New Episode</span>
            </div>
          </div>
        )}
        <StudioLobby onEnterStudio={handleEnterStudio} />
      </div>
    );
  }

  if (isUploading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-lg font-medium">Uploading Recording...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen flex w-full bg-background">
        <div className="h-screen flex flex-col flex-1 bg-background">
          {/* Header with Back, Go Live, and Schedule buttons */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-background/95 backdrop-blur-sm z-50">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/studio')}
                className="text-muted-foreground hover:text-foreground"
              >
                ← Back
              </Button>
            </div>
        
        <div className="flex items-center gap-4">
          {/* My Page Streaming Button */}
          {isLiveOnProfile ? (
            <Button
              onClick={toggleLiveOnProfile}
              size="sm"
              variant="destructive"
              className="bg-red-600 hover:bg-red-700 text-white font-semibold flex items-center gap-2"
            >
              <Radio className="h-4 w-4 animate-pulse" />
              LIVE on My Page
            </Button>
          ) : (
            <Button
              onClick={toggleLiveOnProfile}
              size="sm"
              className="bg-brand-blue hover:bg-brand-blue/90 text-white font-semibold flex items-center gap-2"
            >
              <Radio className="h-4 w-4" />
              Go Live on My Page
            </Button>
          )}
          
          <div className="h-6 w-px bg-border" />
          
          <div className="flex items-center gap-2">
            <Switch
              id="ai-notes"
              checked={showAINotes}
              onCheckedChange={setShowAINotes}
            />
            <Label htmlFor="ai-notes" className="text-sm cursor-pointer flex items-center gap-1">
              <Sparkles className="h-4 w-4" />
              AI Notes
            </Label>
          </div>
          
          <div className="h-6 w-px bg-border" />
          
          <ThemeToggle />
          
        </div>
      </div>
      
      <div className="flex flex-1 overflow-visible border-2 border-border">
        <ResizablePanelGroup direction="horizontal">
          {/* Left Sidebar - Scenes */}
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
            <StudioLeftSidebar
              scenes={scenes}
              activeSceneId={activeSceneId}
              onSceneChange={handleSceneChange}
              onScenesUpdate={(updatedScenes) => {
                setScenes(updatedScenes);
                localStorage.setItem('studioScenes', JSON.stringify(updatedScenes));
              }}
              mediaFiles={mediaFiles}
            />
          </ResizablePanel>

          <ResizableHandle />

          {/* Main Video Area */}
          <ResizablePanel defaultSize={50} minSize={30}>
            {myPageStreamStatus.isLive && myPageStreamStatus.videoUrl ? (
              <div className="relative h-full w-full bg-muted">
                <video
                  src={myPageStreamStatus.videoUrl}
                  className="w-full h-full object-contain"
                  controls
                  autoPlay
                />
                <div className="absolute top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-full flex items-center gap-2 animate-pulse z-10">
                  <Radio className="h-4 w-4" />
                  <span className="font-semibold">LIVE on My Page</span>
                </div>
              </div>
            ) : (
              <StudioMainView
              videoRef={videoRef}
              isRecording={isRecording}
              isLiveOnProfile={isLiveOnProfile}
              recordingTime={recordingTime}
              cameraEnabled={cameraEnabled}
              micEnabled={micEnabled}
              onToggleCamera={toggleCamera}
              onToggleMic={toggleMicrophone}
              onScreenShare={shareScreen}
              onInviteGuests={() => setShowInviteDialog(true)}
              onStartRecording={startRecording}
              onStopRecording={stopRecording}
              brandingSettings={brandingSettings}
              profileImageUrl={profileImageUrl}
              userName={userName}
              formatTime={formatTime}
              onPlayVideo={handlePlayVideo}
              onAddAdMarker={() => addMarker('ad')}
              onAddClipMarker={() => addMarker('clip')}
              onReadScript={() => setShowScriptDialog(true)}
              onOpenHostNotes={() => setShowHostNotesPanel(true)}
            />
            )}
          </ResizablePanel>

          <ResizableHandle />

          {/* Right Sidebar - Markers, Streaming Channels */}
          <ResizablePanel defaultSize={30} minSize={15} maxSize={40} className="relative">
            <StudioRightSidebar
              currentViewerCount={currentViewerCount}
              onAdSelect={(ad, type) => {
                setSelectedAd(ad);
                setSelectedAdType(type as any);
              }}
              selectedAd={selectedAd}
              markers={markers}
              onAddMarker={addMarker}
              isRecording={isRecording}
              selectedChannels={selectedChannels}
              onToggleChannel={handleToggleChannel}
              channelsExpanded={channelsExpanded}
                onToggleChannelsExpanded={() => setChannelsExpanded(!channelsExpanded)}
                profileImageUrl={profileImageUrl}
                sessionId={sessionId}
              />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Dialogs */}
      <StudioInviteDialog
        open={showInviteDialog}
        onOpenChange={setShowInviteDialog}
        sessionName={sessionName}
        onInviteSent={(email) => {
          toast({
            title: "Invitation sent",
            description: `Invited ${email} to join your studio session`,
            duration: 2000,
          });
        }}
      />

      <SaveSessionDialog
        open={showNameDialog}
        onOpenChange={setShowNameDialog}
        defaultName={sessionName || `Session ${new Date().toLocaleDateString()}`}
        onSave={handleSaveSession}
        isLoading={isUploading}
      />

      <Dialog open={showVideoLiveDialog} onOpenChange={setShowVideoLiveDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Go Live with a Video</DialogTitle>
            <DialogDescription>
              Select a video from your media library or choose an ad video to stream on your profile
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {!selectedAdVideoForLive && (
              <div>
                <Label htmlFor="my-video-select">My Videos</Label>
                <Select 
                  value={selectedVideoForLive} 
                  onValueChange={(value) => {
                    setSelectedVideoForLive(value);
                    setSelectedAdVideoForLive("");
                  }}
                >
                  <SelectTrigger id="my-video-select">
                    <SelectValue placeholder="Choose from my videos..." />
                  </SelectTrigger>
                  <SelectContent>
                    {mediaFiles.filter(file => file.file_type?.includes('video') || file.source === 'studio').length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        No videos available. Record or upload videos first.
                      </div>
                    ) : (
                      mediaFiles
                        .filter(file => file.file_type?.includes('video') || file.source === 'studio')
                        .map((file) => (
                          <SelectItem key={file.id} value={file.id}>
                            {file.file_name}
                          </SelectItem>
                        ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {!selectedVideoForLive && (
              <div>
                <Label htmlFor="ad-video-select">Ad Videos</Label>
                <Select 
                  value={selectedAdVideoForLive} 
                  onValueChange={(value) => {
                    setSelectedAdVideoForLive(value);
                    setSelectedVideoForLive("");
                  }}
                >
                  <SelectTrigger id="ad-video-select">
                    <SelectValue placeholder="Choose an ad video..." />
                  </SelectTrigger>
                  <SelectContent>
                    {adVideos.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        No ad videos available.
                      </div>
                    ) : (
                      adVideos.map((ad) => (
                      <SelectItem key={ad.id} value={ad.id}>
                        {ad.title}
                        {!ad.campaign_name && ad.advertiser_company && ` - ${ad.advertiser_company}`}
                      </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {(selectedVideoForLive || selectedAdVideoForLive) && (
              <>
                <div>
                  <Label htmlFor="cta-button-text">Button Text (Optional)</Label>
                  <Select value={ctaButtonText} onValueChange={setCtaButtonText}>
                    <SelectTrigger id="cta-button-text">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Tip">Tip</SelectItem>
                      <SelectItem value="Donate">Donate</SelectItem>
                      <SelectItem value="Funds">Funds</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="cta-phone">Phone Number (Optional)</Label>
                  <Input
                    id="cta-phone"
                    type="tel"
                    value={ctaPhoneNumber}
                    onChange={(e) => setCtaPhoneNumber(e.target.value)}
                    placeholder="e.g., +1 (555) 123-4567"
                  />
                </div>

                <div>
                  <Label htmlFor="cta-keyword">Text Keyword (Optional)</Label>
                  <Input
                    id="cta-keyword"
                    value={ctaTextKeyword}
                    onChange={(e) => setCtaTextKeyword(e.target.value)}
                    placeholder="e.g., JOIN, SUPPORT"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Viewers can text this keyword to {ctaPhoneNumber || "your phone number"}
                  </p>
                </div>
              </>
            )}

            <Button 
              onClick={handleGoLiveWithVideo} 
              className="w-full bg-brand-red hover:bg-brand-red/90"
              disabled={!selectedVideoForLive && !selectedAdVideoForLive}
            >
              <Radio className="mr-2 h-4 w-4" />
              Start Video Stream
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Script Dialog */}
      <Dialog open={showScriptDialog} onOpenChange={setShowScriptDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Advertiser Script</DialogTitle>
            <DialogDescription>
              Read this script during your live stream
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold">Brand:</span>
                <span className="text-muted-foreground">TechCorp Solutions</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold">Duration:</span>
                <span className="text-muted-foreground">30-45 seconds</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold">Script:</label>
              <div className="bg-background border rounded-lg p-4 max-h-96 overflow-y-auto">
                <p className="text-foreground leading-relaxed">
                  "Hey everyone! Before we continue, I want to tell you about TechCorp Solutions. 
                  If you're looking to streamline your workflow and boost productivity, TechCorp has 
                  the perfect tools for you. Their all-in-one platform makes project management a breeze, 
                  with features like real-time collaboration, automated reporting, and seamless integrations 
                  with all your favorite apps. Plus, they're offering an exclusive 20% off for new users. 
                  Just visit TechCorp.com and use code STREAM20 at checkout. That's TechCorp.com, 
                  code STREAM20. Now, let's get back to the show!"
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setShowScriptDialog(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Host Notes Side Panel */}
      {showHostNotesPanel && (
        <div className="fixed right-0 top-0 bottom-0 w-[400px] bg-background border-l border-border shadow-2xl z-[200] animate-in slide-in-from-right duration-300">
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
              <h2 className="font-semibold text-base">Host Notes</h2>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowHostNotesPanel(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground">
                  Your pre-written script and notes for this session
                </p>
                <div className="bg-muted/50 rounded-lg p-4">
                  <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed">
                    {hostNotes}
                  </pre>
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>
      )}
        </div>
      </div>
    </>
  );
}

export default function Studio() {
  return <StudioContent />;
}
