import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Users,
  Loader2,
  Link2,
  Check,
  Sparkles,
  PhoneOff,
  AlertTriangle,
  FileText,
  MonitorPlay,
  Film,
  StickyNote,
  X,
  Play,
  Pause,
  Square,
  Upload,
  Library,
  Search,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { PresenterControls } from './PresenterControls';
import { usePresenterMode, isBoardPortalRoute, getBoardPortalPath, PresenterSection } from '@/hooks/usePresenterMode';
import { toast } from 'sonner';
import { MeetingStatusBadge } from './MeetingStatusBadge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';

interface Participant {
  id: string;
  name: string;
  isVideoOff?: boolean;
  isMuted?: boolean;
  isLocal?: boolean;
}

interface MediaItem {
  id: string;
  title: string;
  media_type: string;
  url: string;
  thumbnail_url?: string;
  duration_seconds?: number;
  size_bytes?: number;
  created_at: string;
}

interface WhiteboardBlock {
  id: string;
  type: 'text' | 'heading' | 'bullet';
  content: string;
  x: number;
  y: number;
}

interface BoardMeetingVideoProps {
  isConnected: boolean;
  isConnecting: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  isGeneratingNotes: boolean;
  isCapturingAudio: boolean;
  participants: Participant[];
  localVideoRef: React.RefObject<HTMLVideoElement>;
  screenShareRef?: React.RefObject<HTMLVideoElement>;
  screenShareTrack?: MediaStreamTrack | null;
  screenShareParticipantId?: string | null;
  hasActiveRoom: boolean;
  guestToken?: string | null;
  isHost?: boolean;
  meetingId?: string;
  hostName?: string;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onStartMeeting?: () => void;
  onJoinMeeting?: () => void;
  onStopAIAndGenerateNotes?: () => void;
  onStopRecordingOnly?: () => void;
  onEndCall?: () => void;
  onInvite?: () => void;
  videoUnavailable?: boolean;
  onNotesOnlyMode?: () => void;
  onMediaPlayStateChange?: (isPlaying: boolean) => void;
  // Timer props for host controls in bottom bar
  timerDisplay?: string;
  timerRunning?: boolean;
  onTimerToggle?: () => void;
  onTimerReset?: () => void;
}

