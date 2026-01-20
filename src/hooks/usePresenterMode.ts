import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

// Meeting sections (in-page navigation)
export type MeetingSection = 
  | 'agenda' 
  | 'decisions' 
  | 'ai-notes' 
  | 'questions' 
  | 'summary'
  | 'video-only';

// Board Portal routes (full page navigation)
export type BoardPortalRoute =
  | 'board-dashboard'
  | 'board-business-model'
  | 'board-gtm'
  | 'board-forecasts'
  | 'board-videos'
  | 'board-docs';

// Combined type
export type PresenterSection = MeetingSection | BoardPortalRoute;

// Check if section is a Board Portal route
export const isBoardPortalRoute = (section: PresenterSection): section is BoardPortalRoute => {
  return section.startsWith('board-');
};

// Get route path for Board Portal sections
export const getBoardPortalPath = (section: BoardPortalRoute): string => {
  const routes: Record<BoardPortalRoute, string> = {
    'board-dashboard': '/board',
    'board-business-model': '/board/business-model',
    'board-gtm': '/board/gtm',
    'board-forecasts': '/board/forecasts',
    'board-videos': '/board/videos',
    'board-docs': '/board/docs',
  };
  return routes[section];
};

export interface PresenterState {
  isPresenting: boolean;
  currentSection: PresenterSection;
  hostName: string;
  scrollPosition?: number;
  customContent?: string;
  meetingId?: string; // Include meeting ID for return navigation
}

interface UsePresenterModeOptions {
  meetingId: string;
  isHost: boolean;
  hostName?: string;
}

export function usePresenterMode({ meetingId, isHost, hostName = "Host" }: UsePresenterModeOptions) {
  const [presenterState, setPresenterState] = useState<PresenterState>({
    isPresenting: false,
    currentSection: 'video-only',
    hostName,
  });
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [isFollowing, setIsFollowing] = useState(true); // Attendees can toggle off

  // Set up realtime channel
  useEffect(() => {
    if (!meetingId) return;

    const channelName = `presenter:${meetingId}`;
    console.log("[PresenterMode] Setting up channel:", channelName);

    const presenterChannel = supabase.channel(channelName, {
      config: {
        broadcast: { self: false },
        presence: { key: isHost ? 'host' : `guest-${Date.now()}` },
      },
    });

    presenterChannel
      .on('broadcast', { event: 'presenter_update' }, (payload) => {
        console.log("[PresenterMode] Received update:", payload);
        if (!isHost && isFollowing) {
          setPresenterState(payload.payload as PresenterState);
        }
      })
      .subscribe((status) => {
        console.log("[PresenterMode] Channel status:", status);
      });

    setChannel(presenterChannel);

    return () => {
      console.log("[PresenterMode] Cleaning up channel");
      supabase.removeChannel(presenterChannel);
    };
  }, [meetingId, isHost]);

  // Host: Broadcast state changes
  const broadcastState = useCallback((newState: Partial<PresenterState>) => {
    if (!channel || !isHost) return;

    const updatedState = { ...presenterState, ...newState };
    setPresenterState(updatedState);

    console.log("[PresenterMode] Broadcasting:", updatedState);
    channel.send({
      type: 'broadcast',
      event: 'presenter_update',
      payload: updatedState,
    });
  }, [channel, isHost, presenterState]);

  // Host: Start presenting
  const startPresenting = useCallback(() => {
    broadcastState({ isPresenting: true, currentSection: 'agenda', hostName, meetingId });
  }, [broadcastState, hostName, meetingId]);

  // Host: Stop presenting
  const stopPresenting = useCallback(() => {
    broadcastState({ isPresenting: false, currentSection: 'video-only' });
  }, [broadcastState]);

  // Host: Navigate to section
  const navigateToSection = useCallback((section: PresenterSection) => {
    broadcastState({ currentSection: section });
  }, [broadcastState]);

  // Attendee: Toggle following
  const toggleFollowing = useCallback(() => {
    setIsFollowing(prev => !prev);
  }, []);

  return {
    presenterState,
    isFollowing,
    // Host controls
    startPresenting,
    stopPresenting,
    navigateToSection,
    broadcastState,
    // Attendee controls
    toggleFollowing,
  };
}
