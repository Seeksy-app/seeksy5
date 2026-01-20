import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// OpenAI Whisper has a 25MB limit
const WHISPER_SIZE_LIMIT = 25 * 1024 * 1024;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { meetingNoteId, audioFilePath } = await req.json();
    
    if (!meetingNoteId || !audioFilePath) {
      throw new Error("meetingNoteId and audioFilePath are required");
    }

    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    
    if (!ELEVENLABS_API_KEY && !OPENAI_API_KEY) {
      throw new Error("Neither ELEVENLABS_API_KEY nor OPENAI_API_KEY is configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Transcribing audio for meeting:", meetingNoteId);
    console.log("Audio file path:", audioFilePath);

    // Update status to transcribing
    await supabase
      .from("board_meeting_notes")
      .update({ ai_notes_status: "transcribing" })
      .eq("id", meetingNoteId);

    // Download audio file from storage
    const { data: audioData, error: downloadError } = await supabase.storage
      .from("meeting-recordings")
      .download(audioFilePath);

    if (downloadError || !audioData) {
      console.error("Failed to download audio:", downloadError);
      throw new Error("Failed to download audio file");
    }

    const fileSize = audioData.size;
    console.log("Audio downloaded, size:", fileSize, "bytes");

    let transcriptText: string;

    // Use ElevenLabs for large files, or if no OpenAI key, or as primary
    // ElevenLabs handles larger files better
    if (ELEVENLABS_API_KEY && (fileSize > WHISPER_SIZE_LIMIT || !OPENAI_API_KEY)) {
      console.log("Using ElevenLabs for transcription (file size:", fileSize, ")");
      transcriptText = await transcribeWithElevenLabs(audioData, ELEVENLABS_API_KEY);
    } else if (OPENAI_API_KEY) {
      console.log("Using OpenAI Whisper for transcription");
      transcriptText = await transcribeWithWhisper(audioData, OPENAI_API_KEY);
    } else {
      throw new Error("No transcription service available");
    }

    console.log("Transcription complete, length:", transcriptText.length);

    // Store the transcript
    const { error: updateError } = await supabase
      .from("board_meeting_notes")
      .update({
        audio_transcript: transcriptText,
        ai_notes_status: "transcribed",
      })
      .eq("id", meetingNoteId);

    if (updateError) {
      console.error("Failed to save transcript:", updateError);
      throw new Error("Failed to save transcript");
    }

    return new Response(
      JSON.stringify({
        success: true,
        transcript: transcriptText,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("transcribe-meeting-audio error:", error);
    
    // Update status to error
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      // Try to extract meetingNoteId from the original request if possible
      // This error handling is best-effort
    } catch {}

    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function transcribeWithElevenLabs(audioData: Blob, apiKey: string): Promise<string> {
  const formData = new FormData();
  formData.append("file", audioData, "meeting-audio.mp3");
  formData.append("model_id", "scribe_v1");
  formData.append("tag_audio_events", "false");
  formData.append("diarize", "true");

  console.log("Sending to ElevenLabs Speech-to-Text...");

  const response = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("ElevenLabs API error:", response.status, errorText);
    throw new Error(`ElevenLabs transcription failed: ${response.status}`);
  }

  const result = await response.json();
  console.log("ElevenLabs transcription complete");
  
  return result.text || "";
}

async function transcribeWithWhisper(audioData: Blob, apiKey: string): Promise<string> {
  const formData = new FormData();
  formData.append("file", audioData, "meeting-audio.webm");
  formData.append("model", "whisper-1");
  formData.append("language", "en");
  formData.append("response_format", "verbose_json");

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Whisper API error:", response.status, errorText);
    throw new Error(`Whisper transcription failed: ${response.status}`);
  }

  const result = await response.json();
  return result.text || "";
}
