import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Recipient {
  email: string;
  name: string;
}

interface NotificationRequest {
  recipients: Recipient[];
  versionLabel: string;
  versionId?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Processing board proforma notification request");

    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verify user token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user has CFO/admin role
    const { data: roles, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    if (roleError) {
      console.error("Role fetch error:", roleError);
      return new Response(
        JSON.stringify({ error: "Failed to verify permissions" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const allowedRoles = ["admin", "super_admin", "cfo"];
    const hasPermission = roles?.some((r) => allowedRoles.includes(r.role));

    if (!hasPermission) {
      return new Response(
        JSON.stringify({ error: "Insufficient permissions" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { recipients, versionLabel, versionId }: NotificationRequest = await req.json();

    if (!recipients || recipients.length === 0) {
      return new Response(
        JSON.stringify({ error: "No recipients specified" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Sending notification to ${recipients.length} board members`);

    // Get sender info
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    const senderName = profile?.full_name || "CFO Team";
    const boardPortalUrl = `${Deno.env.get("SITE_URL") || "https://seeksy.io"}/board/proforma`;

    // Send emails to all recipients
    const emailPromises = recipients.map(async (recipient) => {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #2C6BED 0%, #053877 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">📊 Pro Forma Update</h1>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="margin-top: 0;">Hi ${recipient.name},</p>
            
            <p>${senderName} has shared a new Pro Forma update with the board:</p>
            
            <div style="background: #f8fafc; border-left: 4px solid #2C6BED; padding: 15px 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
              <p style="margin: 0; font-weight: 600; color: #1e293b;">📋 ${versionLabel}</p>
              <p style="margin: 5px 0 0 0; font-size: 14px; color: #64748b;">
                Updated on ${new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            
            <p>The Pro Forma includes updated financial projections, revenue forecasts, and key metrics. Please review at your earliest convenience.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${boardPortalUrl}" 
                 style="display: inline-block; background: linear-gradient(135deg, #2C6BED 0%, #1d4ed8 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                View Pro Forma →
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;">
            
            <p style="font-size: 13px; color: #64748b; margin-bottom: 0;">
              This is a confidential board communication. Please do not forward this email.
            </p>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #94a3b8; font-size: 12px;">
            <p style="margin: 0;">Seeksy Board Portal</p>
          </div>
        </body>
        </html>
      `;

      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "Seeksy Board <notifications@seeksy.io>",
            to: [recipient.email],
            subject: `📊 Pro Forma Update: ${versionLabel}`,
            html: htmlContent,
          }),
        });

        if (!res.ok) {
          const errorData = await res.text();
          console.error(`Failed to send to ${recipient.email}:`, errorData);
          return { success: false, email: recipient.email, error: errorData };
        }

        const response = await res.json();
        console.log(`Email sent to ${recipient.email}:`, response);
        return { success: true, email: recipient.email, response };
      } catch (emailError) {
        console.error(`Failed to send to ${recipient.email}:`, emailError);
        return { success: false, email: recipient.email, error: emailError };
      }
    });

    const results = await Promise.all(emailPromises);
    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    console.log(`Email results: ${successCount} sent, ${failCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Sent ${successCount} email(s)${failCount > 0 ? `, ${failCount} failed` : ""}`,
        results,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-board-proforma-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
