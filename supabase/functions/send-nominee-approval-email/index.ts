import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { nomineeId } = await req.json();

    if (!nomineeId) {
      throw new Error("Nominee ID is required");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get nominee details
    const { data: nominee, error: nomineeError } = await supabaseClient
      .from("award_nominees")
      .select(`
        *,
        award_categories (
          name
        ),
        awards_programs (
          title,
          description
        )
      `)
      .eq("id", nomineeId)
      .single();

    if (nomineeError) throw nomineeError;
    if (!nominee || !nominee.nominee_email) {
      throw new Error("Nominee not found or email not provided");
    }

    const votingLink = `${req.headers.get("origin") || "https://seeksy.com"}/vote/${nominee.unique_voting_link}`;
    const signupLink = `${req.headers.get("origin") || "https://seeksy.com"}/auth?invite=true`;

    // Send approval email
    await resend.emails.send({
      from: Deno.env.get("SENDER_EMAIL_HELLO") || "Seeksy <hello@seeksy.io>",
      to: [nominee.nominee_email],
      subject: `You've been nominated for ${nominee.awards_programs.title}!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #D4AF37;">Congratulations! 🏆</h1>
          
          <p>Dear ${nominee.nominee_name},</p>
          
          <p>Great news! You've been nominated for <strong>${nominee.award_categories.name}</strong> in the <strong>${nominee.awards_programs.title}</strong>!</p>
          
          ${nominee.awards_programs.description ? `<p>${nominee.awards_programs.description}</p>` : ''}
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0;">Share Your Voting Link</h2>
            <p>Share this link with your audience so they can vote for you:</p>
            <a href="${votingLink}" style="display: inline-block; background-color: #D4AF37; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              View Your Nomination
            </a>
            <p style="margin-top: 15px; font-size: 14px;">
              Or copy this link: <br/>
              <code style="background-color: #e0e0e0; padding: 4px 8px; border-radius: 4px;">${votingLink}</code>
            </p>
          </div>
          
          <div style="background-color: #e8f4f8; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0;">Join Seeksy as a Creator</h2>
            <p>Want to host your own awards program or use our creator tools?</p>
            <a href="${signupLink}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Create Your Free Account
            </a>
          </div>
          
          <p>Good luck! 🎉</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;" />
          
          <p style="color: #666; font-size: 12px;">
            This email was sent because you were nominated for an awards program on Seeksy. 
            If you have any questions, please contact the program organizer.
          </p>
        </div>
      `,
    });

    return new Response(
      JSON.stringify({ success: true, message: "Approval email sent successfully" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error sending approval email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
