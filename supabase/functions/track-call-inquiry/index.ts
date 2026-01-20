import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      audioAdId,
      callerNumber,
      callStart,
      callEnd,
      callDurationSeconds,
      promoCodeUsed,
    } = await req.json();

    if (!audioAdId || !callerNumber || !callStart) {
      throw new Error('Missing required fields');
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing environment variables');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get audio ad details
    const { data: audioAd, error: adError } = await supabase
      .from('audio_ads')
      .select('advertiser_id, campaign_id, payout_amount, payout_type')
      .eq('id', audioAdId)
      .single();

    if (adError) {
      throw new Error(`Failed to fetch audio ad: ${adError.message}`);
    }

    // Determine if call is billable and qualified
    const duration = callDurationSeconds || 0;
    const isBillable = duration >= 20; // 20 second threshold
    const isQualified = duration >= 60; // 1 minute threshold

    // Insert call inquiry record
    const { data: inquiry, error: insertError } = await supabase
      .from('ad_call_inquiries')
      .insert({
        audio_ad_id: audioAdId,
        advertiser_id: audioAd.advertiser_id,
        campaign_id: audioAd.campaign_id,
        caller_number: callerNumber,
        call_start: callStart,
        call_end: callEnd,
        call_duration_seconds: duration,
        promo_code_used: promoCodeUsed,
        is_billable: isBillable,
        is_qualified: isQualified,
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to insert inquiry: ${insertError.message}`);
    }

    console.log('Call inquiry tracked:', inquiry.id);

    // Calculate billing if applicable
    let billingAmount = 0;
    if (isBillable && audioAd.payout_amount) {
      if (audioAd.payout_type === 'ppi') {
        billingAmount = audioAd.payout_amount; // Per inquiry
      } else if (audioAd.payout_type === 'ppc' && isQualified) {
        billingAmount = audioAd.payout_amount; // Per qualified call
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        inquiryId: inquiry.id,
        isBillable,
        isQualified,
        billingAmount,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error tracking call inquiry:', error);

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
