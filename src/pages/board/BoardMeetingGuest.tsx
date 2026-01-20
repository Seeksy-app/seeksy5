import { useState, useRef, useEffect, useCallback, memo } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import deerInSnow from "@/assets/deer-in-snow.jpg";
import meetingDog from "@/assets/meeting-dog.jpg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Loader2,
  Users,
  Clock,
  ListChecks,
  MessageSquare,
  Send,
  PanelRightClose,
  PanelRightOpen,
  MonitorPlay,
  Film,
  CalendarDays,
  FileText,
  ChevronDown,
  ChevronUp,
  ListPlus,
} from "lucide-react";
import { toast } from "sonner";
import DailyIframe from "@daily-co/daily-js";
import { usePresenterMode } from "@/hooks/usePresenterMode";
import { GuestPresenterView } from "@/components/board/GuestPresenterView";
import { format } from "date-fns";

interface AgendaItem {
  text: string;
  checked: boolean;
}

interface MemberQuestion {
  id: string;
  author: string;
  text: string;
  created_at: string;
}

interface MeetingMemo {
  purpose?: string;
  objective?: string;
  current_state?: string[];
  key_questions?: string[];
}

interface MeetingInfo {
  id: string;
  title: string;
  meeting_date: string;
  start_time: string | null;
  duration_minutes: number;
  room_name: string | null;
  room_url: string | null;
  status: string;
  agenda_items: AgendaItem[];
  memo: MeetingMemo | null;
  member_questions: MemberQuestion[];
  host_has_started: boolean;
}

// Component to render remote participant with video track (thumbnail)
const RemoteParticipantTile = memo(({ participant }: { participant: { id: string; name: string; videoTrack?: MediaStreamTrack | null } }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  useEffect(() => {
    if (videoRef.current && participant.videoTrack) {
      const stream = new MediaStream([participant.videoTrack]);
      videoRef.current.srcObject = stream;
      console.log('Attached video track for participant:', participant.name);
    }
  }, [participant.videoTrack, participant.name]);
  
  return (
    <div className="relative flex-shrink-0 w-48 h-36 bg-slate-700 rounded-lg overflow-hidden">
      {participant.videoTrack ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-xl font-medium text-primary">
              {participant.name.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
      )}
      <div className="absolute bottom-1 left-1 bg-black/60 px-1.5 py-0.5 rounded text-xs text-white truncate max-w-[90%]">
        {participant.name}
      </div>
    </div>
  );
});

RemoteParticipantTile.displayName = 'RemoteParticipantTile';

// Component to render remote participant video (full-size for grid)
const RemoteParticipantVideo = memo(({ participant }: { participant: { id: string; name: string; videoTrack?: MediaStreamTrack | null } }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  useEffect(() => {
    if (videoRef.current && participant.videoTrack) {
      const stream = new MediaStream([participant.videoTrack]);
      videoRef.current.srcObject = stream;
      console.log('Attached full video track for participant:', participant.name);
    }
  }, [participant.videoTrack, participant.name]);
  
  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className="w-full h-full object-cover"
    />
  );
});

RemoteParticipantVideo.displayName = 'RemoteParticipantVideo';

