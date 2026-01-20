import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * PHASE 3: Generate OpusClip-quality clips
 * Routes to process-clip-phase3 for real video transformations
 */

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mediaId, fileUrl, startTime, endTime, title, hook, transcript, caption } = await req.json();
    
    console.log("[Phase 3] Generating clip:", { mediaId, startTime, endTime, title });

    // Get auth token from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error("Not authenticated");

    // Create authenticated client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error("Not authenticated");

    console.log("User authenticated:", user.id);

    // Create clip record in database
    const { data: clipData, error: clipError } = await supabase
      .from('clips')
      .insert({
        user_id: user.id,
        source_media_id: mediaId,
        start_seconds: startTime,
        end_seconds: endTime,
        title: title || hook || "Viral Moment",
        suggested_caption: caption || hook,
        status: 'processing'
      })
      .select()
      .single();

    if (clipError) {
      console.error("Error creating clip record:", clipError);
      throw clipError;
    }

    console.log("Created clip record:", clipData.id);

    // Route to Phase 3 processor for real video transformations
    console.log("Invoking Phase 3 processor...");
    
    const { data: processingData, error: processingError } = await supabase.functions.invoke("process-clip-phase3", {
      body: {
        clipId: clipData.id,
        sourceVideoUrl: fileUrl,
        startTime,
        duration: endTime - startTime,
        title: title || hook,
        transcript,
        hook,
      }
    });

    if (processingError) {
      console.error("Phase 3 processing error:", processingError);
      
      // Update clip status
      await supabase
        .from('clips')
        .update({
          status: 'failed',
          error_message: processingError.message || 'Phase 3 processing failed'
        })
        .eq('id', clipData.id);

      throw processingError;
    }

    console.log("Phase 3 processing complete:", processingData);

    // Return clip info
    return new Response(
      JSON.stringify({
        success: true,
        clipId: clipData.id,
        message: "OpusClip-quality clips being generated...",
        timeRange: { start: startTime, end: endTime },
        status: "processing",
        formats: ["vertical", "thumbnail"],
        phase: 3,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[Phase 3] Error in generate-clip:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        phase: 3,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
