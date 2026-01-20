import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SecurityAlertRequest {
  alert_type: string;
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description?: string;
  source_ip?: string;
  user_id?: string;
  endpoint?: string;
  metadata?: Record<string, unknown>;
  notify_admin?: boolean;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const senderEmail = Deno.env.get("SENDER_EMAIL") || "security@seeksy.io";

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: SecurityAlertRequest = await req.json();
    console.log("[security-alert] Received alert:", body.alert_type, body.severity);

    // Insert the security alert
    const { data: alert, error: insertError } = await supabase
      .from("security_alerts")
      .insert({
        alert_type: body.alert_type,
        severity: body.severity,
        title: body.title,
        description: body.description,
        source_ip: body.source_ip,
        user_id: body.user_id,
        endpoint: body.endpoint,
        metadata: body.metadata,
      })
      .select()
      .single();

    if (insertError) {
      console.error("[security-alert] Failed to insert alert:", insertError);
      throw new Error("Failed to log security alert");
    }

    console.log("[security-alert] Alert logged:", alert.id);

    // Send email notification for high/critical alerts
    if ((body.severity === "high" || body.severity === "critical") && resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);
        
        const severityColors = {
          critical: "#dc2626",
          high: "#ea580c",
          medium: "#ca8a04",
          low: "#2563eb",
        };

        await resend.emails.send({
          from: `Seeksy Security <${senderEmail}>`,
          to: ["hello@seeksy.io"], // Admin email
          subject: `🚨 ${body.severity.toUpperCase()} Security Alert: ${body.title}`,
          html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto;">
    <div style="background: ${severityColors[body.severity]}; color: white; padding: 16px; border-radius: 8px 8px 0 0;">
      <h1 style="margin: 0; font-size: 20px;">🚨 Security Alert - ${body.severity.toUpperCase()}</h1>
    </div>
    <div style="background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
      <h2 style="margin: 0 0 16px; color: #1e293b;">${body.title}</h2>
      ${body.description ? `<p style="color: #475569; margin: 0 0 16px;">${body.description}</p>` : ""}
      
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Alert Type:</td>
          <td style="padding: 8px 0; color: #1e293b; font-size: 14px;">${body.alert_type}</td>
        </tr>
        ${body.source_ip ? `
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Source IP:</td>
          <td style="padding: 8px 0; color: #1e293b; font-size: 14px;">${body.source_ip}</td>
        </tr>` : ""}
        ${body.endpoint ? `
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Endpoint:</td>
          <td style="padding: 8px 0; color: #1e293b; font-size: 14px;">${body.endpoint}</td>
        </tr>` : ""}
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Time:</td>
          <td style="padding: 8px 0; color: #1e293b; font-size: 14px;">${new Date().toISOString()}</td>
        </tr>
      </table>
      
      <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
        <a href="https://seeksy.io/admin/security" style="display: inline-block; background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-size: 14px;">View in Dashboard</a>
      </div>
    </div>
  </div>
</body>
</html>
          `,
        });
        console.log("[security-alert] Email notification sent");
      } catch (emailError) {
        console.error("[security-alert] Failed to send email:", emailError);
        // Don't throw - alert was still logged
      }
    }

    return new Response(
      JSON.stringify({ success: true, alert_id: alert.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[security-alert] Error:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});