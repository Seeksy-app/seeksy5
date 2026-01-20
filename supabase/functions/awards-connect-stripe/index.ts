import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) throw new Error("Not authenticated");

    const { programId } = await req.json();
    if (!programId) throw new Error("Program ID is required");

    // Verify user owns this program
    const { data: program, error: programError } = await supabaseClient
      .from("awards_programs")
      .select("user_id")
      .eq("id", programId)
      .single();

    if (programError || program.user_id !== user.id) {
      throw new Error("Not authorized to manage this program");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Create Stripe Connect Express account
    const account = await stripe.accounts.create({
      type: "express",
      email: user.email,
      capabilities: {
        transfers: { requested: true },
      },
    });

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${req.headers.get("origin")}/awards/${programId}`,
      return_url: `${req.headers.get("origin")}/awards/${programId}`,
      type: "account_onboarding",
    });

    // Update program with Stripe Connect account ID
    await supabaseClient
      .from("awards_programs")
      .update({
        stripe_connect_account_id: account.id,
        stripe_connect_status: "pending",
      })
      .eq("id", programId);

    return new Response(
      JSON.stringify({ url: accountLink.url, accountId: account.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in awards-connect-stripe:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
