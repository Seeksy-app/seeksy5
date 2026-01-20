import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    
    // Get parameters from URL
    // Expected formats:
    // /signature-click-tracking/{signatureId}/{linkId}?url={targetUrl}
    // /signature-click-tracking/{signatureId}/social/{socialId}?url={targetUrl}
    // /signature-click-tracking/{signatureId}/banner?url={targetUrl}
    
    const pathParts = url.pathname.split("/").filter(Boolean);
    const signatureId = pathParts[1] || null;
    const linkType = pathParts[2] || "link";
    const linkId = pathParts[3] || linkType;
    
    // Get target URL from query params
    const targetUrl = url.searchParams.get("url") || url.searchParams.get("redirect") || "";
    const messageKey = url.searchParams.get("mk") || null;

    console.log("[Click Tracking] Request received:", { signatureId, linkType, linkId, targetUrl, messageKey });

    if (!signatureId) {
      console.log("[Click Tracking] Missing signature ID");
      return new Response("Missing signature ID", { status: 400 });
    }

    if (!targetUrl) {
      console.log("[Click Tracking] Missing target URL");
      return new Response("Missing redirect URL", { status: 400 });
    }

    // Parse user agent for device info
    const userAgent = req.headers.get("user-agent") || "";
    const deviceType = detectDeviceType(userAgent);
    
    // Get IP address
    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                      req.headers.get("cf-connecting-ip") || 
                      "unknown";

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get signature details
    const { data: signature } = await supabase
      .from("email_signatures")
      .select("id, user_id, workspace_id")
      .eq("id", signatureId)
      .single();

    // Determine event type based on link type
    let eventType = "link_click";
    if (linkType === "banner" || linkId === "banner") {
      eventType = "banner_click";
    } else if (linkType === "social") {
      eventType = "social_click";
    }

    // Log the click event
    const { data: insertedEvent, error } = await supabase
      .from("signature_tracking_events")
      .insert({
        signature_id: signatureId,
        user_id: signature?.user_id || null,
        workspace_id: signature?.workspace_id || null,
        event_type: eventType,
        link_id: linkType === "social" ? linkId : linkType,
        target_url: targetUrl,
        ip_address: ipAddress,
        user_agent: userAgent,
        device_type: deviceType,
        message_key: messageKey,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[Click Tracking] Failed to log event:", error);
    } else {
      console.log("[Click Tracking] Click event logged successfully:", eventType, insertedEvent?.id);
      
      // Send notification email if user has it enabled
      if (signature?.user_id) {
        try {
          const notificationUrl = `${supabaseUrl}/functions/v1/signature-notification`;
          await fetch(notificationUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify({
              userId: signature.user_id,
              signatureId: signatureId,
              eventId: insertedEvent?.id,
              eventType: eventType,
              targetUrl: targetUrl,
              linkId: linkType === "social" ? linkId : linkType,
              deviceType: deviceType,
            }),
          });
        } catch (notifError) {
          console.error("[Click Tracking] Failed to send notification:", notifError);
        }
      }
    }

    // Redirect to target URL
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        "Location": targetUrl,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("[Click Tracking] Error:", error);
    return new Response("Internal server error", { 
      status: 500,
      headers: corsHeaders,
    });
  }
};

function detectDeviceType(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  if (/mobile|android|iphone|ipad|phone/i.test(ua)) {
    if (/tablet|ipad/i.test(ua)) return "tablet";
    return "mobile";
  }
  return "desktop";
}

serve(handler);
