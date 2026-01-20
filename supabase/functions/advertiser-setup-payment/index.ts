import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ADVERTISER-SETUP-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");

    logStep("User authenticated", { userId: user.id, email: user.email });

    // Get advertiser record
    const { data: advertiser, error: advertiserError } = await supabaseClient
      .from("advertisers")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (advertiserError) throw new Error("Advertiser not found");
    if (advertiser.status !== "approved") throw new Error("Advertiser not approved yet");

    logStep("Advertiser found", { advertiserId: advertiser.id, status: advertiser.status });

    const { retainerAmount } = await req.json();
    if (!retainerAmount || retainerAmount < 100) {
      throw new Error("Minimum retainer is $100");
    }

    logStep("Retainer amount validated", { retainerAmount });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { 
      apiVersion: "2025-08-27.basil" 
    });

    // Check if customer already exists
    let customerId = advertiser.stripe_customer_id;
    
    if (!customerId) {
      // Create Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        name: advertiser.company_name,
        metadata: {
          advertiser_id: advertiser.id,
          user_id: user.id,
        },
      });
      customerId = customer.id;
      logStep("Stripe customer created", { customerId });

      // Update advertiser with Stripe customer ID
      await supabaseClient
        .from("advertisers")
        .update({ stripe_customer_id: customerId })
        .eq("id", advertiser.id);
    }

    // Create checkout session for retainer deposit with setup mode
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "setup",
      payment_method_types: ["card"],
      success_url: `${req.headers.get("origin")}/advertiser/dashboard?setup=success`,
      cancel_url: `${req.headers.get("origin")}/advertiser/dashboard?setup=cancel`,
      metadata: {
        advertiser_id: advertiser.id,
        retainer_amount: retainerAmount.toString(),
      },
    });

    logStep("Checkout session created", { sessionId: session.id });

    return new Response(JSON.stringify({ 
      url: session.url,
      sessionId: session.id,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
