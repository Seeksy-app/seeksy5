import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// 1x1 transparent PNG pixel
const TRANSPARENT_PIXEL = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
  0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
  0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
  0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
  0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82
]);

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const trackingId = url.searchParams.get("tid");

    if (!trackingId) {
      console.log("No tracking ID provided");
      return new Response(TRANSPARENT_PIXEL, {
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
        },
      });
    }

    console.log("Email opened - Tracking ID:", trackingId);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get client info
    const userAgent = req.headers.get("user-agent") || "";
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0] || 
                     req.headers.get("x-real-ip") || "unknown";

    // Update tracking record
    const { error } = await supabase
      .from("email_tracking")
      .update({
        status: "opened",
        opened_at: new Date().toISOString(),
        open_count: supabase.rpc("increment_open_count"),
        user_agent: userAgent,
        client_ip: clientIp
      })
      .eq("tracking_id", trackingId);

    if (error) {
      console.error("Error updating tracking:", error);
      
      // Try incrementing open count with raw update
      await supabase
        .from("email_tracking")
        .update({
          status: "opened",
          opened_at: new Date().toISOString(),
          user_agent: userAgent
        })
        .eq("tracking_id", trackingId);
    }

    // Log open event
    await supabase.from("email_open_events").insert({
      tracking_id: trackingId,
      opened_at: new Date().toISOString(),
      user_agent: userAgent,
      client_ip: clientIp
    });

    console.log("Email open recorded for:", trackingId);

  } catch (error) {
    console.error("Error tracking email open:", error);
  }

  // Always return the pixel
  return new Response(TRANSPARENT_PIXEL, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    },
  });
});
