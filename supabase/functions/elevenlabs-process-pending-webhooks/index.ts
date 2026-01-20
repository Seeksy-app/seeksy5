import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_RETRIES = 5;
const BACKOFF_MINUTES = [1, 5, 15, 60, 240]; // Exponential backoff

/**
 * RETRY WORKER
 * 
 * Processes failed/pending webhook events with exponential backoff.
 * Should be called periodically (e.g., every 5 minutes via cron).
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('=== PROCESSING PENDING WEBHOOKS ===');

  try {
    // Find events that need processing
    // - Status is pending or failed
    // - Haven't exceeded max retries
    // - Enough time has passed since last attempt (backoff)
    const { data: pendingEvents, error: fetchError } = await supabase
      .from('trucking_webhook_events')
      .select('*')
      .in('processing_status', ['pending', 'failed'])
      .lt('processing_attempts', MAX_RETRIES)
      .order('received_at', { ascending: true })
      .limit(50);

    if (fetchError) {
      throw fetchError;
    }

    console.log(`Found ${pendingEvents?.length || 0} pending events`);

    let processed = 0;
    let succeeded = 0;
    let failed = 0;

    for (const event of pendingEvents || []) {
      // Check backoff
      if (event.last_attempt_at) {
        const backoffMinutes = BACKOFF_MINUTES[Math.min(event.processing_attempts, BACKOFF_MINUTES.length - 1)];
        const nextAttemptTime = new Date(event.last_attempt_at);
        nextAttemptTime.setMinutes(nextAttemptTime.getMinutes() + backoffMinutes);
        
        if (new Date() < nextAttemptTime) {
          console.log(`Skipping ${event.id} - in backoff until ${nextAttemptTime.toISOString()}`);
          continue;
        }
      }

      console.log(`Processing event ${event.id} (attempt ${event.processing_attempts + 1})`);
      processed++;

      try {
        // Re-process the webhook payload
        const processResult = await fetch(`${supabaseUrl}/functions/v1/ai-trucking-call-complete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify(event.raw_payload),
        });

        const processData = await processResult.json();
        console.log(`Event ${event.id} result:`, processData.ok ? 'success' : 'failed');

        // Update event
        const updateData: Record<string, unknown> = {
          processing_attempts: event.processing_attempts + 1,
          last_attempt_at: new Date().toISOString(),
        };

        if (processData.ok) {
          updateData.processing_status = 'success';
          updateData.processed_at = new Date().toISOString();
          if (processData.call_log_id) {
            updateData.call_log_id = processData.call_log_id;
          }
          succeeded++;
        } else {
          updateData.processing_status = 'failed';
          updateData.last_error = processData.error || 'Processing returned ok: false';
          failed++;
        }

        await supabase
          .from('trucking_webhook_events')
          .update(updateData)
          .eq('id', event.id);

        // Update call log if created
        if (processData.call_log_id) {
          await supabase
            .from('trucking_call_logs')
            .update({
              webhook_event_id: event.id,
              post_call_webhook_status: processData.ok ? 'success' : 'failed',
              post_call_webhook_error: processData.error || null,
            })
            .eq('id', processData.call_log_id);
        }

      } catch (processError) {
        console.error(`Error processing event ${event.id}:`, processError);
        failed++;
        
        await supabase
          .from('trucking_webhook_events')
          .update({
            processing_status: event.processing_attempts + 1 >= MAX_RETRIES ? 'max_retries_exceeded' : 'failed',
            processing_attempts: event.processing_attempts + 1,
            last_attempt_at: new Date().toISOString(),
            last_error: processError instanceof Error ? processError.message : 'Unknown error',
          })
          .eq('id', event.id);
      }
    }

    console.log(`Processing complete: ${processed} processed, ${succeeded} succeeded, ${failed} failed`);

    return new Response(JSON.stringify({
      ok: true,
      processed,
      succeeded,
      failed,
      total_pending: pendingEvents?.length || 0,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Pending webhook processor error:', error);
    return new Response(JSON.stringify({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
