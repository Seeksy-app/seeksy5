import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { linkId, investorEmail, investorName, message, boardMemberName, boardMemberEmail } = await req.json();

    console.log("Sending investor email:", { linkId, investorEmail, investorName });

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the link details
    const { data: linkData, error: linkError } = await supabase
      .from("investor_links")
      .select("*")
      .eq("id", linkId)
      .single();

    if (linkError || !linkData) {
      throw new Error("Investor link not found");
    }

    const baseUrl = "https://seeksy.io";
    const investorUrl = `${baseUrl}/investor/${linkData.token}`;

    const emailSubject = `${boardMemberName} has shared Seeksy Investor Materials with you`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; background-color: #f8fafc;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); padding: 32px; border-radius: 16px 16px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">Seeksy</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">Investor Materials</p>
          </div>
          
          <div style="background: white; padding: 32px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            <p style="font-size: 16px; margin: 0 0 16px 0;">Hi ${investorName || "there"},</p>
            
            <p style="font-size: 16px; margin: 0 0 16px 0;">
              <strong>${boardMemberName}</strong> has shared access to Seeksy's investor materials with you.
            </p>
            
            ${message ? `
              <div style="background: #f1f5f9; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 0 8px 8px 0; margin: 24px 0;">
                <p style="margin: 0; font-style: italic; color: #475569;">"${message}"</p>
              </div>
            ` : ""}
            
            <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #64748b;">Your Access Code</p>
              <p style="font-family: monospace; font-size: 32px; letter-spacing: 8px; font-weight: 700; color: #1e293b; margin: 0;">${linkData.passcode}</p>
            </div>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="${investorUrl}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                Access Investor View
              </a>
            </div>
            
            <p style="font-size: 14px; color: #64748b; margin: 24px 0 0 0;">
              Or copy this link: <a href="${investorUrl}" style="color: #3b82f6;">${investorUrl}</a>
            </p>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;">
            
            <div style="background: #fef3c7; border-radius: 8px; padding: 16px; margin: 24px 0;">
              <p style="margin: 0; font-size: 12px; color: #92400e; font-weight: 600;">CONFIDENTIALITY NOTICE</p>
              <p style="margin: 8px 0 0 0; font-size: 12px; color: #92400e;">
                This confidential link is intended solely for investment evaluation. By accessing it, you agree not to redistribute or copy any content without written authorization.
              </p>
            </div>
            
            <p style="font-size: 14px; color: #64748b; margin: 16px 0 0 0;">
              Questions? Contact ${boardMemberName} at <a href="mailto:${boardMemberEmail}" style="color: #3b82f6;">${boardMemberEmail}</a>
            </p>
          </div>
          
          <p style="text-align: center; font-size: 12px; color: #94a3b8; margin: 24px 0 0 0;">
            © 2024 Seeksy. All rights reserved.
          </p>
        </div>
      </body>
      </html>
    `;

    // Send email via Resend
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Seeksy <hello@seeksy.io>",
        to: [investorEmail],
        subject: emailSubject,
        html: emailHtml,
      }),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      console.error("Resend error:", errorText);
      throw new Error("Failed to send email");
    }

    const resendData = await resendResponse.json();
    console.log("Email sent successfully:", resendData);

    // Log the email in database
    const { error: insertError } = await supabase.from("investor_emails").insert({
      link_id: linkId,
      investor_email: investorEmail,
      investor_name: investorName,
      subject: emailSubject,
      body: message,
      status: "sent",
      sent_at: new Date().toISOString(),
    });

    if (insertError) {
      console.error("Error logging email:", insertError);
    }

    return new Response(
      JSON.stringify({ success: true, emailId: resendData.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Send investor email error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
