import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import Stripe from "https://esm.sh/stripe@18.5.0";

const logStep = (step: string, details?: any) => {
  console.log(`[CHARGE-IMPRESSION] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
};

// This function is called when an impression is tracked
// It charges the advertiser's balance and handles auto top-up if needed
serve(async (req) => {
  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { campaignId, impressionCount = 1 } = await req.json();
    if (!campaignId) throw new Error("Campaign ID required");

    // Get campaign with advertiser info
    const { data: campaign, error: campaignError } = await supabaseClient
      .from("ad_campaigns")
      .select("*, advertisers(*)")
      .eq("id", campaignId)
      .single();

    if (campaignError || !campaign) throw new Error("Campaign not found");

    const advertiser = campaign.advertisers;
    if (!advertiser) throw new Error("Advertiser not found");

    // Calculate cost (CPM / 1000 * impression count)
    const cost = (campaign.cpm_bid / 1000) * impressionCount;
    logStep("Cost calculated", { cpm: campaign.cpm_bid, impressionCount, cost });

    // Check if balance is sufficient
    const currentBalance = Number(advertiser.account_balance);
    if (currentBalance < cost) {
      // Check if auto top-up is enabled
      if (advertiser.auto_topup_enabled && advertiser.stripe_customer_id) {
        logStep("Triggering auto top-up", { currentBalance, threshold: advertiser.auto_topup_threshold });
        
        const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { 
          apiVersion: "2025-08-27.basil" 
        });

        // Get default payment method
        const customer = await stripe.customers.retrieve(advertiser.stripe_customer_id);
        const paymentMethodId = (customer as any).invoice_settings?.default_payment_method;

        if (!paymentMethodId) {
          throw new Error("No payment method on file");
        }

        // Charge auto top-up amount
        const topUpAmount = Number(advertiser.auto_topup_amount);
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(topUpAmount * 100),
          currency: "usd",
          customer: advertiser.stripe_customer_id,
          payment_method: paymentMethodId,
          off_session: true,
          confirm: true,
          description: `Auto top-up for ${advertiser.company_name}`,
          metadata: {
            advertiser_id: advertiser.id,
            transaction_type: "topup",
          },
        });

        logStep("Auto top-up completed", { paymentIntentId: paymentIntent.id, amount: topUpAmount });

        // Update balance with top-up
        const newBalance = currentBalance + topUpAmount;
        await supabaseClient
          .from("advertisers")
          .update({ account_balance: newBalance })
          .eq("id", advertiser.id);

        // Record top-up transaction
        await supabaseClient
          .from("advertiser_transactions")
          .insert({
            advertiser_id: advertiser.id,
            transaction_type: "topup",
            amount: topUpAmount,
            balance_after: newBalance,
            description: "Automatic top-up",
            stripe_payment_intent_id: paymentIntent.id,
          });
      } else {
        throw new Error("Insufficient balance and auto top-up not enabled");
      }
    }

    // Deduct cost from balance
    const finalBalance = Number(advertiser.account_balance) - cost;
    await supabaseClient
      .from("advertisers")
      .update({ account_balance: finalBalance })
      .eq("id", advertiser.id);

    // Record charge transaction
    await supabaseClient
      .from("advertiser_transactions")
      .insert({
        advertiser_id: advertiser.id,
        transaction_type: "charge",
        amount: -cost,
        balance_after: finalBalance,
        description: `Ad impressions (${impressionCount})`,
        campaign_id: campaignId,
      });

    // Update campaign totals
    await supabaseClient
      .from("ad_campaigns")
      .update({ 
        total_spent: Number(campaign.total_spent || 0) + cost,
        total_impressions: Number(campaign.total_impressions || 0) + impressionCount,
      })
      .eq("id", campaignId);

      logStep("Charge completed", { cost, finalBalance });

      // Check if balance is low and auto top-up should trigger on next impression
      if (finalBalance < Number(advertiser.auto_topup_threshold) && advertiser.auto_topup_enabled) {
        logStep("Balance below threshold, auto top-up will trigger on next charge", {
          balance: finalBalance,
          threshold: advertiser.auto_topup_threshold
        });
      }

    return new Response(JSON.stringify({ 
      success: true,
      charged: cost,
      balance: finalBalance,
    }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
