import { useState, useRef, useEffect, useCallback } from 'react';
import DailyIframe, { DailyCall } from '@daily-co/daily-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Participant {
  id: string;
  name: string;
  videoTrack?: MediaStreamTrack;
  audioTrack?: MediaStreamTrack;
  isVideoOff?: boolean;
  isMuted?: boolean;
  isLocal?: boolean;
}

export const useBoardMeetingVideo = (meetingNoteId: string) => {
  const [callObject, setCallObject] = useState<DailyCall | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [roomName, setRoomName] = useState<string>('');
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [hasActiveRoom, setHasActiveRoom] = useState(false);
  const [isCapturingAudio, setIsCapturingAudio] = useState(false);
  const [aiNotesStatus, setAiNotesStatus] = useState<string>('none');
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);
  const [screenShareTrack, setScreenShareTrack] = useState<MediaStreamTrack | null>(null);
  const [screenShareParticipantId, setScreenShareParticipantId] = useState<string | null>(null);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const screenShareRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Check if meeting has an active room
  useEffect(() => {
    const checkActiveRoom = async () => {
      if (!meetingNoteId) return;
      
      const result = await (supabase as any)
        .from('board_meeting_notes')
        .select('room_name, room_url')
        .eq('id', meetingNoteId)
        .single();
      
      const data = result.data as any;
      setHasActiveRoom(!!(data?.room_name && data?.room_url));
    };
    
    checkActiveRoom();
  }, [meetingNoteId]);

  // Internal function to start audio capture (used by joinRoom)
  const startAudioCaptureInternal = useCallback((daily: DailyCall) => {
    try {
      const allParticipants = daily.participants();
      const audioTracks: MediaStreamTrack[] = [];
      
      Object.values(allParticipants).forEach((p: any) => {
        if (p.tracks?.audio?.track) {
          audioTracks.push(p.tracks.audio.track);
        }
      });
      
      if (audioTracks.length === 0) {
        console.log('No audio tracks available yet for capture');
        return;
      }
      
      const combinedStream = new MediaStream(audioTracks);
      const recorder = new MediaRecorder(combinedStream, {
        mimeType: 'audio/webm;codecs=opus',
      });
      
      audioChunksRef.current = [];
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      recorder.onstop = async () => {
        console.log('Audio capture stopped, saving to storage...');
        // Save will be handled by endMeetingAndGenerateNotes
      };
      
      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setIsCapturingAudio(true);
      
      console.log('Auto-started audio capture with', audioTracks.length, 'tracks');
    } catch (error) {
      console.error('Error auto-starting audio capture:', error);
    }
  }, []);

  // Common function to join a Daily room
  const joinRoom = useCallback(async (roomUrl: string, token: string, roomNameVal: string) => {
    setRoomName(roomNameVal);

    // Create Daily call object
    const daily = DailyIframe.createCallObject({
      audioSource: true,
      videoSource: true,
    });

    // Set up event handlers
    daily.on('joined-meeting', () => {
      setIsConnected(true);
      setIsConnecting(false);
      
      // Get local video
      if (localVideoRef.current) {
        const localParticipant = daily.participants().local;
        if (localParticipant?.tracks?.video?.track) {
          const stream = new MediaStream([localParticipant.tracks.video.track]);
          localVideoRef.current.srcObject = stream;
        }
      }
      
      // Capture audio stream for AI transcription
      const localParticipant = daily.participants().local;
      if (localParticipant?.tracks?.audio?.track) {
        const audioOnlyStream = new MediaStream([localParticipant.tracks.audio.track]);
        setAudioStream(audioOnlyStream);
      }
      
      // Audio capture will start when user clicks Start Timer
      toast.success('Joined video meeting');
    });

    daily.on('left-meeting', () => {
      setIsConnected(false);
      setParticipants([]);
      setAudioStream(null);
    });

    daily.on('participant-joined', (event: any) => {
      if (!event?.participant || event.participant.local) return;
      
      const p = event.participant;
      setParticipants(prev => [...prev, {
        id: p.session_id,
        name: p.user_name || 'Guest',
        isVideoOff: !p.video,
        isMuted: !p.audio,
        isLocal: false,
      }]);
    });

    daily.on('participant-left', (event: any) => {
      if (!event?.participant) return;
      setParticipants(prev => prev.filter(p => p.id !== event.participant.session_id));
    });

    daily.on('participant-updated', (event: any) => {
      if (!event?.participant) return;
      const p = event.participant;
      
      if (p.local) {
        setIsMuted(!p.audio);
        setIsVideoOff(!p.video);
        
        // Update local video - only set if track exists
        if (localVideoRef.current) {
          if (p.tracks?.video?.track) {
            const stream = new MediaStream([p.tracks.video.track]);
            localVideoRef.current.srcObject = stream;
            localVideoRef.current.play().catch(e => console.log('Local video play error:', e));
          } else if (!p.video) {
            // Clear srcObject when video is explicitly off
            localVideoRef.current.srcObject = null;
          }
        }
      } else {
        setParticipants(prev => prev.map(participant =>
          participant.id === p.session_id
            ? { 
                ...participant, 
                isVideoOff: !p.video, 
                isMuted: !p.audio,
                videoTrack: p.tracks?.video?.track || undefined,
              }
            : participant
        ));
      }
    });

    // Handle video track events (camera + screen share)
    daily.on('track-started', (event: any) => {
      console.log('Track started:', event);
      if (event?.track?.kind === 'video' && event?.participant) {
        const trackType = event.type || '';
        
        // Handle screen share
        if (trackType === 'screenVideo' || event.participant?.tracks?.screenVideo?.track === event.track) {
          console.log('Screen share started by:', event.participant.user_name);
          setScreenShareTrack(event.track);
          setScreenShareParticipantId(event.participant.session_id);
          
          if (screenShareRef.current) {
            const stream = new MediaStream([event.track]);
            screenShareRef.current.srcObject = stream;
          }
        }
        // Handle local camera video (when toggled back on)
        else if (event.participant.local && localVideoRef.current) {
          console.log('Local camera video track started');
          const stream = new MediaStream([event.track]);
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.play().catch(e => console.log('Local video play error:', e));
        }
        // Handle remote participant camera video
        else if (!event.participant.local) {
          const participantId = event.participant.session_id;
          setParticipants(prev => prev.map(p => 
            p.id === participantId 
              ? { ...p, videoTrack: event.track, isVideoOff: false }
              : p
          ));
        }
      }
    });

    daily.on('track-stopped', (event: any) => {
      console.log('Track stopped:', event);
      // Check if the stopped track is the screen share
      if (event?.track === screenShareTrack || 
          (event?.participant?.session_id === screenShareParticipantId && 
           event?.type === 'screenVideo')) {
        console.log('Screen share stopped');
        setScreenShareTrack(null);
        setScreenShareParticipantId(null);
        if (screenShareRef.current) {
          screenShareRef.current.srcObject = null;
        }
      }
    });

    daily.on('recording-started', () => {
      setIsRecording(true);
      toast.success('Recording started');
    });

    daily.on('recording-stopped', () => {
      setIsRecording(false);
      toast.info('Recording stopped');
    });

    daily.on('recording-error', (event: any) => {
      console.error('Recording error:', event);
      toast.error('Recording error occurred');
    });

    daily.on('error', (event: any) => {
      console.error('Daily error:', event);
      toast.error(event?.errorMsg || 'Meeting error occurred');
    });

    setCallObject(daily);

    // Join the room
    await daily.join({
      url: roomUrl,
      token: token,
    });
  }, []);

  // Start a new video meeting (host)
  const startVideoMeeting = useCallback(async () => {
    if (!meetingNoteId || callObject) return;
    
    setIsConnecting(true);
    
    try {
      // Create board meeting room via edge function
      const { data, error } = await supabase.functions.invoke('daily-create-board-room', {
        body: { meetingNoteId },
      });

      if (error || !data) {
        throw new Error(data?.error || 'Failed to create meeting room');
      }

      setHasActiveRoom(true);
      await joinRoom(data.roomUrl, data.token, data.roomName);

    } catch (error: any) {
      console.error('Error starting video meeting:', error);
      toast.error(error.message || 'Failed to start video meeting');
      setIsConnecting(false);
    }
  }, [meetingNoteId, callObject, joinRoom]);

  // Join an existing video meeting (participant)
  const joinVideoMeeting = useCallback(async () => {
    if (!meetingNoteId || callObject) return;
    
    setIsConnecting(true);
    
    try {
      // Get participant token via edge function
      const { data, error } = await supabase.functions.invoke('daily-join-board-room', {
        body: { meetingNoteId },
      });

      if (error || !data) {
        throw new Error(data?.error || 'Failed to join meeting room');
      }

      await joinRoom(data.roomUrl, data.token, data.roomName);

    } catch (error: any) {
      console.error('Error joining video meeting:', error);
      toast.error(error.message || 'Failed to join video meeting');
      setIsConnecting(false);
    }
  }, [meetingNoteId, callObject, joinRoom]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (!callObject) return;
    callObject.setLocalAudio(!isMuted);
    setIsMuted(!isMuted);
  }, [callObject, isMuted]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (!callObject) return;
    callObject.setLocalVideo(!isVideoOff);
    setIsVideoOff(!isVideoOff);
  }, [callObject, isVideoOff]);

  // Start recording
  const startRecording = useCallback(async () => {
    if (!callObject || !roomName) return;
    
    try {
      await callObject.startRecording();
      
      // Update database
      await (supabase as any)
        .from('board_meeting_notes')
        .update({ recording_status: 'recording' })
        .eq('id', meetingNoteId);
        
    } catch (error: any) {
      console.error('Error starting recording:', error);
      toast.error('Failed to start recording');
    }
  }, [callObject, roomName, meetingNoteId]);

  // Stop recording
  const stopRecording = useCallback(async () => {
    if (!callObject) return;
    
    try {
      await callObject.stopRecording();
      
      // Update database
      await (supabase as any)
        .from('board_meeting_notes')
        .update({ recording_status: 'processing' })
        .eq('id', meetingNoteId);
        
    } catch (error: any) {
      console.error('Error stopping recording:', error);
      toast.error('Failed to stop recording');
    }
  }, [callObject, meetingNoteId]);

  // Leave meeting
  const leaveCall = useCallback(async () => {
    if (!callObject) return;
    
    try {
      if (isRecording) {
        await callObject.stopRecording();
      }
      // Stop audio capture if active
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      await callObject.leave();
      callObject.destroy();
      setCallObject(null);
      setIsConnected(false);
      setParticipants([]);
      setAudioStream(null);
      setIsCapturingAudio(false);
    } catch (error) {
      console.error('Error leaving call:', error);
    }
  }, [callObject, isRecording]);

  // Start capturing audio from the meeting
  const startAudioCapture = useCallback(async () => {
    if (!callObject || isCapturingAudio) return;
    
    try {
      // Get all audio tracks from participants
      const allParticipants = callObject.participants();
      const audioTracks: MediaStreamTrack[] = [];
      
      Object.values(allParticipants).forEach((p: any) => {
        if (p.tracks?.audio?.track) {
          audioTracks.push(p.tracks.audio.track);
        }
      });
      
      if (audioTracks.length === 0) {
        toast.error('No audio tracks available');
        return;
      }
      
      // Create a combined audio stream
      const combinedStream = new MediaStream(audioTracks);
      
      // Set up MediaRecorder
      const recorder = new MediaRecorder(combinedStream, {
        mimeType: 'audio/webm;codecs=opus',
      });
      
      audioChunksRef.current = [];
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      recorder.onstop = async () => {
        console.log('Audio capture stopped, saving to storage...');
        await saveAudioToStorage();
      };
      
      recorder.start(1000); // Collect data every second
      mediaRecorderRef.current = recorder;
      setIsCapturingAudio(true);
      
      toast.success('Audio capture started');
      console.log('Started audio capture with', audioTracks.length, 'tracks');
    } catch (error) {
      console.error('Error starting audio capture:', error);
      toast.error('Failed to start audio capture');
    }
  }, [callObject, isCapturingAudio, meetingNoteId]);

  // Stop audio capture
  const stopAudioCapture = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsCapturingAudio(false);
      toast.info('Audio capture stopped');
    }
  }, []);

  // Save captured audio to Supabase Storage
  const saveAudioToStorage = useCallback(async () => {
    if (audioChunksRef.current.length === 0 || !meetingNoteId) {
      console.log('No audio chunks to save');
      return null;
    }
    
    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const fileName = `${meetingNoteId}/${Date.now()}-meeting-audio.webm`;
      
      console.log('Saving audio file:', fileName, 'size:', audioBlob.size);
      
      const { data, error } = await supabase.storage
        .from('meeting-recordings')
        .upload(fileName, audioBlob, {
          contentType: 'audio/webm',
          upsert: false,
        });
      
      if (error) {
        console.error('Storage upload error:', error);
        throw error;
      }
      
      // Update meeting record with audio file URL
      const updateResult = await (supabase as any)
        .from('board_meeting_notes')
        .update({ 
          audio_file_url: fileName,
          ai_notes_status: 'audio_saved',
        })
        .eq('id', meetingNoteId);
      
      if (updateResult.error) {
        console.error('Update error:', updateResult.error);
      }
      
      toast.success('Meeting audio saved');
      console.log('Audio saved to storage:', data?.path);
      return fileName;
    } catch (error) {
      console.error('Error saving audio:', error);
      toast.error('Failed to save meeting audio');
      return null;
    }
  }, [meetingNoteId]);

  // Stop AI capture and generate notes (without ending call)
  const stopAIAndGenerateNotes = useCallback(async () => {
    if (!meetingNoteId) return;
    
    setIsGeneratingNotes(true);
    
    try {
      // Stop audio capture and save
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        setIsCapturingAudio(false);
        // Wait for onstop handler to save audio
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Get the saved audio file path
      const meetingResult = await (supabase as any)
        .from('board_meeting_notes')
        .select('audio_file_url')
        .eq('id', meetingNoteId)
        .single();
      
      const meetingData = meetingResult.data as any;
      const audioFilePath = meetingData?.audio_file_url;
      
      if (!audioFilePath) {
        const existingResult = await (supabase as any)
          .from('board_meeting_notes')
          .select('audio_transcript')
          .eq('id', meetingNoteId)
          .single();
        
        const existingData = existingResult.data as any;
        if (!existingData?.audio_transcript) {
          toast.error('No audio recorded. Please start the timer first to begin recording.');
          setIsGeneratingNotes(false);
          return;
        }
      }
      
      // Step 1: Transcribe audio (if we have audio file)
      if (audioFilePath) {
        setAiNotesStatus('transcribing');
        toast.info('Transcribing meeting audio...');
        
        const { data: transcribeData, error: transcribeError } = await supabase.functions.invoke(
          'transcribe-meeting-audio',
          { body: { meetingNoteId, audioFilePath } }
        );
        
        if (transcribeError || transcribeData?.error) {
          throw new Error(transcribeData?.error || 'Transcription failed');
        }
        
        toast.success('Transcription complete');
      }
      
      // Step 2: Generate AI notes
      setAiNotesStatus('generating');
      toast.info('Generating AI meeting notes...');
      
      const { data: notesData, error: notesError } = await supabase.functions.invoke(
        'generate-board-ai-notes',
        { body: { meetingNoteId } }
      );
      
      if (notesError || notesData?.error) {
        throw new Error(notesData?.error || 'AI notes generation failed');
      }
      
      setAiNotesStatus('draft');
      toast.success('AI meeting notes generated! Review and publish when ready.');
      
    } catch (error: any) {
      console.error('Error generating notes:', error);
      toast.error(error.message || 'Failed to generate meeting notes');
      setAiNotesStatus('error');
    } finally {
      setIsGeneratingNotes(false);
    }
  }, [meetingNoteId]);

  // End call only (no note generation)
  const endCall = useCallback(async () => {
    if (!callObject) return;
    
    try {
      // Stop audio capture if active
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        setIsCapturingAudio(false);
      }
      await callObject.leave();
      callObject.destroy();
      setCallObject(null);
      setIsConnected(false);
      setParticipants([]);
      setAudioStream(null);
      toast.info('Left video meeting');
    } catch (error) {
      console.error('Error leaving call:', error);
    }
  }, [callObject]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (callObject) {
        callObject.leave().catch(console.error);
        callObject.destroy();
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, [callObject]);

  return {
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
    audioStream,
    hasActiveRoom,
    startVideoMeeting,
    joinVideoMeeting,
    toggleMute,
    toggleVideo,
    startAudioCapture,
    stopAudioCapture,
    stopAIAndGenerateNotes,
    endCall,
  };
};