const BoardMeetingVideo: React.FC<BoardMeetingVideoProps> = ({
  isConnected,
  isConnecting,
  isMuted,
  isVideoOff,
  isGeneratingNotes,
  isCapturingAudio,
  participants,
  localVideoRef,
  screenShareRef,
  screenShareTrack,
  screenShareParticipantId,
  hasActiveRoom,
  guestToken,
  isHost = false,
  meetingId,
  hostName = "Host",
  onToggleMute,
  onToggleVideo,
  onStartMeeting,
  onJoinMeeting,
  onStopAIAndGenerateNotes,
  onStopRecordingOnly,
  onEndCall,
  onInvite,
  videoUnavailable = false,
  onNotesOnlyMode,
  onMediaPlayStateChange,
  timerDisplay,
  timerRunning,
  onTimerToggle,
  onTimerReset,
}) => {
  const [linkCopied, setLinkCopied] = useState(false);
  const [isStartingMeeting, setIsStartingMeeting] = useState(false);
  const [isJoiningMeeting, setIsJoiningMeeting] = useState(false);
  const [isEndingCall, setIsEndingCall] = useState(false);
  const totalParticipants = participants.length + 1;
  const isScreenSharing = !!screenShareTrack;
  
  // Host control panel state
  const [activePanel, setActivePanel] = useState<'screen' | 'media' | 'notes' | null>(null);
  const [isLocalScreenSharing, setIsLocalScreenSharing] = useState(false);
  const [localScreenStream, setLocalScreenStream] = useState<MediaStream | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [isMediaPlaying, setIsMediaPlaying] = useState(false);
  const [mediaSource, setMediaSource] = useState<'library' | 'upload'>('library');
  const [mediaSearch, setMediaSearch] = useState("");
  const [selectedLibraryItem, setSelectedLibraryItem] = useState<MediaItem | null>(null);
  const [whiteboardBlocks, setWhiteboardBlocks] = useState<WhiteboardBlock[]>([]);
  const [newBlockContent, setNewBlockContent] = useState("");
  
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const mediaVideoRef = useRef<HTMLVideoElement>(null);
  const { activeTenantId } = useTenant();
  const navigate = useNavigate();

  // Presenter mode hook
  const {
    presenterState,
    startPresenting,
    stopPresenting,
    navigateToSection: baseNavigateToSection,
  } = usePresenterMode({
    meetingId: meetingId || '',
    isHost,
    hostName,
  });

  // Track embedded portal view state
  const [embeddedPortalPath, setEmbeddedPortalPath] = useState<string | null>(null);

  // Wrap stopPresenting to also clear embedded view
  const handleStopPresenting = useCallback(() => {
    stopPresenting();
    setEmbeddedPortalPath(null);
  }, [stopPresenting]);

  // Host broadcasts section and shows embedded view for Board Portal routes
  const navigateToSection = useCallback((section: PresenterSection) => {
    baseNavigateToSection(section);
    
    // For Board Portal routes, show embedded view for host
    if (isBoardPortalRoute(section)) {
      const path = getBoardPortalPath(section);
      console.log("[BoardMeetingVideo] Host presenting Board Portal route:", path);
      setEmbeddedPortalPath(path);
      toast.success(`Presenting: ${section.replace('board-', '').replace(/-/g, ' ')}`);
    } else {
      // For meeting sections, clear embedded view
      setEmbeddedPortalPath(null);
    }
  }, [baseNavigateToSection]);

  // Fetch media library
  const { data: mediaLibrary = [], isLoading: mediaLoading } = useQuery({
    queryKey: ['admin-media-library', activeTenantId, mediaSearch],
    queryFn: async () => {
      let query = (supabase as any)
        .from('media_files')
        .select('id, file_name, media_type, file_url, thumbnail_url, duration_seconds, file_size_bytes, created_at')
        .eq('media_type', 'video')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (mediaSearch) {
        query = query.ilike('file_name', `%${mediaSearch}%`);
      }
      
      const { data, error } = await query;
      if (error) return [];
      
      return ((data as any[]) || []).map((item: any) => ({
        id: item.id,
        title: item.file_name || 'Untitled',
        media_type: item.media_type || 'video',
        url: item.file_url,
        thumbnail_url: item.thumbnail_url,
        duration_seconds: item.duration_seconds,
        size_bytes: item.file_size_bytes,
        created_at: item.created_at,
      }));
    },
    enabled: mediaSource === 'library' && activePanel === 'media',
  });

  // Attach local screen share stream to video element
  useEffect(() => {
    if (localScreenStream && screenVideoRef.current) {
      screenVideoRef.current.srcObject = localScreenStream;
    }
  }, [localScreenStream]);

  const copyGuestLink = () => {
    if (!guestToken) return;
    const guestUrl = `${window.location.origin}/board/meeting-guest/${guestToken}`;
    navigator.clipboard.writeText(guestUrl);
    setLinkCopied(true);
    toast.success("Guest link copied to clipboard");
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleStartMeeting = async () => {
    if (!onStartMeeting || isStartingMeeting) return;
    setIsStartingMeeting(true);
    try {
      await onStartMeeting();
    } finally {
      setIsStartingMeeting(false);
    }
  };

  const handleJoinMeeting = async () => {
    if (!onJoinMeeting || isJoiningMeeting) return;
    setIsJoiningMeeting(true);
    try {
      await onJoinMeeting();
    } finally {
      setIsJoiningMeeting(false);
    }
  };

  const handleEndCall = async () => {
    if (!onEndCall || isEndingCall) return;
    setIsEndingCall(true);
    try {
      await onEndCall();
    } finally {
      setIsEndingCall(false);
    }
  };

  // Screen sharing handlers
  const handleStartScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      
      setLocalScreenStream(stream);
      setIsLocalScreenSharing(true);
      toast.success("Screen sharing started");
      
      stream.getVideoTracks()[0].onended = () => {
        setIsLocalScreenSharing(false);
        setLocalScreenStream(null);
        toast.info("Screen sharing stopped");
      };
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        toast.error("Failed to start screen sharing");
      }
    }
  };

  const handleStopScreenShare = () => {
    if (localScreenStream) {
      localScreenStream.getTracks().forEach(track => track.stop());
    }
    setIsLocalScreenSharing(false);
    setLocalScreenStream(null);
    toast.info("Screen sharing stopped");
  };

  // Media handlers
  const handleMediaPlay = () => {
    if (mediaVideoRef.current) {
      mediaVideoRef.current.play();
      setIsMediaPlaying(true);
      onMediaPlayStateChange?.(true);
    }
  };

  const handleMediaPause = () => {
    if (mediaVideoRef.current) {
      mediaVideoRef.current.pause();
      setIsMediaPlaying(false);
      onMediaPlayStateChange?.(false);
    }
  };

  const handleLibrarySelect = (item: MediaItem) => {
    setSelectedLibraryItem(item);
    setSelectedMedia(item.url);
  };

  const handleClearMedia = () => {
    handleMediaPause();
    setSelectedMedia(null);
    setSelectedLibraryItem(null);
  };

  // Notes handlers
  const addWhiteboardBlock = (type: WhiteboardBlock['type']) => {
    if (!newBlockContent.trim()) return;
    
    const newBlock: WhiteboardBlock = {
      id: crypto.randomUUID(),
      type,
      content: newBlockContent,
      x: 50 + Math.random() * 200,
      y: 50 + whiteboardBlocks.length * 60,
    };
    
    setWhiteboardBlocks([...whiteboardBlocks, newBlock]);
    setNewBlockContent("");
  };

  const removeBlock = (id: string) => {
    setWhiteboardBlocks(whiteboardBlocks.filter(b => b.id !== id));
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const togglePanel = (panel: 'screen' | 'media' | 'notes') => {
    setActivePanel(activePanel === panel ? null : panel);
  };

  // Video unavailable fallback
  if (videoUnavailable) {
    return (
      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-full">
            <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-2 flex items-center gap-2">
              Video Temporarily Unavailable
              <Badge variant="outline" className="text-xs">Network Issue</Badge>
            </h3>
            <p className="text-sm text-amber-700 dark:text-amber-300 mb-4">
              The video service is currently unreachable. You can still run this meeting in notes-only mode.
            </p>
            {onNotesOnlyMode && (
              <Button variant="outline" size="sm" onClick={onNotesOnlyMode} className="gap-2">
                <FileText className="h-4 w-4" />
                Continue with Notes Only
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Not connected - show start or join button
  if (!isConnected && !isConnecting) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 flex flex-col items-center justify-center min-h-[200px]">
        <Video className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">Video Meeting</h3>
        <p className="text-sm text-muted-foreground mb-4 text-center">
          {hasActiveRoom 
            ? 'A meeting is in progress. Join the video call with board members.'
            : 'Start a video call with board members for this meeting'
          }
        </p>
        {hasActiveRoom ? (
          <Button 
            onClick={handleJoinMeeting} 
            className="gap-2"
            disabled={!onJoinMeeting || isJoiningMeeting}
          >
            {isJoiningMeeting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Joining...
              </>
            ) : (
              <>
                <Users className="h-4 w-4" />
                {onJoinMeeting ? 'Join Meeting' : 'Waiting for host...'}
              </>
            )}
          </Button>
        ) : onStartMeeting ? (
          <Button onClick={handleStartMeeting} className="gap-2" disabled={isStartingMeeting}>
            {isStartingMeeting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <Video className="h-4 w-4" />
                Start Video Meeting
              </>
            )}
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">Waiting for host to start...</p>
        )}
      </div>
    );
  }

  // Connecting state
  if (isConnecting) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 flex flex-col items-center justify-center min-h-[200px]">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
        <p className="text-sm text-muted-foreground">Connecting to video meeting...</p>
      </div>
    );
  }

  // Generating notes state
  if (isGeneratingNotes) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 flex flex-col items-center justify-center min-h-[200px]">
        <Sparkles className="h-12 w-12 text-primary animate-pulse mb-4" />
        <p className="text-lg font-medium text-foreground mb-2">Generating AI Notes</p>
        <p className="text-sm text-muted-foreground text-center">
          Transcribing audio and generating meeting notes...
        </p>
      </div>
    );
  }

  // Connected - show video grid
  return (
    <div className="bg-slate-900 rounded-lg overflow-hidden">
      {/* Header with participant count and recording indicator */}
      <div className="bg-slate-800 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {totalParticipants} participant{totalParticipants !== 1 ? 's' : ''}
          </span>
          <MeetingStatusBadge 
            status="active" 
            isCapturingAudio={isCapturingAudio} 
            isGeneratingNotes={isGeneratingNotes} 
          />
          {(isScreenSharing || isLocalScreenSharing) && (
            <Badge variant="secondary" className="text-xs gap-1">
              <Video className="h-3 w-3" />
              Screen Sharing
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {guestToken && (
            <Button variant="ghost" size="sm" onClick={copyGuestLink} className="h-7 text-xs gap-1">
              {linkCopied ? <Check className="h-3 w-3" /> : <Link2 className="h-3 w-3" />}
              {linkCopied ? 'Copied!' : 'Copy Guest Link'}
            </Button>
          )}
        </div>
      </div>

      {/* Persistent Attendee Thumbnails Strip - larger for better visibility */}
      <div className="p-4 flex gap-3 overflow-x-auto bg-slate-900/50 border-b border-slate-700/50">
        {/* Local video thumbnail */}
        <div className="relative flex-shrink-0 w-48 h-36 bg-slate-700 rounded-lg overflow-hidden">
          {!isVideoOff ? (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-slate-600 flex items-center justify-center">
                <VideoOff className="h-7 w-7 text-slate-400" />
              </div>
            </div>
          )}
          <div className="absolute bottom-1 left-1 bg-black/60 px-1.5 py-0.5 rounded text-xs text-white">
            You
          </div>
          {isMuted && (
            <div className="absolute top-1 right-1 bg-red-500/80 rounded-full p-0.5">
              <MicOff className="h-3 w-3 text-white" />
            </div>
          )}
        </div>

        {/* Remote participants thumbnails */}
        {participants.map((participant) => (
          <div
            key={participant.id}
            className={`relative flex-shrink-0 w-48 h-36 bg-slate-700 rounded-lg overflow-hidden ${
              participant.id === screenShareParticipantId ? 'ring-2 ring-primary' : ''
            }`}
          >
            {!participant.isVideoOff ? (
              <div className="w-full h-full bg-slate-600 flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-xl font-medium text-primary">
                    {participant.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-slate-600 flex items-center justify-center">
                  <VideoOff className="h-7 w-7 text-slate-400" />
                </div>
              </div>
            )}
            <div className="absolute bottom-1 left-1 bg-black/60 px-1.5 py-0.5 rounded text-xs text-white truncate max-w-[90%]">
              {participant.name}
              {participant.id === screenShareParticipantId && ' (sharing)'}
            </div>
            {participant.isMuted && (
              <div className="absolute top-1 right-1 bg-red-500/80 rounded-full p-0.5">
                <MicOff className="h-3 w-3 text-white" />
              </div>
            )}
          </div>
        ))}

        {/* Empty slot indicator */}
        {participants.length === 0 && (
          <div className="flex-shrink-0 w-48 h-36 bg-slate-700/50 rounded-lg border-2 border-dashed border-slate-600 flex items-center justify-center">
            <span className="text-sm text-slate-500">Waiting...</span>
          </div>
        )}
      </div>

      {/* Screen Share Area - visible when screen sharing */}
      {(isScreenSharing && screenShareRef) && (
        <div className="p-3 bg-slate-950">
          <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
            <video
              ref={screenShareRef}
              autoPlay
              playsInline
              className="w-full h-full object-contain"
            />
            <div className="absolute top-2 left-2 bg-black/60 px-2 py-1 rounded text-xs text-white flex items-center gap-1">
              <Video className="h-3 w-3" />
              Shared Screen
            </div>
          </div>
        </div>
      )}

      {/* Embedded Board Portal View - visible when presenting portal routes */}
      {isHost && presenterState.isPresenting && embeddedPortalPath && (
        <div className="p-3 bg-slate-950 border-t border-slate-700">
          <div className="relative w-full bg-white rounded-lg overflow-hidden shadow-lg" style={{ height: '60vh' }}>
            <iframe
              src={embeddedPortalPath}
              className="w-full h-full border-0"
              title="Board Portal Presentation"
            />
            <div className="absolute top-2 left-2 bg-primary/90 px-2 py-1 rounded text-xs text-white flex items-center gap-1">
              <MonitorPlay className="h-3 w-3" />
              Presenting to Attendees
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-2 right-2"
              onClick={() => setEmbeddedPortalPath(null)}
            >
              <X className="h-4 w-4 mr-1" />
              Exit View
            </Button>
          </div>
          <p className="text-xs text-center text-muted-foreground mt-2">
            Navigate within this view - attendees see the same page
          </p>
        </div>
      )}

      {/* Host Content Panel - Screen/Media/Notes */}
      {isHost && activePanel && (
        <div className="p-4 bg-slate-950 border-t border-slate-700">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-0 right-0 h-6 w-6 z-10"
              onClick={() => setActivePanel(null)}
            >
              <X className="h-4 w-4" />
            </Button>

            {/* Screen Share Panel */}
            {activePanel === 'screen' && (
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-foreground">Screen Share</h4>
                {!isLocalScreenSharing ? (
                  <div className="text-center py-6">
                    <MonitorPlay className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-3">
                      Share your screen with meeting participants
                    </p>
                    <Button onClick={handleStartScreenShare} size="sm">
                      <MonitorPlay className="w-4 h-4 mr-2" />
                      Start Screen Share
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
                      <video
                        ref={screenVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute top-2 left-2 bg-black/60 px-2 py-1 rounded text-xs text-white flex items-center gap-1">
                        <MonitorPlay className="h-3 w-3" />
                        Your Screen (Preview)
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-3">
                      <Badge variant="default" className="animate-pulse">
                        Screen Sharing Active
                      </Badge>
                      <Button variant="destructive" size="sm" onClick={() => { handleStopScreenShare(); setActivePanel(null); }}>
                        <Square className="w-4 h-4 mr-2" />
                        Stop Sharing
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Media Panel */}
            {activePanel === 'media' && (
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-foreground">Media Player</h4>
                {!selectedMedia ? (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Button
                        variant={mediaSource === 'library' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setMediaSource('library')}
                        className="flex-1"
                      >
                        <Library className="w-4 h-4 mr-2" />
                        Library
                      </Button>
                      <Button
                        variant={mediaSource === 'upload' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setMediaSource('upload')}
                        className="flex-1"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload
                      </Button>
                    </div>

                    {mediaSource === 'library' ? (
                      <div className="space-y-2">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search media library..."
                            value={mediaSearch}
                            onChange={(e) => setMediaSearch(e.target.value)}
                            className="pl-10 h-8 text-sm"
                          />
                        </div>
                        <ScrollArea className="h-[150px]">
                          {mediaLoading ? (
                            <p className="text-center text-muted-foreground py-4 text-sm">Loading...</p>
                          ) : mediaLibrary.length === 0 ? (
                            <div className="text-center py-6">
                              <Film className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                              <p className="text-muted-foreground text-sm">No media in library</p>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              {mediaLibrary.map((item) => (
                                <div
                                  key={item.id}
                                  className={`p-2 border rounded cursor-pointer hover:bg-muted/50 transition-colors ${
                                    selectedLibraryItem?.id === item.id ? 'border-primary bg-primary/5' : ''
                                  }`}
                                  onClick={() => handleLibrarySelect(item)}
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-muted rounded flex items-center justify-center flex-shrink-0">
                                      {item.thumbnail_url ? (
                                        <img src={item.thumbnail_url} alt="" className="w-full h-full object-cover rounded" />
                                      ) : (
                                        <Film className="w-4 h-4 text-muted-foreground" />
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-medium truncate">{item.title}</p>
                                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                        {item.duration_seconds && <span>{formatDuration(item.duration_seconds)}</span>}
                                        {item.size_bytes && <span>• {formatSize(item.size_bytes)}</span>}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </ScrollArea>
                        {selectedLibraryItem && (
                          <Button onClick={() => setSelectedMedia(selectedLibraryItem.url)} size="sm" className="w-full">
                            <Play className="w-4 h-4 mr-2" />
                            Play "{selectedLibraryItem.title}"
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <Upload className="w-10 h-10 mx-auto mb-2 text-muted-foreground" />
                        <Input
                          type="file"
                          accept="video/*,audio/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) setSelectedMedia(URL.createObjectURL(file));
                          }}
                          className="max-w-xs mx-auto text-sm"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
                      <video
                        ref={mediaVideoRef}
                        src={selectedMedia}
                        className="w-full h-full object-contain"
                        onEnded={() => { setIsMediaPlaying(false); onMediaPlayStateChange?.(false); }}
                        onPause={() => { setIsMediaPlaying(false); onMediaPlayStateChange?.(false); }}
                        onPlay={() => { setIsMediaPlaying(true); onMediaPlayStateChange?.(true); }}
                      />
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      {!isMediaPlaying ? (
                        <Button onClick={handleMediaPlay} size="sm">
                          <Play className="w-4 h-4 mr-2" />
                          Play for Participants
                        </Button>
                      ) : (
                        <Button onClick={handleMediaPause} size="sm">
                          <Pause className="w-4 h-4 mr-2" />
                          Pause
                        </Button>
                      )}
                      <Button variant="destructive" size="sm" onClick={() => { handleClearMedia(); setActivePanel(null); }}>
                        <X className="w-4 h-4 mr-2" />
                        Stop & Close
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Notes Panel */}
            {activePanel === 'notes' && (
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-foreground">Quick Notes</h4>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a note..."
                    value={newBlockContent}
                    onChange={(e) => setNewBlockContent(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addWhiteboardBlock('text')}
                    className="h-8 text-sm"
                  />
                  <Button size="sm" onClick={() => addWhiteboardBlock('text')}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <ScrollArea className="h-[150px]">
                  {whiteboardBlocks.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">No notes yet. Add one above.</p>
                  ) : (
                    <div className="space-y-2">
                      {whiteboardBlocks.map((block) => (
                        <div key={block.id} className="flex items-start gap-2 p-2 bg-muted/50 rounded text-sm">
                          <span className="flex-1">{block.content}</span>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => removeBlock(block.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Controls */}
      <TooltipProvider>
        <div className="bg-slate-800 px-4 py-3 flex items-center justify-center gap-2 flex-wrap">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isMuted ? 'destructive' : 'secondary'}
                size="sm"
                className="rounded-full w-10 h-10"
                onClick={onToggleMute}
              >
                {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isMuted ? 'Unmute' : 'Mute'}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isVideoOff ? 'destructive' : 'secondary'}
                size="sm"
                className="rounded-full w-10 h-10"
                onClick={onToggleVideo}
              >
                {isVideoOff ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isVideoOff ? 'Start Video' : 'Stop Video'}</TooltipContent>
          </Tooltip>

          {/* Host-only buttons: Screen, Media, Notes */}
          {isHost && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={activePanel === 'screen' || isLocalScreenSharing ? 'default' : 'secondary'}
                    size="sm"
                    className={`rounded-full w-10 h-10 ${isLocalScreenSharing ? 'bg-green-600 hover:bg-green-700' : ''}`}
                    onClick={() => togglePanel('screen')}
                  >
                    <MonitorPlay className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Screen Share</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={activePanel === 'media' || isMediaPlaying ? 'default' : 'secondary'}
                    size="sm"
                    className={`rounded-full w-10 h-10 ${isMediaPlaying ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                    onClick={() => togglePanel('media')}
                  >
                    <Film className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Media</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={activePanel === 'notes' ? 'default' : 'secondary'}
                    size="sm"
                    className="rounded-full w-10 h-10"
                    onClick={() => togglePanel('notes')}
                  >
                    <StickyNote className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Notes</TooltipContent>
              </Tooltip>

              {/* Presenter Mode Controls */}
              {meetingId && (
                <div className="ml-2 border-l border-slate-600 pl-2">
                  <PresenterControls
                    isPresenting={presenterState.isPresenting}
                    currentSection={presenterState.currentSection}
                    onStartPresenting={startPresenting}
                    onStopPresenting={handleStopPresenting}
                    onNavigateToSection={navigateToSection}
                  />
                </div>
              )}
            </>
          )}

          {/* Host Controls: Invite, Timer, Stop Recording */}
          {isHost && (
            <div className="flex items-center gap-2 ml-2 border-l border-slate-600 pl-2">
              {/* Invite Button */}
              {onInvite && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="secondary" size="sm" onClick={onInvite} className="gap-1.5">
                      <Users className="h-4 w-4" />
                      <span className="hidden sm:inline text-xs">Invite</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Invite participants</TooltipContent>
                </Tooltip>
              )}

              {/* Timer Display */}
              {timerDisplay && (
                <div className="flex items-center gap-1 bg-slate-700/50 px-2 py-1 rounded">
                  <span className="font-mono text-sm text-white">{timerDisplay}</span>
                  {onTimerToggle && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-slate-300 hover:text-white"
                      onClick={onTimerToggle}
                    >
                      {timerRunning ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                    </Button>
                  )}
                </div>
              )}

              {/* Stop Recording Button - Show when meeting is active (timer running) */}
              {timerRunning && onStopRecordingOnly && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={onStopRecordingOnly} 
                      className="gap-1.5"
                    >
                      <Square className="h-4 w-4" />
                      <span className="hidden sm:inline text-xs">Stop Recording</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Stop AI recording (meeting continues)</TooltipContent>
                </Tooltip>
              )}
            </div>
          )}

          {/* AI Notes Status Indicator - Always visible when AI is active */}
          {isCapturingAudio && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 ml-2">
                  <Sparkles className="h-4 w-4 text-emerald-500 animate-pulse" />
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">AI Active</span>
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>AI is actively capturing notes, decisions, and action items in real time.</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* End Call Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                className="ml-2 gap-2"
                onClick={handleEndCall}
                disabled={isEndingCall}
              >
                {isEndingCall ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <PhoneOff className="h-4 w-4" />
                )}
                {isEndingCall ? 'Ending...' : 'End Call'}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Leave video call</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </div>
  );
};

export default BoardMeetingVideo;
