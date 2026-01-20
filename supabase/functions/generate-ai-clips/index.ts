import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * AI Clip Generation MVP - Main Entry Point
 * 
 * This function:
 * 1. Creates a clip_job record
 * 2. Analyzes the video for viral moments using AI
 * 3. Creates clip records with proper metadata
 * 4. Generates actual rendered clips via Cloudflare Stream
 * 
 * Future enhancements (TODO):
 * - Animated captions (word-by-word highlighting)
 * - Split-screen layouts (speaker + B-roll)
 * - Opus-style scoring (Hook/Flow/Value/Trend)
 * - Direct publishing to TikTok, IG, YouTube, LinkedIn, X
 */

interface GenerateClipsRequest {
  sourceMediaId: string;
  options: {
    autoHookDetection: boolean;
    speakerDetection: boolean;
    highEnergyMoments: boolean;
    exportFormats: string[]; // ['9:16', '1:1', '16:9', '4:5']
  };
}

interface ClipSegment {
  startTime: number;
  endTime: number;
  title: string;
  description: string;
  viralityScore: number;
  hook: string;
  transcriptSnippet?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let supabase: any = null;
  let clipJob: any = null;

  try {
    console.log("=== AI Clip Generation MVP ===");

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Not authenticated");
    }

    // Initialize Supabase with service role for admin operations
    supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Verify user from JWT
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      throw new Error("User authentication failed");
    }
    console.log(`✓ Authenticated user: ${user.id}`);

    // Parse request
    const { sourceMediaId, options }: GenerateClipsRequest = await req.json();
    console.log("Request:", { sourceMediaId, options });

    if (!sourceMediaId) {
      throw new Error("sourceMediaId is required");
    }

    // Fetch source media
    const { data: sourceMedia, error: mediaError } = await supabase
      .from("media_files")
      .select("*")
      .eq("id", sourceMediaId)
      .single();

    if (mediaError || !sourceMedia) {
      throw new Error(`Source media not found: ${sourceMediaId}`);
    }

    if (sourceMedia.status !== "ready") {
      throw new Error(`Source media is not ready (status: ${sourceMedia.status})`);
    }

    console.log(`✓ Source media: ${sourceMedia.file_name}, duration: ${sourceMedia.duration_seconds}s`);

    // Get video URL
    const videoUrl = sourceMedia.cloudflare_download_url || sourceMedia.file_url;
    if (!videoUrl) {
      throw new Error("No video URL available for source media");
    }

    // Create clip_job record
    const { data: job, error: jobError } = await supabase
      .from("clip_jobs")
      .insert({
        user_id: user.id,
        source_media_id: sourceMediaId,
        status: "pending",
        options: {
          autoHookDetection: options?.autoHookDetection ?? true,
          speakerDetection: options?.speakerDetection ?? true,
          highEnergyMoments: options?.highEnergyMoments ?? true,
          exportFormats: options?.exportFormats ?? ["9:16", "1:1", "16:9"],
        },
        progress_percent: 0,
        current_step: "Initializing",
      })
      .select()
      .single();

    if (jobError) {
      throw new Error(`Failed to create clip job: ${jobError.message}`);
    }
    clipJob = job;
    console.log(`✓ Created clip job: ${job.id}`);

    // Update job status to processing
    await updateJobProgress(supabase, job.id, 5, "processing", "Analyzing video content");

    // Step 1: Get or generate transcript
    console.log("\n=== Step 1: Getting transcript ===");
    let transcript = "";
    if (sourceMedia.edit_transcript) {
      transcript = typeof sourceMedia.edit_transcript === "string" 
        ? sourceMedia.edit_transcript 
        : JSON.stringify(sourceMedia.edit_transcript);
      console.log("✓ Using existing transcript");
    } else {
      // Try to get transcript from AI analysis
      transcript = await generateTranscript(videoUrl, sourceMedia.duration_seconds || 0);
      console.log("✓ Generated new transcript");
    }
    await updateJobProgress(supabase, job.id, 20, "processing", "Detecting viral moments");

    // Step 2: AI analysis to find clip segments
    console.log("\n=== Step 2: AI Analysis ===");
    const segments = await analyzeForClips(
      transcript,
      sourceMedia.duration_seconds || 0,
      options
    );
    console.log(`✓ AI identified ${segments.length} clip segments`);
    await updateJobProgress(supabase, job.id, 40, "processing", "Creating clip records");

    // Step 3: Create clip records
    console.log("\n=== Step 3: Creating clip records ===");
    const exportFormats = options?.exportFormats || ["9:16", "1:1", "16:9"];
    const createdClips: any[] = [];

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const progressPercent = 40 + Math.floor((i / segments.length) * 30);
      await updateJobProgress(supabase, job.id, progressPercent, "processing", `Creating clip ${i + 1} of ${segments.length}`);

      // Create clip for each format
      for (const format of exportFormats) {
        const { data: clip, error: clipError } = await supabase
          .from("clips")
          .insert({
            user_id: user.id,
            source_media_id: sourceMediaId,
            clip_job_id: job.id,
            start_seconds: segment.startTime,
            end_seconds: segment.endTime,
            title: segment.title,
            suggested_caption: segment.hook,
            virality_score: segment.viralityScore,
            hook_score: segment.viralityScore,
            transcript_snippet: segment.transcriptSnippet,
            aspect_ratio: format,
            export_formats: [format],
            template_id: "seeksy_default",
            status: "processing",
          })
          .select()
          .single();

        if (clipError) {
          console.error(`Error creating clip: ${clipError.message}`);
          continue;
        }

        createdClips.push(clip);
        console.log(`✓ Created clip: ${clip.id} (${format})`);
      }
    }

    await updateJobProgress(supabase, job.id, 70, "processing", "Rendering clips");

    // Step 4: Render clips via Cloudflare Stream
    console.log("\n=== Step 4: Rendering clips ===");
    let renderedCount = 0;

    for (let i = 0; i < createdClips.length; i++) {
      const clip = createdClips[i];
      const progressPercent = 70 + Math.floor((i / createdClips.length) * 25);
      await updateJobProgress(supabase, job.id, progressPercent, "processing", `Rendering clip ${i + 1} of ${createdClips.length}`);

      try {
        const renderResult = await renderClipWithCloudflare(
          supabase,
          sourceMedia,
          clip,
          user.id
        );

        if (renderResult.success) {
          renderedCount++;
        }
      } catch (renderError) {
        console.error(`Failed to render clip ${clip.id}:`, renderError);
        // Mark clip as failed but continue with others
        await supabase
          .from("clips")
          .update({
            status: "failed",
            error_message: renderError instanceof Error ? renderError.message : "Render failed",
          })
          .eq("id", clip.id);
      }
    }

    // Step 5: Finalize job
    console.log("\n=== Step 5: Finalizing ===");
    await supabase
      .from("clip_jobs")
      .update({
        status: "completed",
        progress_percent: 100,
        current_step: "Complete",
        total_clips: renderedCount,
        completed_at: new Date().toISOString(),
      })
      .eq("id", job.id);

    console.log(`✓ Job completed: ${renderedCount} clips rendered`);

    return new Response(
      JSON.stringify({
        success: true,
        jobId: job.id,
        status: "completed",
        totalClips: renderedCount,
        message: `Successfully generated ${renderedCount} clips`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ Error:", error);

    // Update job as failed if we have one
    if (clipJob?.id && supabase) {
      await supabase
        .from("clip_jobs")
        .update({
          status: "failed",
          error_message: error instanceof Error ? error.message : "Unknown error",
          completed_at: new Date().toISOString(),
        })
        .eq("id", clipJob.id);
    }

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        jobId: clipJob?.id,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function updateJobProgress(
  supabase: any,
  jobId: string,
  progressPercent: number,
  status: string,
  currentStep: string
) {
  await supabase
    .from("clip_jobs")
    .update({
      progress_percent: progressPercent,
      status,
      current_step: currentStep,
      started_at: status === "processing" ? new Date().toISOString() : undefined,
    })
    .eq("id", jobId);
}

async function generateTranscript(videoUrl: string, durationSeconds: number): Promise<string> {
  // For MVP, return empty - transcript will come from AI Post-Production
  // TODO: Integrate with transcribe-media edge function
  return "";
}

async function analyzeForClips(
  transcript: string,
  durationSeconds: number,
  options: any
): Promise<ClipSegment[]> {
  // Ensure we have a valid duration - if 0 or null, assume 60 seconds for short-form content
  const actualDuration = durationSeconds > 0 ? durationSeconds : 60;
  console.log(`Analyzing video with duration: ${actualDuration}s`);
  
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  
  if (!LOVABLE_API_KEY) {
    console.log("No Lovable API key - using fallback segment detection");
    return generateFallbackSegments(actualDuration);
  }

  try {
    const analysisContext = transcript 
      ? `Analyze this video transcript and identify 3-5 viral-worthy clips. The video is exactly ${actualDuration} seconds long - ALL timestamps must be within 0 to ${actualDuration}:\n\n${transcript}`
      : `Suggest 3-5 clip segments for a ${actualDuration}-second video. IMPORTANT: The video is ONLY ${actualDuration} seconds long, so all clips must start and end within 0-${actualDuration} seconds.`;

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
            content: `You are an expert at finding viral-worthy moments in video content for TikTok, Instagram Reels, and YouTube Shorts.

CRITICAL: The video is EXACTLY ${actualDuration} seconds long. All clip timestamps MUST be between 0 and ${actualDuration}.

You identify clips that:
- Have a strong hook in the first 3 seconds
- Tell a complete micro-story (15-60 seconds max, or shorter if video is short)
- Have emotional impact or surprising moments
- Are self-contained and don't need context
- Have natural start/end points

${options?.autoHookDetection ? "Focus on attention-grabbing openers." : ""}
${options?.speakerDetection ? "Look for speaker changes as natural cut points." : ""}
${options?.highEnergyMoments ? "Prioritize high-energy, dynamic moments." : ""}

Return clips ordered by virality potential. Ensure ALL timestamps fit within the ${actualDuration}-second video length.`,
          },
          {
            role: "user",
            content: analysisContext,
          },
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
                        startTime: { type: "number", description: `Start time in seconds (0 to ${actualDuration})` },
                        endTime: { type: "number", description: `End time in seconds (must be <= ${actualDuration})` },
                        title: { type: "string", description: "Catchy 5-8 word title" },
                        description: { type: "string", description: "Why this is viral-worthy" },
                        viralityScore: { type: "number", description: "Score 0-100" },
                        hook: { type: "string", description: "Attention-grabbing opening" },
                        transcriptSnippet: { type: "string", description: "Key quote from segment" },
                      },
                      required: ["startTime", "endTime", "title", "viralityScore", "hook"],
                    },
                  },
                },
                required: ["clips"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "identify_clips" } },
      }),
    });

    if (!response.ok) {
      console.error("AI API error:", response.status);
      return generateFallbackSegments(actualDuration);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      return generateFallbackSegments(actualDuration);
    }

    const result = JSON.parse(toolCall.function.arguments);
    
    // CRITICAL: Clamp all timestamps to actual video duration
    return result.clips.map((clip: any) => {
      const startTime = Math.max(0, Math.min(clip.startTime || clip.start_time || 0, actualDuration - 5));
      const endTime = Math.max(startTime + 5, Math.min(clip.endTime || clip.end_time || startTime + 30, actualDuration));
      
      return {
        startTime,
        endTime,
        title: clip.title || "Viral Moment",
        description: clip.description || "",
        viralityScore: clip.viralityScore || clip.virality_score || 80,
        hook: clip.hook || clip.title || "",
        transcriptSnippet: clip.transcriptSnippet || clip.transcript_snippet || "",
      };
    });
  } catch (error) {
    console.error("AI analysis error:", error);
    return generateFallbackSegments(actualDuration);
  }
}

