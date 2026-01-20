import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, elevenlabs-signature',
};

// HMAC signature verification for ElevenLabs webhooks
async function verifyHmacSignature(payload: string, signature: string | null, secret: string | null): Promise<{ valid: boolean; skipped: boolean }> {
  if (!secret) {
    console.log('No ELEVENLABS_WEBHOOK_SECRET configured, skipping HMAC verification');
    return { valid: true, skipped: true };
  }
  if (!signature) {
    // Allow webhook without signature but log warning - ElevenLabs may not always send signatures
    console.warn('No ElevenLabs-Signature header provided - processing anyway for backwards compatibility');
    return { valid: true, skipped: true };
  }
  
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
    const expectedSignature = Array.from(new Uint8Array(sig))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // ElevenLabs may send signature with or without prefix
    const cleanSignature = signature.replace(/^sha256=/, '').toLowerCase();
    const isValid = cleanSignature === expectedSignature.toLowerCase();
    
    console.log('HMAC verification:', isValid ? 'PASSED' : 'FAILED');
    return { valid: isValid, skipped: false };
  } catch (err) {
    console.error('HMAC verification error:', err);
    return { valid: false, skipped: false };
  }
}

// CEI Scoring Rules - Base Score and Event-Based Adjustments
const CEI_BASE_SCORE = 100;

// Event-based penalties (from transcript analysis)
const CEI_PENALTIES: Record<string, number> = {
  dispatch_requested: -25,
  human_requested: -25,
  repeat_human_request: -20,
  impatience_phrase_detected: -15,
  confusion_correction_detected: -10,
  hard_frustration_detected: -15,
  load_lookup_failed: -10,
  lead_create_failed: -20,
};

// Event-based bonuses
const CEI_BONUSES: Record<string, number> = {
  caller_thanked: 5,
  booking_interest_confirmed: 10,
  call_resolved_without_handoff: 10,
  alternate_load_provided: 10,
  ai_verified_phone: 5,
  ai_repeated_info_correctly: 5,
  lead_created: 10,
  load_confirmed: 20,
};

// Duration-based CEI adjustments (calculated server-side)
function getDurationPenalty(durationSeconds: number | null): { penalty: number; reason: string | null } {
  if (durationSeconds === null || durationSeconds === undefined) {
    return { penalty: 0, reason: null };
  }
  if (durationSeconds < 30) {
    return { penalty: -40, reason: 'quick_hangup_under_30s' };
  }
  if (durationSeconds < 90) {
    return { penalty: -20, reason: 'short_call_30_to_90s' };
  }
  return { penalty: 0, reason: null }; // Calls > 90s get no penalty
}

// Early handoff penalty (handoff requested before 60 seconds)
function getEarlyHandoffPenalty(timeToHandoffSeconds: number | null): { penalty: number; reason: string | null } {
  if (timeToHandoffSeconds !== null && timeToHandoffSeconds < 60) {
    return { penalty: -25, reason: 'early_handoff_request_under_60s' };
  }
  return { penalty: 0, reason: null };
}

// Phrase detection lists
const PHRASE_LISTS = {
  dispatch_or_human_request: [
    'talk to dispatch', 'dispatch', 'real person', 'human', 'transfer me',
    'operator', 'dispatcher', 'let me talk to someone', 'speak to someone',
    'talk to a person', 'real agent'
  ],
  impatience: [
    'just tell me', 'get to the point', 'quick question', 'skip the details',
    "don't have time", 'hurry up', 'make it quick', 'come on'
  ],
  confusion_correction: [
    "that's not right", 'wrong', 'no i said', 'i already told you', 'not that',
    "that's incorrect", 'no no no', 'listen to me'
  ],
  hard_frustration: [
    'this is annoying', 'this is frustrating', 'forget it', 'waste of time',
    'never mind', 'ridiculous', 'useless', 'terrible'
  ],
  thanks: [
    'thank you', 'thanks', 'appreciate it', 'great', 'perfect', 'awesome'
  ],
  booking_interest: [
    "i'll take it", 'book it', 'confirm', 'sounds good', 'let\'s do it',
    'i want it', 'i\'m interested', 'sign me up'
  ]
};

