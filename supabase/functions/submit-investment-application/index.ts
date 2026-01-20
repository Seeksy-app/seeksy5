import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvestmentApplication {
  name: string;
  email: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  numberOfShares: number;
  pricePerShare: number;
  totalAmount: number;
  investmentMode: "shares" | "amount";
  investorCertification?: string;
  // Tiered pricing breakdown
  mainShares?: number;
  addonShares?: number;
  addonAmount?: number;
  addonPricePerShare?: number;
  // Tier 2 pricing if applicable
  tier1Shares?: number;
  tier1Price?: number;
  tier2Shares?: number;
  tier2Price?: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body: InvestmentApplication = await req.json();
    const { 
      name, email, street, city, state, zip, 
      numberOfShares, pricePerShare, totalAmount, investorCertification,
      mainShares, addonShares, addonAmount, addonPricePerShare,
      tier1Shares, tier1Price, tier2Shares, tier2Price
    } = body;

    console.log("Received investment application:", { name, email, numberOfShares, totalAmount, mainShares, addonShares });

    // Basic validation
    if (!name || !email || !street || !city || !state || !zip) {
      return new Response(
        JSON.stringify({ success: false, error: "All fields are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (numberOfShares <= 0 || totalAmount <= 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid investment amount" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid email format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Format address for storage
    const fullAddress = `${street}, ${city}, ${state} ${zip}`;

    // Create legal_doc_instance with status "pending" for admin review
    const { data: instance, error: insertError } = await supabase
      .from("legal_doc_instances")
      .insert({
        template_id: "3369d427-1854-4a8d-986d-7c8d64a3b2e5", // Common Stock Purchase Agreement template ID
        status: "pending",
        purchaser_email: email.toLowerCase(),
        recipient_name: name,
        recipient_email: email.toLowerCase(),
        document_type: "stock_purchase_agreement",
        field_values_json: {
          purchaser_name: name,
          purchaser_email: email.toLowerCase(),
          purchaser_street: street,
          purchaser_city: city,
          purchaser_state: state,
          purchaser_zip: zip,
          purchaser_address: fullAddress,
          numberOfShares: numberOfShares.toString(),
          pricePerShare: pricePerShare.toString(),
          investor_certification: investorCertification || "Individual with net worth or joint net worth with spouse exceeding $1 million",
        },
        computed_values_json: {
          totalAmount: totalAmount.toFixed(2),
          numberOfShares: numberOfShares,
          pricePerShare: pricePerShare,
          // Store tier breakdown for document generation
          mainShares: mainShares || numberOfShares,
          addonShares: addonShares || 0,
          addonAmount: addonAmount || 0,
          addonPricePerShare: addonPricePerShare || null,
          tier1Shares: tier1Shares || mainShares || numberOfShares,
          tier1Price: tier1Price || pricePerShare,
          tier2Shares: tier2Shares || 0,
          tier2Price: tier2Price || null,
        },
        addon_amount: addonAmount || 0,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Database insert error:", insertError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to save application" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Investment application saved:", instance.id);

    return new Response(
      JSON.stringify({
        success: true,
        applicationId: instance.id,
        message: "Application submitted successfully",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in submit-investment-application:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