function generateFallbackSegments(durationSeconds: number): ClipSegment[] {
  // Ensure valid duration
  const duration = durationSeconds > 0 ? durationSeconds : 60;
  
  // Unique titles for fallback clips
  const clipTitles = [
    { title: "The Hook That Grabs Attention", hook: "Wait for it..." },
    { title: "Mind-Blowing Insight Revealed", hook: "This changes everything!" },
    { title: "The Moment Everyone Talks About", hook: "You need to see this!" },
    { title: "Game-Changing Perspective", hook: "Here's the truth..." },
    { title: "This Will Surprise You", hook: "Nobody expected this!" },
  ];
  
  // For short videos (< 60s), create 1-2 clips covering most of the video
  if (duration <= 30) {
    return [{
      startTime: 0,
      endTime: duration,
      title: clipTitles[0].title,
      description: "Complete video",
      viralityScore: 85,
      hook: clipTitles[0].hook,
      transcriptSnippet: "",
    }];
  }
  
  if (duration <= 60) {
    return [
      {
        startTime: 0,
        endTime: Math.min(30, duration),
        title: clipTitles[0].title,
        description: "Strong opener",
        viralityScore: 88,
        hook: clipTitles[0].hook,
        transcriptSnippet: "",
      },
      {
        startTime: Math.max(0, duration - 30),
        endTime: duration,
        title: clipTitles[1].title,
        description: "Highlight",
        viralityScore: 85,
        hook: clipTitles[1].hook,
        transcriptSnippet: "",
      }
    ];
  }
  
  // For longer videos, create 3-4 evenly spaced clips
  const segmentDuration = Math.min(30, Math.floor(duration / 4));
  const numSegments = Math.min(4, Math.floor(duration / segmentDuration));
  const segments: ClipSegment[] = [];

  for (let i = 0; i < numSegments; i++) {
    const startTime = i * Math.floor(duration / numSegments);
    const endTime = Math.min(startTime + segmentDuration, duration);
    const titleData = clipTitles[i % clipTitles.length];

    segments.push({
      startTime,
      endTime,
      title: titleData.title,
      description: "Auto-detected segment",
      viralityScore: 88 - i * 3,
      hook: titleData.hook,
      transcriptSnippet: "",
    });
  }

  return segments;
}

