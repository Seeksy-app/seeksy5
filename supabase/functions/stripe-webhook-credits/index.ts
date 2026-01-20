import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

const cryptoProvider = Stripe.createSubtleCryptoProvider();

serve(async (req) => {
  const signature = req.headers.get("Stripe-Signature");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  if (!signature || !webhookSecret) {
    return new Response("Missing signature or webhook secret", { status: 400 });
  }

  try {
    const body = await req.text();
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,
      cryptoProvider
    );

    console.log("Webhook event received:", event.type);

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      
      // CRITICAL: Only process if payment is successful
      if (session.payment_status !== "paid") {
        console.log("Payment not completed yet, skipping:", { payment_status: session.payment_status, session_id: session.id });
        return new Response(JSON.stringify({ received: true, skipped: "payment_not_completed" }), {
          headers: { "Content-Type": "application/json" },
          status: 200,
        });
      }
      
      const userId = session.metadata?.user_id;
      const credits = parseInt(session.metadata?.credits || "0");

      if (!userId || !credits) {
        console.error("Missing user_id or credits in session metadata", { session_id: session.id, metadata: session.metadata });
        return new Response(JSON.stringify({ error: "Invalid metadata" }), { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      console.log("Processing credit purchase:", { userId, credits, session_id: session.id, payment_status: session.payment_status });

      // Get current balance
      const { data: userCredit, error: fetchError } = await supabaseClient
        .from("user_credits")
        .select("balance, total_purchased")
        .eq("user_id", userId)
        .single();

      if (fetchError) {
        console.error("Error fetching user credits:", fetchError);
        throw fetchError;
      }

      const newBalance = (userCredit?.balance || 0) + credits;
      const newTotalPurchased = (userCredit?.total_purchased || 0) + credits;

      // Update user credits
      const { error: updateError } = await supabaseClient
        .from("user_credits")
        .update({
          balance: newBalance,
          total_purchased: newTotalPurchased,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (updateError) {
        console.error("Error updating user credits:", updateError);
        throw updateError;
      }

      // Create transaction record
      const { error: transactionError } = await supabaseClient
        .from("credit_transactions")
        .insert({
          user_id: userId,
          amount: credits,
          transaction_type: "purchase",
          description: `Purchased ${credits} credits`,
          balance_after: newBalance,
          metadata: {
            stripe_session_id: session.id,
            amount_paid: session.amount_total,
          },
        });

      if (transactionError) {
        console.error("Error creating transaction:", transactionError);
        throw transactionError;
      }

      console.log("Credit purchase processed successfully:", { userId, credits, newBalance });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Webhook error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400 }
    );
  }
});