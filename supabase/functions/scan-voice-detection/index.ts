import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Scan Voice Detection Edge Function
 * 
 * Triggered by internal content events (Studio recordings, Meeting recordings, Advertiser uploads)
 * or scheduled jobs for external platform monitoring.
 * 
 * Workflow:
 * 1. Receive content metadata (source_id, source_url, source_type, platform)
 * 2. Load audio from source
 * 3. For each active voice_fingerprint, run detection
 * 4. Log detections to voice_detections table
 * 
 * PLACEHOLDER: Replace mock detection with real AI voice matching service
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { 
      sourceId, 
      sourceUrl, 
      sourceTitle, 
      sourceType, 
      platform,
      userId, // Optional: if scanning for specific user
    } = await req.json();

    if (!sourceId || !sourceUrl || !platform) {
      throw new Error('Missing required fields: sourceId, sourceUrl, platform');
    }

    console.log('[Scan Voice Detection] Processing:', { sourceId, platform, sourceType });

    // Get all active voice fingerprints to scan against
    let fingerprintsQuery = supabaseClient
      .from('voice_fingerprints')
      .select('*')
      .eq('status', 'active');

    if (userId) {
      fingerprintsQuery = fingerprintsQuery.eq('user_id', userId);
    }

    const { data: fingerprints, error: fingerprintError } = await fingerprintsQuery;

    if (fingerprintError) {
      throw fingerprintError;
    }

    if (!fingerprints || fingerprints.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'No active voice fingerprints to scan',
          detectionsCreated: 0,
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    console.log(`[Scan Voice Detection] Scanning against ${fingerprints.length} voice fingerprints`);

    // PLACEHOLDER: Load and normalize audio
    // In production, this would:
    // 1. Download audio from sourceUrl
    // 2. Convert to standard format (16kHz mono PCM)
    // 3. Extract audio features/embeddings

    const detections = [];

    // Scan each fingerprint
    for (const fingerprint of fingerprints) {
      // PLACEHOLDER: Real voice matching
      // Would call AI service to compare audio against fingerprint
      // For now, simulate with random detection
      const mockDetected = Math.random() > 0.7; // 30% detection rate for testing
      
      if (mockDetected) {
        const confidence = 0.85 + Math.random() * 0.14; // 85-99%
        const firstSpokenAt = 30 + Math.random() * 120; // Random start
        
        // Determine usage category based on source type
        let usageCategory = 'unknown';
        if (sourceType === 'ad' || sourceType === 'advertiser_upload') {
          usageCategory = 'ad_read';
        } else if (sourceType === 'podcast_episode') {
          usageCategory = 'narration';
        } else if (sourceType === 'video' || sourceType === 'live_stream') {
          usageCategory = 'appearance';
        }

        // Create detection record
        const { data: detection, error: detectionError } = await supabaseClient
          .from('voice_detections')
          .insert({
            user_id: fingerprint.user_id,
            voice_fingerprint_id: fingerprint.id,
            platform,
            source_type: sourceType,
            source_id: sourceId,
            source_title: sourceTitle,
            source_url: sourceUrl,
            first_spoken_at_sec: firstSpokenAt,
            confidence,
            usage_category: usageCategory,
            status: 'unreviewed',
            raw_metadata: {
              scan_timestamp: new Date().toISOString(),
              detection_method: 'mock', // Would be 'elevenlabs', 'whisper', etc.
              source_duration: 300, // Mock duration
            },
          })
          .select()
          .single();

        if (detectionError) {
          console.error('Error creating detection:', detectionError);
          continue;
        }

        detections.push(detection);
        console.log(`[Scan Voice Detection] Detection created for user ${fingerprint.user_id}`);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        detectionsCreated: detections.length,
        detections,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('[Scan Voice Detection] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
