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
    const { programId, attendeeName, attendeeEmail } = await req.json();

    if (!programId || !attendeeName || !attendeeEmail) {
      throw new Error("Missing required fields");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get program details
    const { data: program, error: programError } = await supabaseClient
      .from("awards_programs")
      .select("*")
      .eq("id", programId)
      .single();

    if (programError) throw programError;
    if (!program.registration_fee || program.registration_fee <= 0) {
      throw new Error("This program does not require a registration fee");
    }

    const feeConfig = (program.fee_configuration as any) || {
      creator_percentage: 4.0,
      platform_processing_fee: 10.95,
      who_pays_processing: "creator",
    };

    // Calculate fees
    const registrationFee = program.registration_fee;
    let serviceFee = 0;
    let processingFee = feeConfig.platform_processing_fee || 10.95;

    // Add creator's service fee if configured
    if (feeConfig.creator_percentage && feeConfig.creator_percentage > 0) {
      serviceFee = registrationFee * (feeConfig.creator_percentage / 100);
    }
    
    let totalAmount = registrationFee;
    let creatorAmount = registrationFee;
    
    // Adjust based on who pays processing fees
    if (feeConfig.who_pays_processing === "creator") {
      creatorAmount -= (serviceFee + processingFee);
    } else {
      // Attendee pays fees
      totalAmount += serviceFee + processingFee;
    }

    // Create registration record
    const { data: registration, error: registrationError } = await supabaseClient
      .from("award_registrations")
      .insert({
        program_id: programId,
        attendee_name: attendeeName,
        attendee_email: attendeeEmail,
        amount_paid: totalAmount,
        status: "pending",
      })
      .select()
      .single();

    if (registrationError) throw registrationError;

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: Math.round(totalAmount * 100),
            product_data: {
              name: `Registration: ${program.title}`,
              description: `Attendance registration for ${program.title}`,
            },
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/awards/registration-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/awards/${programId}`,
      customer_email: attendeeEmail,
      metadata: {
        registrationId: registration.id,
        programId,
        creatorUserId: program.user_id,
        registrationFee: registrationFee.toString(),
        serviceFee: serviceFee.toString(),
        processingFee: processingFee.toString(),
        creatorAmount: creatorAmount.toString(),
      },
      payment_intent_data: program.stripe_connect_account_id ? {
        application_fee_amount: Math.round((totalAmount - creatorAmount) * 100),
        transfer_data: {
          destination: program.stripe_connect_account_id,
          amount: Math.round(creatorAmount * 100),
        },
      } : undefined,
    });


    // Update registration with stripe payment intent
    await supabaseClient
      .from("award_registrations")
      .update({ stripe_payment_intent_id: session.payment_intent as string })
      .eq("id", registration.id);

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error creating registration payment:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