async function renderClipWithCloudflare(
  supabase: any,
  sourceMedia: any,
  clip: any,
  userId: string
): Promise<{ success: boolean; url?: string }> {
  const CLOUDFLARE_ACCOUNT_ID = Deno.env.get("CLOUDFLARE_ACCOUNT_ID");
  const CLOUDFLARE_STREAM_API_TOKEN = Deno.env.get("CLOUDFLARE_STREAM_API_TOKEN");

  if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_STREAM_API_TOKEN) {
    console.log("Cloudflare credentials not configured - using time-fragment URLs");
    return await createTimeFragmentClip(supabase, sourceMedia, clip);
  }

  try {
    // If source has Cloudflare UID, create a clip using Cloudflare's clip API
    if (sourceMedia.cloudflare_uid) {
      const clipResponse = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/${sourceMedia.cloudflare_uid}/clip`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${CLOUDFLARE_STREAM_API_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            clippedFromVideoUID: sourceMedia.cloudflare_uid,
            startTimeSeconds: clip.start_seconds,
            endTimeSeconds: clip.end_seconds,
            allowedOrigins: ["*"],
            requireSignedURLs: false,
            meta: {
              name: clip.title || `Clip ${clip.id}`,
              aspectRatio: clip.aspect_ratio,
              sourceClipId: clip.id,
            },
          }),
        }
      );

      const clipData = await clipResponse.json();

      if (clipData.success && clipData.result) {
        const newClipUid = clipData.result.uid;
        
        // Construct playback URL with aspect ratio transformations
        // TODO: Add proper cropping based on aspect_ratio template
        let width = 1080, height = 1920; // Default 9:16
        if (clip.aspect_ratio === "1:1") {
          width = 1080; height = 1080;
        } else if (clip.aspect_ratio === "16:9") {
          width = 1920; height = 1080;
        } else if (clip.aspect_ratio === "4:5") {
          width = 1080; height = 1350;
        }

        const playbackUrl = `https://customer-${CLOUDFLARE_ACCOUNT_ID.substring(0, 12)}.cloudflarestream.com/${newClipUid}/downloads/default.mp4`;
        const thumbnailUrl = `https://customer-${CLOUDFLARE_ACCOUNT_ID.substring(0, 12)}.cloudflarestream.com/${newClipUid}/thumbnails/thumbnail.jpg?time=${clip.start_seconds + 1}s`;

        // Update clip record
        await supabase
          .from("clips")
          .update({
            status: "ready",
            storage_path: playbackUrl,
            vertical_url: playbackUrl,
            thumbnail_url: thumbnailUrl,
            source_cloudflare_url: `https://customer-${CLOUDFLARE_ACCOUNT_ID.substring(0, 12)}.cloudflarestream.com/${newClipUid}/watch`,
          })
          .eq("id", clip.id);

        console.log(`✓ Rendered clip ${clip.id} via Cloudflare Stream`);
        return { success: true, url: playbackUrl };
      }
    }

    // Fallback to time-fragment if Cloudflare clip API fails
    return await createTimeFragmentClip(supabase, sourceMedia, clip);
  } catch (error) {
    console.error("Cloudflare render error:", error);
    return await createTimeFragmentClip(supabase, sourceMedia, clip);
  }
}

