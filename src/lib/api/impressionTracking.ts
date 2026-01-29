import { supabase } from "@/integrations/supabase/client";

/**
 * Impression Tracking System
 * Tracks real-time impressions and listens for episodes
 */

export interface ImpressionEvent {
  episode_id: string;
  podcast_id: string;
  creator_id: string;
  listener_ip_hash?: string;
  user_agent?: string;
  city?: string;
  country?: string;
  timestamp: string;
}

export interface ListenEvent {
  episode_id: string;
  podcast_id: string;
  creator_id: string;
  listen_duration_seconds: number;
  completion_percentage: number;
  listener_ip_hash?: string;
  timestamp: string;
}

/**
 * Track an impression (episode view/load)
 */
export async function trackImpression(event: ImpressionEvent): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('ad_impressions')
      .insert({
        episode_id: event.episode_id,
        podcast_id: event.podcast_id,
        creator_id: event.creator_id,
        listener_ip_hash: event.listener_ip_hash || createIpHash(),
        user_agent: event.user_agent || navigator.userAgent,
        city: event.city,
        country: event.country,
        played_at: event.timestamp,
        ad_slot_id: null, // Will be set if ad is played
        campaign_id: null,
        is_valid: true,
      });
    
    if (error) {
      console.error('Error tracking impression:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Impression tracking error:', error);
    return false;
  }
}

/**
 * Track a listen event (audio playback)
 */
export async function trackListen(event: ListenEvent): Promise<boolean> {
  try {
    const result = await (supabase as any)
      .from('listen_events')
      .insert({
        episode_id: event.episode_id,
        podcast_id: event.podcast_id,
        creator_id: event.creator_id,
        listen_duration_seconds: event.listen_duration_seconds,
        completion_percentage: event.completion_percentage,
        listener_ip_hash: event.listener_ip_hash || createIpHash(),
        listened_at: event.timestamp,
      });
    
    if (result.error) {
      console.error('Listen tracking error:', result.error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Listen tracking error:', error);
    return false;
  }
}

/**
 * Get impression count for an episode
 */
export async function getEpisodeImpressions(episodeId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('ad_impressions')
      .select('*', { count: 'exact', head: true })
      .eq('episode_id', episodeId)
      .eq('is_valid', true);
    
    if (error) {
      console.error('Error fetching impression count:', error);
      return 0;
    }
    
    return count || 0;
  } catch (error) {
    console.error('Error getting episode impressions:', error);
    return 0;
  }
}

/**
 * Get listen count for an episode
 */
export async function getEpisodeListens(episodeId: string): Promise<number> {
  try {
    const result = await (supabase as any)
      .from('listen_events')
      .select('*', { count: 'exact', head: true })
      .eq('episode_id', episodeId);
    
    if (result.error) {
      console.error('Error fetching listen count:', result.error);
      return 0;
    }
    
    return result.count || 0;
  } catch (error) {
    console.error('Error getting episode listens:', error);
    return 0;
  }
}

/**
 * Get total impressions for a podcast
 */
export async function getPodcastImpressions(podcastId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('ad_impressions')
      .select('*', { count: 'exact', head: true })
      .eq('podcast_id', podcastId)
      .eq('is_valid', true);
    
    if (error) {
      console.error('Error fetching podcast impressions:', error);
      return 0;
    }
    
    return count || 0;
  } catch (error) {
    console.error('Error getting podcast impressions:', error);
    return 0;
  }
}

/**
 * Get impression analytics for admin dashboard
 */
export async function getImpressionAnalytics(startDate?: string, endDate?: string) {
  try {
    let query = supabase
      .from('ad_impressions')
      .select('episode_id, podcast_id, creator_id, played_at, country, city')
      .eq('is_valid', true)
      .order('played_at', { ascending: false });
    
    if (startDate) {
      query = query.gte('played_at', startDate);
    }
    
    if (endDate) {
      query = query.lte('played_at', endDate);
    }
    
    const { data, error } = await query.limit(1000);
    
    if (error) {
      console.error('Error fetching impression analytics:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error getting impression analytics:', error);
    return [];
  }
}

/**
 * Create a simple IP hash for privacy
 */
function createIpHash(): string {
  // In production, this would hash the actual IP
  // For now, create a session-based identifier
  const sessionId = sessionStorage.getItem('listener_session_id') || 
    `session_${Math.random().toString(36).substring(7)}_${Date.now()}`;
  
  if (!sessionStorage.getItem('listener_session_id')) {
    sessionStorage.setItem('listener_session_id', sessionId);
  }
  
  return sessionId;
}

/**
 * Migration helper: Create listen_events table
 * This has been created via Supabase migration
 */
export async function initializeListenEventsTable() {
  console.log('Listen events table created via Supabase migration 2025-11-28');
  return true;
}
