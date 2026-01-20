import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Render Clip with Dynamic Captions
 * 
 * Complete pipeline for OpusClip-style clip generation:
 * 1. Transcribe with Whisper (word-level timestamps)
 * 2. Generate dynamic caption segments
 * 3. Submit to Shotstack with animated captions
 * 
 * This is the unified entry point for AI clip generation.
 */

interface RenderRequest {
  clipId: string;
  sourceVideoUrl: string;
  startTime: number;
  duration: number;
  title?: string;
  existingTranscript?: string;
  orientation?: 'vertical' | 'horizontal';
  captionStyle?: {
    fontFamily?: string;
    fontSize?: number;
    fontColor?: string;
    highlightColor?: string;
    position?: 'bottom' | 'center' | 'top';
    animation?: 'pop' | 'fade' | 'bounce' | 'none';
  };
  enableCertification?: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let clipId: string | null = null;

  try {
    console.log("=== RENDER CLIP WITH CAPTIONS ===");

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Not authenticated");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      throw new Error("User authentication failed");
    }

    const requestData: RenderRequest = await req.json();
    clipId = requestData.clipId;

    const {
      sourceVideoUrl,
      startTime,
      duration,
      title,
      existingTranscript,
      orientation = 'vertical',
      captionStyle = {},
      enableCertification = false,
    } = requestData;

    console.log(`→ Clip: ${clipId}, Duration: ${duration}s, Orientation: ${orientation}`);

    // Update clip status
    await supabase
      .from("clips")
      .update({ status: 'transcribing', shotstack_status: 'preparing' })
      .eq("id", clipId);

    // STEP 1: Get word-level transcription
    console.log("\n=== STEP 1: Whisper Transcription ===");
    let captionSegments: any[] = [];
    let transcriptText = existingTranscript || "";
    let usedFallback = false;

    if (!existingTranscript) {
      try {
        // Call Whisper transcription
        const whisperResponse = await supabase.functions.invoke('transcribe-whisper', {
          body: {
            audio_url: sourceVideoUrl,
            clip_id: clipId,
            language: 'en',
          },
        });

        if (whisperResponse.error) {
          console.error("Whisper transcription failed:", whisperResponse.error);
          usedFallback = true;
        } else if (whisperResponse.data?.text) {
          transcriptText = whisperResponse.data.text;
          captionSegments = whisperResponse.data.caption_segments || [];
          console.log(`✓ Transcribed: ${whisperResponse.data.words?.length || 0} words`);
          console.log(`✓ Caption segments: ${captionSegments.length}`);
        } else {
          console.warn("Whisper returned empty result");
          usedFallback = true;
        }
      } catch (whisperError) {
        console.error("Whisper exception:", whisperError);
        usedFallback = true;
      }

      // FALLBACK: If Whisper failed, generate placeholder captions from title
      if (usedFallback || captionSegments.length === 0) {
        console.log("⚠️ Using fallback caption generation");
        const fallbackText = title || "Watch this amazing clip!";
        captionSegments = generateSimpleSegments(fallbackText, duration);
        transcriptText = fallbackText;
      }
    } else {
      // Generate simple segments from existing transcript
      captionSegments = generateSimpleSegments(existingTranscript, duration);
    }

    // Update clip with transcript
    await supabase
      .from("clips")
      .update({ 
        status: 'rendering',
        suggested_caption: transcriptText.substring(0, 500),
      })
      .eq("id", clipId);

    // STEP 2: Build Shotstack render payload with dynamic captions
    console.log("\n=== STEP 2: Building Render Payload ===");
    
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const callbackUrl = `${SUPABASE_URL}/functions/v1/shotstack-webhook`;
    
    const renderPayload = buildCaptionedRenderPayload(
      sourceVideoUrl,
      duration,
      captionSegments,
      {
        orientation,
        style: captionStyle,
        useHtmlCaptions: captionSegments.length > 0 && captionSegments[0].words?.length > 0,
        callbackUrl,
        title,
        enableWatermark: enableCertification,
        watermarkUrl: enableCertification 
          ? `${SUPABASE_URL}/storage/v1/object/public/assets/seeksy-certified-watermark.png`
          : undefined,
      }
    );

    console.log(`→ Tracks: ${renderPayload.timeline.tracks.length}`);
    console.log(`→ Resolution: ${renderPayload.output.size?.width}x${renderPayload.output.size?.height}`);

