import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, elevenlabs-signature, x-elevenlabs-signature',
};

/**
 * RELIABLE WEBHOOK INGESTION WITH AUTO LEAD CREATION
 * 
 * This function:
 * 1. Stores raw payload IMMEDIATELY
 * 2. Creates a pending lead notification if phone number exists
 * 3. Returns HTTP 200 fast
 * 4. Processes asynchronously (waitUntil)
 * 5. Uses upsert with conversation_id as unique key
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  let rawPayload: string = '';
  let conversationId: string | null = null;

  try {
    // Get raw body
    rawPayload = await req.text();
    const body = JSON.parse(rawPayload);
    
    console.log('=== WEBHOOK INGEST RECEIVED ===');
    
    // Extract conversation_id from multiple possible locations
    const params = body.parameters || body;
    const callData = body.call || params.call || {};
    
    conversationId = body.conversation_id || 
                     params.conversation_id || 
                     callData.conversation_id ||
                     body.call_id || 
                     params.call_id ||
                     callData.call_id ||
                     null;
    
    // Extract caller phone - CRITICAL: always persist this
    const callerPhone = body.caller_number || params.caller_number || params.callback_phone || 
                        params.contact_number || params.phone || callData.from_number || 
                        callData.caller_id || callData.phone_number || null;
    
    // Extract receiver phone (the AITrucking number)
    const receiverPhone = body.receiver_number || params.receiver_number || 
                          callData.to_number || callData.called_number || null;
    
    // Extract summary and transcript
    const summary = body.analysis?.summary || body.summary || params.summary || null;
    const transcript = body.transcript || params.transcript || null;
    
    // Extract Twilio identifiers
    const callSid = body.call_sid || params.call_sid || callData.call_sid || null;
    const streamSid = body.stream_sid || params.stream_sid || callData.stream_sid || null;
    
    console.log('Conversation ID:', conversationId);
    console.log('Caller Phone:', callerPhone);
    console.log('Receiver Phone:', receiverPhone);
    console.log('Has Summary:', !!summary);
    console.log('Has Transcript:', !!transcript);
    
    if (!conversationId) {
      // Generate a fallback ID to avoid losing data
      conversationId = `unknown_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log('Generated fallback conversation ID:', conversationId);
    }

    // STEP 1: Store raw payload IMMEDIATELY using upsert
    const { data: webhookEvent, error: insertError } = await supabase
      .from('trucking_webhook_events')
      .upsert({
        elevenlabs_conversation_id: conversationId,
        event_type: 'post_call',
        raw_payload: body,
        received_at: new Date().toISOString(),
        processing_status: 'pending',
        processing_attempts: 0,
      }, {
        onConflict: 'elevenlabs_conversation_id',
        ignoreDuplicates: false,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to store webhook event:', insertError);
      // Even on error, return 200 to prevent ElevenLabs from retrying
      return new Response(JSON.stringify({ 
        received: true, 
        stored: false, 
        error: insertError.message 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Webhook event stored:', webhookEvent.id);

    // STEP 2: AUTO-CREATE PENDING LEAD NOTIFICATION if caller phone exists
    // This is the critical piece that enables real-time lead notifications
    let leadNotificationId: string | null = null;
    
    if (callerPhone) {
      console.log('=== AUTO-CREATING PENDING LEAD NOTIFICATION ===');
      
      // Try to find the agency based on the receiver phone number
      // The receiver phone is the AITrucking line which belongs to an agency
      let agencyId: string | null = null;
      let ownerId: string | null = null;
      
      // Look up agency by phone number in trucking_ai_phone_numbers table
      const { data: phoneMapping } = await supabase
        .from('trucking_ai_phone_numbers')
        .select('agency_id')
        .eq('phone_number', receiverPhone)
        .maybeSingle();
      
      if (phoneMapping) {
        agencyId = phoneMapping.agency_id;
        console.log('Found agency from phone mapping:', agencyId);
      } else {
        // Fallback: Get the first/default agency (for single-tenant setups)
        const { data: defaultAgency } = await supabase
          .from('agencies')
          .select('id, owner_id')
          .limit(1)
          .maybeSingle();
        
        if (defaultAgency) {
          agencyId = defaultAgency.id;
          ownerId = defaultAgency.owner_id;
          console.log('Using default agency:', agencyId);
        }
      }
      
      // Create the lead notification using upsert to avoid duplicates
      const { data: notification, error: notifError } = await supabase
        .from('trucking_lead_notifications')
        .upsert({
          conversation_id: conversationId,
          agency_id: agencyId,
          owner_id: ownerId,
          caller_number: callerPhone,
          receiver_number: receiverPhone,
          summary: summary,
          transcript: typeof transcript === 'string' ? transcript : JSON.stringify(transcript),
          call_sid: callSid,
          stream_sid: streamSid,
          source: 'elevenlabs',
          status: 'pending',
        }, {
          onConflict: 'conversation_id',
          ignoreDuplicates: false,
        })
        .select()
        .single();
      
      if (notifError) {
        console.error('Failed to create lead notification:', notifError);
      } else if (notification) {
        leadNotificationId = notification.id;
        console.log('Lead notification created:', notification.id);
        console.log('This will trigger realtime update to Chrome extension');
      }
    } else {
      console.log('No caller phone number - skipping lead notification');
    }

    // STEP 3: Return 200 immediately
    const response = new Response(JSON.stringify({ 
      received: true, 
      stored: true,
      event_id: webhookEvent.id,
      conversation_id: conversationId,
      lead_notification_id: leadNotificationId,
      has_phone: !!callerPhone,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

    // STEP 4: Process asynchronously using waitUntil
    const processAsync = async () => {
      try {
        console.log('Starting async processing for:', conversationId);
        
        // Call the existing ai-trucking-call-complete function
        const processResult = await fetch(`${supabaseUrl}/functions/v1/ai-trucking-call-complete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: rawPayload,
        });

        const processData = await processResult.json();
        console.log('Process result:', JSON.stringify(processData, null, 2));

        // Update webhook event with processing result
        const updateData: Record<string, unknown> = {
          processed_at: new Date().toISOString(),
          processing_status: processData.ok ? 'success' : 'failed',
          processing_attempts: webhookEvent.processing_attempts + 1,
          last_attempt_at: new Date().toISOString(),
        };

        if (processData.call_log_id) {
          updateData.call_log_id = processData.call_log_id;
        }
        if (processData.error) {
          updateData.last_error = processData.error;
        }

        await supabase
          .from('trucking_webhook_events')
          .update(updateData)
          .eq('id', webhookEvent.id);

        // Also update the call log with webhook status
        if (processData.call_log_id) {
          await supabase
            .from('trucking_call_logs')
            .update({
              webhook_event_id: webhookEvent.id,
              post_call_webhook_status: 'success',
            })
            .eq('id', processData.call_log_id);
          
          // Update the lead notification with the lead_id if one was created
          if (leadNotificationId) {
            // Check if a lead was created from this call
            const { data: callLog } = await supabase
              .from('trucking_call_logs')
              .select('lead_id')
              .eq('id', processData.call_log_id)
              .maybeSingle();
            
            if (callLog?.lead_id) {
              await supabase
                .from('trucking_lead_notifications')
                .update({ 
                  lead_id: callLog.lead_id,
                  status: 'processed'
                })
                .eq('id', leadNotificationId);
              
              console.log('Updated lead notification with lead_id:', callLog.lead_id);
            }
          }
        }

        console.log('Async processing complete for:', conversationId);

      } catch (processError) {
        console.error('Async processing error:', processError);
        
        // Update webhook event with error
        await supabase
          .from('trucking_webhook_events')
          .update({
            processing_status: 'failed',
            processing_attempts: webhookEvent.processing_attempts + 1,
            last_attempt_at: new Date().toISOString(),
            last_error: processError instanceof Error ? processError.message : 'Unknown error',
          })
          .eq('id', webhookEvent.id);
      }
    };

    // Use waitUntil if available (Supabase Edge Runtime)
    if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
      EdgeRuntime.waitUntil(processAsync());
    } else {
      // Fallback: fire and forget
      processAsync().catch(console.error);
    }

    return response;

  } catch (error) {
    console.error('Webhook ingest error:', error);
    
    // Try to store even failed payloads
    try {
      await supabase
        .from('trucking_webhook_events')
        .insert({
          elevenlabs_conversation_id: conversationId || `error_${Date.now()}`,
          event_type: 'post_call_error',
          raw_payload: { raw_text: rawPayload, parse_error: error instanceof Error ? error.message : 'Unknown' },
          received_at: new Date().toISOString(),
          processing_status: 'error',
          last_error: error instanceof Error ? error.message : 'Unknown error',
        });
    } catch (storeError) {
      console.error('Failed to store error event:', storeError);
    }

    // Always return 200 to prevent retries
    return new Response(JSON.stringify({ 
      received: true, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Declare EdgeRuntime for TypeScript
declare const EdgeRuntime: {
  waitUntil: (promise: Promise<unknown>) => void;
} | undefined;
