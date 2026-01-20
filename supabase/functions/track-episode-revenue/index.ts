import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EpisodeRevenueData {
  episodeId: string;
  podcastId: string;
  userId: string;
  impressions: number;
  adReadCount: number;
  adReadEvents: Array<{
    timestamp: number;
    scriptId: string;
    brandName: string;
    scriptTitle: string;
    duration: number;
  }>;
  duration: number;
  isCertifiedVoice?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { episodeId, podcastId, userId, impressions, adReadCount, adReadEvents, duration, isCertifiedVoice } =
      await req.json() as EpisodeRevenueData;

    // Revenue calculation constants
    const DEFAULT_CPM = 25;
    const CERTIFIED_VOICE_MULTIPLIER = 1.25;
    const PLATFORM_FEE_PERCENTAGE = 0.30;

    // Calculate base revenue
    const baseCpm = isCertifiedVoice ? DEFAULT_CPM * CERTIFIED_VOICE_MULTIPLIER : DEFAULT_CPM;
    const baseRevenue = (impressions / 1000) * baseCpm;
    
    // Apply ad read multiplier
    const adReadMultiplier = 1 + (adReadCount * 0.1); // 10% bonus per ad read
    const totalRevenue = baseRevenue * adReadMultiplier;
    
    const platformFee = totalRevenue * PLATFORM_FEE_PERCENTAGE;
    const creatorPayout = totalRevenue - platformFee;

    // Insert revenue event
    const { data: revenueEvent, error: revenueError } = await supabase
      .from('revenue_events')
      .insert({
        user_id: userId,
        episode_id: episodeId,
        podcast_id: podcastId,
        event_type: 'episode_published',
        revenue_amount: totalRevenue,
        platform_fee: platformFee,
        creator_payout: creatorPayout,
        metadata: {
          impressions,
          ad_read_count: adReadCount,
          cpm_rate: baseCpm,
          is_certified_voice: isCertifiedVoice,
          ad_read_multiplier: adReadMultiplier,
          duration_seconds: duration,
        },
      })
      .select()
      .single();

    if (revenueError) {
      console.error('Revenue event error:', revenueError);
      throw revenueError;
    }

    // Track individual ad read events
    if (adReadEvents && adReadEvents.length > 0) {
      const adRevenueRecords = adReadEvents.map((adRead) => ({
        advertiser_id: '00000000-0000-0000-0000-000000000000', // Mock for now
        campaign_id: 'campaign_' + adRead.scriptId,
        script_id: adRead.scriptId,
        episode_id: episodeId,
        podcast_id: podcastId,
        creator_id: userId,
        event_type: 'ad_marked',
        cpm_rate: baseCpm,
        impressions: Math.floor(impressions / adReadCount), // Split impressions
        revenue_amount: totalRevenue / adReadCount, // Split revenue
        ad_read_timestamp: adRead.timestamp,
        ad_read_duration: adRead.duration,
        is_certified_voice: isCertifiedVoice || false,
        voice_uplift_applied: isCertifiedVoice || false,
        metadata: {
          brand_name: adRead.brandName,
          script_title: adRead.scriptTitle,
        },
      }));

      const { error: adRevenueError } = await supabase
        .from('ad_revenue_events')
        .insert(adRevenueRecords);

      if (adRevenueError) {
        console.error('Ad revenue events error:', adRevenueError);
      }
    }

    console.log(`Revenue tracked for episode ${episodeId}: $${totalRevenue.toFixed(2)}`);

    return new Response(
      JSON.stringify({
        success: true,
        revenueEvent,
        totalRevenue,
        platformFee,
        creatorPayout,
        impressions,
        adReadCount,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Track episode revenue error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});