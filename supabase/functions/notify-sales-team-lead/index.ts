import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SENDER_EMAIL = Deno.env.get("SENDER_EMAIL_HELLO") || "hello@seeksy.io";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationPayload {
  contactId: string;
  leadSource: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { contactId, leadSource }: NotificationPayload = await req.json();

    // Get contact details
    const { data: contact, error: contactError } = await supabaseClient
      .from("contacts")
      .select("*")
      .eq("id", contactId)
      .single();

    if (contactError) throw contactError;

    // Get all sales team members
    const { data: salesTeam, error: salesError } = await supabaseClient
      .from("sales_team_members")
      .select("email, full_name")
      .eq("status", "active");

    if (salesError) throw salesError;

    // Send email to each sales team member
    for (const member of salesTeam || []) {
      const emailData = {
        from: SENDER_EMAIL,
        to: [member.email],
        subject: `🎯 New Lead: ${contact.name}`,
        html: `
          <h2>New Lead Alert</h2>
          <p>Hi ${member.full_name},</p>
          <p>A new lead has been added to the CRM:</p>
          <ul>
            <li><strong>Name:</strong> ${contact.name}</li>
            <li><strong>Email:</strong> ${contact.email}</li>
            <li><strong>Company:</strong> ${contact.company || "N/A"}</li>
            <li><strong>Phone:</strong> ${contact.phone || "N/A"}</li>
            <li><strong>Source:</strong> ${leadSource}</li>
            <li><strong>Status:</strong> New Lead</li>
          </ul>
          <p><a href="${Deno.env.get("SUPABASE_URL")?.replace("supabase.co", "seeksy.app")}/crm">View in CRM</a></p>
        `,
      };

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify(emailData),
      });
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});