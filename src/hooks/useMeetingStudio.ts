import { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Participant {
  id: string;
  name: string;
  videoTrack?: MediaStreamTrack;
  audioTrack?: MediaStreamTrack;
  isVideoOff?: boolean;
  isMuted?: boolean;
}

export const useMeetingStudio = (meetingId: string) => {
  const { toast } = useToast();
  
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Initialize local media
  useEffect(() => {
    const initLocalMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        
        localStreamRef.current = stream;
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        
        setIsConnected(true);
      } catch (error) {
        console.error('Error accessing media devices:', error);
        toast({
          title: 'Camera/Microphone access denied',
          description: 'Please allow access to your camera and microphone to join the meeting.',
          variant: 'destructive',
        });
      }
    };

    if (meetingId) {
      initLocalMedia();
    }

    return () => {
      // Cleanup streams on unmount
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [meetingId]);

  const joinCall = useCallback(async () => {
    setIsConnecting(true);
    
    try {
      // Record participant joining
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase.from('meeting_participants').insert({
        meeting_id: meetingId,
        user_id: user?.id,
        role: 'guest',
        status: 'in-meeting',
        joined_at: new Date().toISOString(),
      });

      setIsConnected(true);
    } catch (error) {
      console.error('Error joining call:', error);
      toast({
        title: 'Failed to join meeting',
        variant: 'destructive',
      });
    } finally {
      setIsConnecting(false);
    }
  }, [meetingId, toast]);

  const leaveCall = useCallback(async () => {
    // Stop all tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
    }

    // Update participant record
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('meeting_participants')
        .update({ 
          status: 'left',
          left_at: new Date().toISOString() 
        })
        .eq('meeting_id', meetingId)
        .eq('user_id', user.id);
    }

    setIsConnected(false);
  }, [meetingId]);

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  }, []);

  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  }, []);

  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      // Stop screen sharing
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
        screenStreamRef.current = null;
      }
      
      // Restore camera
      if (localStreamRef.current && localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
      
      setIsScreenSharing(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
        
        screenStreamRef.current = screenStream;
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        
        // Handle when user stops sharing via browser UI
        screenStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          if (localStreamRef.current && localVideoRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current;
          }
        };
        
        setIsScreenSharing(true);
      } catch (error) {
        console.error('Error sharing screen:', error);
        toast({
          title: 'Screen share cancelled',
          variant: 'default',
        });
      }
    }
  }, [isScreenSharing, toast]);

  const startRecording = useCallback(async () => {
    const streamToRecord = screenStreamRef.current || localStreamRef.current;
    
    if (!streamToRecord) {
      toast({
        title: 'No media to record',
        variant: 'destructive',
      });
      return;
    }

    try {
      recordedChunksRef.current = [];
      
      const mediaRecorder = new MediaRecorder(streamToRecord, {
        mimeType: 'video/webm;codecs=vp9',
      });
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        await saveRecording(blob);
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000); // Collect data every second
      
      setIsRecording(true);
      toast({ title: 'Recording started' });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: 'Failed to start recording',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast({ title: 'Recording stopped. Saving...' });
    }
  }, [toast]);

  const saveRecording = async (blob: Blob) => {
    try {
      const filename = `meeting-${meetingId}-${Date.now()}.webm`;
      const { data: { user } } = await supabase.auth.getUser();
      
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('studio-recordings')
        .upload(`${user?.id}/${filename}`, blob);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('studio-recordings')
        .getPublicUrl(`${user?.id}/${filename}`);

      // Save recording record
      await supabase.from('meeting_recordings').insert({
        meeting_id: meetingId,
        recording_url: publicUrl,
        storage_path: uploadData.path,
        file_size_bytes: blob.size,
        status: 'ready',
      });

      toast({ title: 'Recording saved successfully!' });
    } catch (error) {
      console.error('Error saving recording:', error);
      toast({
        title: 'Failed to save recording',
        variant: 'destructive',
      });
    }
  };

  return {
    isConnected,
    isConnecting,
    isMuted,
    isVideoOff,
    isScreenSharing,
    isRecording,
    participants,
    localVideoRef,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
    startRecording,
    stopRecording,
    leaveCall,
    joinCall,
  };
};
