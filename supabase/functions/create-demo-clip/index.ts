import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * CREATE DEMO CLIP - Shotstack Integration
 * 
 * Creates a demo clip using Shotstack Edit API:
 * - Creates clips record with proper status tracking
 * - Extracts Cloudflare Stream MP4 download URL
 * - Submits render job to Shotstack
 * - Returns clipId for status polling
 * - Shotstack webhook updates clip when rendering completes
 */

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let clipRecord: any = null;
  let supabase: any = null;

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authenticated");

    // Use service role key for edge function to bypass RLS
    supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { 
        global: { 
          headers: { 
            Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}` 
          } 
        } 
      }
    );

    // Extract and verify user JWT from Authorization header
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) throw new Error("Not authenticated");

    // Parse request body for certification preference
    const body = await req.json().catch(() => ({}));
    const enableCertification = body.enableCertification === true;

    console.log("Creating demo clip for user:", user.id, "| Certification:", enableCertification);

    // Get a source video from the user's library
    const { data: sourceVideos, error: videosError } = await supabase
      .from("media_files")
      .select("id, file_url, file_name, duration_seconds")
      .eq("user_id", user.id)
      .ilike("file_type", "video%")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (videosError || !sourceVideos) {
      throw new Error("No source video found. Please upload a video first.");
    }

    const sourceVideo = sourceVideos;
    const startTime = 5; // Start at 5 seconds
    const endTime = Math.min(15, sourceVideo.duration_seconds || 30); // 10 second clip
    const duration = endTime - startTime;

    console.log("Source video:", sourceVideo.file_name, "Duration:", duration);

    // STEP 1: Create clips record
    const { data: clip, error: clipError } = await supabase
      .from("clips")
      .insert({
        user_id: user.id,
        source_media_id: sourceVideo.id,
        start_seconds: startTime,
        end_seconds: endTime,
        duration_seconds: duration,
        title: "Demo: AI Clip Test",
        suggested_caption: "🎯 This is a demonstration clip showing the complete pipeline architecture",
        status: 'processing',
        enable_certification: enableCertification,
        cert_status: 'not_requested', // Always start with not_requested, webhook will handle certification
      })
      .select()
      .single();

    if (clipError) throw clipError;
    clipRecord = clip;

    console.log("Created clip record:", clipRecord.id);

    // STEP 2: Submit BOTH vertical and thumbnail renders to Shotstack
    console.log("Submitting vertical and thumbnail clips to Shotstack...");
    
    // Use the direct file URL from media_files table (Supabase Storage URL)
    const sourceVideoUrl = sourceVideo.file_url;
    console.log("Source video URL:", sourceVideoUrl);

    // Submit vertical clip (9:16)
    console.log("→ Submitting vertical clip (9:16)...");
    const verticalResponse = await supabase.functions.invoke('submit-shotstack-render', {
      headers: {
        Authorization: authHeader,
      },
      body: {
        clipId: clipRecord.id,
        cloudflareDownloadUrl: sourceVideoUrl,
        start: 0,
        length: duration,
        orientation: "vertical",
        templateName: "vertical_template_1",
        enableCertification,
      }
    });

    if (verticalResponse.error) {
      console.error("Vertical clip submission failed:", verticalResponse.error);
      throw new Error(`Vertical clip failed: ${verticalResponse.error.message}`);
    }

    console.log("✓ Vertical clip submitted:", verticalResponse.data.shotstackJobId);

    // Submit thumbnail clip (square/16:9)
    console.log("→ Submitting thumbnail clip (square)...");
    const thumbnailResponse = await supabase.functions.invoke('submit-shotstack-render', {
      headers: {
        Authorization: authHeader,
      },
      body: {
        clipId: clipRecord.id,
        cloudflareDownloadUrl: sourceVideoUrl,
        start: 0,
        length: duration,
        orientation: "horizontal",
        templateName: "horizontal_template_1",
      }
    });

    if (thumbnailResponse.error) {
      console.warn("Thumbnail clip submission failed (non-fatal):", thumbnailResponse.error);
      // Don't fail the entire process if thumbnail fails
    } else {
      console.log("✓ Thumbnail clip submitted:", thumbnailResponse.data.shotstackJobId);
    }

    console.log("SHOTSTACK SUCCESS - Both clips submitted", JSON.stringify({
      clipId: clipRecord.id,
      verticalJobId: verticalResponse.data.shotstackJobId,
      thumbnailJobId: thumbnailResponse.data?.shotstackJobId,
      engine: 'shotstack',
      status: 'processing',
    }, null, 2));

    return new Response(
      JSON.stringify({
        success: true,
        clipId: clipRecord.id,
        verticalJobId: verticalResponse.data.shotstackJobId,
        thumbnailJobId: thumbnailResponse.data?.shotstackJobId,
        title: "Demo: AI Clip Test",
        duration: duration,
        status: "processing",
        message: "Vertical and thumbnail clips submitted to Shotstack. Use the clipId to poll for completion.",
        instructions: "Poll GET /clips?id={clipId} to check status. When status='ready', vertical_url and thumbnail_url will contain the final videos.",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("SHOTSTACK ERROR - Full details:", JSON.stringify({
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined,
      code: (error as any)?.code,
      details: (error as any)?.details,
      hint: (error as any)?.hint,
      clipId: clipRecord?.id,
      hasSupabaseClient: !!supabase,
    }, null, 2));
    
    // Update clip status to failed if we have a clipRecord
    if (clipRecord?.id && supabase) {
      try {
        await supabase
          .from("clips")
          .update({ 
            status: 'failed',
            error_message: error instanceof Error ? error.message : String(error)
          })
          .eq("id", clipRecord.id);
      } catch (updateError) {
        console.error("Failed to update clip status:", updateError);
      }
    }
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        details: String(error),
        code: (error as any)?.code,
        hint: (error as any)?.hint,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
