import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PROCESSING_FEE_FIXED = 10.95;
const PROCESSING_FEE_PERCENT = 0.04;

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
      packageId,
      sponsorName,
      sponsorEmail,
      sponsorWebsiteUrl,
      sponsorLogoUrl,
      socialMediaHandles,
      hashtags,
      mentions
    } = await req.json();

    // Get package and program details
    const { data: pkg, error: pkgError } = await supabaseClient
      .from("award_sponsorship_packages")
      .select("*, awards_programs!inner(*)")
      .eq("id", packageId)
      .single();

    if (pkgError) throw new Error("Package not found");

    // Check if max sponsors reached
    if (pkg.max_sponsors) {
      const { count } = await supabaseClient
        .from("award_sponsorships")
        .select("*", { count: "exact", head: true })
        .eq("package_id", packageId)
        .eq("status", "paid");

      if (count && count >= pkg.max_sponsors) {
        throw new Error("This sponsorship package is sold out");
      }
    }

    const program = pkg.awards_programs;

    // Create sponsorship record first
    const { data: sponsorship, error: sponsorshipError } = await supabaseClient
      .from("award_sponsorships")
      .insert({
        program_id: programId,
        package_id: packageId,
        sponsor_name: sponsorName,
        sponsor_email: sponsorEmail,
        sponsor_website_url: sponsorWebsiteUrl,
        sponsor_logo_url: sponsorLogoUrl,
        social_media_handles: socialMediaHandles || {},
        hashtags: hashtags || [],
        mentions: mentions || [],
        amount_paid: pkg.price,
        status: "pending",
      })
      .select()
      .single();

    if (sponsorshipError) throw sponsorshipError;

    // Create lead in contacts table for sales tracking
    try {
      const { data: contactData, error: contactError } = await supabaseClient
        .from("contacts")
        .insert({
          name: sponsorName,
          email: sponsorEmail,
          company: sponsorName, // Could be individual or company
          phone: null,
          title: null,
          lead_source: "sponsorship_request",
          lead_status: "new",
          notes: `Sponsorship Package: ${pkg.package_name} for ${program.title}\nWebsite: ${sponsorWebsiteUrl || "N/A"}\nPackage Price: $${pkg.price}`,
        })
        .select()
        .single();

      if (!contactError && contactData) {
        // Notify sales team about new sponsorship lead
        await supabaseClient.functions.invoke('notify-sales-team-lead', {
          body: {
            contactId: contactData.id,
            leadSource: 'Sponsorship Request',
          },
        });
      }
    } catch (leadError) {
      console.error('Lead creation failed:', leadError);
      // Don't block sponsorship if lead creation fails
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Get fee configuration from package or use defaults
    const feeConfig = (pkg.fee_configuration as any) || {
      creator_percentage: 0,
      who_pays_processing: "sponsor",
    };

    // Calculate fees
    const packagePrice = pkg.price;
    let serviceFee = 0;
    let processingFee = PROCESSING_FEE_FIXED; // $10.95 base

    // Add creator's service fee if configured
    if (feeConfig.creator_percentage && feeConfig.creator_percentage > 0) {
      serviceFee = packagePrice * (feeConfig.creator_percentage / 100);
      processingFee += serviceFee; // Includes creator's percentage
    } else {
      // Default platform fee
      processingFee += packagePrice * PROCESSING_FEE_PERCENT;
    }

    const totalCharge = packagePrice + processingFee;
    const creatorAmount = Math.round(packagePrice * 100); // Convert to cents

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${pkg.package_name} - ${program.title}`,
              description: pkg.package_description || "Sponsorship package",
            },
            unit_amount: Math.round(totalCharge * 100), // Total including fees
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/awards/${programId}/vote?sponsorship=success`,
      cancel_url: `${req.headers.get("origin")}/awards/${programId}/sponsor/${packageId}?cancelled=true`,
      customer_email: sponsorEmail,
      metadata: {
        programId,
        packageId,
        sponsorshipId: sponsorship.id,
        creatorUserId: program.user_id,
        packagePrice: packagePrice.toString(),
        serviceFee: serviceFee.toFixed(2),
        processingFee: processingFee.toFixed(2),
      },
      payment_intent_data: program.stripe_connect_account_id ? {
        application_fee_amount: Math.round(processingFee * 100),
        transfer_data: {
          destination: program.stripe_connect_account_id,
          amount: creatorAmount,
        },
      } : undefined,
    });

    // Update sponsorship with payment intent
    await supabaseClient
      .from("award_sponsorships")
      .update({
        stripe_payment_intent_id: session.payment_intent as string,
      })
      .eq("id", sponsorship.id);

    return new Response(
      JSON.stringify({ 
        url: session.url, 
        sessionId: session.id,
        breakdown: {
          packagePrice,
          serviceFee: serviceFee.toFixed(2),
          processingFee: processingFee.toFixed(2),
          total: totalCharge.toFixed(2),
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in awards-create-sponsorship-payment:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
