import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Credit costs per activity
const CREDIT_RATES: Record<string, number> = {
  recording_per_minute: 1,
  streaming_per_minute: 1.5,
  storage_per_gb: 10,
  ai_clip_generation: 3,
  ai_enhancement: 2,
  transcription_per_10_min: 1,
  voice_cloning: 5,
  default: 1,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw userError;
    const user = userData.user;

    const { activityType, description, metadata, quantity = 1 } = await req.json();
    
    // Calculate credits based on activity type and quantity
    const rateKey = activityType?.toLowerCase().replace(/ /g, '_') || 'default';
    const baseRate = CREDIT_RATES[rateKey] || CREDIT_RATES.default;
    const creditsToDeduct = Math.ceil(baseRate * quantity);

    console.log("Deduct credit request:", { userId: user.id, activityType, quantity, creditsToDeduct });

    // Check free limits first for time-based activities
    let useFreeTier = false;
    if (['recording_per_minute', 'streaming_per_minute', 'storage_per_gb'].includes(rateKey)) {
      const { data: usageLimits } = await supabaseClient
        .from("user_usage_limits")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (usageLimits) {
        if (rateKey === 'recording_per_minute') {
          const newUsage = (usageLimits.recording_minutes_used || 0) + quantity;
          if (newUsage <= usageLimits.free_recording_minutes_monthly) {
            useFreeTier = true;
            await supabaseClient
              .from("user_usage_limits")
              .update({ recording_minutes_used: newUsage, updated_at: new Date().toISOString() })
              .eq("user_id", user.id);
          }
        } else if (rateKey === 'streaming_per_minute') {
          const newUsage = (usageLimits.streaming_minutes_used || 0) + quantity;
          if (newUsage <= usageLimits.free_streaming_minutes_monthly) {
            useFreeTier = true;
            await supabaseClient
              .from("user_usage_limits")
              .update({ streaming_minutes_used: newUsage, updated_at: new Date().toISOString() })
              .eq("user_id", user.id);
          }
        } else if (rateKey === 'storage_per_gb') {
          const newUsage = (usageLimits.storage_used_gb || 0) + quantity;
          if (newUsage <= usageLimits.free_storage_gb) {
            useFreeTier = true;
            await supabaseClient
              .from("user_usage_limits")
              .update({ storage_used_gb: newUsage, updated_at: new Date().toISOString() })
              .eq("user_id", user.id);
          }
        }
      }
    }

    // If using free tier, no credits needed
    if (useFreeTier) {
      console.log("Using free tier for:", { userId: user.id, activityType });
      return new Response(
        JSON.stringify({ 
          success: true,
          usedFreeTier: true,
          creditsDeducted: 0,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Get current balance
    const { data: userCredit, error: fetchError } = await supabaseClient
      .from("user_credits")
      .select("balance, total_spent")
      .eq("user_id", user.id)
      .single();

    if (fetchError) {
      console.error("Error fetching user credits:", fetchError);
      throw fetchError;
    }

    const currentBalance = userCredit?.balance || 0;

    if (currentBalance < creditsToDeduct) {
      return new Response(
        JSON.stringify({ 
          error: "Insufficient credits",
          balance: currentBalance,
          required: creditsToDeduct
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 402,
        }
      );
    }

    const newBalance = currentBalance - creditsToDeduct;
    const newTotalSpent = (userCredit?.total_spent || 0) + creditsToDeduct;

    // Update user credits
    const { error: updateError } = await supabaseClient
      .from("user_credits")
      .update({
        balance: newBalance,
        total_spent: newTotalSpent,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Error updating user credits:", updateError);
      throw updateError;
    }

    // Create transaction record
    const { error: transactionError } = await supabaseClient
      .from("credit_transactions")
      .insert({
        user_id: user.id,
        amount: -creditsToDeduct,
        transaction_type: "spend",
        activity_type: activityType,
        description: description || `Used ${creditsToDeduct} credit(s) for ${activityType}`,
        balance_after: newBalance,
        metadata: metadata || {},
      });

    if (transactionError) {
      console.error("Error creating transaction:", transactionError);
      throw transactionError;
    }

    // Check if user is eligible for spin wheel (every 20 credits spent)
    const totalSpentSinceLastSpin = newTotalSpent % 20;
    const isEligibleForSpin = totalSpentSinceLastSpin === 0 && newTotalSpent > 0;

    console.log("Credit deducted successfully:", { 
      userId: user.id, 
      newBalance,
      creditsDeducted: creditsToDeduct,
      isEligibleForSpin 
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        balance: newBalance,
        creditsDeducted: creditsToDeduct,
        isEligibleForSpin
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in deduct-credit:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});