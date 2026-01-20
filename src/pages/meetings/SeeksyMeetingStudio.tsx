import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut, Clock, Users, Shield, Video, AlertCircle } from 'lucide-react';
import MeetingControls from '@/components/meetings/MeetingControls';
import MeetingParticipantGrid from '@/components/meetings/MeetingParticipantGrid';
import MeetingChat from '@/components/meetings/MeetingChat';
import MeetingWaitingRoom from '@/components/meetings/MeetingWaitingRoom';
import { useDailyMeeting } from '@/hooks/useDailyMeeting';

const SeeksyMeetingStudio = () => {
  const { meetingId } = useParams<{ meetingId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [meeting, setMeeting] = useState<any>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isWaitingRoomOpen, setIsWaitingRoomOpen] = useState(false);
  const [showPreJoin, setShowPreJoin] = useState(true);

  const {
    isConnected,
    isConnecting,
    isHost,
    isMuted,
    isVideoOff,
    isScreenSharing,
    isRecording,
    participants,
    waitingParticipants,
    localVideoRef,
    meetingTitle,
    initializeCall,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
    startRecording,
    stopRecording,
    admitParticipant,
    rejectParticipant,
    leaveCall,
    endMeeting,
  } = useDailyMeeting(meetingId || '');

  // Fetch meeting details
  useEffect(() => {
    if (!meetingId) return;

    const fetchMeeting = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .eq('id', meetingId)
        .single();

      if (error || !data) {
        toast({ title: 'Meeting not found', variant: 'destructive' });
        navigate('/');
        return;
      }

      setMeeting(data);
    };

    fetchMeeting();
  }, [meetingId, navigate, toast]);

  // Timer
  useEffect(() => {
    if (!isConnected) return;
    
    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isConnected]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleJoinMeeting = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const isHostUser = meeting?.user_id === user?.id;
    
    setShowPreJoin(false);
    await initializeCall(isHostUser);
  };

  const handleLeave = async () => {
    await leaveCall();
    navigate('/admin/meetings/scheduled');
  };

  const handleEndMeeting = async () => {
    await endMeeting();
    navigate('/admin/meetings/scheduled');
  };

  // Loading state
  if (!meeting) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-slate-400">Loading meeting...</p>
        </div>
      </div>
    );
  }

  // Pre-join screen
  if (showPreJoin) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full mx-4 text-center">
          <div className="w-16 h-16 bg-[#053877] rounded-full flex items-center justify-center mx-auto mb-6">
            <Video className="h-8 w-8 text-white" />
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-2">{meeting.title}</h1>
          <p className="text-slate-400 mb-6">
            {meeting.description || 'Ready to join the meeting?'}
          </p>

          {/* Preview video */}
          <div className="relative bg-slate-700 rounded-xl overflow-hidden aspect-video mb-6">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-3 left-3 bg-slate-900/80 px-3 py-1 rounded-lg">
              <span className="text-white text-sm">Preview</span>
            </div>
          </div>

          <Button
            onClick={handleJoinMeeting}
            disabled={isConnecting}
            className="w-full bg-[#053877] hover:bg-[#053877]/90 text-white rounded-lg h-12"
          >
            {isConnecting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Connecting...
              </>
            ) : (
              'Join Meeting'
            )}
          </Button>

          <p className="text-slate-500 text-sm mt-4">
            By joining, you agree to our terms of service
          </p>
        </div>
      </div>
    );
  }

  // Waiting for host screen (for non-hosts when room not ready)
  if (!isConnected && !isConnecting) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full mx-4 text-center">
          <AlertCircle className="h-12 w-12 text-amber-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Waiting for host</h2>
          <p className="text-slate-400">
            The host hasn't started the meeting yet. Please wait...
          </p>
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="mt-6"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Top Bar */}
      <div className="h-14 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <h1 className="text-white font-medium">{meetingTitle || meeting.title}</h1>
          {isHost && (
            <Badge variant="secondary" className="bg-amber-500/20 text-amber-400 border-amber-500/30">
              <Shield className="h-3 w-3 mr-1" />
              Host
            </Badge>
          )}
          {isRecording && (
            <Badge variant="secondary" className="bg-red-500/20 text-red-400 border-red-500/30 animate-pulse">
              <div className="w-2 h-2 bg-red-500 rounded-full mr-2" />
              Recording
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-slate-300">
            <Clock className="h-4 w-4" />
            <span className="font-mono">{formatTime(elapsedTime)}</span>
          </div>

          <div className="flex items-center gap-2 text-slate-300">
            <Users className="h-4 w-4" />
            <span>{participants.length + 1}</span>
          </div>

          {isHost && waitingParticipants.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsWaitingRoomOpen(true)}
              className="border-amber-500 text-amber-400 hover:bg-amber-500/20"
            >
              {waitingParticipants.length} waiting
            </Button>
          )}

          <Button
            variant="destructive"
            size="sm"
            onClick={handleLeave}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Leave
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Video Grid */}
        <div className={`flex-1 p-4 ${isChatOpen ? 'pr-0' : ''}`}>
          <MeetingParticipantGrid
            participants={participants}
            localVideoRef={localVideoRef}
            isVideoOff={isVideoOff}
            isScreenSharing={isScreenSharing}
          />
        </div>

        {/* Chat Drawer */}
        {isChatOpen && (
          <MeetingChat
            meetingId={meetingId || ''}
            onClose={() => setIsChatOpen(false)}
          />
        )}
      </div>

      {/* Bottom Controls */}
      <MeetingControls
        isMuted={isMuted}
        isVideoOff={isVideoOff}
        isScreenSharing={isScreenSharing}
        isRecording={isRecording}
        isHost={isHost}
        isChatOpen={isChatOpen}
        onToggleMute={toggleMute}
        onToggleVideo={toggleVideo}
        onToggleScreenShare={toggleScreenShare}
        onToggleChat={() => setIsChatOpen(!isChatOpen)}
        onStartRecording={startRecording}
        onStopRecording={stopRecording}
        onEndMeeting={handleEndMeeting}
      />

      {/* Waiting Room Modal */}
      {isWaitingRoomOpen && (
        <MeetingWaitingRoom
          participants={waitingParticipants.map(p => ({
            id: p.id,
            guest_name: p.user_name,
            created_at: new Date().toISOString(),
          }))}
          onAdmit={admitParticipant}
          onReject={rejectParticipant}
          onClose={() => setIsWaitingRoomOpen(false)}
        />
      )}
    </div>
  );
};

export default SeeksyMeetingStudio;
