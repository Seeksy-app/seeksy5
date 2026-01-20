import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== Quick Campaign Request Started ===');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const requestBody = await req.json();
    console.log('Request body:', JSON.stringify(requestBody, null, 2));

    const {
      adId,
      adType,
      advertiserId,
      cpmBid,
      maxImpressions,
      totalBudget,
      targetCategories,
    } = requestBody;

    console.log('Creating quick campaign:', {
      adId,
      adType,
      advertiserId,
      cpmBid,
      maxImpressions,
      targetCategories,
    });

    // Get the ad details to create campaign name
    const { data: ad, error: adError } = await supabase
      .from('audio_ads')
      .select('script, campaign_name')
      .eq('id', adId)
      .single();

    if (adError) {
      console.error('Error fetching ad:', adError);
      throw new Error(`Failed to fetch ad details: ${adError.message}`);
    }

    // Create the quick campaign
    const campaignName = "Quick Campaign";
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days from now

    const { data: campaign, error: campaignError } = await supabase
      .from('ad_campaigns')
      .insert({
        advertiser_id: advertiserId,
        name: campaignName,
        campaign_type: 'quick',
        status: 'active',
        budget: totalBudget,
        cpm_bid: cpmBid,
        max_impressions: maxImpressions,
        remaining_impressions: maxImpressions,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        targeting_rules: {
          categories: targetCategories,
          quick_campaign: true,
        },
      })
      .select()
      .single();

    if (campaignError) {
      console.error('Error creating campaign:', campaignError);
      throw new Error(`Failed to create campaign: ${campaignError.message}`);
    }

    console.log('Campaign created:', campaign.id);

    // Link the ad to the campaign
    const { error: updateAdError } = await supabase
      .from('audio_ads')
      .update({
        campaign_id: campaign.id,
        status: 'active',
      })
      .eq('id', adId);

    if (updateAdError) {
      console.error('Error linking ad to campaign:', updateAdError);
      throw new Error(`Failed to link ad to campaign: ${updateAdError.message}`);
    }

    // Count matching creators based on target categories
    // Match against both profile categories and podcast categories
    const { data: matchingProfiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, categories')
      .overlaps('categories', targetCategories);

    const { data: matchingPodcasts, error: podcastError } = await supabase
      .from('podcasts')
      .select('user_id')
      .in('category', targetCategories);

    if (profileError) console.error('Error fetching matching profiles:', profileError);
    if (podcastError) console.error('Error fetching matching podcasts:', podcastError);

    // Combine unique user IDs from both sources
    const profileIds = new Set(matchingProfiles?.map(p => p.id) || []);
    const podcastUserIds = new Set(matchingPodcasts?.map(p => p.user_id) || []);
    const allMatchingIds = new Set([...profileIds, ...podcastUserIds]);
    const matchedCreatorsCount = allMatchingIds.size;

    console.log(`Found ${matchedCreatorsCount} matching creators`);

    // ACTUALLY place the ad on matching creator pages
    if (allMatchingIds.size > 0) {
      console.log('Updating creator profiles to show ad...');
      const creatorIds = Array.from(allMatchingIds);
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          my_page_ad_id: adId,
          my_page_video_type: 'ad', // Set to show ad video
        })
        .in('id', creatorIds);

      if (updateError) {
        console.error('Error updating creator profiles:', updateError);
        // Don't throw - campaign is created, just log the error
      } else {
        console.log(`Successfully placed ad on ${creatorIds.length} creator pages`);
      }
    }

    console.log('Quick campaign created successfully, matched creators:', matchedCreatorsCount);

    return new Response(
      JSON.stringify({
        success: true,
        campaign,
        matchedCreatorsCount,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in create-quick-campaign:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});