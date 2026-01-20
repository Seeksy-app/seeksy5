import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { programId, eventType, amount, metadata } = await req.json();

    if (!programId || !eventType || amount === undefined) {
      throw new Error('programId, eventType, and amount are required');
    }

    // Get program details
    const { data: program } = await supabase
      .from('awards_programs')
      .select('*')
      .eq('id', programId)
      .single();

    if (!program) {
      throw new Error('Program not found');
    }

    // Calculate platform fee (10% for awards)
    const platformFee = amount * 0.10;
    const netAmount = amount - platformFee;

    // Record revenue event
    const { error: revenueError } = await supabase
      .from('revenue_events')
      .insert({
        event_type: `awards_${eventType}`,
        revenue_amount: amount,
        platform_fee: platformFee,
        creator_id: program.user_id,
        podcast_id: null,
        episode_id: null,
        metadata: {
          ...metadata,
          program_id: programId,
          program_title: program.title,
          event_type: eventType,
        },
      });

    if (revenueError) throw revenueError;

    // If this is a paid event that needs payout tracking, create payout record
    if (['self_nomination', 'registration', 'sponsorship'].includes(eventType)) {
      await supabase
        .from('award_payouts')
        .insert({
          program_id: programId,
          creator_user_id: program.user_id,
          payout_type: eventType,
          amount: amount,
          net_amount: netAmount,
          platform_fee: platformFee,
          status: 'pending',
          hold_until_date: program.payout_scheduled_date || program.ceremony_date,
          source_id: metadata?.source_id || programId,
        });
    }

    console.log(`Awards revenue tracked: ${eventType} - $${amount} for program ${programId}`);

    return new Response(
      JSON.stringify({
        success: true,
        revenue: amount,
        platformFee,
        netAmount,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Track awards revenue error:', error);
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
