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
    if (!authHeader) throw new Error("Not authenticated");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error("Not authenticated");

    const { mediaId, fileUrl, duration, transcript } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!mediaId) {
      throw new Error("mediaId is required");
    }

    console.log("Analyzing video for clips:", { mediaId, duration, hasTranscript: !!transcript, userId: user.id });

    // Create AI job for clips generation
    const { data: aiJob, error: aiJobError } = await supabase
      .from("ai_jobs")
      .insert({
        user_id: user.id,
        source_media_id: mediaId,
        job_type: 'clips_generation',
        engine: 'lovable_ai',
        params: { duration, has_transcript: !!transcript },
        status: 'processing',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (aiJobError) {
      console.error("Error creating AI job:", aiJobError);
      throw aiJobError;
    }

    const startTime = Date.now();

    // Build context for AI - use transcript if available
    let analysisContext = `Analyze a ${duration || 'unknown'}-second video and identify 3-5 viral-worthy clips.`;
    
    if (transcript) {
      analysisContext += `\n\nVideo Transcript:\n${transcript}\n\nUse this transcript to identify specific moments with compelling quotes or topics.`;
    } else {
      analysisContext += `\n\nNo transcript available - suggest general clip segments based on typical video content patterns.`;
    }

    // AI analyzes the video to find viral-worthy moments
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
            content: `You are an expert at finding viral-worthy moments in video content for TikTok and Instagram Reels. 
You identify clips that:
- Have a strong hook in the first 3 seconds
- Tell a complete micro-story (15-60 seconds)
- Have emotional impact or surprising moments
- Are self-contained and don't need context
- Have natural start/end points

Return clips in order of virality potential.`
          },
          {
            role: "user",
            content: `${analysisContext}

For each clip, provide:
1. start_time (seconds)
2. end_time (seconds, clips should be 15-60s)
3. title (catchy, 5-8 words)
4. description (why this moment is viral-worthy)
5. virality_score (0-100, how likely to go viral)
6. hook (the first line/moment that grabs attention)

Video duration: ${duration || 'unknown'} seconds`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "identify_clips",
              description: "Identify viral-worthy video clips",
              parameters: {
                type: "object",
                properties: {
                  clips: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        start_time: { type: "number", description: "Start time in seconds" },
                        end_time: { type: "number", description: "End time in seconds" },
                        title: { type: "string", description: "Catchy clip title" },
                        description: { type: "string", description: "Why this is viral-worthy" },
                        virality_score: { type: "number", description: "Virality score 0-100" },
                        hook: { type: "string", description: "The attention-grabbing opening" }
                      },
                      required: ["start_time", "end_time", "title", "description", "virality_score", "hook"]
                    }
                  }
                },
                required: ["clips"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "identify_clips" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);
      
      // Mark job as failed
      await supabase
        .from("ai_jobs")
        .update({
          status: "failed",
          error_message: `AI API error: ${response.status}`,
          completed_at: new Date().toISOString(),
        })
        .eq("id", aiJob.id);
      
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      await supabase
        .from("ai_jobs")
        .update({
          status: "failed",
          error_message: "No clips identified by AI",
          completed_at: new Date().toISOString(),
        })
        .eq("id", aiJob.id);
      
      throw new Error("No clips identified by AI");
    }

    const result = JSON.parse(toolCall.function.arguments);
    console.log("AI identified", result.clips.length, "clips");

    // Create clip records in database
    // NOTE: duration_seconds is a GENERATED column, do NOT include it in insert
    const clipInserts = result.clips.map((clip: any) => ({
      user_id: user.id,
      source_media_id: mediaId,
      ai_job_id: aiJob.id,
      start_seconds: clip.start_time,
      end_seconds: clip.end_time,
      // duration_seconds is GENERATED from (end_seconds - start_seconds), do not insert
      title: clip.title,
      suggested_caption: clip.hook,
      virality_score: clip.virality_score,
      storage_path: fileUrl ? `${fileUrl}#t=${clip.start_time},${clip.end_time}` : null,
      status: 'ready', // Clips are playable via time-fragment URLs immediately
    }));

    const { data: insertedClips, error: clipsError } = await supabase
      .from("clips")
      .insert(clipInserts)
      .select();

    if (clipsError) {
      console.error("Error creating clips:", clipsError);
      
      await supabase
        .from("ai_jobs")
        .update({
          status: "failed",
          error_message: `Failed to save clips: ${clipsError.message}`,
          completed_at: new Date().toISOString(),
        })
        .eq("id", aiJob.id);
      
      throw clipsError;
    }

    // Mark job as completed
    const processingTime = (Date.now() - startTime) / 1000;
    await supabase
      .from("ai_jobs")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        processing_time_seconds: processingTime,
      })
      .eq("id", aiJob.id);

    console.log(`Clips job ${aiJob.id} completed in ${processingTime}s, created ${insertedClips.length} clips`);

    return new Response(
      JSON.stringify({ 
        success: true,
        clips: result.clips,
        jobId: aiJob.id,
        clipsCreated: insertedClips.length
      }), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in analyze-clips:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
