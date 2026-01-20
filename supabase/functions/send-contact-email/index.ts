import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);
const senderEmail = Deno.env.get("SENDER_EMAIL_HELLO") ?? "hello@seeksy.io";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  recipientEmails: string[];
  subject: string;
  message: string;
  userId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recipientEmails, subject, message, userId }: EmailRequest = await req.json();

    if (!recipientEmails || recipientEmails.length === 0) {
      return new Response(
        JSON.stringify({ error: "No recipients provided" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    if (!subject || !message) {
      return new Response(
        JSON.stringify({ error: "Subject and message are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Get user's profile for sender info
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .single();

    // Get user's email for reply-to
    const { data: { user } } = await supabase.auth.admin.getUserById(userId);
    const userEmail = user?.email;

    const senderName = profile?.full_name || "Seeksy";

    // Send emails to all recipients
    const emailPromises = recipientEmails.map(async (email) => {
      const emailResponse = await resend.emails.send({
        from: `${senderName} <${senderEmail}>`,
        replyTo: userEmail, // Enable recipients to reply directly to the sender
        to: [email],
        subject: subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <p>${message.replace(/\n/g, '<br>')}</p>
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">
              Sent via Seeksy.io
            </p>
          </div>
        `,
        tags: [
          { name: 'category', value: 'contact_email' },
          { name: 'user_id', value: userId },
        ],
      });

      // Log the email
      await supabase.from("email_logs").insert({
        user_id: userId,
        recipient_email: email,
        recipient_name: email,
        subject: subject,
        email_type: "contact_email",
        status: emailResponse.error ? "failed" : "sent",
        error_message: emailResponse.error?.message || null,
      });

      return emailResponse;
    });

    await Promise.all(emailPromises);

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-contact-email function:", error);
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