import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * RECONCILIATION JOB
 * 
 * Fetches calls from ElevenLabs API, finds calls with booking intent but no lead,
 * and rebuilds missing leads. Designed to run nightly.
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const elevenLabsApiKey = Deno.env.get('ELEVENLABS_API_KEY');
  const agentId = Deno.env.get('ELEVENLABS_JESS_AGENT_ID');

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('=== ELEVENLABS CALL RECONCILIATION ===');

  if (!elevenLabsApiKey || !agentId) {
    return new Response(JSON.stringify({
      ok: false,
      error: 'Missing ELEVENLABS_API_KEY or ELEVENLABS_AGENT_ID',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Parse request body for options
    let hoursBack = 24;
    try {
      const body = await req.json();
      if (body.hours_back) hoursBack = parseInt(body.hours_back);
    } catch {
      // Use default
    }

    console.log(`Reconciling calls from last ${hoursBack} hours`);

    // Fetch conversations from ElevenLabs
    const startDate = new Date();
    startDate.setHours(startDate.getHours() - hoursBack);

    const url = new URL('https://api.elevenlabs.io/v1/convai/conversations');
    url.searchParams.set('agent_id', agentId);
    url.searchParams.set('page_size', '100');

    const response = await fetch(url.toString(), {
      headers: {
        'xi-api-key': elevenLabsApiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const conversations = data.conversations || [];
    
    console.log(`Fetched ${conversations.length} conversations from ElevenLabs`);

    let reconciled = 0;
    let leadsCreated = 0;
    let callLogsCreated = 0;
    let summariesUpdated = 0;

    for (const conv of conversations) {
      const convId = conv.conversation_id;
      
      // Check if call log exists and needs summary update
      const { data: existingCallLog } = await supabase
        .from('trucking_call_logs')
        .select('id, summary')
        .eq('elevenlabs_conversation_id', convId)
        .maybeSingle();

      // If call log exists but has no summary, fetch and update it
      if (existingCallLog && !existingCallLog.summary) {
        const detailResponse = await fetch(
          `https://api.elevenlabs.io/v1/convai/conversations/${convId}`,
          { headers: { 'xi-api-key': elevenLabsApiKey } }
        );

        if (detailResponse.ok) {
          const detail = await detailResponse.json();
          
          // Log the full structure to find where summary is located
          console.log(`=== DETAIL FOR ${convId} ===`);
          console.log('Top-level keys:', Object.keys(detail));
          console.log('Analysis keys:', Object.keys(detail.analysis || {}));
          if (detail.analysis?.evaluation_criteria_results) {
            console.log('Evaluation criteria keys:', Object.keys(detail.analysis.evaluation_criteria_results));
          }
          // Log actual values for summary-related fields
          console.log('detail.analysis?.summary:', detail.analysis?.summary);
          console.log('detail.analysis?.call_summary:', detail.analysis?.call_summary);
          console.log('detail.analysis?.transcript_summary:', detail.analysis?.transcript_summary);
          console.log('detail.summary:', detail.summary);
          console.log('detail.conversation_summary:', detail.conversation_summary);
          
          // Try multiple possible summary field names - ElevenLabs uses various structures
          const summary = detail.analysis?.summary || 
                         detail.analysis?.call_summary ||
                         detail.analysis?.transcript_summary ||
                         detail.analysis?.evaluation_criteria_results?.call_summary ||
                         detail.analysis?.evaluation_criteria_results?.summary ||
                         detail.analysis?.agent_response_summary ||
                         detail.metadata?.summary ||
                         detail.conversation_summary ||
                         detail.summary ||
                         detail.output?.summary ||
                         (detail.analysis?.data_collection_results ? 
                           `Call with ${detail.analysis.data_collection_results.company_name || 'carrier'}. Outcome: ${detail.analysis.call_successful ? 'Successful' : 'Unknown'}` : 
                           null);
          
          console.log('Extracted summary:', summary ? summary.substring(0, 100) : 'null');
          
          if (summary) {
            await supabase
              .from('trucking_call_logs')
              .update({ summary })
              .eq('id', existingCallLog.id);
            summariesUpdated++;
            console.log(`Updated summary for call log: ${existingCallLog.id}`);
          } else {
            console.log(`No summary found for ${convId} - check ElevenLabs agent settings`);
          }
        }
        continue; // Skip to next conversation
      }

      // Check if we already have this in webhook_events
      const { data: existingEvent } = await supabase
        .from('trucking_webhook_events')
        .select('id, processing_status')
        .eq('elevenlabs_conversation_id', convId)
        .maybeSingle();

      if (!existingEvent) {
        console.log(`Missing webhook event for conversation: ${convId}`);
        
        // Fetch full conversation details
        const detailResponse = await fetch(
          `https://api.elevenlabs.io/v1/convai/conversations/${convId}`,
          {
            headers: { 'xi-api-key': elevenLabsApiKey },
          }
        );

        if (!detailResponse.ok) {
          console.error(`Failed to fetch details for ${convId}`);
          continue;
        }

        const detail = await detailResponse.json();
        
        // Extract caller phone - CRITICAL for recovery
        const callerPhone = detail.metadata?.phone_number || 
                           detail.metadata?.caller_id ||
                           detail.phone_call?.from_number ||
                           null;

        // Create webhook event for this missed call
        await supabase
          .from('trucking_webhook_events')
          .insert({
            elevenlabs_conversation_id: convId,
            event_type: 'reconciled',
            raw_payload: detail,
            received_at: new Date().toISOString(),
            processing_status: 'pending',
          });

        console.log(`Created webhook event for reconciled call: ${convId}`);
        reconciled++;

        // Check for booking intent indicators in transcript
        const hasBookingIntent = detectBookingIntent(detail);
        
        // Check if call log exists
        const { data: existingCallLog } = await supabase
          .from('trucking_call_logs')
          .select('id, lead_id, summary')
          .eq('elevenlabs_conversation_id', convId)
          .maybeSingle();

        // Get summary from ElevenLabs analysis
        const summary = detail.analysis?.summary || 
                       detail.analysis?.call_summary ||
                       detail.metadata?.summary ||
                       null;

        if (existingCallLog) {
          // Update existing call log if summary is missing
          if (!existingCallLog.summary && summary) {
            await supabase
              .from('trucking_call_logs')
              .update({ summary })
              .eq('id', existingCallLog.id);
            console.log(`Updated summary for existing call log: ${existingCallLog.id}`);
          }
        } else if (callerPhone) {
          // Create call log
          const { data: ownerData } = await supabase
            .from('trucking_loads')
            .select('owner_id')
            .limit(1)
            .single();
          const ownerId = ownerData?.owner_id || '';
          
          const callLogData = {
            owner_id: ownerId,
            carrier_phone: callerPhone,
            call_direction: detail.phone_call?.direction || 'inbound',
            call_started_at: detail.start_time || detail.metadata?.start_time || new Date().toISOString(),
            call_ended_at: detail.end_time || detail.metadata?.end_time || null,
            duration_seconds: detail.metadata?.call_duration_secs || 0,
            elevenlabs_conversation_id: convId,
            elevenlabs_agent_id: agentId,
            call_status: detail.status || 'completed',
            ended_reason: detail.metadata?.ended_reason || null,
            twilio_call_sid: detail.phone_call?.twilio_call_sid || null,
            twilio_stream_sid: detail.phone_call?.twilio_stream_sid || null,
            receiver_number: detail.phone_call?.to_number || null,
            call_cost_credits: detail.metadata?.cost_credits || null,
            llm_cost_usd_total: detail.metadata?.llm_cost_usd || null,
            summary: summary || 'Reconciled from ElevenLabs',
            source: 'reconciliation',
            post_call_webhook_status: 'missed',
            post_call_webhook_error: 'Webhook not received - recovered via reconciliation',
          };

          const { data: newCallLog, error: callLogError } = await supabase
            .from('trucking_call_logs')
            .insert(callLogData)
            .select()
            .single();

          if (!callLogError && newCallLog) {
            callLogsCreated++;
            console.log(`Created call log for ${convId}: ${newCallLog.id}`);

            // If booking intent detected and no lead exists, create lead
            if (hasBookingIntent && callerPhone) {
              const leadData = {
                owner_id: ownerId,
                phone: callerPhone,
                company_name: detail.analysis?.data_collection?.company_name || 'Unknown (Reconciled)',
                mc_number: detail.analysis?.data_collection?.mc_number || null,
                source: 'ai_voice_agent_reconciled',
                status: 'new',
                requires_callback: true,
                notes: `[Reconciled from ElevenLabs] Call ID: ${convId}. Booking intent detected but no lead was created during the call. Manual follow-up required.`,
                call_log_id: newCallLog.id,
              };

              const { data: newLead, error: leadError } = await supabase
                .from('trucking_carrier_leads')
                .insert(leadData)
                .select()
                .single();

              if (!leadError && newLead) {
                leadsCreated++;
                console.log(`Created lead for ${convId}: ${newLead.id}`);

                // Update call log with lead reference
                await supabase
                  .from('trucking_call_logs')
                  .update({ lead_id: newLead.id })
                  .eq('id', newCallLog.id);
              }
            }
          }
        }
      }
    }

    console.log(`Reconciliation complete: ${reconciled} reconciled, ${callLogsCreated} call logs, ${leadsCreated} leads, ${summariesUpdated} summaries updated`);

    return new Response(JSON.stringify({
      ok: true,
      conversations_checked: conversations.length,
      reconciled,
      call_logs_created: callLogsCreated,
      leads_created: leadsCreated,
      summaries_updated: summariesUpdated,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Reconciliation error:', error);
    return new Response(JSON.stringify({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper to detect booking intent from call details
function detectBookingIntent(detail: Record<string, unknown>): boolean {
  const analysis = detail.analysis as Record<string, unknown> | undefined;
  const transcript = (analysis?.transcript as string) || '';
  const summary = (analysis?.summary as string) || '';
  
  const bookingPhrases = [
    "i'll take it", 'book it', 'confirm', 'sounds good', "let's do it",
    'i want it', "i'm interested", 'sign me up', 'callback', 'call me back',
    'have dispatch call', 'speak to dispatch', 'talk to dispatch',
    'interested in the load', 'want to book'
  ];

  const lowerText = (transcript + ' ' + summary).toLowerCase();
  
  return bookingPhrases.some(phrase => lowerText.includes(phrase));
}

