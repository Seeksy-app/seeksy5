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
    const { mediaId, audioUrl } = await req.json();

    if (!audioUrl) {
      throw new Error("Audio URL is required");
    }

    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    if (!ELEVENLABS_API_KEY) {
      throw new Error("ELEVENLABS_API_KEY not configured");
    }

    console.log("Transcribing media:", mediaId);

    // Fetch the audio file
    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) {
      throw new Error("Failed to fetch audio file");
    }

    const audioBlob = await audioResponse.blob();

    // Create form data for ElevenLabs API
    const formData = new FormData();
    formData.append("audio", audioBlob, "audio.mp4");
    formData.append("model_id", "eleven_multilingual_v2");

    console.log("Sending to ElevenLabs for transcription...");

    // Call ElevenLabs Speech-to-Text API (correct endpoint)
    const response = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("ElevenLabs API error:", error);
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Transcription completed successfully");

    // Get auth token and update media file with transcript
    const authHeader = req.headers.get("Authorization");
    if (authHeader && mediaId) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? "",
        { global: { headers: { Authorization: authHeader } } }
      );

      // Store transcript in media_files table
      await supabase
        .from("media_files")
        .update({
          edit_transcript: {
            transcript: data.text,
            confidence: data.confidence,
            transcribed_at: new Date().toISOString(),
          },
        })
        .eq("id", mediaId);

      console.log("Transcript saved to database");
    }

    return new Response(
      JSON.stringify({
        transcript: data.text,
        confidence: data.confidence,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error transcribing media:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
