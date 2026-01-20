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
    const { 
      programId, 
      categoryId, 
      nomineeName, 
      nomineeEmail, 
      nomineeDescription,
      nomineeImageUrl,
      rssFeeedUrl,
      audioUrl,
      videoUrl 
    } = await req.json();

    // Get program details
    const { data: program, error: programError } = await supabaseClient
      .from("awards_programs")
      .select("*, profiles!inner(email)")
      .eq("id", programId)
      .single();

    if (programError) throw new Error("Program not found");
    if (!program.self_nomination_fee || program.self_nomination_fee <= 0) {
      throw new Error("Self-nomination not enabled for this program");
    }

    // Check if user is trying to nominate themselves in their own program
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabaseClient.auth.getUser(token);
      if (user && user.id === program.user_id) {
        throw new Error("Program creators cannot nominate themselves");
      }
    }

    // Create nominee first
    const { data: nominee, error: nomineeError } = await supabaseClient
      .from("award_nominees")
      .insert({
        program_id: programId,
        category_id: categoryId,
        nominee_name: nomineeName,
        nominee_email: nomineeEmail,
        nominee_description: nomineeDescription,
        nominee_image_url: nomineeImageUrl,
        rss_feed_url: rssFeeedUrl,
        audio_url: audioUrl,
        video_url: videoUrl,
        status: "pending",
      })
      .select()
      .single();

    if (nomineeError) throw nomineeError;

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Get fee configuration from program
    const feeConfig = (program.fee_configuration as any) || {
      creator_percentage: 4.0,
      platform_processing_fee: 10.95,
      who_pays_processing: "nominee",
    };

    // Calculate fees
    const nominationFee = program.self_nomination_fee;
    let serviceFee = 0;
    let processingFee = feeConfig.platform_processing_fee || 10.95;

    // Add creator's service fee if configured
    if (feeConfig.creator_percentage && feeConfig.creator_percentage > 0) {
      serviceFee = nominationFee * (feeConfig.creator_percentage / 100);
    }

    // Determine who pays processing fees
    let totalAmount = nominationFee;
    let creatorAmount = nominationFee;
    
    if (feeConfig.who_pays_processing === "nominee") {
      // Nominee pays: add all fees to total
      totalAmount += serviceFee + processingFee;
    } else {
      // Creator pays: deduct from creator amount
      creatorAmount -= (serviceFee + processingFee);
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Self-Nomination: ${program.title}`,
              description: `Category: ${categoryId}`,
            },
            unit_amount: Math.round(totalAmount * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/awards/${programId}?nomination=success`,
      cancel_url: `${req.headers.get("origin")}/nominate/${programId}?nomination=cancelled`,
      metadata: {
        programId,
        categoryId,
        nomineeId: nominee.id,
        creatorUserId: program.user_id,
      },
      payment_intent_data: program.stripe_connect_account_id ? {
        application_fee_amount: Math.round((totalAmount - creatorAmount) * 100),
        transfer_data: {
          destination: program.stripe_connect_account_id,
          amount: Math.round(creatorAmount * 100),
        },
      } : undefined,
    });

    // Create self-nomination record
    await supabaseClient
      .from("award_self_nominations")
      .insert({
        program_id: programId,
        category_id: categoryId,
        nominee_id: nominee.id,
        user_id: nominee.submitted_by_user_id || null,
        amount_paid: program.self_nomination_fee,
        stripe_payment_intent_id: session.payment_intent as string,
        status: "pending",
      });

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in awards-create-nomination-payment:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
