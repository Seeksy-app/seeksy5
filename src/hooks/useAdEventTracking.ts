import { useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

type AdEventType = 'start' | 'first_quartile' | 'midpoint' | 'third_quartile' | 'complete' | 'skip' | 'error';
type AdPosition = 'pre' | 'mid' | 'post';

interface AdEventContext {
  adId: string;
  placementId: string;
  videoId: string;
  channelId?: string | null;
  position: AdPosition;
  viewerSessionId: string;
  durationSeconds?: number;
}

// Error codes for ad failures
export const AD_ERROR_CODES: Record<string, string> = {
  MEDIA_404: 'AD_MEDIA_404',
  MEDIA_TIMEOUT: 'AD_MEDIA_TIMEOUT',
  MEDIA_DECODE: 'AD_MEDIA_DECODE_ERROR',
  EDGE_NO_RESPONSE: 'AD_EDGE_NO_RESPONSE',
  UNKNOWN: 'AD_UNKNOWN',
};

export function useAdEventTracking() {
  // Track which quartiles have been logged for current ad playback
  const loggedQuartiles = useRef<Set<AdEventType>>(new Set());

  const resetTracking = useCallback(() => {
    loggedQuartiles.current.clear();
  }, []);

  const logAdEvent = useCallback(async (
    eventType: AdEventType,
    context: AdEventContext,
    options?: { atSecond?: number; errorCode?: string }
  ) => {
    // Dedupe: only log each quartile once per ad playback
    if (loggedQuartiles.current.has(eventType)) {
      return;
    }

    loggedQuartiles.current.add(eventType);

    try {
      await supabase.functions.invoke('seeksy-tv-log-ad-event', {
        body: {
          adId: context.adId,
          placementId: context.placementId,
          videoId: context.videoId,
          channelId: context.channelId,
          position: context.position,
          eventType,
          atSecond: options?.atSecond,
          durationSeconds: context.durationSeconds,
          viewerSessionId: context.viewerSessionId,
          errorCode: options?.errorCode,
        },
      });
      console.log(`[AdEventTracking] Logged: ${eventType}`);
    } catch (err) {
      console.error('[AdEventTracking] Failed to log event:', err);
    }
  }, []);

  const getQuartileFromProgress = useCallback((currentTime: number, duration: number): AdEventType | null => {
    if (duration <= 0) return null;
    
    const progress = currentTime / duration;
    
    if (progress >= 0.75 && !loggedQuartiles.current.has('third_quartile')) {
      return 'third_quartile';
    } else if (progress >= 0.50 && !loggedQuartiles.current.has('midpoint')) {
      return 'midpoint';
    } else if (progress >= 0.25 && !loggedQuartiles.current.has('first_quartile')) {
      return 'first_quartile';
    }
    
    return null;
  }, []);

  const getClickRedirectUrl = useCallback((
    adId: string,
    destinationUrl: string,
    context: {
      placementId?: string;
      videoId?: string;
      channelId?: string;
      position?: AdPosition;
      sessionId?: string;
    }
  ): string => {
    const baseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/seeksy-tv-ad-click-redirect`;
    const params = new URLSearchParams({
      adId,
      dest: destinationUrl,
    });
    
    if (context.placementId) params.set('placementId', context.placementId);
    if (context.videoId) params.set('videoId', context.videoId);
    if (context.channelId) params.set('channelId', context.channelId);
    if (context.position) params.set('position', context.position);
    if (context.sessionId) params.set('sessionId', context.sessionId);
    
    return `${baseUrl}?${params.toString()}`;
  }, []);

  return {
    logAdEvent,
    getQuartileFromProgress,
    getClickRedirectUrl,
    resetTracking,
    loggedQuartiles,
  };
}
