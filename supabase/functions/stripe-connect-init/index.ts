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

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    console.log("Initializing Stripe Connect for user:", user.id);

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check if user already has a Stripe Connect account
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("stripe_connect_account_id")
      .eq("id", user.id)
      .single();

    let accountId = profile?.stripe_connect_account_id;

    // Create account if it doesn't exist
    if (!accountId) {
      console.log("Creating new Stripe Connect account");
      const account = await stripe.accounts.create({
        type: "standard",
        email: user.email,
      });
      accountId = account.id;

      // Store account ID in database
      await supabaseClient
        .from("profiles")
        .update({
          stripe_connect_account_id: accountId,
          stripe_connect_status: "pending",
        })
        .eq("id", user.id);

      console.log("Created account:", accountId);
    }

    // Create account link for onboarding
    const origin = req.headers.get("origin") || "http://localhost:5173";
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/integrations?stripe_connect_refresh=true`,
      return_url: `${origin}/integrations?stripe_connect_success=true`,
      type: "account_onboarding",
    });

    console.log("Created account link for:", accountId);

    return new Response(
      JSON.stringify({ url: accountLink.url }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in stripe-connect-init:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
