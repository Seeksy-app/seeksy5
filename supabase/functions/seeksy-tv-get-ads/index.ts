import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AdPlacement {
  id: string;
  ad_id: string;
  target_type: string;
  channel_id: string | null;
  video_id: string | null;
  position: string;
  cpm: number;
  start_date: string;
  end_date: string;
  status: string;
  priority: number;
  ad: {
    id: string;
    title: string;
    type: string;
    asset_url: string;
    duration_seconds: number;
    click_url: string | null;
    thumbnail_url: string | null;
    status: string;
  } | null;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { video_id, channel_id } = await req.json();
    
    console.log('[seeksy-tv-get-ads] Request received:', { video_id, channel_id });

    if (!video_id) {
      return new Response(
        JSON.stringify({ error: 'video_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const today = new Date().toISOString().split('T')[0];

    // Fetch all active placements for this video or channel
    const { data: placements, error } = await supabase
      .from('seeksy_tv_ad_placements')
      .select(`
        id,
        ad_id,
        target_type,
        channel_id,
        video_id,
        position,
        cpm,
        start_date,
        end_date,
        status,
        priority,
        ad:seeksy_tv_ads(id, title, type, asset_url, duration_seconds, click_url, thumbnail_url, status)
      `)
      .eq('status', 'active')
      .lte('start_date', today)
      .gte('end_date', today)
      .order('priority', { ascending: false })
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('[seeksy-tv-get-ads] Error fetching placements:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch placements' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[seeksy-tv-get-ads] Found placements:', placements?.length || 0);

    // Filter placements for this video or channel
    const relevantPlacements = (placements || []).filter((p: any) => {
      // Only include placements where the ad is also active
      const ad = Array.isArray(p.ad) ? p.ad[0] : p.ad;
      if (!ad || ad.status !== 'active') return false;
      
      // Video-level placement for this video
      if (p.target_type === 'video' && p.video_id === video_id) return true;
      
      // Channel-level placement for this channel
      if (p.target_type === 'channel' && p.channel_id === channel_id) return true;
      
      return false;
    });

    console.log('[seeksy-tv-get-ads] Relevant placements:', relevantPlacements.length);

    // Select best pre-roll ad (prefer video-level over channel-level)
    let preAd = null;
    let prePlacementId = null;
    const prePlacements = relevantPlacements.filter((p: any) => p.position === 'pre' || p.position === 'both');
    
    // Sort by video-level first, then priority
    prePlacements.sort((a: any, b: any) => {
      if (a.target_type === 'video' && b.target_type !== 'video') return -1;
      if (a.target_type !== 'video' && b.target_type === 'video') return 1;
      return b.priority - a.priority;
    });
    
    if (prePlacements.length > 0) {
      const p = prePlacements[0];
      preAd = Array.isArray(p.ad) ? p.ad[0] : p.ad;
      prePlacementId = p.id;
    }

    // Select best post-roll ad (prefer video-level over channel-level)
    let postAd = null;
    let postPlacementId = null;
    const postPlacements = relevantPlacements.filter((p: any) => p.position === 'post' || p.position === 'both');
    
    postPlacements.sort((a: any, b: any) => {
      if (a.target_type === 'video' && b.target_type !== 'video') return -1;
      if (a.target_type !== 'video' && b.target_type === 'video') return 1;
      return b.priority - a.priority;
    });
    
    if (postPlacements.length > 0) {
      const p = postPlacements[0];
      postAd = Array.isArray(p.ad) ? p.ad[0] : p.ad;
      postPlacementId = p.id;
    }

    console.log('[seeksy-tv-get-ads] Selected ads:', { 
      preAd: preAd?.title || null, 
      postAd: postAd?.title || null 
    });

    return new Response(
      JSON.stringify({
        preAd,
        postAd,
        prePlacementId,
        postPlacementId,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[seeksy-tv-get-ads] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
