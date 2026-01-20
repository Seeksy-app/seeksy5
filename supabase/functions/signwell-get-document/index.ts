import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const SIGNWELL_API_KEY = Deno.env.get("SIGNWELL_API_KEY");
    
    if (!SIGNWELL_API_KEY) {
      return new Response(
        JSON.stringify({ error: "SignWell API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { documentId } = await req.json();

    if (!documentId) {
      return new Response(
        JSON.stringify({ error: "documentId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Fetching SignWell document:", documentId);

    const response = await fetch(`https://www.signwell.com/api/v1/documents/${documentId}`, {
      method: "GET",
      headers: {
        "X-Api-Key": SIGNWELL_API_KEY,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("SignWell API error:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to fetch document", details: errorText }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const documentData = await response.json();

    return new Response(
      JSON.stringify({
        id: documentData.id,
        status: documentData.status,
        name: documentData.name,
        recipients: documentData.recipients,
        files: documentData.files,
        createdAt: documentData.created_at,
        completedAt: documentData.completed_at,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in signwell-get-document:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
