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

    console.log("Checking Stripe Connect status for user:", user.id);

    // Get user's Stripe Connect account ID
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("stripe_connect_account_id")
      .eq("id", user.id)
      .single();

    if (!profile?.stripe_connect_account_id) {
      return new Response(
        JSON.stringify({
          connected: false,
          status: null,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Retrieve account details from Stripe
    const account = await stripe.accounts.retrieve(profile.stripe_connect_account_id);

    // Update database with latest status
    await supabaseClient
      .from("profiles")
      .update({
        stripe_connect_status: account.charges_enabled && account.payouts_enabled ? "active" : 
                               account.details_submitted ? "restricted" : "pending",
        stripe_connect_details_submitted: account.details_submitted,
        stripe_connect_charges_enabled: account.charges_enabled,
        stripe_connect_payouts_enabled: account.payouts_enabled,
      })
      .eq("id", user.id);

    console.log("Updated status for account:", profile.stripe_connect_account_id);

    return new Response(
      JSON.stringify({
        connected: true,
        accountId: account.id,
        email: account.email,
        detailsSubmitted: account.details_submitted,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        status: account.charges_enabled && account.payouts_enabled ? "active" : 
                account.details_submitted ? "restricted" : "pending",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in stripe-connect-status:", error);
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
