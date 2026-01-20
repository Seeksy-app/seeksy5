import { supabase } from "@/integrations/supabase/client";

interface TrackImpressionParams {
  ad_slot_id: string;
  campaign_id?: string;
  episode_id: string;
  podcast_id: string;
  creator_id: string;
}

interface ImpressionResponse {
  success: boolean;
  impression_id?: string;
  is_valid?: boolean;
  counted?: boolean;
  error?: string;
  message?: string;
}

export const trackAdImpression = async (
  params: TrackImpressionParams
): Promise<ImpressionResponse> => {
  try {
    const { data, error } = await supabase.functions.invoke('track-ad-impression', {
      body: params,
    });

    if (error) {
      console.error('Failed to track impression:', error);
      return { success: false, error: error.message };
    }

    return data as ImpressionResponse;
  } catch (error) {
    console.error('Error tracking impression:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};