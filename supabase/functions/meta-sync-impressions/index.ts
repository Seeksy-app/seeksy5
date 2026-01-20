import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { campaign_property_id, social_account_id, post_id } = await req.json();

    if (!campaign_property_id || !social_account_id || !post_id) {
      throw new Error('Missing required parameters');
    }

    // Get social account
    const { data: socialAccount, error: accountError } = await supabase
      .from('social_media_accounts')
      .select('*')
      .eq('id', social_account_id)
      .single();

    if (accountError || !socialAccount) {
      throw new Error('Social account not found');
    }

    // Get campaign property to find the campaign
    const { data: campaignProperty, error: propertyError } = await supabase
      .from('campaign_properties')
      .select('multi_channel_campaign_id')
      .eq('id', campaign_property_id)
      .single();

    if (propertyError || !campaignProperty) {
      throw new Error('Campaign property not found');
    }

    let impressionCount = 0;
    const accessToken = socialAccount.access_token;

    if (socialAccount.platform === 'instagram') {
      // Fetch Instagram post insights
      const insightsResponse = await fetch(
        `https://graph.facebook.com/v18.0/${post_id}/insights?` +
        `metric=impressions,reach&access_token=${accessToken}`
      );

      if (!insightsResponse.ok) {
        const errorData = await insightsResponse.text();
        console.error('Instagram insights fetch failed:', errorData);
        throw new Error('Failed to fetch Instagram insights');
      }

      const insightsData = await insightsResponse.json();
      
      // Get impressions from insights
      if (insightsData.data && insightsData.data.length > 0) {
        const impressionsMetric = insightsData.data.find((m: any) => m.name === 'impressions');
        if (impressionsMetric && impressionsMetric.values && impressionsMetric.values.length > 0) {
          impressionCount = impressionsMetric.values[0].value;
        }
      }

    } else if (socialAccount.platform === 'facebook') {
      // Use page access token from metadata
      const pageAccessToken = socialAccount.account_metadata?.access_token || accessToken;
      
      // Fetch Facebook post insights
      const insightsResponse = await fetch(
        `https://graph.facebook.com/v18.0/${post_id}/insights?` +
        `metric=post_impressions,post_impressions_unique&access_token=${pageAccessToken}`
      );

      if (!insightsResponse.ok) {
        const errorData = await insightsResponse.text();
        console.error('Facebook insights fetch failed:', errorData);
        throw new Error('Failed to fetch Facebook insights');
      }

      const insightsData = await insightsResponse.json();
      
      // Get impressions from insights
      if (insightsData.data && insightsData.data.length > 0) {
        const impressionsMetric = insightsData.data.find((m: any) => m.name === 'post_impressions');
        if (impressionsMetric && impressionsMetric.values && impressionsMetric.values.length > 0) {
          impressionCount = impressionsMetric.values[0].value;
        }
      }
    }

    // Store impression data
    const { error: impressionError } = await supabase
      .from('campaign_property_impressions')
      .insert({
        campaign_property_id,
        multi_channel_campaign_id: campaignProperty.multi_channel_campaign_id,
        impression_count: impressionCount,
        tracking_method: 'meta_api',
        metadata: {
          platform: socialAccount.platform,
          post_id,
          synced_at: new Date().toISOString(),
        },
      });

    if (impressionError) {
      console.error('Failed to store impressions:', impressionError);
      throw impressionError;
    }

    console.log(`Synced ${impressionCount} impressions for ${socialAccount.platform} post ${post_id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        impression_count: impressionCount,
        platform: socialAccount.platform,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in meta-sync-impressions:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