    // STEP 3: Submit to Shotstack
    console.log("\n=== STEP 3: Submitting to Shotstack ===");
    
    const SHOTSTACK_API_KEY = Deno.env.get("SHOTSTACK_API_KEY");
    if (!SHOTSTACK_API_KEY) {
      throw new Error("Shotstack API key not configured");
    }

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
      console.error("Shotstack error:", errorMsg);
      throw new Error(`Shotstack render failed: ${errorMsg}`);
    }

    const shotstackJobId = shotstackData.response.id;
    console.log(`✓ Shotstack job submitted: ${shotstackJobId}`);

    // Update clip with job ID
    await supabase
      .from("clips")
      .update({
        shotstack_job_id: shotstackJobId,
        shotstack_status: 'queued',
        status: 'processing',
        has_word_timestamps: captionSegments.some(s => s.words?.length > 0),
        source_cloudflare_url: sourceVideoUrl,
        enable_certification: enableCertification,
      })
      .eq("id", clipId);

    // Create AI job record for tracking
    await supabase
      .from("ai_jobs")
      .insert({
        user_id: user.id,
        job_type: 'clips_generation',
        engine: 'shotstack',
        params: {
          clip_id: clipId,
          duration,
          orientation,
          caption_segments: captionSegments.length,
          has_word_timestamps: captionSegments.some(s => s.words?.length > 0),
        },
        status: 'processing',
        started_at: new Date().toISOString(),
      });

    console.log("=== RENDER SUBMITTED SUCCESSFULLY ===");

    return new Response(
      JSON.stringify({
        success: true,
        clipId,
        shotstackJobId,
        status: 'processing',
        captionSegments: captionSegments.length,
        hasWordTimestamps: captionSegments.some(s => s.words?.length > 0),
        message: 'Clip rendering with dynamic captions',
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("❌ Render error:", error);

    // Update clip status on error
    if (clipId) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      );
      
      await supabase
        .from("clips")
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : String(error),
        })
        .eq("id", clipId);
    }

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

/**
 * Generate simple caption segments from plain text
 */
function generateSimpleSegments(text: string, totalDuration: number): any[] {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  if (words.length === 0) return [];

  const segments: any[] = [];
  const wordsPerSegment = 4;
  const segmentDuration = totalDuration / Math.ceil(words.length / wordsPerSegment);

  let currentTime = 0;
  for (let i = 0; i < words.length; i += wordsPerSegment) {
    const segmentWords = words.slice(i, i + wordsPerSegment);
    const start = currentTime;
    const end = Math.min(currentTime + segmentDuration, totalDuration);

    // Create word timestamps (evenly spaced)
    const wordDuration = (end - start) / segmentWords.length;
    const wordTimestamps = segmentWords.map((word, idx) => ({
      word,
      start: start + idx * wordDuration,
      end: start + (idx + 1) * wordDuration,
    }));

    segments.push({
      text: segmentWords.join(' '),
      words: wordTimestamps,
      start,
      end,
      highlightWord: segmentWords.length > 2 ? segmentWords[Math.floor(segmentWords.length / 2)] : undefined,
    });

    currentTime = end;
  }

  return segments;
}

/**
 * Build Shotstack render payload with dynamic captions
 * (Inline version - same logic as dynamic-captions.ts)
 */
