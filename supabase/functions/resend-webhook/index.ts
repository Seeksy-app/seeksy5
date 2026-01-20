import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, svix-id, svix-timestamp, svix-signature",
};

interface ResendWebhookEvent {
  type: string;
  created_at: string;
  data: {
    email_id?: string;
    from?: string;
    to?: string[];
    subject?: string;
    tags?: Array<{ name: string; value: string }>;
    clicked_link?: {
      url: string;
      timestamp: string;
    };
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get signing secret
    const signingSecret = Deno.env.get("SIGNING_SECRET");
    if (!signingSecret) {
      console.error("SIGNING_SECRET not configured");
      return new Response(
        JSON.stringify({ error: "Webhook configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get signature headers
    const svixId = req.headers.get("svix-id");
    const svixTimestamp = req.headers.get("svix-timestamp");
    const svixSignature = req.headers.get("svix-signature");

    if (!svixId || !svixTimestamp || !svixSignature) {
      console.error("Missing signature headers");
      return new Response(
        JSON.stringify({ error: "Missing signature headers" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get raw body for signature verification
    const body = await req.text();
    
    // Verify signature
    const signedContent = `${svixId}.${svixTimestamp}.${body}`;
    const secretBytes = new TextEncoder().encode(signingSecret.split('_')[1]); // Remove 'whsec_' prefix
    const key = await crypto.subtle.importKey(
      "raw",
      secretBytes,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signedContent));
    const expectedSignature = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");

    // Svix sends multiple signatures (v1=signature), check if any match
    const signatures = svixSignature.split(" ");
    const isValid = signatures.some(sig => {
      const [version, hash] = sig.split("=");
      return version === "v1" && hash === expectedSignature;
    });

    if (!isValid) {
      console.error("Invalid signature");
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse the verified body
    const webhookEvent: ResendWebhookEvent = JSON.parse(body);
    console.log("📨 Received Resend webhook:", webhookEvent.type);

    const { type, data, created_at } = webhookEvent;
    
    // Extract email data
    const emailId = data.email_id;
    const to = data.to?.[0];
    const from = data.from;
    const subject = data.subject;

    // Extract user_id from tags if present
    const userId = data.tags?.find((t: any) => t.name === 'user_id')?.value;
    const campaignId = data.tags?.find((t: any) => t.name === 'campaign_id')?.value;

    // Find the contact by email
    let contactId = null;
    if (to) {
      const { data: contact } = await supabase
        .from("contacts")
        .select("id")
        .eq("email", to)
        .single();
      
      if (contact) {
        contactId = contact.id;
      }
    }

    // Extract device type and other metadata
    const userAgent = (data as any).user_agent || "";
    const deviceType = userAgent.match(/Mobile|Android|iPhone/i) ? "mobile" : "desktop";
    const ipAddress = (data as any).ip || null;
    const clickedUrl = (data as any).clicked_link?.url || null;

    // Map Resend event types to our event types
    const eventTypeMap: Record<string, string> = {
      'email.sent': 'sent',
      'email.delivered': 'delivered',
      'email.delivery_delayed': 'delayed',
      'email.bounced': 'bounced',
      'email.opened': 'opened',
      'email.clicked': 'clicked',
      'email.complained': 'complained',
      'email.unsubscribed': 'unsubscribed',
    };

    const eventType = eventTypeMap[type];
    
    if (!eventType) {
      console.log(`⚠️ Unknown event type: ${type}`);
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Store event in email_events table
    const eventData: any = {
      event_type: eventType,
      to_email: to || null,
      from_email: from || null,
      email_subject: subject || null,
      resend_email_id: emailId || null,
      campaign_id: campaignId || null,
      contact_id: contactId || null,
      user_id: userId || null,
      ip_address: ipAddress,
      user_agent: userAgent || null,
      device_type: deviceType,
      clicked_url: clickedUrl,
      link_url: clickedUrl,
      bounce_reason: (data as any).bounce?.type || (data as any).bounce?.message || null,
      unsubscribe_reason: (data as any).unsubscribe?.reason || null,
      occurred_at: created_at || new Date().toISOString(),
      raw_payload: webhookEvent,
    };

    const { error: insertError } = await supabase
      .from("email_events")
      .insert(eventData);

    if (insertError) {
      console.error("❌ Error inserting email event:", insertError);
      throw insertError;
    }

    // Update campaign statistics if campaign_id is present
    if (campaignId) {
      const statField = {
        'sent': 'total_sent',
        'delivered': 'total_delivered',
        'bounced': 'total_bounced',
        'opened': 'total_opened',
        'clicked': 'total_clicked',
        'complained': 'total_complained',
      }[eventType];

      if (statField) {
        // Fetch current value and increment
        const { data: campaign } = await supabase
          .from("email_campaigns")
          .select(statField)
          .eq("id", campaignId)
          .single();

        if (campaign) {
          await supabase
            .from("email_campaigns")
            .update({ [statField]: ((campaign as any)[statField] || 0) + 1 })
            .eq("id", campaignId);
        }
      }
    }

    // Update contact last_opened_at / last_clicked_at
    if (contactId) {
      if (eventType === 'opened') {
        await supabase
          .from("contacts")
          .update({ last_opened_at: new Date().toISOString() })
          .eq("id", contactId);
      } else if (eventType === 'clicked') {
        await supabase
          .from("contacts")
          .update({ last_clicked_at: new Date().toISOString() })
          .eq("id", contactId);
      }
    }

    // Handle unsubscribe
    if (eventType === 'unsubscribed' && contactId) {
      await supabase
        .from("contact_preferences")
        .upsert({
          contact_id: contactId,
          global_unsubscribe: true,
          unsubscribed_at: new Date().toISOString(),
          unsubscribe_reason: (data as any).unsubscribe?.reason || "User unsubscribed via email",
        }, { onConflict: 'contact_id' });
    }

    console.log(`✅ Successfully recorded ${eventType} event for ${to}`);

    return new Response(
      JSON.stringify({ received: true }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in resend-webhook function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
