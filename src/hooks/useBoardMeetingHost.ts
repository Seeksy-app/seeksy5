import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UseBoardMeetingHostOptions {
  meetingId: string | undefined;
  onAudioCaptureStart?: () => void;
  onAudioCaptureStop?: () => void;
}

export function useBoardMeetingHost({
  meetingId,
  onAudioCaptureStart,
  onAudioCaptureStop,
}: UseBoardMeetingHostOptions) {
  const [isHost, setIsHost] = useState(false);
  const [hostHasStarted, setHostHasStarted] = useState(false);
  const [isMediaPlaying, setIsMediaPlaying] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [wasCapturingBeforeMedia, setWasCapturingBeforeMedia] = useState(false);
  const [isLoadingHost, setIsLoadingHost] = useState(true);

  // Check if current user is host + subscribe to realtime updates
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    
    const checkHost = async () => {
      if (!meetingId) {
        setIsLoadingHost(false);
        return;
      }

      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
          setIsHost(false);
          setIsLoadingHost(false);
          return;
        }

        const result = await (supabase as any)
          .from('board_meeting_notes')
          .select('host_user_id, host_has_started, created_by')
          .eq('id', meetingId)
          .single();

        if (result.data) {
          const meeting = result.data as any;
          // Host is either the designated host_user_id or the creator
          const hostId = meeting.host_user_id || meeting.created_by;
          setIsHost(userData.user.id === hostId);
          setHostHasStarted(meeting.host_has_started || false);
        }

        // Subscribe to realtime updates for this meeting (for participants to know when host starts)
        channel = supabase
          .channel(`board-meeting-${meetingId}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'board_meeting_notes',
              filter: `id=eq.${meetingId}`,
            },
            (payload) => {
              const updated = payload.new as { host_has_started?: boolean; status?: string };
              if (updated.host_has_started !== undefined) {
                setHostHasStarted(updated.host_has_started);
              }
            }
          )
          .subscribe();
      } catch (error) {
        console.error('Error checking host status:', error);
      } finally {
        setIsLoadingHost(false);
      }
    };

    checkHost();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [meetingId]);

  // Start meeting as host
  const startMeetingAsHost = useCallback(async () => {
    if (!meetingId || !isHost) {
      toast.error('Only the host can start the meeting');
      return false;
    }

    try {
      const result = await (supabase as any)
        .from('board_meeting_notes')
        .update({
          host_has_started: true,
          started_at: new Date().toISOString(),
          status: 'active',
        })
        .eq('id', meetingId);

      if (result.error) throw result.error;

      setHostHasStarted(true);
      toast.success('Meeting started');

      // Push GTM event
      if (typeof window !== 'undefined' && (window as any).dataLayer) {
        (window as any).dataLayer.push({
          event: 'board_meeting_started',
          meeting_id: meetingId,
        });
      }

      return true;
    } catch (error) {
      console.error('Error starting meeting:', error);
      toast.error('Failed to start meeting');
      return false;
    }
  }, [meetingId, isHost]);

  // Handle media playback state change (pause/resume AI)
  const handleMediaPlayStateChange = useCallback((playing: boolean) => {
    setIsMediaPlaying(playing);

    if (playing && aiEnabled) {
      // Media started - pause AI capture
      setWasCapturingBeforeMedia(true);
      onAudioCaptureStop?.();

      // Push GTM event
      if (typeof window !== 'undefined' && (window as any).dataLayer) {
        (window as any).dataLayer.push({
          event: 'ai_paused_media',
          meeting_id: meetingId,
        });
      }

      toast.info('AI capture paused during media playback');
    } else if (!playing && wasCapturingBeforeMedia && aiEnabled) {
      // Media stopped - resume AI capture
      setWasCapturingBeforeMedia(false);
      onAudioCaptureStart?.();

      // Push GTM event
      if (typeof window !== 'undefined' && (window as any).dataLayer) {
        (window as any).dataLayer.push({
          event: 'ai_resumed_media',
          meeting_id: meetingId,
        });
      }

      toast.info('AI capture resumed');
    }
  }, [aiEnabled, wasCapturingBeforeMedia, meetingId, onAudioCaptureStart, onAudioCaptureStop]);

  // Toggle AI enabled state and start/stop audio capture
  const toggleAI = useCallback((enabled: boolean) => {
    setAiEnabled(enabled);
    if (enabled) {
      onAudioCaptureStart?.();
    } else {
      onAudioCaptureStop?.();
    }
  }, [onAudioCaptureStart, onAudioCaptureStop]);

  // End meeting as host
  const endMeetingAsHost = useCallback(async () => {
    if (!meetingId || !isHost) {
      toast.error('Only the host can end the meeting');
      return false;
    }

    try {
      const result = await (supabase as any)
        .from('board_meeting_notes')
        .update({
          status: 'completed',
          ended_at: new Date().toISOString(),
        })
        .eq('id', meetingId);

      if (result.error) throw result.error;

      // Push GTM event
      if (typeof window !== 'undefined' && (window as any).dataLayer) {
        (window as any).dataLayer.push({
          event: 'board_meeting_ended',
          meeting_id: meetingId,
        });
      }

      toast.success('Meeting ended successfully');
      return true;
    } catch (error) {
      console.error('Error ending meeting:', error);
      toast.error('Failed to end meeting');
      return false;
    }
  }, [meetingId, isHost]);

  return {
    isHost,
    hostHasStarted,
    isMediaPlaying,
    aiEnabled,
    isLoadingHost,
    startMeetingAsHost,
    endMeetingAsHost,
    handleMediaPlayStateChange,
    toggleAI,
  };
}
