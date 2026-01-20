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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify admin user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Not authenticated');
    }

    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (rolesError || !roles || !['admin', 'super_admin'].includes(roles.role)) {
      throw new Error('Unauthorized - Admin access required');
    }

    const { targetUserId, amount, reason } = await req.json();

    if (!targetUserId || !amount || amount <= 0) {
      throw new Error('Invalid request - targetUserId and positive amount required');
    }

    // Get current balance
    const { data: userCredits, error: fetchError } = await supabase
      .from('user_credits')
      .select('balance, total_earned')
      .eq('user_id', targetUserId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch user credits: ${fetchError.message}`);
    }

    const newBalance = userCredits.balance + amount;
    const newTotalEarned = userCredits.total_earned + amount;

    // Update balance
    const { error: updateError } = await supabase
      .from('user_credits')
      .update({ 
        balance: newBalance,
        total_earned: newTotalEarned
      })
      .eq('user_id', targetUserId);

    if (updateError) {
      throw new Error(`Failed to update credits: ${updateError.message}`);
    }

    // Record transaction
    const { error: transactionError } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: targetUserId,
        amount: amount,
        transaction_type: 'admin_grant',
        description: reason || 'Credits added by admin',
        balance_after: newBalance,
        metadata: { granted_by: user.id }
      });

    if (transactionError) {
      console.error('Failed to record transaction:', transactionError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        newBalance,
        message: `Successfully added ${amount} credits`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in admin-add-credits:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});