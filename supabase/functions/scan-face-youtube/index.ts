import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openaiKey = Deno.env.get("OPENAI_API_KEY")!;
    const youtubeApiKey = Deno.env.get("YOUTUBE_API_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { videoUrl, appearanceId } = await req.json();

    // Get user's face identity
    const { data: faceIdentity, error: faceError } = await supabase
      .from("face_identity")
      .select("*")
      .eq("user_id", user.id)
      .eq("verification_status", "verified")
      .single();

    if (faceError || !faceIdentity) {
      return new Response(JSON.stringify({ 
        error: "Face identity not verified. Please verify your face first." 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[scan-face-youtube] Starting face scan for user ${user.id}`);

    // Create scan job
    const { data: scanJob, error: jobError } = await supabase
      .from("face_scan_jobs")
      .insert({
        user_id: user.id,
        platform: "youtube",
        source_url: videoUrl,
        status: "processing",
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (jobError) {
      console.error("[scan-face-youtube] Job creation error:", jobError);
      throw jobError;
    }

    // Extract video ID from URL
    const videoIdMatch = videoUrl?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/);
    const videoId = videoIdMatch?.[1];

    if (!videoId) {
      await supabase
        .from("face_scan_jobs")
        .update({ status: "failed", error_message: "Invalid YouTube URL" })
        .eq("id", scanJob.id);
        
      return new Response(JSON.stringify({ error: "Invalid YouTube URL" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get video metadata from YouTube API
    const ytResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${youtubeApiKey}`
    );
    
    const ytData = await ytResponse.json();
    const videoInfo = ytData.items?.[0]?.snippet;

    if (!videoInfo) {
      await supabase
        .from("face_scan_jobs")
        .update({ status: "failed", error_message: "Video not found" })
        .eq("id", scanJob.id);
        
      return new Response(JSON.stringify({ error: "Video not found on YouTube" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get high-quality thumbnail for analysis
    const thumbnailUrl = videoInfo.thumbnails?.maxres?.url || 
                         videoInfo.thumbnails?.high?.url ||
                         videoInfo.thumbnails?.medium?.url;

    if (!thumbnailUrl) {
      await supabase
        .from("face_scan_jobs")
        .update({ status: "failed", error_message: "No thumbnail available" })
        .eq("id", scanJob.id);
        
      return new Response(JSON.stringify({ error: "No video thumbnail available for analysis" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[scan-face-youtube] Analyzing thumbnail for face match");

    // Use OpenAI Vision to compare face in thumbnail with user's face description
    const faceDescription = faceIdentity.embedding_data?.description || "";
    const distinctiveFeatures = faceIdentity.embedding_data?.distinctiveFeatures || [];

    const visionResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a face matching system. Compare faces in images against a reference description.

Reference Face Description:
${faceDescription}

Distinctive Features to look for:
${distinctiveFeatures.join(", ")}

Analyze the image and determine if the reference person appears in it. Output JSON:
{
  "faceDetected": boolean,
  "matchFound": boolean,
  "confidenceScore": number (0-1),
  "matchDetails": string (explanation of match or why not),
  "personPosition": string (where in frame if found)
}`
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Does the reference person appear in this video thumbnail? Analyze carefully." },
              { type: "image_url", image_url: { url: thumbnailUrl, detail: "high" } }
            ]
          }
        ],
        max_tokens: 800,
      }),
    });

    if (!visionResponse.ok) {
      const errorText = await visionResponse.text();
      console.error("[scan-face-youtube] Vision error:", errorText);
      
      await supabase
        .from("face_scan_jobs")
        .update({ 
          status: "failed", 
          error_message: "Face analysis failed",
          completed_at: new Date().toISOString()
        })
        .eq("id", scanJob.id);
        
      return new Response(JSON.stringify({ error: "Face analysis failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const visionData = await visionResponse.json();
    const analysisText = visionData.choices[0]?.message?.content || "";

    // Parse result
    let matchResult;
    try {
      const jsonMatch = analysisText.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, analysisText];
      matchResult = JSON.parse(jsonMatch[1] || analysisText);
    } catch {
      console.error("[scan-face-youtube] Parse error:", analysisText);
      matchResult = { 
        faceDetected: false, 
        matchFound: false, 
        confidenceScore: 0,
        matchDetails: "Could not parse analysis"
      };
    }

    console.log("[scan-face-youtube] Match result:", matchResult);

    // Update scan job
    await supabase
      .from("face_scan_jobs")
      .update({
        status: "completed",
        total_frames_scanned: 1,
        matches_found: matchResult.matchFound ? 1 : 0,
        completed_at: new Date().toISOString(),
      })
      .eq("id", scanJob.id);

    // If match found, create face_match record
    if (matchResult.matchFound && matchResult.confidenceScore >= 0.6) {
      await supabase
        .from("face_matches")
        .insert({
          user_id: user.id,
          scan_job_id: scanJob.id,
          appearance_id: appearanceId || null,
          platform: "youtube",
          video_url: `https://youtube.com/watch?v=${videoId}`,
          video_title: videoInfo.title,
          thumbnail_url: thumbnailUrl,
          confidence_score: matchResult.confidenceScore,
          is_verified: false,
        });

      // Update appearance if provided
      if (appearanceId) {
        await supabase
          .from("guest_appearance_scans")
          .update({ 
            detection_method: "face_verified",
            is_verified: true 
          })
          .eq("id", appearanceId);
      }
    }

    return new Response(JSON.stringify({
      status: "completed",
      matchFound: matchResult.matchFound,
      confidenceScore: matchResult.confidenceScore,
      matchDetails: matchResult.matchDetails,
      videoTitle: videoInfo.title,
      thumbnailUrl,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[scan-face-youtube] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Scan failed";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});