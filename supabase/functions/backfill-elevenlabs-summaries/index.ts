import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Backfill summaries for existing call logs from ElevenLabs API
 * 
 * This function:
 * 1. Finds call logs with elevenlabs_conversation_id but no summary
 * 2. Fetches the conversation details from ElevenLabs API
 * 3. Extracts the summary from the analysis object
 * 4. Updates the call log with the summary
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body for optional limit
    let limit = 50;
    try {
      const body = await req.json();
      if (body.limit) limit = Math.min(body.limit, 100);
    } catch {
      // Use default limit
    }

    console.log('=== BACKFILL ELEVENLABS SUMMARIES ===');
    console.log('Limit:', limit);

    // Find call logs with conversation_id but no summary
    const { data: callLogs, error: fetchError } = await supabase
      .from('trucking_call_logs')
      .select('id, elevenlabs_conversation_id')
      .not('elevenlabs_conversation_id', 'is', null)
      .or('summary.is.null,summary.eq.')
      .order('call_started_at', { ascending: false })
      .limit(limit);

    if (fetchError) {
      throw fetchError;
    }

    console.log(`Found ${callLogs?.length || 0} call logs to backfill`);

    const results = {
      processed: 0,
      updated: 0,
      failed: 0,
      skipped: 0,
      details: [] as Array<{ id: string; status: string; summary_preview?: string }>,
    };

    for (const callLog of callLogs || []) {
      results.processed++;
      
      try {
        console.log(`Processing call log ${callLog.id} with conversation ${callLog.elevenlabs_conversation_id}`);
        
        const convResponse = await fetch(
          `https://api.elevenlabs.io/v1/convai/conversations/${callLog.elevenlabs_conversation_id}`,
          {
            headers: {
              'xi-api-key': ELEVENLABS_API_KEY,
            },
          }
        );

        if (!convResponse.ok) {
          console.warn(`Failed to fetch conversation ${callLog.elevenlabs_conversation_id}: ${convResponse.status}`);
          results.failed++;
          results.details.push({ id: callLog.id, status: `api_error_${convResponse.status}` });
          continue;
        }

        const convData = await convResponse.json();
        
        // Extract summary from analysis object
        let summary = null;
        if (convData.analysis) {
          summary = convData.analysis.call_successful_summary || 
                   convData.analysis.summary || 
                   convData.analysis.transcript_summary ||
                   null;
        }

        if (!summary) {
          console.log(`No summary found for conversation ${callLog.elevenlabs_conversation_id}`);
          results.skipped++;
          results.details.push({ id: callLog.id, status: 'no_summary_in_api' });
          continue;
        }

        // Update the call log with the summary
        const { error: updateError } = await supabase
          .from('trucking_call_logs')
          .update({ summary })
          .eq('id', callLog.id);

        if (updateError) {
          console.error(`Failed to update call log ${callLog.id}:`, updateError);
          results.failed++;
          results.details.push({ id: callLog.id, status: 'update_failed' });
        } else {
          console.log(`Updated call log ${callLog.id} with summary`);
          results.updated++;
          results.details.push({ 
            id: callLog.id, 
            status: 'updated', 
            summary_preview: summary.substring(0, 100) + '...' 
          });
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (err) {
        console.error(`Error processing call log ${callLog.id}:`, err);
        results.failed++;
        results.details.push({ id: callLog.id, status: 'error' });
      }
    }

    console.log('Backfill complete:', results);

    return new Response(JSON.stringify({
      success: true,
      results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Backfill error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
