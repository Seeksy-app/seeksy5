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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { 
      conversationId, 
      audioAdId, 
      durationSeconds, 
      callerPhone,
      startedAt,
      endedAt 
    } = await req.json();

    console.log('Tracking conversation usage:', { conversationId, audioAdId, durationSeconds });

    // Get audio ad details
    const { data: audioAd, error: adError } = await supabaseClient
      .from('audio_ads')
      .select('advertiser_id, campaign_id')
      .eq('id', audioAdId)
      .single();

    if (adError || !audioAd) {
      throw new Error('Audio ad not found');
    }

    // Get advertiser's pricing tier
    const { data: advertiser, error: advertiserError } = await supabaseClient
      .from('advertisers')
      .select('id, pricing_tier_id, account_balance')
      .eq('id', audioAd.advertiser_id)
      .single();

    if (advertiserError || !advertiser) {
      throw new Error('Advertiser not found');
    }

    // Get pricing tier details
    let costPerMinute = 0.25; // Default rate
    let discount = 0;

    if (advertiser.pricing_tier_id) {
      const { data: tier } = await supabaseClient
        .from('advertiser_pricing_tiers')
        .select('conversational_ad_rate, conversational_ad_discount')
        .eq('id', advertiser.pricing_tier_id)
        .single();

      if (tier) {
        costPerMinute = tier.conversational_ad_rate;
        discount = tier.conversational_ad_discount || 0;
      }
    }

    // Apply discount
    const effectiveRate = costPerMinute * (1 - discount / 100);

    // Calculate cost (minimum 1 minute)
    const minutes = Math.max(1, Math.ceil(durationSeconds / 60));
    const totalCost = minutes * effectiveRate;

    // Insert usage record
    const { error: usageError } = await supabaseClient
      .from('conversational_ad_usage')
      .insert({
        advertiser_id: audioAd.advertiser_id,
        campaign_id: audioAd.campaign_id,
        audio_ad_id: audioAdId,
        conversation_id: conversationId,
        duration_seconds: durationSeconds,
        cost_per_minute: effectiveRate,
        total_cost: totalCost,
        caller_phone: callerPhone,
        started_at: startedAt,
        ended_at: endedAt
      });

    if (usageError) {
      throw usageError;
    }

    // Deduct from advertiser balance
    const newBalance = (advertiser.account_balance || 0) - totalCost;

    const { error: balanceError } = await supabaseClient
      .from('advertisers')
      .update({ account_balance: newBalance })
      .eq('id', audioAd.advertiser_id);

    if (balanceError) {
      throw balanceError;
    }

    // Create charge record
    const { error: chargeError } = await supabaseClient
      .from('conversational_ad_charges')
      .insert({
        advertiser_id: audioAd.advertiser_id,
        campaign_id: audioAd.campaign_id,
        audio_ad_id: audioAdId,
        charge_type: 'conversation_minutes',
        amount: totalCost,
        description: `Conversation: ${minutes} minute${minutes > 1 ? 's' : ''} at $${effectiveRate.toFixed(2)}/min`,
        metadata: {
          conversation_id: conversationId,
          duration_seconds: durationSeconds,
          minutes_charged: minutes,
          rate_per_minute: effectiveRate,
          discount_percentage: discount
        }
      });

    if (chargeError) {
      throw chargeError;
    }

    // Create transaction record
    await supabaseClient
      .from('advertiser_transactions')
      .insert({
        advertiser_id: audioAd.advertiser_id,
        campaign_id: audioAd.campaign_id,
        transaction_type: 'charge',
        amount: -totalCost,
        balance_after: newBalance,
        description: `Conversational ad usage: ${minutes} minute${minutes > 1 ? 's' : ''}`
      });

    console.log('Usage tracked successfully:', { totalCost, newBalance, minutes });

    return new Response(
      JSON.stringify({ 
        success: true, 
        totalCost, 
        minutes,
        newBalance 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error tracking conversation usage:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});