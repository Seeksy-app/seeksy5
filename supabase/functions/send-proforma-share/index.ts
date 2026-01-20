import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ShareEmailRequest {
  recipientName: string;
  recipientEmail: string;
  shareUrl: string;
  passcode: string;
  proformaType: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recipientName, recipientEmail, shareUrl, passcode, proformaType }: ShareEmailRequest = await req.json();

    if (!recipientEmail) {
      throw new Error("Recipient email is required");
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background: linear-gradient(135deg, #053877 0%, #2563eb 100%); border-radius: 16px 16px 0 0; padding: 32px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">Seeksy</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0 0; font-size: 14px;">Financial Projections</p>
          </div>
          
          <div style="background: white; border-radius: 0 0 16px 16px; padding: 32px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #1e293b; margin: 0 0 16px 0; font-size: 20px;">
              ${recipientName ? `Hello ${recipientName},` : 'Hello,'}
            </h2>
            
            <p style="color: #475569; line-height: 1.6; margin: 0 0 24px 0;">
              You've been invited to view the <strong>${proformaType}</strong>. This document contains confidential financial projections for your review.
            </p>
            
            <div style="background: #f1f5f9; border-radius: 12px; padding: 24px; text-align: center; margin: 0 0 24px 0;">
              <p style="color: #64748b; margin: 0 0 8px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Your Access Code</p>
              <p style="color: #053877; font-size: 32px; font-weight: 700; letter-spacing: 6px; margin: 0; font-family: monospace;">${passcode}</p>
            </div>
            
            <a href="${shareUrl}" style="display: block; background: #053877; color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; text-align: center; margin: 0 0 24px 0;">
              View Pro Forma
            </a>
            
            <p style="color: #94a3b8; font-size: 13px; line-height: 1.5; margin: 0; padding-top: 16px; border-top: 1px solid #e2e8f0;">
              <strong>Important:</strong> This document is confidential. By accessing it, you agree to maintain strict confidentiality of all information contained within.
            </p>
          </div>
          
          <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 24px;">
            © ${new Date().getFullYear()} Seeksy. All rights reserved.
          </p>
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
        from: "Seeksy <notifications@seeksy.io>",
        to: [recipientEmail],
        subject: `You've been invited to view the ${proformaType}`,
        html: emailHtml,
      }),
    });

    if (!res.ok) {
      const errorData = await res.text();
      throw new Error(`Resend API error: ${errorData}`);
    }

    const emailResponse = await res.json();
    console.log("Pro Forma share email sent:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending Pro Forma share email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
