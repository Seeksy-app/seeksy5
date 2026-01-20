import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EditInstruction {
  timestamp: number;
  type: 'remove_filler' | 'remove_pause' | 'trim_silence';
  original_text?: string;
  duration: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recordingId, audioUrl, isMediaFile = false } = await req.json();

    if (!recordingId || !audioUrl) {
      throw new Error("Missing required fields: recordingId, audioUrl");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const tableName = isMediaFile ? "media_files" : "studio_recordings";

    // Update status to processing
    await supabase
      .from(tableName)
      .update({ edit_status: "processing" })
      .eq("id", recordingId);

    console.log("Analyzing audio for post-production edits...");

    // Call Lovable AI to analyze transcript and identify edits
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a professional audio editor. Analyze the transcript and identify:
1. Filler words (um, uh, like, you know, basically, actually, etc.)
2. Long pauses or dead air (over 2 seconds)
3. Excessive silence at start/end

Return a structured JSON array of edit instructions.`,
          },
          {
            role: "user",
            content: `Audio URL: ${audioUrl}\n\nAnalyze this recording and provide edit instructions to improve quality by removing filler words and excessive pauses. Focus on natural-sounding edits that maintain conversational flow.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_edit_instructions",
              description: "Generate structured edit instructions for audio post-production",
              parameters: {
                type: "object",
                properties: {
                  edits: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        timestamp: { type: "number", description: "Time in seconds" },
                        type: {
                          type: "string",
                          enum: ["remove_filler", "remove_pause", "trim_silence"],
                        },
                        original_text: { type: "string", description: "Text to remove (if applicable)" },
                        duration: { type: "number", description: "Duration to remove in seconds" },
                      },
                      required: ["timestamp", "type", "duration"],
                    },
                  },
                  summary: { type: "string", description: "Summary of edits made" },
                  estimated_time_saved: { type: "number", description: "Seconds saved" },
                },
                required: ["edits", "summary", "estimated_time_saved"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_edit_instructions" } },
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", errorText);
      throw new Error(`AI analysis failed: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      throw new Error("No edit instructions generated");
    }

    const editData = JSON.parse(toolCall.function.arguments);

    console.log(`Generated ${editData.edits.length} edit instructions`);
    console.log(`Estimated time saved: ${editData.estimated_time_saved}s`);

    // Store edit instructions
    const { error: updateError } = await supabase
      .from(tableName)
      .update({
        edit_status: "edited",
        edit_transcript: editData,
        ...(isMediaFile ? { original_file_url: audioUrl } : { original_recording_url: audioUrl }),
      })
      .eq("id", recordingId);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({
        success: true,
        edits: editData.edits,
        summary: editData.summary,
        timeSaved: editData.estimated_time_saved,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Post-production error:", error);

    // Update status to error
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { recordingId, isMediaFile = false } = await new Request(req.url, { body: req.body }).json();
      if (recordingId) {
        const tableName = isMediaFile ? "media_files" : "studio_recordings";
        await supabase
          .from(tableName)
          .update({ edit_status: "error" })
          .eq("id", recordingId);
      }
    } catch {}

    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});