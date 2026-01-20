import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  userId: string;
  signatureId: string;
  eventId: string;
  eventType: "open" | "link_click" | "banner_click" | "social_click";
  targetUrl?: string;
  linkId?: string;
  deviceType?: string;
  emailClient?: string;
  recipientEmail?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: NotificationRequest = await req.json();
    const { userId, signatureId, eventId, eventType, targetUrl, linkId, deviceType, emailClient, recipientEmail } = payload;

    console.log("[Signature Notification] Received:", payload);

    if (!userId || !signatureId || !eventType) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user's signature notification preferences
    const { data: sigNotifSettings } = await supabase
      .from("signature_notification_settings")
      .select("*")
      .eq("user_id", userId)
      .single();

    // Check if email notifications are enabled (default to true if no preference set)
    const emailEnabled = sigNotifSettings?.notify_via_email !== false;
    const notifyOnOpens = sigNotifSettings?.notify_on_open !== false;
    const notifyOnClicks = sigNotifSettings?.notify_on_click !== false;
    const showContactAction = sigNotifSettings?.show_create_contact_action !== false;
    const showTaskAction = sigNotifSettings?.show_create_task_action !== false;
    const autoCreateContact = sigNotifSettings?.auto_create_contact === true;

    // Determine if we should send based on event type
    const shouldSendEmail = emailEnabled && (
      (eventType === "open" && notifyOnOpens) ||
      (["link_click", "banner_click", "social_click"].includes(eventType) && notifyOnClicks)
    );

    if (!shouldSendEmail) {
      console.log("[Signature Notification] Notifications disabled for this event type");
      return new Response(JSON.stringify({ success: true, sent: false, reason: "disabled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Auto-create contact if enabled
    if (autoCreateContact && eventType === "open" && eventId) {
      try {
        // Get event details for contact creation
        const { data: eventData } = await supabase
          .from("signature_tracking_events")
          .select("*")
          .eq("id", eventId)
          .single();

        if (eventData && eventData.recipient_email) {
          // Check if contact already exists
          const { data: existingContact } = await supabase
            .from("contacts")
            .select("id")
            .eq("user_id", userId)
            .eq("email", eventData.recipient_email)
            .single();

          if (!existingContact) {
            await supabase.from("contacts").insert({
              user_id: userId,
              email: eventData.recipient_email,
              name: eventData.recipient_email?.split('@')[0] || "Email Lead",
              notes: `Auto-created from email open on ${new Date().toISOString()}. Device: ${eventData.device_type || "unknown"}, Client: ${eventData.email_client || "unknown"}`,
              lead_source: "email_signature",
            });
            console.log("[Signature Notification] Auto-created contact for:", eventData.recipient_email);
          }
        }
      } catch (err) {
        console.error("[Signature Notification] Auto-create contact error:", err);
      }
    }

    // Get user email from auth.users
    const { data: authData, error: authError } = await supabase.auth.admin.getUserById(userId);
    
    const userEmail = authData?.user?.email;
    if (!userEmail) {
      console.log("[Signature Notification] No email found for user", authError);
      return new Response(JSON.stringify({ success: false, error: "No email" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user's full name from profiles
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .single();

    // Get signature details
    const { data: signature } = await supabase
      .from("email_signatures")
      .select("name")
      .eq("id", signatureId)
      .single();

    const signatureName = signature?.name || "your email signature";
    const now = new Date();
    const formattedDate = now.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const formattedTime = now.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    // Build action URLs
    const actionBaseUrl = `${supabaseUrl}/functions/v1/signature-tracking-action`;
    const createContactUrl = eventId 
      ? `${actionBaseUrl}?action=create_contact&eventId=${eventId}&userId=${userId}`
      : null;
    const createTaskUrl = eventId 
      ? `${actionBaseUrl}?action=create_task&eventId=${eventId}&userId=${userId}`
      : null;

    // Build subject and body based on event type
    let subject = "";
    let bodyHtml = "";

    // Build action buttons based on user preferences
    let actionButtonsHtml = "";
    if ((showContactAction || showTaskAction) && (createContactUrl || createTaskUrl)) {
      const contactBtn = showContactAction && createContactUrl
        ? `<a href="${createContactUrl}" style="display: inline-block; background: #2C6BED; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 500;">➕ Create Contact</a>`
        : "";
      const taskBtn = showTaskAction && createTaskUrl
        ? `<a href="${createTaskUrl}" style="display: inline-block; background: #053877; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 500;">📋 Create Task</a>`
        : "";
      
      if (contactBtn || taskBtn) {
        actionButtonsHtml = `
          <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
            <p style="font-size: 14px; color: #64748b; margin: 0 0 20px; text-align: center;">Take action on this lead:</p>
            <div style="text-align: center;">
              ${contactBtn ? `<div style="margin-bottom: 16px;">${contactBtn}</div>` : ""}
              ${taskBtn ? `<div>${taskBtn}</div>` : ""}
            </div>
          </div>
        `;
      }
    }

    if (eventType === "open") {
      subject = recipientEmail 
        ? `${recipientEmail} opened your email`
        : `Someone opened your email`;
      bodyHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #053877, #2C6BED); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">📧 Email Opened!</h1>
          </div>
          <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
            <p style="font-size: 16px; color: #334155; margin: 0 0 20px;">
              ${recipientEmail 
                ? `<strong>${recipientEmail}</strong> opened your email that uses <strong>"${signatureName}"</strong> signature.`
                : `Someone opened your email that uses <strong>"${signatureName}"</strong> signature.`
              }
            </p>
            <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Event</td>
                  <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600; text-align: right;">Email Opened</td>
                </tr>
                ${recipientEmail ? `
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Recipient</td>
                  <td style="padding: 8px 0; color: #2C6BED; font-size: 14px; font-weight: 600; text-align: right;">${recipientEmail}</td>
                </tr>
                ` : ""}
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Signature</td>
                  <td style="padding: 8px 0; color: #1e293b; font-size: 14px; text-align: right;">${signatureName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Date</td>
                  <td style="padding: 8px 0; color: #1e293b; font-size: 14px; text-align: right;">${formattedDate}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Time</td>
                  <td style="padding: 8px 0; color: #1e293b; font-size: 14px; text-align: right;">${formattedTime}</td>
                </tr>
                ${deviceType ? `
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Device</td>
                  <td style="padding: 8px 0; color: #1e293b; font-size: 14px; text-align: right;">${deviceType}</td>
                </tr>
                ` : ""}
                ${emailClient && emailClient !== "unknown" ? `
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Email Client</td>
                  <td style="padding: 8px 0; color: #1e293b; font-size: 14px; text-align: right;">${emailClient}</td>
                </tr>
                ` : ""}
              </table>
            </div>
            ${actionButtonsHtml}
            <p style="font-size: 13px; color: #94a3b8; margin: 20px 0 0; text-align: center;">
              View all your signature analytics in your Seeksy dashboard.
            </p>
          </div>
        </div>
      `;
    } else {
      // Click events
      const clickType = eventType === "banner_click" ? "banner" : 
                        eventType === "social_click" ? `${linkId || "social"} icon` : 
                        "link";
      subject = `Someone clicked a ${clickType} in your email`;
      bodyHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #053877, #2C6BED); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🔗 Link Clicked!</h1>
          </div>
          <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
            <p style="font-size: 16px; color: #334155; margin: 0 0 20px;">
              Someone clicked a ${clickType} in your email that uses <strong>"${signatureName}"</strong> signature.
            </p>
            <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Event</td>
                  <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600; text-align: right;">Click on ${clickType}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Signature</td>
                  <td style="padding: 8px 0; color: #1e293b; font-size: 14px; text-align: right;">${signatureName}</td>
                </tr>
                ${targetUrl ? `
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Link Clicked</td>
                  <td style="padding: 8px 0; color: #2C6BED; font-size: 14px; text-align: right; word-break: break-all;">${targetUrl}</td>
                </tr>
                ` : ""}
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Date</td>
                  <td style="padding: 8px 0; color: #1e293b; font-size: 14px; text-align: right;">${formattedDate}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Time</td>
                  <td style="padding: 8px 0; color: #1e293b; font-size: 14px; text-align: right;">${formattedTime}</td>
                </tr>
                ${deviceType ? `
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Device</td>
                  <td style="padding: 8px 0; color: #1e293b; font-size: 14px; text-align: right;">${deviceType}</td>
                </tr>
                ` : ""}
              </table>
            </div>
            ${actionButtonsHtml}
            <p style="font-size: 13px; color: #94a3b8; margin: 20px 0 0; text-align: center;">
              View all your signature analytics in your Seeksy dashboard.
            </p>
          </div>
        </div>
      `;
    }

    // Send the email
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("[Signature Notification] RESEND_API_KEY not configured");
      return new Response(JSON.stringify({ success: false, error: "Email not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resend = new Resend(resendApiKey);
    const senderEmail = Deno.env.get("SENDER_EMAIL") || "notifications@seeksy.dev";

    const emailResponse = await resend.emails.send({
      from: `Seeksy <${senderEmail}>`,
      to: [userEmail],
      subject: subject,
      html: bodyHtml,
    });

    console.log("[Signature Notification] Email sent:", emailResponse);

    return new Response(JSON.stringify({ success: true, sent: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("[Signature Notification] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
