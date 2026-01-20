import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SignWellRecipient {
  id: string;
  email: string;
  name: string;
  role?: string;
}

interface SignWellRequest {
  documentBase64: string;
  documentName: string;
  recipients: SignWellRecipient[];
  subject?: string;
  message?: string;
  instanceId?: string;
  sellerName?: string;
  sellerEmail?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SIGNWELL_API_KEY = Deno.env.get("SIGNWELL_API_KEY");
    
    if (!SIGNWELL_API_KEY) {
      console.error("SIGNWELL_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "SignWell API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: SignWellRequest = await req.json();
    const { documentBase64, documentName, recipients, subject, message, instanceId, sellerName, sellerEmail } = body;

    console.log("Creating SignWell document:", documentName);
    console.log("Recipients:", recipients.map(r => r.email));

    // Create document in SignWell with sequential 3-party signing
    // Order: 1) Purchaser -> 2) Seller -> 3) Chairman
    // Document uses {{signature:1}}, {{signature:2}}, {{signature:3}} text tags
    // The index in the tag matches the recipient's position in the array (1-based)
    
    // Create a friendly document title (without .docx extension)
    const friendlyDocName = documentName.replace(/\.docx$/i, '').replace(/_/g, ' ');
    
    // Build recipients array in signing order:
    // Index 1 = Purchaser (signs first)
    // Index 2 = Seller (signs second)
    // Index 3 = Chairman (signs last)
    // The {{signature:N}} tags in document will match recipient at position N
    
    const signWellPayload = {
      test_mode: false,
      files: [
        {
          name: documentName,
          file_base64: documentBase64,
        }
      ],
      name: friendlyDocName,
      subject: subject || `Please sign: ${friendlyDocName}`,
      message: message || "Please review and sign this document at your earliest convenience.",
      recipients: recipients.map((r, index) => ({
        id: (index + 1).toString(), // SignWell uses string IDs, match with {{signature:N}}
        email: r.email,
        name: r.name,
        signing_order: index + 1, // Sequential: 1, 2, 3
      })),
      // Use text tags for signature placement - document contains {{signature:1}}, {{signature:2}}, {{signature:3}}
      text_tags: true,
      apply_signing_order: true,
      custom_requester_name: sellerName || "Seeksy Legal",
      custom_requester_email: sellerEmail || "legal@seeksy.io",
      redirect_url: `${Deno.env.get("SITE_URL") || "https://seeksy.io"}/legal/signed?instance=${instanceId || ""}`,
      decline_redirect_url: `${Deno.env.get("SITE_URL") || "https://seeksy.io"}/legal/declined?instance=${instanceId || ""}`,
      expires_in: 30,
      reminders: true,
      allow_decline: true,
      allow_reassign: false,
      metadata: instanceId ? { instanceId } : undefined,
    };

    console.log("Sending to SignWell API with signature page...");
    console.log("Payload recipients:", JSON.stringify(signWellPayload.recipients));

    const signWellResponse = await fetch("https://www.signwell.com/api/v1/documents/", {
      method: "POST",
      headers: {
        "X-Api-Key": SIGNWELL_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(signWellPayload),
    });

    const responseText = await signWellResponse.text();
    console.log("SignWell response status:", signWellResponse.status);
    console.log("SignWell response:", responseText);

    if (!signWellResponse.ok) {
      console.error("SignWell API error:", responseText);
      return new Response(
        JSON.stringify({ 
          error: "Failed to create SignWell document", 
          details: responseText 
        }),
        { status: signWellResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const createData = JSON.parse(responseText);

    console.log("SignWell document created:", createData.id);

    // Now send the document to trigger email notifications
    console.log("Sending document to recipients...");
    const sendResponse = await fetch(`https://www.signwell.com/api/v1/documents/${createData.id}/send/`, {
      method: "POST",
      headers: {
        "X-Api-Key": SIGNWELL_API_KEY,
        "Content-Type": "application/json",
      },
    });

    if (!sendResponse.ok) {
      const sendErrorText = await sendResponse.text();
      console.error("SignWell send error:", sendErrorText);
      // Document was created but not sent - return partial success
      return new Response(
        JSON.stringify({
          success: true,
          documentId: createData.id,
          status: "created_not_sent",
          warning: "Document created but emails not sent",
          recipients: createData.recipients,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const sendData = await sendResponse.json();
    console.log("SignWell document sent successfully:", sendData);

    return new Response(
      JSON.stringify({
        success: true,
        documentId: createData.id,
        status: sendData.status || "sent",
        recipients: sendData.recipients || createData.recipients,
        embeddedSigningUrl: sendData.embedded_signing_url,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in signwell-send-document:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
