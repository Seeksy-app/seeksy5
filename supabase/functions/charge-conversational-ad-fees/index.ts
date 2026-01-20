import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const AGENT_SETUP_FEE = 50;
const CUSTOM_PHONE_MONTHLY_FEE = 10;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { audioAdId, feeType } = await req.json();

    console.log('Charging conversational ad fee:', { audioAdId, feeType });

    // Get audio ad and advertiser details
    const { data: audioAd, error: adError } = await supabaseClient
      .from('audio_ads')
      .select('advertiser_id, campaign_id, agent_setup_fee_charged, custom_phone_fee_charged, phone_number_type')
      .eq('id', audioAdId)
      .single();

    if (adError || !audioAd) {
      throw new Error('Audio ad not found');
    }

    // Check if fee already charged
    if (feeType === 'agent_setup' && audioAd.agent_setup_fee_charged) {
      return new Response(
        JSON.stringify({ success: true, message: 'Fee already charged' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (feeType === 'custom_phone' && audioAd.custom_phone_fee_charged) {
      return new Response(
        JSON.stringify({ success: true, message: 'Fee already charged' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get advertiser
    const { data: advertiser, error: advertiserError } = await supabaseClient
      .from('advertisers')
      .select('id, account_balance')
      .eq('id', audioAd.advertiser_id)
      .single();

    if (advertiserError || !advertiser) {
      throw new Error('Advertiser not found');
    }

    // Determine fee amount and description
    let feeAmount = 0;
    let description = '';
    let updateField = '';

    if (feeType === 'agent_setup') {
      feeAmount = AGENT_SETUP_FEE;
      description = 'Conversational AI Agent Setup Fee';
      updateField = 'agent_setup_fee_charged';
    } else if (feeType === 'custom_phone') {
      feeAmount = CUSTOM_PHONE_MONTHLY_FEE;
      description = 'Custom Phone Number Monthly Fee';
      updateField = 'custom_phone_fee_charged';
    } else {
      throw new Error('Invalid fee type');
    }

    // Check sufficient balance
    if ((advertiser.account_balance || 0) < feeAmount) {
      throw new Error('Insufficient balance');
    }

    // Deduct from balance
    const newBalance = (advertiser.account_balance || 0) - feeAmount;

    const { error: balanceError } = await supabaseClient
      .from('advertisers')
      .update({ account_balance: newBalance })
      .eq('id', audioAd.advertiser_id);

    if (balanceError) {
      throw balanceError;
    }

    // Mark fee as charged
    const { error: updateError } = await supabaseClient
      .from('audio_ads')
      .update({ [updateField]: true })
      .eq('id', audioAdId);

    if (updateError) {
      throw updateError;
    }

    // Create charge record
    const { error: chargeError } = await supabaseClient
      .from('conversational_ad_charges')
      .insert({
        advertiser_id: audioAd.advertiser_id,
        campaign_id: audioAd.campaign_id,
        audio_ad_id: audioAdId,
        charge_type: feeType,
        amount: feeAmount,
        description,
        metadata: { fee_type: feeType }
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
        amount: -feeAmount,
        balance_after: newBalance,
        description
      });

    console.log('Fee charged successfully:', { feeType, feeAmount, newBalance });

    return new Response(
      JSON.stringify({ 
        success: true, 
        feeAmount,
        newBalance 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error charging conversational ad fee:', error);
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