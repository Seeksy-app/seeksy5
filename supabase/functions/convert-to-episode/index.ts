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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { recordingId, podcastId, title, description, isMediaFile = false } = await req.json();

    if (!recordingId || !podcastId || !title) {
      throw new Error("Missing required fields");
    }

    const tableName = isMediaFile ? "media_files" : "studio_recordings";

    // Get recording/media file details
    let audioUrl: string;
    let durationSeconds: number | null;

    if (isMediaFile) {
      const { data: mediaFile, error: mediaError } = await supabase
        .from("media_files")
        .select("*")
        .eq("id", recordingId)
        .single();

      if (mediaError) throw mediaError;
      if (!mediaFile?.file_url) throw new Error("Media file not found");
      
      audioUrl = mediaFile.file_url;
      durationSeconds = mediaFile.duration_seconds;
    } else {
      const { data: recording, error: recordingError } = await supabase
        .from("studio_recordings")
        .select("*, studio_sessions!inner(user_id)")
        .eq("id", recordingId)
        .single();

      if (recordingError) throw recordingError;
      if (!recording?.recording_url) throw new Error("Recording not found or not ready");
      
      audioUrl = recording.edited_recording_url || recording.recording_url;
      durationSeconds = recording.duration_seconds;
    }

    // Check if podcast has ads enabled
    const { data: adSettings } = await supabase
      .from("podcast_ad_settings")
      .select("*")
      .eq("podcast_id", podcastId)
      .eq("platform_ads_enabled", true)
      .single();

    console.log(`Converting recording ${recordingId} to episode for podcast ${podcastId}`);
    console.log(`Ad monetization: ${adSettings ? "ENABLED" : "DISABLED"}`);

    // Create episode
    const { data: episode, error: episodeError } = await supabase
      .from("episodes")
      .insert({
        podcast_id: podcastId,
        title,
        description: description || "",
        audio_url: audioUrl,
        duration_seconds: durationSeconds,
        is_published: false,
        publish_date: new Date().toISOString(),
      })
      .select()
      .single();

    if (episodeError) throw episodeError;

    // Link recording/media file to episode
    await supabase
      .from(tableName)
      .update({ converted_to_episode_id: episode.id })
      .eq("id", recordingId);

    // If ads are enabled, create ad slots
    const adSlots = [];
    if (adSettings) {
      console.log("Creating ad slots for monetized episode...");

      // Create pre-roll ad slot
      const { data: preRollSlot, error: preRollError } = await supabase
        .from("ad_slots")
        .insert({
          episode_id: episode.id,
          slot_type: "pre-roll",
          position_seconds: 0,
          ad_source: "platform",
          status: "empty",
        })
        .select()
        .single();

      if (!preRollError && preRollSlot) {
        adSlots.push(preRollSlot);

        // Only track for studio recordings (not uploaded media)
        if (!isMediaFile) {
          await supabase.from("studio_recording_ads").insert({
            recording_id: recordingId,
            ad_slot_id: preRollSlot.id,
          });
        }
      }

      // Create mid-roll ad slot (if episode is long enough)
      if (durationSeconds && durationSeconds > 300) {
        const midRollPosition = Math.floor(durationSeconds / 2);
        const { data: midRollSlot, error: midRollError } = await supabase
          .from("ad_slots")
          .insert({
            episode_id: episode.id,
            slot_type: "mid-roll",
            position_seconds: midRollPosition,
            ad_source: "platform",
            status: "empty",
          })
          .select()
          .single();

        if (!midRollError && midRollSlot) {
          adSlots.push(midRollSlot);

          if (!isMediaFile) {
            await supabase.from("studio_recording_ads").insert({
              recording_id: recordingId,
              ad_slot_id: midRollSlot.id,
            });
          }
        }
      }

      console.log(`Created ${adSlots.length} ad slots for episode`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        episode,
        adsEnabled: !!adSettings,
        adSlotsCreated: adSlots.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Conversion error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});