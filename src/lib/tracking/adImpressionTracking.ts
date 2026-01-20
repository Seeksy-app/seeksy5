import { supabase } from "@/integrations/supabase/client";

export type AdPlatform = 'seeksy' | 'spotify' | 'apple' | 'youtube' | 'other';
export type AdSourceType = 'podcast_episode' | 'video' | 'clip' | 'external' | 'blog' | 'newsletter';
export type AdSlotType = 'pre-roll' | 'mid-roll' | 'post-roll' | 'blog-widget' | 'newsletter-inline';

export interface TrackAdImpressionParams {
  adSlotId: string;
  campaignId?: string | null;
  episodeId?: string | null;
  podcastId?: string | null;
  creatorId: string;
  listenerIpHash: string;
  userAgent?: string | null;
  
  // Extended fields for VAST, blog, newsletter
  platform?: AdPlatform;
  sourceType?: AdSourceType;
  sourceId?: string | null;
  externalImpressionId?: string | null;
  adSlotType?: AdSlotType | null;
  playbackMs?: number | null;
  fullyListened?: boolean;
  
  // Geo data
  city?: string | null;
  country?: string | null;
}

/**
 * Unified ad impression tracking for all ad types:
 * - Native podcast/video ads
 * - VAST-based external ads
 * - Blog widget placements
 * - Newsletter inline ads
 */
export const trackAdImpression = async (params: TrackAdImpressionParams): Promise<void> => {
  try {
    const {
      adSlotId,
      campaignId,
      episodeId,
      podcastId,
      creatorId,
      listenerIpHash,
      userAgent,
      platform = 'seeksy',
      sourceType = 'podcast_episode',
      sourceId,
      externalImpressionId,
      adSlotType,
      playbackMs,
      fullyListened = false,
      city,
      country,
    } = params;

    const { error } = await supabase
      .from('ad_impressions')
      .insert({
        ad_slot_id: adSlotId,
        campaign_id: campaignId,
        episode_id: episodeId || sourceId,
        podcast_id: podcastId,
        creator_id: creatorId,
        listener_ip_hash: listenerIpHash,
        user_agent: userAgent,
        platform,
        source_type: sourceType,
        external_impression_id: externalImpressionId,
        ad_slot_type: adSlotType,
        playback_ms: playbackMs,
        fully_listened: fullyListened,
        city,
        country,
        played_at: new Date().toISOString(),
        is_valid: true,
      });

    if (error) {
      console.error('Error tracking ad impression:', error);
      throw error;
    }

    console.log('Ad impression tracked successfully:', {
      platform,
      sourceType,
      adSlotType,
      externalImpressionId,
    });
  } catch (error) {
    console.error('Failed to track ad impression:', error);
    // Don't throw to avoid blocking user experience
  }
};

/**
 * Track VAST-based ad impression for podcast or video player
 * 
 * @example
 * ```typescript
 * await trackVASTAdImpression({
 *   adId: 'ad-123',
 *   campaignId: 'campaign-456',
 *   vastTagUrl: 'https://vast.example.com/tag',
 *   episodeId: 'episode-789',
 *   creatorId: 'creator-abc',
 *   slotType: 'mid-roll',
 *   playbackMs: 30000,
 *   fullyListened: true,
 * });
 * ```
 */
export const trackVASTAdImpression = async (params: {
  adId: string;
  campaignId?: string;
  vastTagUrl?: string;
  episodeId: string;
  podcastId?: string;
  creatorId: string;
  slotType: AdSlotType;
  playbackMs?: number;
  fullyListened?: boolean;
  externalImpressionId?: string;
}): Promise<void> => {
  const listenerIpHash = await generateIpHash();
  
  await trackAdImpression({
    adSlotId: params.adId,
    campaignId: params.campaignId,
    episodeId: params.episodeId,
    podcastId: params.podcastId,
    creatorId: params.creatorId,
    listenerIpHash,
    userAgent: navigator.userAgent,
    platform: 'seeksy',
    sourceType: 'external',
    externalImpressionId: params.externalImpressionId,
    adSlotType: params.slotType,
    playbackMs: params.playbackMs,
    fullyListened: params.fullyListened,
  });
};

/**
 * Track blog widget ad impression
 * Fires when ad slot comes into view or on page load
 */
export const trackBlogAdImpression = async (params: {
  adId: string;
  campaignId?: string;
  blogPostId: string;
  creatorId: string;
}): Promise<void> => {
  const listenerIpHash = await generateIpHash();
  
  await trackAdImpression({
    adSlotId: params.adId,
    campaignId: params.campaignId,
    sourceId: params.blogPostId,
    creatorId: params.creatorId,
    listenerIpHash,
    userAgent: navigator.userAgent,
    platform: 'seeksy',
    sourceType: 'blog',
    adSlotType: 'blog-widget',
  });
};

/**
 * Track newsletter ad click (impression + redirect)
 * Called via /ad/click/:adId redirect endpoint
 */
export const trackNewsletterAdClick = async (params: {
  adId: string;
  campaignId?: string;
  newsletterId?: string;
  creatorId: string;
  ipHash: string;
}): Promise<void> => {
  await trackAdImpression({
    adSlotId: params.adId,
    campaignId: params.campaignId,
    sourceId: params.newsletterId,
    creatorId: params.creatorId,
    listenerIpHash: params.ipHash,
    platform: 'seeksy',
    sourceType: 'newsletter',
    adSlotType: 'newsletter-inline',
  });
};

/**
 * Generate a hashed version of the user's IP address for privacy
 */
const generateIpHash = async (): Promise<string> => {
  // In production, this should be done server-side
  // For now, use a client-side session identifier
  const sessionId = sessionStorage.getItem('ad_session_id') || crypto.randomUUID();
  sessionStorage.setItem('ad_session_id', sessionId);
  
  const encoder = new TextEncoder();
  const data = encoder.encode(sessionId);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};