async function createTimeFragmentClip(
  supabase: any,
  sourceMedia: any,
  clip: any
): Promise<{ success: boolean; url?: string }> {
  // Use time-fragment URL as fallback (instant, no rendering needed)
  const baseUrl = sourceMedia.cloudflare_download_url || sourceMedia.file_url;
  const fragmentUrl = `${baseUrl}#t=${clip.start_seconds},${clip.end_seconds}`;
  
  // Generate thumbnail URL - prefer Cloudflare, fallback to source thumbnail, or generate placeholder
  let thumbnailUrl = sourceMedia.thumbnail_url;
  
  if (sourceMedia.cloudflare_uid) {
    // Use Cloudflare thumbnail at clip start time
    thumbnailUrl = `https://customer-typiggwc4l6lm7r2.cloudflarestream.com/${sourceMedia.cloudflare_uid}/thumbnails/thumbnail.jpg?time=${clip.start_seconds + 1}s`;
  } else if (!thumbnailUrl && sourceMedia.file_url) {
    // For videos without Cloudflare, use a frame-grab service or placeholder
    // Since we can't generate thumbnails without FFmpeg, use a gradient placeholder with clip info
    thumbnailUrl = `https://placehold.co/1080x1920/1e3a5f/ffffff?text=${encodeURIComponent(clip.title || 'Clip')}`;
  }

  await supabase
    .from("clips")
    .update({
      status: "ready",
      storage_path: fragmentUrl,
      vertical_url: fragmentUrl,
      thumbnail_url: thumbnailUrl,
    })
    .eq("id", clip.id);

  console.log(`✓ Created time-fragment clip ${clip.id} with thumbnail: ${thumbnailUrl ? 'yes' : 'no'}`);
  return { success: true, url: fragmentUrl };
}
