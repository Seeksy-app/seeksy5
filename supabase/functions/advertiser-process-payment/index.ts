import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  console.log(`[PROCESS-PAYMENT] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { sessionId } = await req.json();
    if (!sessionId) throw new Error("Session ID required");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { 
      apiVersion: "2025-08-27.basil" 
    });

    // Retrieve the session
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    logStep("Session retrieved", { sessionId, status: session.status });

    if (session.status !== "complete") {
      throw new Error("Payment not completed");
    }

    const advertiserId = session.metadata?.advertiser_id;
    const retainerAmount = parseFloat(session.metadata?.retainer_amount || "0");

    if (!advertiserId || !retainerAmount) {
      throw new Error("Invalid session metadata");
    }

    // Get advertiser
    const { data: advertiser, error: advertiserError } = await supabaseClient
      .from("advertisers")
      .select("*")
      .eq("id", advertiserId)
      .single();

    if (advertiserError) throw advertiserError;

    // Get setup intent to retrieve payment method
    const setupIntent = await stripe.setupIntents.retrieve(session.setup_intent as string);
    const paymentMethodId = setupIntent.payment_method as string;

    // Charge the retainer using the payment method
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(retainerAmount * 100), // Convert to cents
      currency: "usd",
      customer: advertiser.stripe_customer_id,
      payment_method: paymentMethodId,
      off_session: true,
      confirm: true,
      description: `Initial retainer deposit for ${advertiser.company_name}`,
      metadata: {
        advertiser_id: advertiserId,
        transaction_type: "deposit",
      },
    });

    logStep("Payment intent created", { paymentIntentId: paymentIntent.id });

    // Update advertiser balance
    const newBalance = Number(advertiser.account_balance) + retainerAmount;
    await supabaseClient
      .from("advertisers")
      .update({ account_balance: newBalance })
      .eq("id", advertiserId);

    // Record transaction
    await supabaseClient
      .from("advertiser_transactions")
      .insert({
        advertiser_id: advertiserId,
        transaction_type: "deposit",
        amount: retainerAmount,
        balance_after: newBalance,
        description: "Initial retainer deposit",
        stripe_payment_intent_id: paymentIntent.id,
      });

    logStep("Transaction recorded", { newBalance });

    return new Response(JSON.stringify({ 
      success: true,
      balance: newBalance,
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
