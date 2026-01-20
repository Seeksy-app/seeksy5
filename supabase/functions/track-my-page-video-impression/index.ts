import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { profileId, videoType, videoId, sessionDuration } = await req.json();

    if (!profileId || !videoType || !videoId) {
      throw new Error("Missing required fields");
    }

    // Hash IP for privacy
    const clientIp = req.headers.get("x-forwarded-for") || "unknown";
    const encoder = new TextEncoder();
    const data = encoder.encode(clientIp);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const ipHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    const userAgent = req.headers.get("user-agent") || "unknown";

    // Create impression record
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error } = await supabase
      .from("my_page_video_impressions")
      .insert({
        profile_id: profileId,
        video_type: videoType,
        video_id: videoId,
        viewer_ip_hash: ipHash,
        user_agent: userAgent,
        session_duration_seconds: sessionDuration || null,
      });

    if (error) throw error;

    // If this is an ad video, also track in ad_impressions table for advertiser reporting
    if (videoType === 'ad') {
      // Get the ad details and campaign info
      const { data: adData } = await supabase
        .from("audio_ads")
        .select("campaign_id, advertiser_id")
        .eq("id", videoId)
        .single();

      if (adData?.campaign_id) {
        // Get episode and podcast info (use placeholder values for My Page ads)
        const { error: impressionError } = await supabase
          .from("ad_impressions")
          .insert({
            ad_slot_id: videoId, // Using ad ID as slot ID for My Page videos
            campaign_id: adData.campaign_id,
            creator_id: profileId,
            podcast_id: profileId, // Using profile ID as placeholder
            episode_id: profileId, // Using profile ID as placeholder
            listener_ip_hash: ipHash,
            user_agent: userAgent,
            is_valid: true,
          });

        if (impressionError) {
          console.error("Error tracking ad impression:", impressionError);
        } else {
          console.log(`Tracked ad impression for campaign ${adData.campaign_id}`);
        }
      }
    }

    console.log(`Tracked impression for profile ${profileId}, video ${videoId}`);

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error tracking impression:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});