import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const senderEmail = Deno.env.get("SENDER_EMAIL_HELLO") || "Seeksy <hello@seeksy.io>";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InviteRequest {
  investorEmail: string;
  investorName?: string;
  accessCode: string;
  investorLink: string;
  senderName?: string;
  senderUserId?: string;
}

const generateEmailHTML = (accessCode: string, investorLink: string, senderName?: string) => `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Financial Forecast Access</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            
            <!-- Header with gradient -->
            <tr>
              <td style="background: linear-gradient(135deg, hsl(207, 100%, 50%) 0%, hsl(45, 100%, 60%) 100%); padding: 40px 30px; text-align: center;">
                <h1 style="margin: 0 0 10px 0; color: #ffffff; font-size: 36px; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">Seeksy</h1>
                <p style="margin: 0; color: #ffffff; font-size: 18px; opacity: 0.95;">Financial Forecast Access</p>
              </td>
            </tr>

            <!-- Main content -->
            <tr>
              <td style="padding: 40px 30px;">
                <p style="margin: 0 0 16px 0; font-size: 18px; color: #111827;">Hello,</p>
                <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #374151;">
                  ${senderName ? `${senderName} has` : 'You have been'} invited you to access financial forecasts and models through the Seeksy platform.
                </p>

                <!-- Access code box -->
                <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                  <tr>
                    <td style="background-color: #f9fafb; border: 2px dashed #9ca3af; border-radius: 8px; padding: 24px; text-align: center;">
                      <p style="margin: 0 0 12px 0; font-size: 14px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Your Access Code</p>
                      <p style="margin: 0; font-size: 32px; font-weight: bold; letter-spacing: 4px; color: hsl(207, 100%, 50%); font-family: 'Courier New', monospace;">${accessCode}</p>
                    </td>
                  </tr>
                </table>

                <!-- CTA Button -->
                <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                  <tr>
                    <td align="center">
                      <a href="${investorLink}" style="display: inline-block; background-color: hsl(207, 100%, 50%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Access Financial Models</a>
                    </td>
                  </tr>
                </table>

                <p style="margin: 24px 0 8px 0; font-size: 14px; color: #6b7280;">Or copy and paste this link in your browser:</p>
                <p style="margin: 0 0 32px 0; font-size: 13px; color: hsl(207, 100%, 50%); padding: 12px; background-color: #f9fafb; border-radius: 4px; word-break: break-all;">${investorLink}</p>

                <!-- Instructions -->
                <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0; background-color: #f9fafb; border-left: 4px solid hsl(207, 100%, 50%); border-radius: 4px;">
                  <tr>
                    <td style="padding: 20px;">
                      <p style="margin: 0 0 12px 0; font-weight: bold; font-size: 16px; color: #111827;">How to Access:</p>
                      <p style="margin: 8px 0; font-size: 15px; color: #374151; line-height: 1.5;">1. Click the button above</p>
                      <p style="margin: 8px 0; font-size: 15px; color: #374151; line-height: 1.5;">2. Enter the access code: <strong>${accessCode}</strong></p>
                      <p style="margin: 8px 0; font-size: 15px; color: #374151; line-height: 1.5;">3. Review the confidentiality agreement</p>
                      <p style="margin: 8px 0; font-size: 15px; color: #374151; line-height: 1.5;">4. View read-only financial forecasts</p>
                    </td>
                  </tr>
                </table>

                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">

                <!-- Security note -->
                <p style="margin: 0; font-size: 13px; color: #6b7280; line-height: 1.6;">
                  <strong>Security Note:</strong> This access code expires in 30 days and provides read-only access to confidential financial data. By accessing this information, you agree to maintain strict confidentiality.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding: 20px 30px; text-align: center; background-color: #f9fafb;">
                <p style="margin: 0 0 4px 0; font-size: 14px; color: #374151; font-weight: 600;">Seeksy Financial Platform</p>
                <p style="margin: 0; font-size: 12px; color: #9ca3af;">Questions? Reply to this email.</p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { investorEmail, investorName, accessCode, investorLink, senderName, senderUserId }: InviteRequest = await req.json();

    if (!investorEmail || !accessCode || !investorLink) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emailHTML = generateEmailHTML(accessCode, investorLink, senderName);

    // Plain text version
    const emailText = `
Financial Forecast Access

Hello,

${senderName ? `${senderName} has` : 'You have been'} invited you to access financial forecasts and models through the Seeksy platform.

YOUR ACCESS CODE: ${accessCode}

To access the financial portal:
1. Visit: ${investorLink}
2. Enter the access code: ${accessCode}
3. Review the confidentiality agreement
4. View read-only financial forecasts and models

Security Note: This access code expires in 30 days and provides read-only access to confidential financial data. By accessing this information, you agree to maintain strict confidentiality.

---
Seeksy Financial Platform
Questions? Reply to this email.
    `.trim();

    const emailResponse = await resend.emails.send({
      from: senderEmail,
      to: [investorEmail],
      replyTo: senderEmail,
      subject: "Financial Forecast Access - Seeksy",
      html: emailHTML,
      text: emailText,
    });

    console.log("Investor invite email sent successfully:", emailResponse);

    // Log the email send in investor_portal_emails table
    if (senderUserId) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      
      const { error: logError } = await supabase
        .from("investor_portal_emails")
        .insert({
          sent_by_user_id: senderUserId,
          recipient_email: investorEmail,
          recipient_name: investorName || investorEmail,
          access_code: accessCode,
          status: 'sent',
          resend_email_id: emailResponse.data?.id || null,
        });

      if (logError) {
        console.error("Error logging email send:", logError);
        // Don't fail the request if logging fails
      }
    }

    return new Response(
      JSON.stringify({ success: true, data: emailResponse }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-investor-invite function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send email" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);