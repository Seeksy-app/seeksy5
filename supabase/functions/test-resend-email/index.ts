import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const senderEmail = Deno.env.get("SENDER_EMAIL_HELLO") ?? "hello@seeksy.io";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TestEmailRequest {
  recipientEmail: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recipientEmail }: TestEmailRequest = await req.json();
    
    console.log(`Testing Resend email to: ${recipientEmail}`);
    console.log(`Sending from: ${senderEmail}`);

    if (!recipientEmail) {
      return new Response(
        JSON.stringify({ error: "recipientEmail is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emailResponse = await resend.emails.send({
      from: `Seeksy <${senderEmail}>`,
      to: [recipientEmail],
      subject: "🎉 Resend Integration Test Successful!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333;">Test Email from Seeksy</h1>
          <p style="font-size: 16px; color: #666;">
            Great news! Your Resend integration is working correctly.
          </p>
          <p style="font-size: 14px; color: #888;">
            Sent at: ${new Date().toISOString()}
          </p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 12px;">
            This is a test email sent via Seeksy.io
          </p>
        </div>
      `,
    });

    console.log("Email response:", emailResponse);

    if (emailResponse.error) {
      console.error("Resend error:", emailResponse.error);
      return new Response(
        JSON.stringify({ error: emailResponse.error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Test email sent to ${recipientEmail}`,
        emailId: emailResponse.data?.id 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in test-resend-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
