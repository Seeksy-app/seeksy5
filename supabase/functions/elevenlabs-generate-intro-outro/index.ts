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
    const { script, voiceId, musicAssetId, type, sessionId } = await req.json();
    
    if (!script || !voiceId) {
      throw new Error("Script and voice ID are required");
    }

    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    if (!ELEVENLABS_API_KEY) {
      throw new Error("ElevenLabs API key not configured");
    }

    console.log(`Generating ${type} with voice ${voiceId}...`);

    // Clean script: Remove stage directions and formatting
    const cleanScript = script
      .replace(/\([^)]*\)/g, '')
      .replace(/\*\*[^*]+:\*\*/g, '')
      .replace(/\*\*/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Generate the speech with ElevenLabs
    const ttsUrl = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
    
    const ttsBody: any = {
      text: cleanScript,
      model_id: "eleven_multilingual_v2",
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
      },
    };

    // Add music if selected
    if (musicAssetId && musicAssetId !== "none") {
      ttsBody.background_music = {
        music_asset_id: musicAssetId,
        volume: 0.3, // Background music at 30% volume
      };
    }

    const ttsResponse = await fetch(ttsUrl, {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(ttsBody),
    });

    if (!ttsResponse.ok) {
      const errorText = await ttsResponse.text();
      console.error("ElevenLabs TTS error:", ttsResponse.status, errorText);
      throw new Error(`ElevenLabs API returned ${ttsResponse.status}: ${errorText}`);
    }

    const audioBuffer = await ttsResponse.arrayBuffer();
    console.log("Generated audio, size:", audioBuffer.byteLength);

    // Upload to Supabase Storage
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const fileName = `${type}-${sessionId}-${Date.now()}.mp3`;
    const filePath = `studio-${type}s/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("studio-recordings")
      .upload(filePath, audioBuffer, {
        contentType: "audio/mpeg",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error(`Failed to upload audio: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("studio-recordings")
      .getPublicUrl(filePath);

    console.log(`${type} generated and uploaded successfully`);

    return new Response(
      JSON.stringify({ 
        audioUrl: urlData.publicUrl,
        fileName,
        type
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in elevenlabs-generate-intro-outro:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