function buildCaptionedRenderPayload(
  videoUrl: string,
  duration: number,
  segments: any[],
  options: {
    orientation?: 'vertical' | 'horizontal';
    style?: any;
    useHtmlCaptions?: boolean;
    callbackUrl?: string;
    title?: string;
    enableWatermark?: boolean;
    watermarkUrl?: string;
  } = {}
): any {
  const {
    orientation = 'vertical',
    style = {},
    useHtmlCaptions = true,
    callbackUrl,
    title,
    enableWatermark = false,
    watermarkUrl,
  } = options;

  const isVertical = orientation === 'vertical';
  const resolution = isVertical ? { width: 1080, height: 1920 } : { width: 1920, height: 1080 };

  const DEFAULT_STYLE = {
    fontFamily: 'Montserrat ExtraBold',
    fontSize: 42,
    fontColor: '#FFFFFF',
    highlightColor: '#FFFF00',
    position: 'bottom',
    animation: 'pop',
    ...style,
  };

  // Build tracks
  const tracks: any[] = [];

  // Track 1: Main video
  tracks.push({
    clips: [
      {
        asset: {
          type: 'video',
          src: videoUrl,
        },
        start: 0,
        length: duration,
        fit: 'crop',
      },
    ],
  });

  // Track 2: Caption segments
  if (segments.length > 0) {
    const captionClips: any[] = [];
    
    for (const segment of segments) {
      if (useHtmlCaptions && segment.words?.length > 0) {
        // Word-by-word animated captions
        for (let i = 0; i < segment.words.length; i++) {
          const word = segment.words[i];
          
          captionClips.push({
            asset: {
              type: 'html',
              html: generateCaptionHTML(segment.words, i, DEFAULT_STYLE),
              width: 1080,
              height: 200,
              background: 'transparent',
            },
            start: word.start,
            length: Math.max(0.1, word.end - word.start + 0.05),
            position: DEFAULT_STYLE.position,
            offset: { x: 0, y: DEFAULT_STYLE.position === 'bottom' ? -0.15 : 0 },
          });
        }
      } else {
        // Simple segment caption
        captionClips.push({
          asset: {
            type: 'title',
            text: segment.text.toUpperCase(),
            style: 'subtitle',
            size: 'medium',
            position: DEFAULT_STYLE.position,
            color: DEFAULT_STYLE.fontColor,
            background: 'rgba(0,0,0,0.6)',
          },
          start: segment.start,
          length: segment.end - segment.start,
        });
      }
    }

    if (captionClips.length > 0) {
      tracks.push({ clips: captionClips });
    }
  }

  // Track 3: Title (optional)
  if (title) {
    tracks.push({
      clips: [
        {
          asset: {
            type: 'title',
            text: title,
            style: 'chunk',
            size: 'medium',
            position: 'top',
            color: '#FFFFFF',
            background: '#8B5CF6',
          },
          start: 0,
          length: Math.min(3, duration),
          transition: { in: 'fade', out: 'fade' },
        },
      ],
    });
  }

  // Track 4: Watermark (optional)
  if (enableWatermark && watermarkUrl) {
    tracks.push({
      clips: [
        {
          asset: {
            type: 'image',
            src: watermarkUrl,
          },
          start: 0,
          length: duration,
          position: 'bottomRight',
          offset: { x: -0.02, y: 0.02 },
          scale: 0.15,
          opacity: 0.7,
        },
      ],
    });
  }

  const payload: any = {
    timeline: {
      tracks,
      background: '#000000',
    },
    output: {
      format: 'mp4',
      fps: 30,
      size: resolution,
      aspectRatio: isVertical ? '9:16' : '16:9',
      quality: 'high',
    },
  };

  if (callbackUrl) {
    payload.callback = callbackUrl;
  }

  return payload;
}

/**
 * Generate HTML for animated caption with current word highlighted
 */
function generateCaptionHTML(words: any[], currentIndex: number, style: any): string {
  const wordSpans = words.map((word: any, idx: number) => {
    if (idx > currentIndex) {
      return `<span style="opacity: 0;">${escapeHtml(word.word)}</span>`;
    } else if (idx === currentIndex) {
      return `<span style="
        color: ${style.highlightColor};
        transform: scale(1.1);
        display: inline-block;
        text-shadow: 0 0 20px ${style.highlightColor}40;
      ">${escapeHtml(word.word)}</span>`;
    } else {
      return `<span style="color: ${style.fontColor};">${escapeHtml(word.word)}</span>`;
    }
  });

  return `<!DOCTYPE html>
<html>
<head>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@800&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      font-family: 'Montserrat', sans-serif;
      font-size: ${style.fontSize}px;
      font-weight: 800;
      text-align: center;
      line-height: 1.3;
      padding: 10px 30px;
      overflow: hidden;
    }
    .caption {
      max-width: 100%;
      word-wrap: break-word;
      overflow-wrap: break-word;
      white-space: normal;
      text-shadow: 
        2px 2px 0 #000,
        -2px -2px 0 #000,
        2px -2px 0 #000,
        -2px 2px 0 #000,
        0 4px 8px rgba(0,0,0,0.5);
      word-spacing: 0.05em;
    }
  </style>
</head>
<body>
  <div class="caption">${wordSpans.join(' ')}</div>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
