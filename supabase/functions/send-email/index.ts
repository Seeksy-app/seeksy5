import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error("Unauthorized");

    const { to, cc, bcc, subject, htmlContent, fromAccountId } = await req.json();
    
    if (!to || to.length === 0) throw new Error("Recipient email is required");
    if (!subject) throw new Error("Subject is required");
    if (!htmlContent) throw new Error("Email content is required");

    // Get user's email for Reply-To header
    let userEmail = user.email || "";
    let userName = user.user_metadata?.full_name || "Seeksy User";
    
    if (fromAccountId) {
      const { data: account } = await supabase
        .from("email_accounts")
        .select("email_address, display_name")
        .eq("id", fromAccountId)
        .single();
      
      if (account?.email_address) {
        userEmail = account.email_address;
        userName = account.display_name || userName;
      }
    }

    // Always send FROM verified Seeksy domain, but set Reply-To as user's email
    const fromEmail = `${userName} via Seeksy <hello@seeksy.io>`;

    // Initialize Resend
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    // Prepare recipient list
    const recipients = Array.isArray(to) ? to : [to];
    const ccRecipients = cc && cc.length > 0 ? (Array.isArray(cc) ? cc : [cc]) : undefined;
    const bccRecipients = bcc && bcc.length > 0 ? (Array.isArray(bcc) ? bcc : [bcc]) : undefined;

    // Send email via Resend
    const { data: emailData, error: sendError } = await resend.emails.send({
      from: fromEmail,
      replyTo: userEmail, // Replies go to user's actual email
      to: recipients,
      cc: ccRecipients,
      bcc: bccRecipients,
      subject: subject,
      html: htmlContent,
      headers: {
        'X-Entity-Ref-ID': user.id,
      },
    });

    if (sendError) {
      console.error("❌ Failed to send email:", sendError);
      throw new Error(`Failed to send email: ${sendError.message}`);
    }

    console.log(`✅ Email sent successfully:`, emailData);

    // Track sent event for each recipient
    for (const recipient of recipients) {
      // Try to find contact by email
      const { data: contact } = await supabase
        .from("contacts")
        .select("id")
        .eq("email", recipient)
        .eq("user_id", user.id)
        .maybeSingle();

      const { error: insertError } = await supabase.from("email_events").insert({
        event_type: "sent",
        to_email: recipient,
        from_email: fromEmail,
        email_subject: subject,
        contact_id: contact?.id || null,
        campaign_id: null,
        user_id: user.id,
        resend_email_id: emailData?.id,
        occurred_at: new Date().toISOString(),
      });

      if (insertError) {
        console.error("❌ Failed to log email event:", insertError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        emailId: emailData?.id,
        message: "Email sent successfully",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ Send email error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