function getCEIBand(score: number): string {
  if (score >= 90) return '90-100';
  if (score >= 75) return '75-89';
  if (score >= 50) return '50-74';
  if (score >= 25) return '25-49';
  return '0-24';
}

function analyzeTranscript(
  transcript: string | null,
  callDurationSeconds: number | null,
  leadCreated: boolean,
  loadConfirmed: boolean
): {
  events: Array<{ event_type: string; severity: string; source: string; phrase?: string; cei_delta: number }>;
  handoff_requested: boolean;
  handoff_reason: string | null;
  time_to_handoff_seconds: number | null;
  cei_score: number;
  cei_reasons: string[];
} {
  const events: Array<{ event_type: string; severity: string; source: string; phrase?: string; cei_delta: number }> = [];
  const cei_reasons: string[] = [];
  let cei_score = CEI_BASE_SCORE;
  let handoff_requested = false;
  let handoff_reason: string | null = null;
  let time_to_handoff_seconds: number | null = null;

  // Apply duration-based penalties FIRST (server-side calculation)
  const durationPenalty = getDurationPenalty(callDurationSeconds);
  if (durationPenalty.penalty !== 0) {
    cei_score += durationPenalty.penalty;
    cei_reasons.push(durationPenalty.reason!);
    events.push({
      event_type: durationPenalty.reason!,
      severity: durationPenalty.penalty <= -40 ? 'error' : 'warn',
      source: 'system',
      cei_delta: durationPenalty.penalty,
    });
  }

  if (!transcript) {
    // Clamp and return early if no transcript
    cei_score = Math.max(0, Math.min(100, cei_score));
    return { events, handoff_requested, handoff_reason, time_to_handoff_seconds, cei_score, cei_reasons };
  }

  const lowerTranscript = transcript.toLowerCase();

  // Check for dispatch/human requests
  for (const phrase of PHRASE_LISTS.dispatch_or_human_request) {
    if (lowerTranscript.includes(phrase)) {
      handoff_requested = true;
      handoff_reason = phrase;
      events.push({
        event_type: phrase.includes('dispatch') ? 'dispatch_requested' : 'human_requested',
        severity: 'error',
        source: 'classifier',
        phrase,
        cei_delta: CEI_PENALTIES.dispatch_requested,
      });
      cei_score += CEI_PENALTIES.dispatch_requested;
      cei_reasons.push(phrase.includes('dispatch') ? 'dispatch_requested' : 'human_requested');
      break; // Only count once
    }
  }

  // Check for impatience
  for (const phrase of PHRASE_LISTS.impatience) {
    if (lowerTranscript.includes(phrase)) {
      events.push({
        event_type: 'impatience_phrase_detected',
        severity: 'warn',
        source: 'classifier',
        phrase,
        cei_delta: CEI_PENALTIES.impatience_phrase_detected,
      });
      cei_score += CEI_PENALTIES.impatience_phrase_detected;
      cei_reasons.push('impatience_phrase_detected');
      break;
    }
  }

  // Check for confusion/correction
  for (const phrase of PHRASE_LISTS.confusion_correction) {
    if (lowerTranscript.includes(phrase)) {
      events.push({
        event_type: 'confusion_correction_detected',
        severity: 'warn',
        source: 'classifier',
        phrase,
        cei_delta: CEI_PENALTIES.confusion_correction_detected,
      });
      cei_score += CEI_PENALTIES.confusion_correction_detected;
      cei_reasons.push('confusion_correction_detected');
      break;
    }
  }

  // Check for hard frustration
  for (const phrase of PHRASE_LISTS.hard_frustration) {
    if (lowerTranscript.includes(phrase)) {
      events.push({
        event_type: 'hard_frustration_detected',
        severity: 'error',
        source: 'classifier',
        phrase,
        cei_delta: CEI_PENALTIES.hard_frustration_detected,
      });
      cei_score += CEI_PENALTIES.hard_frustration_detected;
      cei_reasons.push('hard_frustration_detected');
      break;
    }
  }

  // Check for thanks (positive)
  for (const phrase of PHRASE_LISTS.thanks) {
    if (lowerTranscript.includes(phrase)) {
      events.push({
        event_type: 'caller_thanked',
        severity: 'info',
        source: 'classifier',
        phrase,
        cei_delta: CEI_BONUSES.caller_thanked,
      });
      cei_score += CEI_BONUSES.caller_thanked;
      cei_reasons.push('caller_thanked');
      break;
    }
  }

  // Check for booking interest (positive)
  for (const phrase of PHRASE_LISTS.booking_interest) {
    if (lowerTranscript.includes(phrase)) {
      events.push({
        event_type: 'booking_interest_confirmed',
        severity: 'info',
        source: 'classifier',
        phrase,
        cei_delta: CEI_BONUSES.booking_interest_confirmed,
      });
      cei_score += CEI_BONUSES.booking_interest_confirmed;
      cei_reasons.push('booking_interest_confirmed');
      break;
    }
  }

  // Bonus for resolved without handoff
  if (!handoff_requested) {
    events.push({
      event_type: 'call_resolved_without_handoff',
      severity: 'info',
      source: 'system',
      cei_delta: CEI_BONUSES.call_resolved_without_handoff,
    });
    cei_score += CEI_BONUSES.call_resolved_without_handoff;
    cei_reasons.push('call_resolved_without_handoff');
  } else if (time_to_handoff_seconds !== null) {
    // Apply early handoff penalty if handoff was requested before 60 seconds
    const earlyHandoff = getEarlyHandoffPenalty(time_to_handoff_seconds);
    if (earlyHandoff.penalty !== 0) {
      cei_score += earlyHandoff.penalty;
      cei_reasons.push(earlyHandoff.reason!);
      events.push({
        event_type: earlyHandoff.reason!,
        severity: 'error',
        source: 'system',
        cei_delta: earlyHandoff.penalty,
      });
    }
  }

  // Bonus for lead created
  if (leadCreated) {
    events.push({
      event_type: 'lead_created',
      severity: 'info',
      source: 'system',
      cei_delta: CEI_BONUSES.lead_created,
    });
    cei_score += CEI_BONUSES.lead_created;
    cei_reasons.push('lead_created');
  }

  // Bonus for load confirmed
  if (loadConfirmed) {
    events.push({
      event_type: 'load_confirmed',
      severity: 'info',
      source: 'system',
      cei_delta: CEI_BONUSES.load_confirmed,
    });
    cei_score += CEI_BONUSES.load_confirmed;
    cei_reasons.push('load_confirmed');
  }

  // Clamp score to 0-100
  cei_score = Math.max(0, Math.min(100, cei_score));

  return { events, handoff_requested, handoff_reason, time_to_handoff_seconds, cei_score, cei_reasons };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let callLogId: string | null = null;
  let ceiCallId: string | null = null;
  let logError: string | null = null;

  try {
    console.log('=== POST CALL WEBHOOK (CEI) ===');
    
    // Get raw body for HMAC verification
    const rawBody = await req.text();
    
    // Verify HMAC signature if configured
    const webhookSecret = Deno.env.get('ELEVENLABS_WEBHOOK_SECRET');
    const signature = req.headers.get('elevenlabs-signature') || req.headers.get('x-elevenlabs-signature');
    
    const hmacResult = await verifyHmacSignature(rawBody, signature, webhookSecret || null);
    if (!hmacResult.valid) {
      console.error('HMAC signature verification failed');
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (hmacResult.skipped) {
      console.log('HMAC verification skipped - proceeding with webhook processing');
    }
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = JSON.parse(rawBody);
    console.log('Raw body:', JSON.stringify(body, null, 2));

    const params = body.parameters || body;
    const analysis = body.analysis || params.analysis || {};
    const callData = body.call || params.call || {};
    const metadata = body.metadata || params.metadata || {};
    const phoneCallData = metadata.phone_call || {};
    
    console.log('Analysis object:', JSON.stringify(analysis, null, 2));
    console.log('Call object:', JSON.stringify(callData, null, 2));
    console.log('Metadata phone_call:', JSON.stringify(phoneCallData, null, 2));
    
    const {
      owner_id: direct_owner_id, user_id, account_id,
      call_outcome, outcome, status,
      company_name, mc_number, callback_phone, contact_number, phone, load_id, notes,
      conversation_id, call_id, agent_id, caller_id, caller_number, phone_number, from_number,
      duration, duration_seconds, call_duration, transcript, summary: webhookSummary, started_at, ended_at,
      lead_id, lead_status, lead_error, confirmed_load_number, final_rate
    } = params;
    
    // Extract conversation ID for ElevenLabs API fetch
    const elevenLabsConversationId = conversation_id || call_id || body.conversation_id || callData.conversation_id || null;
    
    // Fetch summary - CHECK analysis.transcript_summary FIRST (ElevenLabs primary field)
    let summary = webhookSummary || analysis.transcript_summary || analysis.summary || analysis.call_successful_summary || analysis.call_summary || null;
    console.log('Initial summary from webhook:', summary ? `${summary.substring(0, 100)}...` : 'null');
    
    if (!summary && elevenLabsConversationId) {
      const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
      if (ELEVENLABS_API_KEY) {
        try {
          console.log('Fetching conversation details from ElevenLabs for:', elevenLabsConversationId);
          const convResponse = await fetch(
            `https://api.elevenlabs.io/v1/convai/conversations/${elevenLabsConversationId}`,
            {
              headers: {
                'xi-api-key': ELEVENLABS_API_KEY,
              },
            }
          );
          
          if (convResponse.ok) {
            const convData = await convResponse.json();
            console.log('ElevenLabs conversation response keys:', Object.keys(convData));
            if (convData.analysis) {
              console.log('ElevenLabs analysis keys:', Object.keys(convData.analysis));
              console.log('ElevenLabs analysis:', JSON.stringify(convData.analysis, null, 2));
            }
            
            // Extract summary from the analysis object - try multiple field names
            if (convData.analysis) {
              summary = convData.analysis.call_successful_summary || 
                       convData.analysis.summary || 
                       convData.analysis.transcript_summary ||
                       convData.analysis.call_summary ||
                       null;
              
              // Also check evaluation criteria results for summary
              if (!summary && convData.analysis.evaluation_criteria_results) {
                const evalResults = convData.analysis.evaluation_criteria_results;
                if (typeof evalResults === 'object') {
                  // Look for a summary in evaluation results
                  summary = evalResults.summary || evalResults.call_summary || null;
                }
              }
              
              console.log('Extracted summary from ElevenLabs:', summary ? `${summary.substring(0, 100)}...` : 'null');
            }
            
            // If still no summary, check if there's a data field
            if (!summary && convData.data) {
              console.log('Checking convData.data for summary...');
              summary = convData.data.summary || convData.data.call_summary || null;
            }
          } else {
            const errorText = await convResponse.text();
            console.warn('Failed to fetch ElevenLabs conversation:', convResponse.status, errorText);
          }
        } catch (fetchError) {
          console.error('Error fetching ElevenLabs conversation details:', fetchError);
        }
      } else {
        console.warn('ELEVENLABS_API_KEY not configured, cannot fetch summary');
      }
    }
    
    console.log('Final summary value:', summary ? `${summary.substring(0, 100)}...` : 'null');
    
    // Extract duration - CHECK metadata.call_duration_secs FIRST (ElevenLabs primary field)
    const elevenLabsDuration = 
      metadata.call_duration_secs || metadata.call_duration ||
      callData.call_duration_secs || callData.call_duration || callData.duration ||
      analysis.call_duration || analysis.duration || 
      body.call_duration_secs || body.call_duration || body.duration;

    const callOutcome = call_outcome || outcome || status || 'completed';

    // Extract caller phone - CHECK metadata.phone_call.external_number FIRST (ElevenLabs primary field)
    const callerPhone = phoneCallData.external_number || phoneCallData.from_number ||
                        callback_phone || contact_number || phone || 
                        caller_number || phone_number || from_number || caller_id ||
                        callData.from_number || callData.caller_id || callData.phone_number || null;
    
    console.log('Extracted caller phone:', callerPhone);
    
    let callDuration = elevenLabsDuration || duration_seconds || duration || call_duration;
    const callStarted = started_at || callData.started_at || callData.start_time;
    const callEnded = ended_at || callData.ended_at || callData.end_time;
    
    if (!callDuration && callStarted && callEnded) {
      const start = new Date(callStarted);
      const end = new Date(callEnded);
      callDuration = Math.round((end.getTime() - start.getTime()) / 1000);
    }
    if (callDuration && typeof callDuration === 'number') {
      callDuration = Math.round(callDuration);
    }
    console.log('Calculated call duration:', callDuration);

    // Get owner_id
    let owner_id = direct_owner_id || user_id || account_id || null;
    let actualLoadId = load_id || null;
    
    if (lead_id) {
      const { data: lead } = await supabase
        .from('trucking_carrier_leads')
        .select('owner_id, load_id')
        .eq('id', lead_id)
        .maybeSingle();
      
      if (lead) {
        owner_id = owner_id || lead.owner_id;
        actualLoadId = actualLoadId || lead.load_id;
      }
    }
    
    if (!owner_id && callerPhone) {
      const cleanPhone = callerPhone.replace(/[^0-9]/g, '');
      const { data: recentLead } = await supabase
        .from('trucking_carrier_leads')
        .select('owner_id, load_id, id')
        .or(`phone.eq.${cleanPhone},phone.ilike.%${cleanPhone}%`)
        .gte('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (recentLead) {
        owner_id = recentLead.owner_id;
        actualLoadId = actualLoadId || recentLead.load_id;
      }
    }

    if (!owner_id) {
      const { data: anyOwner } = await supabase
        .from('trucking_loads')
        .select('owner_id')
        .limit(1)
        .maybeSingle();
      
      if (anyOwner) {
        owner_id = anyOwner.owner_id;
      }
    }

    // Extract transcript
    let callTranscript = transcript || analysis.transcript || body.transcript || null;
    if (Array.isArray(callTranscript)) {
      callTranscript = callTranscript
        .map((msg: { role?: string; message?: string; text?: string; content?: string }) => {
          const role = msg.role || 'unknown';
          const text = msg.message || msg.text || msg.content || '';
          return `${role}: ${text}`;
        })
        .join('\n');
    }
    
    console.log('Transcript available:', !!callTranscript, callTranscript ? `(${String(callTranscript).length} chars)` : '');

    // Map call outcome to CEI outcome
    let ceiOutcome: string = 'incomplete';
    const loadConfirmed = callOutcome === 'confirmed' || callOutcome === 'booked';
    if (loadConfirmed) {
      ceiOutcome = 'confirmed';
    } else if (callOutcome === 'declined' || callOutcome === 'rejected') {
      ceiOutcome = 'declined';
    } else if (callOutcome === 'callback' || callOutcome === 'callback_requested') {
      ceiOutcome = 'callback_requested';
    } else if (callOutcome === 'error' || callOutcome === 'failed') {
      ceiOutcome = 'error';
    } else if (callOutcome === 'completed' || callOutcome === 'success') {
      ceiOutcome = lead_id ? 'confirmed' : 'incomplete';
    }

    // Analyze transcript for CEI scoring with duration-based adjustments
    const transcriptAnalysis = analyzeTranscript(
      callTranscript, 
      callDuration || null, 
      !!lead_id, 
      loadConfirmed
    );
    console.log('CEI Analysis:', JSON.stringify({
      cei_score: transcriptAnalysis.cei_score,
      cei_band: getCEIBand(transcriptAnalysis.cei_score),
      handoff_requested: transcriptAnalysis.handoff_requested,
      time_to_handoff_seconds: transcriptAnalysis.time_to_handoff_seconds,
      events_count: transcriptAnalysis.events.length,
    }, null, 2));

    // Extract audio URL from ElevenLabs payload if available
    const audioUrl = body.recording_url || callData.recording_url || analysis.recording_url || null;

    // Create CEI call record with duration and audio
    const ceiCallData = {
      call_provider: 'elevenlabs',
      call_external_id: conversation_id || call_id || null,
      agent_name: 'Jess',
      caller_phone: callerPhone,
      mc_number: mc_number || null,
      company_name: company_name || null,
      primary_load_id: actualLoadId,
      load_ids_discussed: actualLoadId ? [actualLoadId] : [],
      transcript_text: callTranscript,
      call_outcome: ceiOutcome,
      handoff_requested: transcriptAnalysis.handoff_requested,
      handoff_reason: transcriptAnalysis.handoff_reason,
      lead_created: !!lead_id,
      lead_create_error: lead_error || null,
      cei_score: transcriptAnalysis.cei_score,
      cei_band: getCEIBand(transcriptAnalysis.cei_score),
      cei_reasons: transcriptAnalysis.cei_reasons,
      owner_id,
      // New fields for engagement metrics
      call_duration_seconds: callDuration || 0,
      audio_url: audioUrl,
      time_to_handoff_seconds: transcriptAnalysis.time_to_handoff_seconds,
    };

    console.log('Creating CEI call:', JSON.stringify(ceiCallData, null, 2));

    const { data: ceiCall, error: ceiError } = await supabase
      .from('trucking_calls')
      .insert(ceiCallData)
      .select()
      .maybeSingle();

    if (ceiError) {
      console.error('Error creating CEI call:', ceiError);
    } else if (ceiCall) {
      ceiCallId = ceiCall.id;
      console.log('CEI call created:', ceiCall.id);

      // Insert CEI events
      if (transcriptAnalysis.events.length > 0) {
        const eventRecords = transcriptAnalysis.events.map(event => ({
          call_id: ceiCall.id,
          event_type: event.event_type,
          severity: event.severity,
          source: event.source,
          phrase: event.phrase || null,
          cei_delta: event.cei_delta,
        }));

        const { error: eventsError } = await supabase
          .from('trucking_call_events')
          .insert(eventRecords);

        if (eventsError) {
          console.error('Error inserting CEI events:', eventsError);
        } else {
          console.log(`Inserted ${eventRecords.length} CEI events`);
        }
      }
    }

    // Try to find and UPDATE existing call log first (created by call-router at call start)
    // Then fall back to INSERT if not found
    let callNotes = notes || '';
    if (lead_status === 'failed' || lead_error) {
      callNotes += `\n[Lead creation failed: ${lead_error || 'unknown error'}]`;
      if (company_name) callNotes += `\nCompany: ${company_name}`;
      if (mc_number) callNotes += `\nMC: ${mc_number}`;
      if (callerPhone) callNotes += `\nCallback: ${callerPhone}`;
    }

    // Try to find existing call log by conversation_id or recent caller phone
    let existingCallLog = null;
    const conversationIdToMatch = conversation_id || call_id;
    
    if (conversationIdToMatch) {
      // First try to match by conversation_id stored in metadata or notes
      const { data: byConversation } = await supabase
        .from('trucking_call_logs')
        .select('id')
        .or(`notes.ilike.%${conversationIdToMatch}%,summary.ilike.%${conversationIdToMatch}%`)
        .gte('call_started_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Within last hour
        .order('call_started_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (byConversation) {
        existingCallLog = byConversation;
        console.log('Found existing call log by conversation_id:', existingCallLog.id);
      }
    }

    // If not found by conversation_id, try by phone number and duration = 0
    if (!existingCallLog && callerPhone && owner_id) {
      const cleanPhone = callerPhone.replace(/[^0-9]/g, '');
      const phoneVariants = [cleanPhone, `+1${cleanPhone}`, cleanPhone.slice(-10)];
      
      const { data: byPhone } = await supabase
        .from('trucking_call_logs')
        .select('id')
        .eq('owner_id', owner_id)
        .in('carrier_phone', phoneVariants)
        .eq('duration_seconds', 0) // Only match calls with 0 duration (not yet updated)
        .gte('call_started_at', new Date(Date.now() - 30 * 60 * 1000).toISOString()) // Within last 30 min
        .order('call_started_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (byPhone) {
        existingCallLog = byPhone;
        console.log('Found existing call log by phone (duration=0):', existingCallLog.id);
      }
    }

    const callLogUpdateData: Record<string, unknown> = {
      call_ended_at: callEnded || new Date().toISOString(),
      duration_seconds: callDuration || 0,
      outcome: callOutcome,
      call_outcome: callOutcome,
      summary: summary || callNotes || null,
      transcript: callTranscript,
      elevenlabs_conversation_id: elevenLabsConversationId,
    };

    if (lead_id) {
      callLogUpdateData.lead_id = lead_id;
    }

    let callLog = null;
    let error = null;

    if (existingCallLog) {
      // UPDATE existing call log
      console.log('Updating existing call log:', existingCallLog.id, 'with duration:', callDuration);
      const result = await supabase
        .from('trucking_call_logs')
        .update(callLogUpdateData)
        .eq('id', existingCallLog.id)
        .select()
        .maybeSingle();
      
      callLog = result.data;
      error = result.error;
      
      if (!error && callLog) {
        callLogId = callLog.id;
        console.log('Call log UPDATED successfully:', callLog.id, 'duration:', callLog.duration_seconds);
      }
    } else {
      // INSERT new call log (fallback)
      const callLogData: Record<string, unknown> = {
        owner_id,
        load_id: actualLoadId,
        carrier_phone: callerPhone,
        call_started_at: callStarted || new Date().toISOString(),
        call_ended_at: callEnded || new Date().toISOString(),
        duration_seconds: callDuration || 0,
        outcome: callOutcome,
        call_outcome: callOutcome,
        summary: summary || callNotes || null,
        transcript: callTranscript,
        elevenlabs_conversation_id: elevenLabsConversationId,
        is_demo: false,
        total_characters: callTranscript ? callTranscript.length : null,
        call_direction: 'inbound'
      };

      if (lead_id) {
        callLogData.lead_id = lead_id;
      }

      const result = await supabase
        .from('trucking_call_logs')
        .insert(callLogData)
        .select()
        .maybeSingle();

      callLog = result.data;
      error = result.error;
      
      if (!error && callLog) {
        callLogId = callLog.id;
        console.log('Call log INSERTED successfully:', callLog.id);
      }
    }

    if (error) {
      console.error('Database error with call log:', error);
      logError = error.message;
    } else if (callLog) {
      if (lead_id) {
        await supabase
          .from('trucking_carrier_leads')
          .update({ call_log_id: callLog.id })
          .eq('id', lead_id);
      } else if (callerPhone && owner_id && (callOutcome === 'completed' || callOutcome === 'callback_requested')) {
        // AUTO-CREATE LEAD for completed calls without existing lead
        // This ensures every meaningful call gets a pending lead for follow-up
        console.log('Auto-creating pending lead for completed call without existing lead');
        try {
          // If phone number exists in conversation, mark as pending lead
          const leadStatus = callerPhone ? 'pending' : 'new';
          const autoLeadData = {
            owner_id,
            load_id: actualLoadId,
            phone: callerPhone,
            company_name: company_name || null,
            mc_number: mc_number || null,
            notes: `Auto-created from AI call. ${summary || ''}\nCall outcome: ${callOutcome}`,
            source: 'ai_voice_agent',
            status: leadStatus,
            is_confirmed: false,
            requires_callback: true,
            call_source: 'inbound',
            call_log_id: callLog.id,
            mc_pending: !mc_number
          };
          
          const { data: autoLead, error: autoLeadError } = await supabase
            .from('trucking_carrier_leads')
            .insert(autoLeadData)
            .select()
            .single();
          
          if (autoLeadError) {
            console.error('Failed to auto-create lead:', autoLeadError);
          } else if (autoLead) {
            console.log('Auto-created pending lead:', autoLead.id);
            // Update call log with the new lead_id
            await supabase
              .from('trucking_call_logs')
              .update({ lead_id: autoLead.id })
              .eq('id', callLog.id);
          }
        } catch (autoLeadErr) {
          console.error('Error auto-creating lead:', autoLeadErr);
        }
      }

      // SMS notifications disabled per user request
      console.log('SMS notifications disabled - skipping SMS send');
    }

  } catch (error: unknown) {
    console.error('Error in ai-trucking-call-complete:', error);
    logError = error instanceof Error ? error.message : 'Unknown error';
  }

  return new Response(JSON.stringify({
    ok: !logError,
    success: !logError,
    message: logError ? `Call logged with error: ${logError}` : "Call logged successfully with CEI scoring",
    call_log_id: callLogId,
    cei_call_id: ceiCallId,
    error: logError
  }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});
