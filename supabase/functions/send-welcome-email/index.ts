import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const SENDER_EMAIL = Deno.env.get("SENDER_EMAIL") || "hello@seeksy.io";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  name: string;
  isAdvertiser?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, isAdvertiser }: WelcomeEmailRequest = await req.json();

    console.log(`Sending ${isAdvertiser ? 'advertiser' : 'creator'} welcome email to: ${email}`);

    // Different email content for advertisers vs creators
    const emailHtml = isAdvertiser ? `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #0064B1 0%, #053877 100%);
              color: white;
              padding: 40px 20px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .header h1 {
              margin: 0;
              font-size: 32px;
            }
            .header p {
              margin: 10px 0 0;
              font-size: 16px;
              opacity: 0.9;
            }
            .content {
              background: #ffffff;
              padding: 40px 30px;
              border: 1px solid #e5e7eb;
              border-top: none;
            }
            .greeting {
              font-size: 20px;
              font-weight: 600;
              margin-bottom: 20px;
              color: #0064B1;
            }
            .cta-box {
              background: #f0f9ff;
              border: 2px solid #0064B1;
              border-radius: 8px;
              padding: 24px;
              margin: 30px 0;
              text-align: center;
            }
            .cta-box h2 {
              color: #0064B1;
              margin: 0 0 10px;
              font-size: 24px;
            }
            .button {
              display: inline-block;
              background: #0064B1;
              color: white !important;
              text-decoration: none;
              padding: 14px 32px;
              border-radius: 6px;
              font-weight: 600;
              margin: 20px 0;
            }
            .next-steps {
              margin: 30px 0;
            }
            .step {
              margin: 20px 0;
              padding: 15px;
              background: #f9fafb;
              border-left: 4px solid #F0A71F;
              border-radius: 4px;
            }
            .step-number {
              display: inline-block;
              background: #0064B1;
              color: white;
              width: 24px;
              height: 24px;
              border-radius: 50%;
              text-align: center;
              font-weight: 600;
              margin-right: 10px;
            }
            .footer {
              text-align: center;
              padding: 30px 20px;
              color: #6b7280;
              font-size: 14px;
              border: 1px solid #e5e7eb;
              border-top: none;
              border-radius: 0 0 8px 8px;
            }
            .footer a {
              color: #0064B1;
              text-decoration: none;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Welcome to Seeksy Advertising!</h1>
            <p>Your application is being reviewed</p>
          </div>
          
          <div class="content">
            <div class="greeting">Hi ${name || "there"}! 👋</div>
            
            <p>Thank you for applying to become a Seeksy advertiser! We're excited about the potential partnership.</p>
            
            <div class="cta-box">
              <h2>🎯 Next Step: Create Your First Campaign</h2>
              <p style="margin: 10px 0; color: #475569;">Once your application is approved, you'll be able to create and launch campaigns instantly.</p>
              <a href="${Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", ".lovable.app") || "https://seeksy.lovable.app"}/advertiser/dashboard" class="button">
                Go to Dashboard
              </a>
            </div>
            
            <div class="next-steps">
              <h3 style="color: #0064B1; margin-bottom: 15px;">What happens next?</h3>
              
              <div class="step">
                <span class="step-number">1</span>
                <strong>Application Review</strong> - Our team will review your application shortly.
              </div>
              
              <div class="step">
                <span class="step-number">2</span>
                <strong>Get Approved</strong> - You'll receive an email notification once you're approved.
              </div>
              
              <div class="step">
                <span class="step-number">3</span>
                <strong>Create Campaign</strong> - Set up your first campaign with targeting, budget, and creatives.
              </div>
              
              <div class="step">
                <span class="step-number">4</span>
                <strong>Go Live</strong> - Launch your campaign and start reaching podcast audiences.
              </div>
            </div>
            
            <p style="margin-top: 30px;">While you wait, you can explore the platform and prepare your campaign materials. If you have any questions, just reply to this email!</p>
          </div>
          
          <div class="footer">
            <p><strong>Seeksy Advertising</strong> - Reach Engaged Podcast Audiences</p>
            <p style="margin-top: 10px; color: #9ca3af; font-size: 12px;">
              Questions? Contact us at ${Deno.env.get("SENDER_EMAIL") || "hello@seeksy.io"}
            </p>
          </div>
        </body>
      </html>
    ` : `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #0064B1 0%, #053877 100%);
              color: white;
              padding: 40px 20px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .header h1 {
              margin: 0;
              font-size: 32px;
            }
            .header p {
              margin: 10px 0 0;
              font-size: 16px;
              opacity: 0.9;
            }
            .content {
              background: #ffffff;
              padding: 40px 30px;
              border: 1px solid #e5e7eb;
              border-top: none;
            }
            .greeting {
              font-size: 20px;
              font-weight: 600;
              margin-bottom: 20px;
              color: #0064B1;
            }
            .button {
              display: inline-block;
              background: #0064B1;
              color: white;
              text-decoration: none;
              padding: 14px 32px;
              border-radius: 6px;
              font-weight: 600;
              margin: 20px 0;
            }
            .features {
              margin: 30px 0;
            }
            .feature {
              margin: 20px 0;
              padding: 15px;
              background: #f9fafb;
              border-left: 4px solid #F0A71F;
              border-radius: 4px;
            }
            .feature-title {
              font-weight: 600;
              color: #0064B1;
              margin-bottom: 5px;
            }
            .footer {
              text-align: center;
              padding: 30px 20px;
              color: #6b7280;
              font-size: 14px;
              border: 1px solid #e5e7eb;
              border-top: none;
              border-radius: 0 0 8px 8px;
            }
            .footer a {
              color: #0064B1;
              text-decoration: none;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Welcome to Seeksy!</h1>
            <p>Connecting Your Way</p>
          </div>
          
          <div class="content">
            <div class="greeting">Hi ${name || "there"}! 👋</div>
            
            <p>We're thrilled to have you join Seeksy! You're now part of a community of creators who are building meaningful connections.</p>
            
            <p>Here's what you can do to get started:</p>
            
            <div class="features">
              <div class="feature">
                <div class="feature-title">🎉 Create Your First Event</div>
                <p>Host workshops, gatherings, and experiences. Manage registrations effortlessly.</p>
              </div>
              
              <div class="feature">
                <div class="feature-title">📅 Set Up Meeting Bookings</div>
                <p>Let people book time with you automatically using your personalized booking link.</p>
              </div>
              
              <div class="feature">
                <div class="feature-title">🔗 Customize Your Profile</div>
                <p>Build your landing page with all your events and links in one beautiful place.</p>
              </div>
              
              <div class="feature">
                <div class="feature-title">📊 Create Polls & Sign-ups</div>
                <p>Engage your community with polls and organize volunteer sign-ups.</p>
              </div>
            </div>
            
            <center>
              <a href="${Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", ".lovable.app") || "https://seeksy.lovable.app"}/dashboard" class="button">
                Go to Dashboard
              </a>
            </center>
            
            <p style="margin-top: 30px;">If you have any questions, we're here to help. Just reply to this email!</p>
          </div>
          
          <div class="footer">
            <p><strong>Seeksy</strong> - Connecting Your Way</p>
            <p style="margin-top: 10px; color: #9ca3af; font-size: 12px;">
              If you didn't create this account, you can safely ignore this email.
            </p>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: `Seeksy <${SENDER_EMAIL}>`,
      to: [email],
      subject: isAdvertiser ? "Welcome to Seeksy Advertising - Next Steps" : "Welcome to Seeksy - Let's Get Started!",
      html: emailHtml,
    });

    console.log("Welcome email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending welcome email:", error);
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
