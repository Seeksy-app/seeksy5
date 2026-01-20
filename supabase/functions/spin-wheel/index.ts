import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Prize tiers for the spin wheel
const PRIZES = [
  { credits: 1, weight: 30, label: "1 Credit" },
  { credits: 2, weight: 25, label: "2 Credits" },
  { credits: 3, weight: 20, label: "3 Credits" },
  { credits: 5, weight: 15, label: "5 Credits" },
  { credits: 10, weight: 8, label: "10 Credits" },
  { credits: 25, weight: 2, label: "25 Credits! 🎉" },
];

// Welcome spin prizes for first-time users (5-20 credits)
const WELCOME_PRIZES = [
  { credits: 5, weight: 30, label: "5 Credits" },
  { credits: 8, weight: 25, label: "8 Credits" },
  { credits: 10, weight: 20, label: "10 Credits" },
  { credits: 15, weight: 15, label: "15 Credits" },
  { credits: 20, weight: 10, label: "20 Credits! 🎉" },
];

function getRandomPrize(isWelcomeSpin = false) {
  const prizePool = isWelcomeSpin ? WELCOME_PRIZES : PRIZES;
  const totalWeight = prizePool.reduce((sum, prize) => sum + prize.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const prize of prizePool) {
    random -= prize.weight;
    if (random <= 0) {
      return prize;
    }
  }
  
  return prizePool[0]; // Fallback
}

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

    console.log("Spin wheel request:", { userId: user.id });

    // Check if user is eligible (spent 20 credits since last spin)
    const { data: userCredit } = await supabaseClient
      .from("user_credits")
      .select("balance, total_spent, total_earned")
      .eq("user_id", user.id)
      .single();

    const totalSpent = userCredit?.total_spent || 0;
    
    // Check if this is a first-time welcome spin
    const { data: spinHistory } = await supabaseClient
      .from("spin_wheel_history")
      .select("id")
      .eq("user_id", user.id);
    
    const isWelcomeSpin = !spinHistory || spinHistory.length === 0;
    
    if (!isWelcomeSpin) {
      // Regular spin eligibility check (every 20 credits)
      if (totalSpent === 0 || totalSpent % 20 !== 0) {
        return new Response(
          JSON.stringify({ 
            error: "Not eligible for spin",
            creditsUntilNextSpin: 20 - (totalSpent % 20)
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 403,
          }
        );
      }

      // Check if already spun for this milestone
      const currentThreshold = Math.floor(totalSpent / 20) * 20;
      const { data: existingSpin } = await supabaseClient
        .from("spin_wheel_history")
        .select("id")
        .eq("user_id", user.id)
        .eq("credits_spent_threshold", currentThreshold)
        .single();

      if (existingSpin) {
        return new Response(
          JSON.stringify({ error: "Already spun for this milestone" }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 403,
          }
        );
      }
    }

    // Get random prize (welcome spin gives 5-20 credits, regular gives 1-25)
    const prize = getRandomPrize(isWelcomeSpin);
    const currentBalance = userCredit?.balance || 0;
    const newBalance = currentBalance + prize.credits;

    // Update user credits
    await supabaseClient
      .from("user_credits")
      .update({
        balance: newBalance,
        total_earned: (userCredit?.total_earned || 0) + prize.credits,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    // Record spin in history
    const currentThreshold = isWelcomeSpin ? 0 : Math.floor(totalSpent / 20) * 20;
    await supabaseClient
      .from("spin_wheel_history")
      .insert({
        user_id: user.id,
        credits_spent_threshold: currentThreshold,
        credits_won: prize.credits,
      });

    // Create transaction record
    await supabaseClient
      .from("credit_transactions")
      .insert({
        user_id: user.id,
        amount: prize.credits,
        transaction_type: "spin_wheel",
        description: `Won ${prize.credits} credits from spin wheel!`,
        balance_after: newBalance,
        metadata: { threshold: currentThreshold },
      });

    console.log("Spin wheel success:", { userId: user.id, creditsWon: prize.credits });

    return new Response(
      JSON.stringify({ 
        success: true,
        creditsWon: prize.credits,
        balance: newBalance,
        prizeLabel: prize.label,
        isWelcomeSpin
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in spin-wheel:", error);
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