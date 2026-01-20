import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { campaignId } = await req.json();

    if (!campaignId) {
      throw new Error("Campaign ID is required");
    }

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from("newsletter_campaigns")
      .select("*")
      .eq("id", campaignId)
      .single();

    if (campaignError || !campaign) {
      throw new Error("Campaign not found");
    }

    if (campaign.status === "sent") {
      throw new Error("Campaign already sent");
    }

    // Get active subscribers
    const { data: subscribers, error: subscribersError } = await supabase
      .from("newsletter_subscribers")
      .select("*")
      .eq("status", "active");

    if (subscribersError) throw subscribersError;

    if (!subscribers || subscribers.length === 0) {
      throw new Error("No active subscribers found");
    }

    // Update campaign status to sending
    await supabase
      .from("newsletter_campaigns")
      .update({ status: "sending" })
      .eq("id", campaignId);

    let sentCount = 0;
    let failedCount = 0;

    // Send emails via Resend
    for (const subscriber of subscribers) {
      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Seeksy Newsletter <newsletter@seeksy.io>",
            to: [subscriber.email],
            subject: campaign.subject,
            html: campaign.html_content,
          }),
        });

        if (response.ok) {
          sentCount++;
          
          // Track send
          await supabase
            .from("newsletter_sends")
            .insert({
              campaign_id: campaignId,
              subscriber_id: subscriber.id,
              email: subscriber.email,
              status: "sent",
            });
        } else {
          failedCount++;
          console.error(`Failed to send to ${subscriber.email}:`, await response.text());
        }
      } catch (error) {
        failedCount++;
        console.error(`Error sending to ${subscriber.email}:`, error);
      }
    }

    // Update campaign status and stats
    await supabase
      .from("newsletter_campaigns")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        recipient_count: sentCount,
      })
      .eq("id", campaignId);

    return new Response(
      JSON.stringify({
        success: true,
        sent: sentCount,
        failed: failedCount,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Newsletter send error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
