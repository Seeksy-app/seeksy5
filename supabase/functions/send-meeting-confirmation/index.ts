import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MeetingConfirmationRequest {
  attendeeName: string;
  attendeeEmail: string;
  meetingType: string;
  meetingDate: string;
  meetingTime: string;
  duration: number;
  hostName?: string;
  notes?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      attendeeName, 
      attendeeEmail, 
      meetingType, 
      meetingDate, 
      meetingTime, 
      duration,
      hostName,
      notes 
    }: MeetingConfirmationRequest = await req.json();

    console.log("Sending meeting confirmation to:", attendeeEmail);

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const senderEmail = "hello@seeksy.io";

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #053877 0%, #0a5aaa 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Meeting Confirmed! ✓</h1>
        </div>
        
        <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none;">
          <p style="font-size: 18px; margin-top: 0;">Hi ${attendeeName},</p>
          
          <p>Your <strong>${meetingType}</strong> has been successfully scheduled.</p>
          
          <div style="background: white; border-radius: 8px; padding: 20px; margin: 24px 0; border: 1px solid #e2e8f0;">
            <h3 style="margin-top: 0; color: #053877;">📅 Meeting Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Date:</td>
                <td style="padding: 8px 0; font-weight: 600;">${meetingDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Time:</td>
                <td style="padding: 8px 0; font-weight: 600;">${meetingTime} EST</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Duration:</td>
                <td style="padding: 8px 0; font-weight: 600;">${duration} minutes</td>
              </tr>
              ${hostName ? `
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Host:</td>
                <td style="padding: 8px 0; font-weight: 600;">${hostName}</td>
              </tr>
              ` : ''}
            </table>
          </div>
          
          ${notes ? `
          <div style="background: #fffbeb; border-radius: 8px; padding: 16px; margin: 16px 0; border-left: 4px solid #f59e0b;">
            <p style="margin: 0; font-size: 14px;"><strong>Your notes:</strong> ${notes}</p>
          </div>
          ` : ''}
          
          <p style="color: #64748b; font-size: 14px;">
            A calendar invite with the video call link will be sent separately.
          </p>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="https://seeksy.io" style="display: inline-block; background: #053877; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
              Visit Seeksy
            </a>
          </div>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #94a3b8; font-size: 12px;">
          <p style="margin: 0;">© ${new Date().getFullYear()} Seeksy. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `Seeksy <${senderEmail}>`,
        to: [attendeeEmail],
        subject: `Meeting Confirmed: ${meetingType}`,
        html: emailHtml,
      }),
    });

    const data = await res.json();
    
    if (!res.ok) {
      console.error("Resend API error:", data);
      throw new Error(data.message || "Failed to send email");
    }

    console.log("Email sent successfully:", data);

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending meeting confirmation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
