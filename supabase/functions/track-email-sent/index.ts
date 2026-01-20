import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { user_id, recipient_email, subject, tracking_id, sent_at } = await req.json();

    console.log("Tracking email sent:", { user_id, recipient_email, tracking_id });

    // Insert into email_tracking table
    const { data, error } = await supabase
      .from("email_tracking")
      .insert({
        user_id,
        recipient_email,
        subject,
        tracking_id,
        sent_at,
        status: "sent",
        source: "gmail_extension"
      })
      .select()
      .single();

    if (error) {
      console.error("Error inserting email tracking:", error);
      throw error;
    }

    console.log("Email tracking recorded:", data);

    return new Response(JSON.stringify({ success: true, tracking_id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    console.error("Error in track-email-sent:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
