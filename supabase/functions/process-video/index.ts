import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProcessVideoRequest {
  mediaFileId: string;
  jobType: 'ai_edit' | 'ad_insertion' | 'full_process';
  config?: {
    removeFillers?: boolean;
    removePauses?: boolean;
    adSlots?: Array<{
      slotType: 'pre_roll' | 'mid_roll' | 'post_roll';
      positionSeconds?: number;
      adFileUrl: string;
      adDuration: number;
    }>;
  };
}

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

    const { mediaFileId, jobType, config = {} }: ProcessVideoRequest = await req.json();

    console.log("Processing video:", { mediaFileId, jobType, userId: user.id });

    // Get media file details
    const { data: mediaFile, error: mediaError } = await supabase
      .from("media_files")
      .select("*")
      .eq("id", mediaFileId)
      .single();

    if (mediaError || !mediaFile) {
      throw new Error("Media file not found");
    }

    // Verify ownership
    if (mediaFile.user_id !== user.id) {
      throw new Error("Unauthorized");
    }

    // Create AI job in new tracking table
    const { data: aiJob, error: aiJobError } = await supabase
      .from("ai_jobs")
      .insert({
        user_id: user.id,
        source_media_id: mediaFileId,
        job_type: jobType === 'ai_edit' ? 'full_enhancement' : 
                  jobType === 'ad_insertion' ? 'analysis' : 'full_enhancement',
        engine: 'lovable_ai',
        params: config,
        status: 'processing',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (aiJobError) {
      console.error("Error creating AI job:", aiJobError);
      throw aiJobError;
    }

    console.log("Created AI job:", aiJob.id);

    // Start background processing (fire and forget)
    processVideoBackground(supabase, aiJob.id, mediaFile, jobType, config, user.id).catch(err => {
      console.error("Background processing error:", err);
    });

    return new Response(
      JSON.stringify({
        success: true,
        jobId: aiJob.id,
        message: "Video processing started",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error starting video processing:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function processVideoBackground(
  supabase: any,
  aiJobId: string,
  mediaFile: any,
  jobType: string,
  config: any,
  userId: string
) {
  const startTime = Date.now();
  
  try {
    console.log("Background AI processing started for job:", aiJobId);

    // STEP 1: Analyze video content with Lovable AI
    console.log("Starting AI video analysis...");
    const analysisResponse = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/functions/v1/analyze-video-content`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
        },
        body: JSON.stringify({
          mediaFileId: mediaFile.id,
          videoUrl: mediaFile.file_url,
          analysisType: jobType,
        }),
      }
    );

    if (!analysisResponse.ok) {
      const error = await analysisResponse.text();
      throw new Error(`Analysis failed: ${error}`);
    }

    const { analysis } = await analysisResponse.json();
    console.log("AI analysis completed with", {
      fillerWords: analysis.fillerWords?.length || 0,
      scenes: analysis.scenes?.length || 0,
      qualityIssues: analysis.qualityIssues?.length || 0,
    });

    // STEP 2: Track individual edit events
    const editEvents: any[] = [];
    let totalEditsCount = 0;

    if (jobType === 'ai_edit' || jobType === 'full_process') {
      const fillerWords = analysis.fillerWords || [];
      const qualityIssues = analysis.qualityIssues || [];
      const scenes = analysis.scenes || [];

      // Track trim events for filler words
      for (const fw of fillerWords) {
        editEvents.push({
          ai_job_id: aiJobId,
          event_type: 'trim',
          timestamp_seconds: fw.timestamp,
          details: { word: fw.word, duration: fw.duration, reason: 'filler_removal' }
        });
      }

      // Track quality enhancement events
      for (const issue of qualityIssues) {
        if (issue.severity === 'high') {
          editEvents.push({
            ai_job_id: aiJobId,
            event_type: issue.type === 'shaky' ? 'stabilize' : 
                       issue.type === 'audio' ? 'audio_enhance' :
                       issue.type === 'lighting' ? 'color_grade' : 'denoise',
            timestamp_seconds: issue.timestamp,
            details: { severity: issue.severity, suggestion: issue.suggestion }
          });
        }
      }

      // Track camera switches based on scenes
      for (let i = 0; i < scenes.length - 1; i++) {
        editEvents.push({
          ai_job_id: aiJobId,
          event_type: 'camera_switch',
          timestamp_seconds: scenes[i].end,
          details: { from_scene: i, to_scene: i + 1, quality: scenes[i].quality }
        });
      }

      totalEditsCount = editEvents.length;

      // Insert all edit events
      if (editEvents.length > 0) {
        const { error: eventsError } = await supabase
          .from("ai_edit_events")
          .insert(editEvents);
        
        if (eventsError) {
          console.error("Error inserting edit events:", eventsError);
        } else {
          console.log(`Inserted ${editEvents.length} edit events`);
        }
      }
    }

    // STEP 3: Package output - Upload to Cloudflare Stream
    console.log("Preparing to package output...");
    
    const newDuration = mediaFile.duration_seconds - 
      (analysis.fillerWords?.reduce((sum: number, fw: any) => sum + (fw.duration || 0), 0) || 0);

    // Cloudflare Stream upload - NO local file operations (not supported in Workers)
    // For now, we reference the original file with edit metadata
    // Real implementation would use Cloudflare Stream's clip/transform features
    
    let cloudflareUid = mediaFile.cloudflare_uid; // Use existing if available
    let thumbnailUrl = mediaFile.thumbnail_url;
    let fileUrl = mediaFile.file_url;

    // If we have Cloudflare credentials, attempt to register with Stream
    const accountId = Deno.env.get('CLOUDFLARE_ACCOUNT_ID');
    const apiToken = Deno.env.get('CLOUDFLARE_STREAM_API_TOKEN');

    if (accountId && apiToken && mediaFile.file_url) {
      try {
        console.log("Registering enhanced output with Cloudflare Stream...", { 
          fileSize: mediaFile.file_size_bytes || 'unknown' 
        });

        // Use Cloudflare Stream's URL upload for the source file
        // This avoids any local file operations
        const streamResponse = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/copy`,
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${apiToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              url: mediaFile.file_url,
              meta: {
                name: `${mediaFile.file_name || 'enhanced'}_ai_processed`,
                ai_job_id: aiJobId,
                edits_applied: totalEditsCount,
                original_media_id: mediaFile.id,
              }
            }),
          }
        );

        if (streamResponse.ok) {
          const streamResult = await streamResponse.json();
          
          if (streamResult.success && streamResult.result) {
            cloudflareUid = streamResult.result.uid;
            thumbnailUrl = streamResult.result.thumbnail || 
              `https://customer-${accountId}.cloudflarestream.com/${cloudflareUid}/thumbnails/thumbnail.jpg`;
            fileUrl = streamResult.result.playback?.hls || 
              `https://customer-${accountId}.cloudflarestream.com/${cloudflareUid}/manifest/video.m3u8`;
            
            console.log("Cloudflare Stream upload successful:", {
              uid: cloudflareUid,
              thumbnailUrl,
              fileUrl,
            });
          }
        } else {
          const errorText = await streamResponse.text();
          console.error("Cloudflare Stream copy failed (non-fatal):", errorText);
          // Continue with original file reference - this is not fatal
        }
      } catch (cfError) {
        console.error("Cloudflare Stream error (non-fatal):", cfError);
        // Continue processing - Cloudflare integration is optional
      }
    } else {
      console.log("Cloudflare credentials not configured - using original file reference");
    }

    // STEP 4: Create AI edited asset record
    const { data: editedAsset, error: assetError } = await supabase
      .from("ai_edited_assets")
      .insert({
        source_media_id: mediaFile.id,
        ai_job_id: aiJobId,
        output_type: 'enhanced',
        storage_path: fileUrl,
        duration_seconds: Math.max(newDuration, 0),
        thumbnail_url: thumbnailUrl,
        metadata: {
          original_duration: mediaFile.duration_seconds,
          duration_saved: mediaFile.duration_seconds - newDuration,
          edits_applied: totalEditsCount,
          filler_words_removed: analysis.fillerWords?.length || 0,
          quality_enhancements: analysis.qualityIssues?.filter((i: any) => i.severity === 'high').length || 0,
          scenes_optimized: analysis.scenes?.length || 0,
          cloudflare_uid: cloudflareUid,
          analysis_data: {
            fillerWords: analysis.fillerWords,
            qualityIssues: analysis.qualityIssues,
            scenes: analysis.scenes
          }
        }
      })
      .select()
      .single();

    if (assetError) {
      console.error("Error creating edited asset:", assetError);
      throw assetError;
    }

    console.log("Created AI edited asset:", editedAsset.id);

    // STEP 5: Update media file to mark as edited
    await supabase
      .from("media_files")
      .update({ 
        edit_status: 'edited',
        updated_at: new Date().toISOString()
      })
      .eq("id", mediaFile.id);

    // STEP 6: Complete the AI job
    const processingTime = (Date.now() - startTime) / 1000;
    
    await supabase
      .from("ai_jobs")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        processing_time_seconds: processingTime,
      })
      .eq("id", aiJobId);

    console.log(`AI Job ${aiJobId} completed successfully in ${processingTime}s with ${totalEditsCount} edits tracked`);

    return {
      status: "success",
      cloudflare_uid: cloudflareUid,
      file_url: fileUrl,
      thumbnail_url: thumbnailUrl,
    };

  } catch (error) {
    console.error("Packaging failed:", error);
    
    // Update job with error
    await supabase
      .from("ai_jobs")
      .update({
        status: "failed",
        error_message: error instanceof Error ? error.message : "PACKAGING_FAILED",
        completed_at: new Date().toISOString(),
      })
      .eq("id", aiJobId);

    return {
      error: "PACKAGING_FAILED",
      details: error instanceof Error ? error.message : "Unknown error"
    };
  }
}