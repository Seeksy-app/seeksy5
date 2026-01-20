import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-MODULE-PURCHASE] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id });

    const { sessionId } = await req.json();
    if (!sessionId) throw new Error("Session ID is required");
    logStep("Session ID received", { sessionId });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    logStep("Session retrieved", { status: session.payment_status });

    if (session.payment_status !== "paid") {
      return new Response(JSON.stringify({ verified: false, message: "Payment not completed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const moduleId = session.metadata?.module_id;
    if (!moduleId) throw new Error("Module ID not found in session metadata");

    // Check if purchase already recorded
    const { data: existingPurchase } = await supabaseClient
      .from("module_purchases")
      .select("id")
      .eq("user_id", user.id)
      .eq("module_id", moduleId)
      .maybeSingle();

    if (!existingPurchase) {
      // Record the purchase
      const { error: purchaseError } = await supabaseClient
        .from("module_purchases")
        .insert({
          user_id: user.id,
          module_id: moduleId,
          amount_paid: (session.amount_total || 0) / 100,
          stripe_payment_intent_id: session.payment_intent as string,
          status: "completed",
        });

      if (purchaseError) throw purchaseError;
      logStep("Purchase recorded");

      // Grant module access
      const { error: accessError } = await supabaseClient
        .from("user_modules")
        .upsert({
          user_id: user.id,
          module_id: moduleId,
        }, {
          onConflict: "user_id,module_id"
        });

      if (accessError) throw accessError;
      logStep("Module access granted");
    }

    return new Response(JSON.stringify({ verified: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in verify-module-purchase", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