export default function BoardMeetingGuest() {
  const { token } = useParams<{ token: string }>();
  const [guestName, setGuestName] = useState("");
  const [hasEnteredName, setHasEnteredName] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [meetingInfo, setMeetingInfo] = useState<MeetingInfo | null>(null);
  const [newQuestion, setNewQuestion] = useState("");
  const [newAgendaItem, setNewAgendaItem] = useState("");
  const [personalNotes, setPersonalNotes] = useState("");
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [showAgendaInput, setShowAgendaInput] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [participantCount, setParticipantCount] = useState(1);
  const [isLoadingMeeting, setIsLoadingMeeting] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [remoteParticipants, setRemoteParticipants] = useState<Array<{id: string; name: string; videoTrack?: MediaStreamTrack | null}>>([]);
  
  // Collapsible sections
  const [memoOpen, setMemoOpen] = useState(true);
  const [agendaOpen, setAgendaOpen] = useState(true);
  const [questionsOpen, setQuestionsOpen] = useState(true);
  
  // Screen share and media state
  const [remoteScreenShare, setRemoteScreenShare] = useState<MediaStreamTrack | null>(null);
  const [screenSharerName, setScreenSharerName] = useState<string>("");
  const [hostMediaUrl, setHostMediaUrl] = useState<string | null>(null);
  const [isMediaPlaying, setIsMediaPlaying] = useState(false);

  const callFrameRef = useRef<ReturnType<typeof DailyIframe.createCallObject> | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const screenShareVideoRef = useRef<HTMLVideoElement>(null);
  const mediaVideoRef = useRef<HTMLVideoElement>(null);

  const {
    presenterState,
    isFollowing,
    toggleFollowing,
  } = usePresenterMode({
    meetingId: meetingInfo?.id || '',
    isHost: false,
  });

  // Auto-collapse sidebar when video connects
  useEffect(() => {
    if (isConnected) {
      setSidebarOpen(false);
    }
  }, [isConnected]);

  // Attach screen share track to video element
  useEffect(() => {
    if (remoteScreenShare && screenShareVideoRef.current) {
      const stream = new MediaStream([remoteScreenShare]);
      screenShareVideoRef.current.srcObject = stream;
    } else if (screenShareVideoRef.current) {
      screenShareVideoRef.current.srcObject = null;
    }
  }, [remoteScreenShare]);

  // Subscribe to meeting updates and host media broadcast
  useEffect(() => {
    if (!meetingInfo?.id) return;

    const meetingChannel = supabase
      .channel(`meeting-updates:${meetingInfo.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'board_meeting_notes',
          filter: `id=eq.${meetingInfo.id}`,
        },
        (payload) => {
          console.log("[GuestView] Meeting updated:", payload);
          const updated = payload.new as any;
          setMeetingInfo(prev => prev ? { ...prev, ...updated } : null);
          
          if (updated.host_has_started && !meetingInfo.host_has_started) {
            toast.success("Host has started the meeting!");
          }
        }
      )
      .subscribe();

    const mediaChannel = supabase
      .channel(`meeting-media:${meetingInfo.id}`)
      .on('broadcast', { event: 'media-play' }, (payload) => {
        console.log("[GuestView] Media broadcast received:", payload);
        setHostMediaUrl(payload.payload.url);
        setIsMediaPlaying(payload.payload.isPlaying);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(meetingChannel);
      supabase.removeChannel(mediaChannel);
    };
  }, [meetingInfo?.id]);

  useEffect(() => {
    if (!token) return;
    fetchMeetingInfo();
  }, [token]);

  const fetchMeetingInfo = async () => {
    try {
      const { data: invite } = await supabase
        .from('board_meeting_invites')
        .select('meeting_id, invitee_name')
        .eq('invite_token', token)
        .maybeSingle();

      let meetingId: string | null = null;

      if (invite) {
        meetingId = invite.meeting_id;
        if (invite.invitee_name && !guestName) {
          setGuestName(invite.invitee_name);
        }
      } else {
        const { data: meeting } = await supabase
          .from('board_meeting_notes')
          .select('id')
          .eq('guest_token', token)
          .maybeSingle();
        
        if (meeting) {
          meetingId = meeting.id;
        }
      }

      if (!meetingId) {
        setError("Invalid or expired meeting link");
        setIsLoadingMeeting(false);
        return;
      }

      const { data: meetingData, error: meetingError } = await supabase
        .from('board_meeting_notes')
        .select('id, title, meeting_date, start_time, duration_minutes, room_name, room_url, status, agenda_items, memo, member_questions, host_has_started')
        .eq('id', meetingId)
        .single();

      if (meetingError || !meetingData) {
        setError("Meeting not found");
        setIsLoadingMeeting(false);
        return;
      }

      setMeetingInfo({
        ...meetingData,
        agenda_items: (meetingData.agenda_items as unknown as AgendaItem[]) || [],
        memo: meetingData.memo as unknown as MeetingMemo | null,
        member_questions: (meetingData.member_questions as unknown as MemberQuestion[]) || [],
      } as MeetingInfo);

      setIsLoadingMeeting(false);
    } catch (err) {
      console.error("Error fetching meeting:", err);
      setError("Failed to load meeting");
      setIsLoadingMeeting(false);
    }
  };

  const handleEnterName = () => {
    if (!guestName.trim()) {
      toast.error("Please enter your name");
      return;
    }
    setHasEnteredName(true);
  };

  const handleJoinVideo = async () => {
    if (!meetingInfo?.room_url) {
      toast.error("Meeting video hasn't started yet");
      return;
    }

    setIsJoining(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("daily-guest-join", {
        body: { guestToken: token, guestName: guestName.trim() },
      });

      if (fnError || data?.error) {
        throw new Error(data?.error || fnError?.message || "Failed to join meeting");
      }

      const callFrame = DailyIframe.createCallObject({
        showLeaveButton: false,
        showFullscreenButton: false,
      });

      callFrameRef.current = callFrame;

      callFrame.on("joined-meeting", () => {
        setIsConnected(true);
        setIsJoining(false);
        toast.success("Joined video call");
        checkForScreenShares();
      });

      callFrame.on("left-meeting", () => {
        setIsConnected(false);
        setRemoteScreenShare(null);
        callFrameRef.current = null;
      });

      callFrame.on("participant-joined", () => {
        updateParticipantCount();
        checkForScreenShares();
      });
      
      callFrame.on("participant-left", () => {
        updateParticipantCount();
        checkForScreenShares();
      });

      callFrame.on("participant-updated", (event: any) => {
        if (event?.participant && !event.participant.local) {
          checkForScreenShares();
        }
      });

      callFrame.on("error", (event) => {
        console.error("Daily error:", event);
        toast.error("Video error occurred");
      });

      await callFrame.join({
        url: data.roomUrl,
        token: data.token,
      });

      const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
      }

      updateParticipantCount();
    } catch (err) {
      console.error("Join error:", err);
      const message = err instanceof Error ? err.message : "Failed to join meeting";
      toast.error(message);
      setIsJoining(false);
    }
  };

  const checkForScreenShares = () => {
    if (!callFrameRef.current) return;
    
    const participants = callFrameRef.current.participants();
    let foundScreenShare = false;
    
    for (const [id, participant] of Object.entries(participants)) {
      if (id === 'local') continue;
      
      const p = participant as any;
      if (p.screen && p.tracks?.screenVideo?.track) {
        setRemoteScreenShare(p.tracks.screenVideo.track);
        setScreenSharerName(p.user_name || 'Host');
        foundScreenShare = true;
        break;
      }
    }
    
    if (!foundScreenShare) {
      setRemoteScreenShare(null);
      setScreenSharerName("");
    }
  };

  const updateParticipantCount = () => {
    if (callFrameRef.current) {
      const participants = callFrameRef.current.participants();
      setParticipantCount(Object.keys(participants).length);
      
      // Update remote participants list
      const remotes: Array<{id: string; name: string; videoTrack?: MediaStreamTrack | null}> = [];
      for (const [id, participant] of Object.entries(participants)) {
        if (id === 'local') continue;
        const p = participant as any;
        remotes.push({
          id,
          name: p.user_name || 'Participant',
          videoTrack: p.tracks?.video?.track || null,
        });
      }
      setRemoteParticipants(remotes);
    }
  };

  const toggleMute = () => {
    console.log('toggleMute called, callFrameRef:', !!callFrameRef.current, 'isMuted:', isMuted);
    if (callFrameRef.current) {
      const newMutedState = !isMuted;
      callFrameRef.current.setLocalAudio(!newMutedState);
      setIsMuted(newMutedState);
      console.log('Audio toggled, new muted state:', newMutedState);
    } else {
      console.warn('Cannot toggle mute - no call frame');
    }
  };

  const toggleVideo = () => {
    console.log('toggleVideo called, callFrameRef:', !!callFrameRef.current, 'isVideoOff:', isVideoOff);
    if (callFrameRef.current) {
      const newVideoOffState = !isVideoOff;
      callFrameRef.current.setLocalVideo(!newVideoOffState);
      setIsVideoOff(newVideoOffState);
      console.log('Video toggled, new video off state:', newVideoOffState);
    } else {
      console.warn('Cannot toggle video - no call frame');
    }
  };

  const leaveCall = () => {
    if (callFrameRef.current) {
      callFrameRef.current.leave();
      callFrameRef.current.destroy();
      callFrameRef.current = null;
    }
    setIsConnected(false);
    setRemoteScreenShare(null);
  };

  const handleAddQuestion = async () => {
    if (!newQuestion.trim() || !meetingInfo?.id) return;
    
    setIsAddingQuestion(true);
    try {
      const newQ: MemberQuestion = {
        id: crypto.randomUUID(),
        author: guestName,
        text: newQuestion.trim(),
        created_at: new Date().toISOString(),
      };

      const updatedQuestions = [...(meetingInfo.member_questions || []), newQ];

      const { error } = await supabase
        .from('board_meeting_notes')
        .update({ member_questions: updatedQuestions as unknown as any })
        .eq('id', meetingInfo.id);

      if (error) throw error;

      setMeetingInfo(prev => prev ? { ...prev, member_questions: updatedQuestions } : null);
      setNewQuestion("");
      toast.success("Question added");
    } catch (err) {
      console.error("Error adding question:", err);
      toast.error("Failed to add question");
    } finally {
      setIsAddingQuestion(false);
    }
  };

  const handleAddAgendaItem = async () => {
    if (!newAgendaItem.trim() || !meetingInfo?.id) return;
    
    try {
      const newItem: AgendaItem = {
        text: `[Suggested by ${guestName}] ${newAgendaItem.trim()}`,
        checked: false,
      };

      const updatedItems = [...(meetingInfo.agenda_items || []), newItem];

      const { error } = await supabase
        .from('board_meeting_notes')
        .update({ agenda_items: updatedItems as unknown as any })
        .eq('id', meetingInfo.id);

      if (error) throw error;

      setMeetingInfo(prev => prev ? { ...prev, agenda_items: updatedItems } : null);
      setNewAgendaItem("");
      setShowAgendaInput(false);
      toast.success("Agenda item suggested");
    } catch (err) {
      console.error("Error adding agenda item:", err);
      toast.error("Failed to add agenda item");
    }
  };

  useEffect(() => {
    return () => {
      if (callFrameRef.current) {
        callFrameRef.current.leave();
        callFrameRef.current.destroy();
      }
    };
  }, []);

  const formatMeetingDateTime = () => {
    if (!meetingInfo) return "";
    const date = format(new Date(meetingInfo.meeting_date + "T12:00:00"), "EEEE, MMMM d, yyyy");
    const time = meetingInfo.start_time ? meetingInfo.start_time.substring(0, 5) : null;
    return time ? `${date} at ${time}` : date;
  };

  if (isLoadingMeeting) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error && !meetingInfo) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Name entry screen
  if (!hasEnteredName) {
    return (
      <div className="fixed inset-0 flex items-center justify-center p-4">
        {/* Full-page fun background image */}
        <div 
          className="fixed inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${deerInSnow})` }}
        />
        <div className="fixed inset-0 bg-white/30 backdrop-blur-[2px]" />
        <Card className="w-full max-w-md relative z-10 shadow-2xl bg-card/95 backdrop-blur-sm">
          
          <CardHeader className="text-center pt-4">
            <CardTitle className="text-xl">{meetingInfo?.title || "Board Meeting"}</CardTitle>
            <CardDescription className="text-base">
              {meetingInfo?.meeting_date && (
                <span className="flex items-center justify-center gap-2 mt-2">
                  <CalendarDays className="h-4 w-4" />
                  {formatMeetingDateTime()}
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pb-6">
            <div className="space-y-2">
              <Label htmlFor="guestName">Your Name</Label>
              <Input
                id="guestName"
                placeholder="Enter your name to join"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleEnterName()}
                className="text-center"
              />
            </div>
            <Button onClick={handleEnterName} disabled={!guestName.trim()} className="w-full">
              <Video className="h-4 w-4 mr-2" />
              Join Meeting
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const meetingStarted = meetingInfo?.host_has_started || !!meetingInfo?.room_url;
  const hasPresentation = isConnected && (remoteScreenShare || hostMediaUrl || presenterState.isPresenting);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-card border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="font-semibold">{meetingInfo?.title || "Board Meeting"}</h1>
            <p className="text-sm text-muted-foreground">
              {formatMeetingDateTime()}
            </p>
          </div>
          {isConnected && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span className="text-sm">{participantCount}</span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {isConnected && (
            <>
              <Button
                variant={isMuted ? "destructive" : "secondary"}
                size="sm"
                onClick={toggleMute}
              >
                {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
              <Button
                variant={isVideoOff ? "destructive" : "secondary"}
                size="sm"
                onClick={toggleVideo}
              >
                {isVideoOff ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={leaveCall}
              >
                <PhoneOff className="h-4 w-4 mr-1.5" />
                Leave
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main content - full screen when connected */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Full-screen Video Grid (when connected) */}
        {isConnected && (
          <div className="flex-1 bg-slate-900 p-4 flex flex-col">
            {/* Main video grid */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0">
              {/* Local video - larger */}
              <div className="relative bg-slate-800 rounded-xl overflow-hidden flex items-center justify-center">
                {!isVideoOff ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center">
                    <div className="w-24 h-24 rounded-full bg-slate-700 flex items-center justify-center">
                      <span className="text-3xl font-semibold text-white">
                        {guestName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                )}
                <div className="absolute bottom-3 left-3 bg-black/70 px-3 py-1.5 rounded-lg text-sm text-white font-medium">
                  You ({guestName})
                </div>
                {isMuted && (
                  <div className="absolute top-3 right-3 bg-red-500/80 p-1.5 rounded-full">
                    <MicOff className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>

              {/* Remote participants - larger */}
              {remoteParticipants.map((participant) => (
                <div key={participant.id} className="relative bg-slate-800 rounded-xl overflow-hidden flex items-center justify-center">
                  {participant.videoTrack ? (
                    <RemoteParticipantVideo participant={participant} />
                  ) : (
                    <div className="flex items-center justify-center">
                      <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-3xl font-semibold text-primary">
                          {participant.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="absolute bottom-3 left-3 bg-black/70 px-3 py-1.5 rounded-lg text-sm text-white font-medium">
                    {participant.name}
                  </div>
                </div>
              ))}

              {/* Empty slot when waiting for host/others */}
              {remoteParticipants.length === 0 && (
                <div className="relative bg-slate-800/50 rounded-xl border-2 border-dashed border-slate-600 flex items-center justify-center">
                  <div className="text-center">
                    <Users className="h-12 w-12 text-slate-500 mx-auto mb-2" />
                    <span className="text-slate-400">Waiting for host...</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Scrollable content area */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          
          {/* Meeting Status Banner */}
          {!meetingStarted ? (
            <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
              <CardContent className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full mb-4">
                  <Clock className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                </div>
                <h2 className="text-xl font-semibold text-amber-800 dark:text-amber-200 mb-2">
                  Meeting starts {meetingInfo?.start_time ? `at ${meetingInfo.start_time.substring(0, 5)}` : 'soon'}
                </h2>
                <p className="text-amber-700 dark:text-amber-300">
                  Review the agenda, add questions, and prepare notes below while waiting for the host.
                </p>
                <Badge variant="outline" className="mt-3 border-amber-300 text-amber-700">
                  <Clock className="w-3 h-3 mr-1" />
                  Waiting for host
                </Badge>
              </CardContent>
            </Card>
          ) : !isConnected ? (
            <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
              <CardContent className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
                  <Video className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-xl font-semibold text-green-800 dark:text-green-200 mb-2">
                  Meeting is Live — Join Now
                </h2>
                <p className="text-green-700 dark:text-green-300 mb-4">
                  The host has started the meeting. Click below to join the video call.
                </p>
                <Button onClick={handleJoinVideo} disabled={isJoining} className="gap-2">
                  {isJoining ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Joining...
                    </>
                  ) : (
                    <>
                      <Video className="h-4 w-4" />
                      Join Video Call
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ) : null}

          {/* Screen Share / Media / Presenter Area (when connected) */}
          {isConnected && (remoteScreenShare || hostMediaUrl || (presenterState.isPresenting && meetingInfo?.id)) && (
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                {remoteScreenShare && (
                  <div className="relative w-full aspect-video bg-black">
                    <video
                      ref={screenShareVideoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute top-3 left-3 bg-black/70 px-3 py-1.5 rounded-md flex items-center gap-2">
                      <MonitorPlay className="h-4 w-4 text-green-400" />
                      <span className="text-sm text-white">{screenSharerName}'s Screen</span>
                    </div>
                  </div>
                )}

                {hostMediaUrl && !remoteScreenShare && (
                  <div className="relative w-full aspect-video bg-black">
                    <video
                      ref={mediaVideoRef}
                      src={hostMediaUrl}
                      autoPlay={isMediaPlaying}
                      controls
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute top-3 left-3 bg-black/70 px-3 py-1.5 rounded-md flex items-center gap-2">
                      <Film className="h-4 w-4 text-primary" />
                      <span className="text-sm text-white">Host Media</span>
                    </div>
                  </div>
                )}

                {presenterState.isPresenting && !remoteScreenShare && !hostMediaUrl && meetingInfo?.id && (
                  <GuestPresenterView
                    meetingId={meetingInfo.id}
                    presenterState={presenterState}
                    isFollowing={isFollowing}
                    onToggleFollowing={toggleFollowing}
                  />
                )}
              </CardContent>
            </Card>
          )}

          {/* Meeting Agenda */}
          <Collapsible open={memoOpen} onOpenChange={setMemoOpen}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CalendarDays className="w-5 h-5" />
                      Meeting Details
                    </CardTitle>
                    {memoOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span><strong>Date:</strong> {formatMeetingDateTime()}</span>
                    <span><strong>Duration:</strong> {meetingInfo?.duration_minutes || 45} minutes</span>
                  </div>

                  {meetingInfo?.memo && (
                    <div className="space-y-3 pt-4 border-t">
                      {meetingInfo.memo.purpose && (
                        <div>
                          <h4 className="font-medium text-sm text-muted-foreground mb-1">Purpose</h4>
                          <p>{meetingInfo.memo.purpose}</p>
                        </div>
                      )}
                      {meetingInfo.memo.objective && (
                        <div>
                          <h4 className="font-medium text-sm text-muted-foreground mb-1">Objective</h4>
                          <p>{meetingInfo.memo.objective}</p>
                        </div>
                      )}
                      {meetingInfo.memo.key_questions && meetingInfo.memo.key_questions.length > 0 && (
                        <div>
                          <h4 className="font-medium text-sm text-muted-foreground mb-1">Key Questions</h4>
                          <ul className="list-disc list-inside space-y-1">
                            {meetingInfo.memo.key_questions.map((q, i) => (
                              <li key={i}>{q}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Agenda Items */}
          <Collapsible open={agendaOpen} onOpenChange={setAgendaOpen}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ListChecks className="w-5 h-5" />
                      Agenda
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowAgendaInput(!showAgendaInput);
                        }}
                      >
                        <ListPlus className="w-4 h-4 mr-1" />
                        Suggest Item
                      </Button>
                      {agendaOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  {meetingInfo?.agenda_items && meetingInfo.agenda_items.length > 0 ? (
                    <ul className="space-y-2 mb-4">
                      {meetingInfo.agenda_items.map((item, i) => (
                        <li key={i} className={`flex items-start gap-2 ${item.checked ? 'text-muted-foreground line-through' : ''}`}>
                          <span className="text-muted-foreground font-mono text-sm">{i + 1}.</span>
                          <span>{item.text}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground text-sm mb-4">No agenda items yet.</p>
                  )}

                  {showAgendaInput && (
                    <div className="flex gap-2 pt-2 border-t">
                      <Input
                        placeholder="Suggest an agenda item..."
                        value={newAgendaItem}
                        onChange={(e) => setNewAgendaItem(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddAgendaItem()}
                      />
                      <Button onClick={handleAddAgendaItem} disabled={!newAgendaItem.trim()}>
                        Add
                      </Button>
                    </div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Pre-Meeting Questions */}
          <Collapsible open={questionsOpen} onOpenChange={setQuestionsOpen}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MessageSquare className="w-5 h-5" />
                      Questions & Notes
                      {meetingInfo?.member_questions && meetingInfo.member_questions.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {meetingInfo.member_questions.length}
                        </Badge>
                      )}
                    </CardTitle>
                    {questionsOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  {/* Existing questions */}
                  {meetingInfo?.member_questions && meetingInfo.member_questions.length > 0 && (
                    <div className="space-y-2">
                      {meetingInfo.member_questions.map((q) => (
                        <div key={q.id} className="p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">{q.author}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(q.created_at), "MMM d, h:mm a")}
                            </span>
                          </div>
                          <p className="text-sm">{q.text}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add new question */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a question or note..."
                      value={newQuestion}
                      onChange={(e) => setNewQuestion(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddQuestion()}
                    />
                    <Button onClick={handleAddQuestion} disabled={isAddingQuestion || !newQuestion.trim()}>
                      {isAddingQuestion ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Your questions will be visible to all participants.
                  </p>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Personal Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5" />
                My Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Add your personal notes for this meeting..."
                value={personalNotes}
                onChange={(e) => setPersonalNotes(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Notes are saved locally and visible only to you.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}