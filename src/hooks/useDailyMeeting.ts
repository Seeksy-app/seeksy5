import { useState, useRef, useEffect, useCallback } from 'react';
import DailyIframe, { DailyCall } from '@daily-co/daily-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface WaitingParticipant {
  id: string;
  session_id: string;
  user_name: string;
}

interface Participant {
  id: string;
  name: string;
  videoTrack?: MediaStreamTrack;
  audioTrack?: MediaStreamTrack;
  isVideoOff?: boolean;
  isMuted?: boolean;
  isScreenSharing?: boolean;
  isLocal?: boolean;
}

export const useDailyMeeting = (meetingId: string) => {
  const { toast } = useToast();
  
  const [callObject, setCallObject] = useState<DailyCall | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [waitingParticipants, setWaitingParticipants] = useState<WaitingParticipant[]>([]);
  const [roomName, setRoomName] = useState<string>('');
  const [meetingTitle, setMeetingTitle] = useState<string>('');
  
  const localVideoRef = useRef<HTMLVideoElement>(null);

  // Initialize Daily call
  const initializeCall = useCallback(async (isHostUser: boolean) => {
    if (!meetingId || callObject) return;
    
    setIsConnecting(true);
    
    try {
      // Create or join the Daily room
      const functionName = isHostUser ? 'daily-create-meeting-room' : 'daily-join-meeting';
      
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { meetingId, enableWaitingRoom: true },
      });

      if (error || !data) {
        throw new Error(data?.error || 'Failed to initialize meeting');
      }

      setRoomName(data.roomName);
      setIsHost(data.isHost);
      setMeetingTitle(data.meetingTitle || '');

      // Create Daily call object
      const daily = DailyIframe.createCallObject({
        audioSource: true,
        videoSource: true,
      });

      // Set up event handlers
      daily.on('joined-meeting', handleJoinedMeeting);
      daily.on('left-meeting', handleLeftMeeting);
      daily.on('participant-joined', handleParticipantJoined);
      daily.on('participant-left', handleParticipantLeft);
      daily.on('participant-updated', handleParticipantUpdated);
      daily.on('recording-started', () => setIsRecording(true));
      daily.on('recording-stopped', () => setIsRecording(false));
      daily.on('recording-error', handleRecordingError);
      daily.on('waiting-participant-added', handleWaitingParticipantAdded);
      daily.on('waiting-participant-removed', handleWaitingParticipantRemoved);
      daily.on('error', handleError);

      setCallObject(daily);

      // Join the room
      await daily.join({
        url: data.roomUrl,
        token: data.token,
      });

    } catch (error: any) {
      console.error('Error initializing call:', error);
      toast({
        title: 'Failed to join meeting',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
      setIsConnecting(false);
    }
  }, [meetingId, callObject, toast]);

  // Event handlers
  const handleJoinedMeeting = useCallback(() => {
    setIsConnected(true);
    setIsConnecting(false);
    
    // Get local video element
    if (localVideoRef.current && callObject) {
      const localParticipant = callObject.participants().local;
      if (localParticipant?.tracks?.video?.track) {
        const stream = new MediaStream([localParticipant.tracks.video.track]);
        localVideoRef.current.srcObject = stream;
      }
    }
    
    toast({ title: 'Joined meeting successfully' });
  }, [callObject, toast]);

  const handleLeftMeeting = useCallback(() => {
    setIsConnected(false);
    setParticipants([]);
  }, []);

  const handleParticipantJoined = useCallback((event: any) => {
    if (!event?.participant || event.participant.local) return;
    
    const p = event.participant;
    setParticipants(prev => [...prev, {
      id: p.session_id,
      name: p.user_name || 'Guest',
      isVideoOff: !p.video,
      isMuted: !p.audio,
    }]);
  }, []);

  const handleParticipantLeft = useCallback((event: any) => {
    if (!event?.participant) return;
    setParticipants(prev => prev.filter(p => p.id !== event.participant.session_id));
  }, []);

  const handleParticipantUpdated = useCallback((event: any) => {
    if (!event?.participant) return;
    const p = event.participant;
    
    if (p.local) {
      setIsMuted(!p.audio);
      setIsVideoOff(!p.video);
      setIsScreenSharing(p.screen || false);
      
      // Update local video
      if (localVideoRef.current && p.tracks?.video?.track) {
        const stream = new MediaStream([p.tracks.video.track]);
        localVideoRef.current.srcObject = stream;
      }
    } else {
      setParticipants(prev => prev.map(participant => 
        participant.id === p.session_id
          ? { ...participant, isVideoOff: !p.video, isMuted: !p.audio, isScreenSharing: p.screen }
          : participant
      ));
    }
  }, []);

  const handleWaitingParticipantAdded = useCallback((event: any) => {
    if (!event?.participant) return;
    const p = event.participant;
    setWaitingParticipants(prev => [...prev, {
      id: p.id,
      session_id: p.id,
      user_name: p.name || 'Guest',
    }]);
  }, []);

  const handleWaitingParticipantRemoved = useCallback((event: any) => {
    if (!event?.participant) return;
    setWaitingParticipants(prev => prev.filter(p => p.id !== event.participant.id));
  }, []);

  const handleRecordingError = useCallback((event: any) => {
    console.error('Recording error:', event);
    setIsRecording(false);
    toast({
      title: 'Recording could not start',
      description: 'Please try again.',
      variant: 'destructive',
    });
  }, [toast]);

  const handleError = useCallback((event: any) => {
    console.error('Daily error:', event);
    toast({
      title: 'Meeting error',
      description: event?.errorMsg || 'An error occurred',
      variant: 'destructive',
    });
  }, [toast]);

  // Control functions
  const toggleMute = useCallback(() => {
    if (!callObject) return;
    callObject.setLocalAudio(!isMuted ? false : true);
  }, [callObject, isMuted]);

  const toggleVideo = useCallback(() => {
    if (!callObject) return;
    callObject.setLocalVideo(!isVideoOff ? false : true);
  }, [callObject, isVideoOff]);

  const toggleScreenShare = useCallback(async () => {
    if (!callObject) return;
    
    try {
      if (isScreenSharing) {
        await callObject.stopScreenShare();
      } else {
        await callObject.startScreenShare();
      }
    } catch (error) {
      console.error('Screen share error:', error);
      toast({
        title: 'Screen share cancelled',
        variant: 'default',
      });
    }
  }, [callObject, isScreenSharing, toast]);

  const startRecording = useCallback(async () => {
    if (!callObject || !isHost || !roomName) {
      toast({
        title: 'Cannot start recording',
        description: 'Only the host can start recording',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase.functions.invoke('daily-start-recording', {
        body: { meetingId, roomName },
      });

      if (error) throw error;
      
      // Also trigger via Daily SDK
      await callObject.startRecording({
        layout: { preset: 'active-participant' },
      });
      
      toast({ title: 'Recording started' });
    } catch (error: any) {
      console.error('Error starting recording:', error);
      toast({
        title: 'Recording could not start',
        description: 'Please try again.',
        variant: 'destructive',
      });
    }
  }, [callObject, isHost, roomName, meetingId, toast]);

  const stopRecording = useCallback(async () => {
    if (!callObject || !isHost) return;

    try {
      await callObject.stopRecording();
      
      await supabase.functions.invoke('daily-stop-meeting-recording', {
        body: { meetingId, roomName },
      });
      
      toast({ title: 'Recording stopped. Processing...' });
    } catch (error) {
      console.error('Error stopping recording:', error);
    }
  }, [callObject, isHost, meetingId, roomName, toast]);

  const admitParticipant = useCallback(async (participantId: string) => {
    if (!callObject || !isHost) return;
    
    try {
      await callObject.updateWaitingParticipant(participantId, { grantRequestedAccess: true });
      toast({ title: 'Participant admitted' });
    } catch (error) {
      console.error('Error admitting participant:', error);
    }
  }, [callObject, isHost, toast]);

  const rejectParticipant = useCallback(async (participantId: string) => {
    if (!callObject || !isHost) return;
    
    try {
      await callObject.updateWaitingParticipant(participantId, { grantRequestedAccess: false });
    } catch (error) {
      console.error('Error rejecting participant:', error);
    }
  }, [callObject, isHost]);

  const muteParticipant = useCallback(async (participantId: string) => {
    if (!callObject || !isHost) return;
    
    try {
      await callObject.updateParticipant(participantId, { setAudio: false });
      toast({ title: 'Participant muted' });
    } catch (error) {
      console.error('Error muting participant:', error);
    }
  }, [callObject, isHost, toast]);

  const removeParticipant = useCallback(async (participantId: string) => {
    if (!callObject || !isHost) return;
    
    try {
      await callObject.updateParticipant(participantId, { eject: true });
      toast({ title: 'Participant removed' });
    } catch (error) {
      console.error('Error removing participant:', error);
    }
  }, [callObject, isHost, toast]);

  const leaveCall = useCallback(async () => {
    if (!callObject) return;
    
    await callObject.leave();
    callObject.destroy();
    setCallObject(null);
    
    // Update participant record
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await (supabase as any)
        .from('meeting_participants')
        .update({ left_at: new Date().toISOString() })
        .eq('meeting_id', meetingId)
        .eq('user_id', user.id);
    }
  }, [callObject, meetingId]);

  const endMeeting = useCallback(async () => {
    if (!callObject || !isHost) return;
    
    try {
      // Stop recording if active
      if (isRecording) {
        await stopRecording();
      }
      
      // End meeting via API
      await supabase.functions.invoke('daily-end-meeting', {
        body: { meetingId, roomName },
      });
      
      await leaveCall();
      toast({ title: 'Meeting ended for all participants' });
    } catch (error) {
      console.error('Error ending meeting:', error);
      await leaveCall();
    }
  }, [callObject, isHost, isRecording, meetingId, roomName, stopRecording, leaveCall, toast]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (callObject) {
        callObject.leave();
        callObject.destroy();
      }
    };
  }, [callObject]);

  return {
    callObject,
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
    roomName,
    initializeCall,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
    startRecording,
    stopRecording,
    admitParticipant,
    rejectParticipant,
    muteParticipant,
    removeParticipant,
    leaveCall,
    endMeeting,
  };
};
