import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getTemplatePayload } from "./templates.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Submit Shotstack Render Job
 * 
 * Creates a video clip render job using Shotstack Edit API.
 * Supports vertical (9:16) format for social media (Reels, TikTok, Shorts).
 * 
 * Input:
 * - clipId: UUID of the clips record
 * - cloudflareDownloadUrl: MP4 download URL from Cloudflare Stream
 * - start: start time in seconds (relative to source video)
 * - length: duration in seconds
 * - orientation: 'vertical' (9:16) or 'horizontal' (16:9) - defaults to vertical
 * 
 * Process:
 * 1. Validates input and authenticates user
 * 2. Builds Shotstack render JSON payload
 * 3. Submits to Shotstack API
 * 4. Updates clips record with shotstack_job_id and status
 */

interface SubmitRenderRequest {
  clipId: string;
  cloudflareDownloadUrl: string;
  start?: number; // Start offset within the source video (defaults to 0)
  length: number; // Clip duration in seconds
  orientation?: 'vertical' | 'horizontal'; // Output format (legacy)
  templateName?: string; // Template to use (e.g., "vertical_template_1")
  collectionId?: string; // Optional collection to organize clip into
  enableCertification?: boolean; // Whether to add certification watermark
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== SUBMIT SHOTSTACK RENDER ===");

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Not authenticated");
    }

    // Initialize Supabase with service role
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        global: {
          headers: {
            Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
        },
      }
    );

    // Verify user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      throw new Error("User authentication failed");
    }

    // Parse request
    const requestData: SubmitRenderRequest = await req.json();
    const {
      clipId,
      cloudflareDownloadUrl,
      start = 0,
      length,
      orientation = 'vertical',
      templateName,
      collectionId,
      enableCertification = false,
    } = requestData;

    console.log(`✓ Request parsed - Clip: ${clipId}, Length: ${length}s, Template: ${templateName || 'auto'}`);

    // Validate clip exists and belongs to user
    const { data: clip, error: clipError } = await supabase
      .from("clips")
      .select("*")
      .eq("id", clipId)
      .eq("user_id", user.id)
      .single();

    if (clipError || !clip) {
      throw new Error(`Clip not found or access denied: ${clipId}`);
    }

    // Get Shotstack API key
    const SHOTSTACK_API_KEY = Deno.env.get("SHOTSTACK_API_KEY");
    if (!SHOTSTACK_API_KEY) {
      throw new Error("Shotstack API key not configured");
    }

    // Get webhook URL (our shotstack-webhook endpoint)
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const callbackUrl = `${SUPABASE_URL}/functions/v1/shotstack-webhook`;

    // Prepare dynamic placeholders from clip metadata
    const placeholders = {
      VIDEO_URL: cloudflareDownloadUrl,
      CLIP_LENGTH_SECONDS: length,
      TITLE_TEXT: clip.title || "Demo: AI Clip Test",
      SUBTITLE_TEXT: clip.description || "AI-powered vertical clip",
      HOOK_TEXT: clip.title || "Watch this!",
      USERNAME_OR_TAGLINE: clip.user_id || "@creator",
      CTA_TEXT: "Learn More",
      BRAND_COLOR_PRIMARY: "#8B5CF6",
      LOGO_URL: "", // Can be added later from user profile
      CERT_WATERMARK_URL: enableCertification ? `${SUPABASE_URL}/storage/v1/object/public/assets/seeksy-certified-watermark.png` : undefined,
    };

    // Determine which template to use
    const selectedTemplate = templateName || (orientation === 'horizontal' ? 'horizontal_template_1' : 'vertical_template_1');

    // Get the template payload with optional watermark
    const renderPayload = getTemplatePayload(selectedTemplate, placeholders, callbackUrl, enableCertification);

    console.log("→ Submitting render to Shotstack...");
    console.log("  Source:", cloudflareDownloadUrl);
    console.log("  Template:", selectedTemplate);
    console.log("  Title:", placeholders.TITLE_TEXT);
    console.log("  Subtitle:", placeholders.SUBTITLE_TEXT);

    // Submit to Shotstack Edit API
    const shotstackResponse = await fetch("https://api.shotstack.io/edit/v1/render", {
      method: "POST",
      headers: {
        "x-api-key": SHOTSTACK_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(renderPayload),
    });

    const shotstackData = await shotstackResponse.json();

    if (!shotstackResponse.ok || !shotstackData.success) {
      const errorMsg = shotstackData.message || JSON.stringify(shotstackData);
      console.error("✗ Shotstack API error:", errorMsg);
      throw new Error(`Shotstack render failed: ${errorMsg}`);
    }

    const shotstackJobId = shotstackData.response.id;
    console.log(`✓ Shotstack job created: ${shotstackJobId}`);

    // Update clips record based on which type of render this is
    const updateFields: any = {
      shotstack_status: "queued",
      status: "processing",
      source_cloudflare_url: cloudflareDownloadUrl,
      template_name: selectedTemplate,
      collection_id: collectionId || null,
      enable_certification: enableCertification,
    };

    // Store job ID in the appropriate field based on orientation
    if (orientation === 'vertical') {
      updateFields.shotstack_job_id = shotstackJobId;
    } else {
      updateFields.shotstack_job_id_thumbnail = shotstackJobId;
    }

    // If certification enabled, set cert_status to pending
    if (enableCertification) {
      updateFields.cert_status = 'pending';
    }

    const { error: updateError } = await supabase
      .from("clips")
      .update(updateFields)
      .eq("id", clipId);

    if (updateError) {
      console.error("Failed to update clip record:", updateError);
      throw updateError;
    }

    console.log("✓ Clip record updated with Shotstack job ID");

    return new Response(
      JSON.stringify({
        success: true,
        clipId: clipId,
        shotstackJobId: shotstackJobId,
        status: "queued",
        message: "Render job submitted to Shotstack successfully",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("❌ Submit render error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
