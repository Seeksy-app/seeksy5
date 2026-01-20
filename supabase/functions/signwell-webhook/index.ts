import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    const body = await req.json();
    
    console.log("SignWell webhook received:", JSON.stringify(body, null, 2));

    const { event_type, data } = body;
    const documentId = data?.document?.id;
    const instanceId = data?.document?.metadata?.instanceId;

    console.log("Event type:", event_type);
    console.log("Document ID:", documentId);
    console.log("Instance ID:", instanceId);

    if (!instanceId) {
      console.log("No instanceId in metadata, skipping database update");
      return new Response(
        JSON.stringify({ received: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle different SignWell events for 3-party sequential signing
    // Order: Seller (1) -> Purchaser (2) -> Chairman (3)
    switch (event_type) {
      case "document_completed": {
        // All 3 parties have signed - download and save the signed PDF
        console.log("Document completed - all parties signed");
        
        // Get the signed PDF URL
        const signedPdfUrl = data?.document?.files?.[0]?.url;
        
        const { error: updateError } = await supabase
          .from("legal_doc_instances")
          .update({
            status: "completed",
            signwell_document_id: documentId,
            signwell_status: "completed",
            signed_pdf_url: signedPdfUrl,
            chairman_signed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", instanceId);

        if (updateError) {
          console.error("Error updating instance:", updateError);
          throw updateError;
        }

        console.log("Instance marked as completed with signed PDF");
        break;
      }

      case "document_signed": {
        // A recipient has signed - track which party
        const recipientEmail = data?.recipient?.email;
        const recipientName = data?.recipient?.name;
        const signingOrder = data?.recipient?.signing_order;
        console.log(`Recipient signed: ${recipientName} (${recipientEmail}) - Order: ${signingOrder}`);

        // Determine which signature field to update based on signing order
        const updateFields: Record<string, unknown> = {
          signwell_status: "partially_signed",
          signwell_document_id: documentId,
          updated_at: new Date().toISOString(),
        };

        // Track signature timestamps based on order
        if (signingOrder === 1) {
          updateFields.seller_signed_at = new Date().toISOString();
          console.log("Seller signature recorded");
        } else if (signingOrder === 2) {
          updateFields.purchaser_signed_at = new Date().toISOString();
          console.log("Purchaser signature recorded");
        } else if (signingOrder === 3) {
          // This is handled by document_completed event
          console.log("Chairman signature - awaiting document_completed");
        }

        const { error: updateError } = await supabase
          .from("legal_doc_instances")
          .update(updateFields)
          .eq("id", instanceId);

        if (updateError) {
          console.error("Error updating instance:", updateError);
        }
        break;
      }

      case "document_viewed": {
        console.log("Document viewed by:", data?.recipient?.email);
        break;
      }

      case "document_declined": {
        console.log("Document declined by:", data?.recipient?.email);
        
        const { error: updateError } = await supabase
          .from("legal_doc_instances")
          .update({
            status: "declined",
            signwell_status: "declined",
            signwell_document_id: documentId,
            updated_at: new Date().toISOString(),
          })
          .eq("id", instanceId);

        if (updateError) {
          console.error("Error updating instance:", updateError);
        }
        break;
      }

      default:
        console.log("Unhandled event type:", event_type);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in signwell-webhook:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
