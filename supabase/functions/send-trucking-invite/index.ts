import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InviteEmailRequest {
  email: string;
  inviteLink: string;
  role: string;
  agencyName?: string;
  inviterName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, inviteLink, role, agencyName, inviterName }: InviteEmailRequest = await req.json();

    console.log("Sending trucking invite email to:", email);

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const senderEmail = Deno.env.get("SENDER_EMAIL_HELLO") || "hello@seeksy.io";

    const roleDisplay = role === 'agent' ? 'Agent' : role === 'admin' ? 'Admin' : role === 'owner' ? 'Owner' : role;

    const emailResponse = await resend.emails.send({
      from: `Trucking Platform <${senderEmail}>`,
      to: [email],
      subject: `You've been invited to join ${agencyName || 'the Trucking Platform'} as ${roleDisplay}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #FF9F1C 0%, #F7931E 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🚛 You're Invited!</h1>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="font-size: 16px; margin-bottom: 20px;">
              ${inviterName ? `<strong>${inviterName}</strong> has invited you` : "You've been invited"} to join 
              <strong>${agencyName || 'the Trucking Platform'}</strong> as a <strong>${roleDisplay}</strong>.
            </p>
            
            <p style="font-size: 14px; color: #666; margin-bottom: 25px;">
              Click the button below to create your account and get started.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${inviteLink}" 
                 style="background: #FF9F1C; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">
                Accept Invitation
              </a>
            </div>
            
            <p style="font-size: 12px; color: #999; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${inviteLink}" style="color: #FF9F1C; word-break: break-all;">${inviteLink}</a>
            </p>
            
            <p style="font-size: 12px; color: #999; margin-top: 15px;">
              This invitation will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.
            </p>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending trucking invite email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
