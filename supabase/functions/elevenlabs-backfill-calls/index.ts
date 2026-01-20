import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ElevenLabsConversation {
  conversation_id: string;
  agent_id: string;
  status: string;
  start_time_unix_secs?: number;
  end_time_unix_secs?: number;
  call_duration_secs?: number;
  call?: {
    from_number?: string;
    to_number?: string;
  };
  metadata?: Record<string, unknown>;
}

interface ElevenLabsConversationDetail {
  conversation_id: string;
  agent_id: string;
  status: string;
  start_time_unix_secs?: number;
  end_time_unix_secs?: number;
  call_duration_secs?: number;
  transcript?: Array<{
    role: string;
    message: string;
    time_in_call_secs?: number;
  }>;
  analysis?: {
    summary?: string;
    call_successful?: boolean;
    data_collection_results?: Record<string, unknown>;
  };
  metadata?: {
    call_sid?: string;
    stream_sid?: string;
    caller_phone_number?: string;
    called_phone_number?: string;
    call_direction?: string;
    twilio_call_sid?: string;
    twilio_stream_sid?: string;
    [key: string]: unknown;
  };
  call?: {
    from_number?: string;
    to_number?: string;
    recording_url?: string;
    call_cost_credits?: number;
    ended_reason?: string;
    call_direction?: string;
    connection_duration_secs?: number;
  };
  has_audio?: boolean;
  has_user_audio?: boolean;
  has_response_audio?: boolean;
  user_id?: string;
  branch_id?: string;
  conversation_initiation_client_data?: {
    dynamic_variables?: Record<string, unknown>;
    [key: string]: unknown;
  };
}

interface IntentAnalysis {
  intentScore: number;
  hasStrongBookingPhrase: boolean;
  hasVerificationScript: boolean;
  hasLoadReference: boolean;
  hasRateInfo: boolean;
  carrierName: string | null;
  rateOffered: number | null;
  rateRequested: number | null;
  needsCallback: boolean;
  loadReference: string | null;
  meetsIntentThreshold: boolean;
}

// Backfill modes
type BackfillMode = 'missing_only' | 'conversation_id' | 'date_range' | 'all';

const COST_PER_MINUTE = 0.07;
const COST_PER_CREDIT = 0.00003;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== ELEVENLABS BACKFILL CALLS ===');
    
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    const JESS_AGENT_ID = Deno.env.get('ELEVENLABS_JESS_AGENT_ID');
    
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY not configured');
    }
    
    if (!JESS_AGENT_ID) {
      throw new Error('ELEVENLABS_JESS_AGENT_ID not configured');
    }

    if (!JESS_AGENT_ID.startsWith('agent_')) {
      throw new Error(`Invalid agent ID format: ${JESS_AGENT_ID.substring(0, 15)}... - must start with 'agent_'`);
    }

    console.log(`Using Jess Agent ID: ${JESS_AGENT_ID}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json().catch(() => ({}));
    const { 
      owner_id, 
      max_pages = 50,
      mode = 'missing_only' as BackfillMode,
      conversation_id: targetConversationId,
      start_date,
      end_date,
    } = body;

    console.log(`Backfill mode: ${mode}`);

    // Get owner_id if not provided
    let resolvedOwnerId = owner_id;
    if (!resolvedOwnerId) {
      const { data: anyOwner } = await supabase
        .from('trucking_loads')
        .select('owner_id')
        .limit(1)
        .maybeSingle();
      resolvedOwnerId = anyOwner?.owner_id;
      console.log(`Resolved owner_id: ${resolvedOwnerId}`);
    }

    if (!resolvedOwnerId) {
      throw new Error('No owner_id found');
    }

    const results = {
      mode,
      fetched_total: 0,
      upserted_total: 0,
      skipped_already_exists: 0,
      skipped_no_phone: 0,
      skipped_no_load_ref: 0,
      skipped_low_intent: 0,
      errors_total: 0,
      pages_fetched: 0,
      leads_created: 0,
      leads_skipped_existing: 0,
      details: [] as Array<{ 
        conversation_id: string; 
        status: string; 
        duration?: number; 
        error?: string; 
        lead_created?: boolean;
        intent_score?: number;
        skip_reason?: string;
      }>,
    };

    // 2-signal intent detection with scoring
    const analyzeIntent = (transcript: string): IntentAnalysis => {
      const lowerTranscript = transcript.toLowerCase();
      
      // Strong booking phrases (signal 1)
      const strongBookingPhrases = [
        'bookload', 'book load', 'book it', 'i\'ll take it', 'we\'ll take it',
        'yes, yes', 'that\'s correct', 'great, i\'ll send this to dispatch',
        'confirming you want load', 'you\'re booking load'
      ];
      const hasStrongBookingPhrase = strongBookingPhrases.some(p => lowerTranscript.includes(p));
      
      // Verification script indicators (signal 1 alternative)
      const verificationPhrases = [
        'just to confirm', 'the company is', 'callback number is',
        'is that correct', 'dispatch to finalize', 'hear back shortly'
      ];
      const hasVerificationScript = verificationPhrases.filter(p => lowerTranscript.includes(p)).length >= 2;
      
      // Load reference detection (signal 2)
      let loadReference: string | null = null;
      const loadRefPatterns = [
        /load (?:number |#)?(\d{3,6})/i,
        /reference (?:number )?(\d{3,6})/i,
        /load (?:one |two |three |four |five |six |seven |eight |nine |zero )+/i,
      ];
      for (const pattern of loadRefPatterns) {
        const match = transcript.match(pattern);
        if (match) {
          loadReference = match[1] || 'detected';
          break;
        }
      }
      const hasLoadReference = loadReference !== null;
      
      // Rate info detection (signal 2 alternative)
      let rateOffered: number | null = null;
      let rateRequested: number | null = null;
      
      const ratePatterns = [
        /(\d{1,2}(?:,\d{3}|\d{3}))\s*(?:dollars|for this load)/i,
        /(?:offer|offering|at|pay(?:ing)?)\s*(?:\$)?(\d{3,4})/i,
        /(?:one|two|three|four|five|six|seven|eight|nine)\s+(?:thousand|hundred)/i,
      ];
      
      for (const pattern of ratePatterns) {
        const match = transcript.match(pattern);
        if (match && match[1]) {
          const val = parseInt(match[1].replace(/,/g, ''));
          if (!isNaN(val) && val >= 100 && val <= 10000) {
            rateOffered = val;
            break;
          }
        }
      }
      
      const requestPatterns = [
        /(?:would you go|can you (?:do|accept)|go)\s*(?:\$)?(\d{3,4})/i,
      ];
      for (const pattern of requestPatterns) {
        const match = transcript.match(pattern);
        if (match && match[1]) {
          const val = parseInt(match[1].replace(/,/g, ''));
          if (!isNaN(val)) rateRequested = val;
          break;
        }
      }
      
      const hasRateInfo = rateOffered !== null || rateRequested !== null;
      
      // Carrier name extraction
      let carrierName: string | null = null;
      const companyPatterns = [
        /company (?:is|name is) ([A-Z][a-zA-Z\s]+?)(?:,|\.|the callback)/i,
        /it's ([A-Z][a-zA-Z\s]+?)(?:\.|phone|,)/i,
        /your name is ([A-Z][a-zA-Z\s]+?)(?:\.|and|,)/i,
      ];
      for (const pattern of companyPatterns) {
        const match = transcript.match(pattern);
        if (match) {
          carrierName = match[1].trim();
          break;
        }
      }
      
      // Needs callback detection
      const needsCallback = lowerTranscript.includes('dispatch to call') || 
        lowerTranscript.includes('above what i\'m authorized') ||
        lowerTranscript.includes('let me get dispatch') ||
        lowerTranscript.includes('get dispatch to call');
      
      // Calculate intent score (0-100)
      let intentScore = 0;
      if (hasStrongBookingPhrase) intentScore += 40;
      if (hasVerificationScript) intentScore += 30;
      if (hasLoadReference) intentScore += 20;
      if (hasRateInfo) intentScore += 10;
      if (carrierName) intentScore += 10;
      if (needsCallback) intentScore += 5;
      
      // 2-signal gate: (strong booking OR verification) AND (load OR rate)
      const meetsIntentThreshold = (hasStrongBookingPhrase || hasVerificationScript) && (hasLoadReference || hasRateInfo);
      
      return {
        intentScore,
        hasStrongBookingPhrase,
        hasVerificationScript,
        hasLoadReference,
        hasRateInfo,
        carrierName,
        rateOffered,
        rateRequested,
        needsCallback,
        loadReference,
        meetsIntentThreshold,
      };
    };

    // Fetch helper with retry
    const fetchWithRetry = async (url: string, retries = 3): Promise<Response> => {
      for (let attempt = 1; attempt <= retries; attempt++) {
        const response = await fetch(url, {
          headers: { 'xi-api-key': ELEVENLABS_API_KEY },
        });
        
        if (response.ok) return response;
        
        if (response.status === 429 && attempt < retries) {
          const delay = Math.pow(2, attempt) * 1000;
          console.log(`Rate limited, waiting ${delay}ms...`);
          await new Promise(r => setTimeout(r, delay));
          continue;
        }
        
        return response;
      }
      throw new Error('Max retries exceeded');
    };

    // Get existing conversation IDs for missing_only mode
    let existingConversationIds = new Set<string>();
    if (mode === 'missing_only') {
      const { data: existingLogs } = await supabase
        .from('trucking_call_logs')
        .select('elevenlabs_conversation_id')
        .not('elevenlabs_conversation_id', 'is', null);
      
      existingConversationIds = new Set((existingLogs || []).map(l => l.elevenlabs_conversation_id));
      console.log(`Found ${existingConversationIds.size} existing call logs`);
    }

    // Get existing leads by conversation_id for deduplication
    const { data: existingLeads } = await supabase
      .from('trucking_carrier_leads')
      .select('source_conversation_id')
      .not('source_conversation_id', 'is', null);
    
    const existingLeadConversationIds = new Set((existingLeads || []).map(l => l.source_conversation_id));
    console.log(`Found ${existingLeadConversationIds.size} existing leads with conversation IDs`);

    // Fetch conversations based on mode
    const allConversations: ElevenLabsConversation[] = [];

    if (mode === 'conversation_id' && targetConversationId) {
      // Single conversation mode
      allConversations.push({ 
        conversation_id: targetConversationId, 
        agent_id: JESS_AGENT_ID, 
        status: 'unknown' 
      });
      results.fetched_total = 1;
    } else {
      // Fetch from API with pagination
      let cursor: string | null = null;
      let hasMore = true;

      while (hasMore && results.pages_fetched < max_pages) {
        let url = `https://api.elevenlabs.io/v1/convai/conversations?page_size=100&agent_id=${encodeURIComponent(JESS_AGENT_ID)}`;
        if (cursor) url += `&cursor=${encodeURIComponent(cursor)}`;

        const listResponse = await fetchWithRetry(url);

        if (!listResponse.ok) {
          const errorText = await listResponse.text();
          throw new Error(`ElevenLabs API error: ${listResponse.status} - ${errorText}`);
        }

        const listData = await listResponse.json();
        const pageConversations: ElevenLabsConversation[] = listData.conversations || [];
        
        for (const conv of pageConversations) {
          // Filter by mode
          if (mode === 'missing_only' && existingConversationIds.has(conv.conversation_id)) {
            results.skipped_already_exists++;
            continue;
          }
          
          if (mode === 'date_range' && start_date && end_date) {
            const convTime = conv.start_time_unix_secs ? conv.start_time_unix_secs * 1000 : 0;
            const startTime = new Date(start_date).getTime();
            const endTime = new Date(end_date).getTime();
            if (convTime < startTime || convTime > endTime) continue;
          }
          
          allConversations.push(conv);
        }

        results.pages_fetched++;
        cursor = listData.next_cursor || null;
        hasMore = !!cursor && pageConversations.length > 0;

        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      results.fetched_total = allConversations.length;
    }

    console.log(`Processing ${allConversations.length} conversations...`);

    // Process each conversation
    for (const conv of allConversations) {
      try {
        const detailUrl = `https://api.elevenlabs.io/v1/convai/conversations/${conv.conversation_id}`;
        const detailResponse = await fetchWithRetry(detailUrl);

        if (!detailResponse.ok) {
          const errorText = await detailResponse.text();
          results.errors_total++;
          results.details.push({ conversation_id: conv.conversation_id, status: 'fetch_error', error: errorText });
          continue;
        }

        const detail: ElevenLabsConversationDetail = await detailResponse.json();

        // Build transcript
        let transcriptText: string | null = null;
        if (detail.transcript && Array.isArray(detail.transcript)) {
          transcriptText = detail.transcript.map(t => `${t.role}: ${t.message}`).join('\n');
        }

        // Calculate duration: prefer call_duration_secs, fallback to end-start calculation
        // Also check connection_duration_secs from call data
        let duration = detail.call_duration_secs || 0;
        if (!duration && detail.end_time_unix_secs && detail.start_time_unix_secs) {
          duration = detail.end_time_unix_secs - detail.start_time_unix_secs;
        }
        if (!duration && detail.call?.connection_duration_secs) {
          duration = detail.call.connection_duration_secs;
        }
        console.log(`Call ${conv.conversation_id}: duration=${duration}, call_duration_secs=${detail.call_duration_secs}, end-start=${detail.end_time_unix_secs && detail.start_time_unix_secs ? detail.end_time_unix_secs - detail.start_time_unix_secs : 'N/A'}, connection_duration=${detail.call?.connection_duration_secs || 'N/A'}`);

        // Extract phone and metadata
        const callData = detail.call || {};
        const metadata = detail.metadata || {};
        const phoneCall = (metadata.phone_call || {}) as Record<string, unknown>;
        
        const phoneCallExternal = phoneCall.external_number as string || null;
        const phoneCallAgent = phoneCall.agent_number as string || null;
        const phoneCallDirection = phoneCall.direction as string || 'inbound';
        
        let callerPhone: string | null = null;
        let receiverPhone: string | null = null;
        
        if (phoneCallDirection === 'inbound') {
          callerPhone = phoneCallExternal || callData.from_number || metadata.caller_phone_number as string || null;
          receiverPhone = phoneCallAgent || callData.to_number || metadata.called_phone_number as string || null;
        } else {
          callerPhone = phoneCallAgent || callData.from_number || null;
          receiverPhone = phoneCallExternal || callData.to_number || null;
        }
        
        if (!callerPhone && phoneCallExternal) callerPhone = phoneCallExternal;
        
        const twilioCallSid = phoneCall.call_sid as string || metadata.call_sid as string || null;
        const twilioStreamSid = phoneCall.stream_sid as string || metadata.stream_sid as string || null;
        
        const startTimeUnix = detail.start_time_unix_secs || metadata.start_time_unix_secs as number || null;
        const startTime = startTimeUnix ? new Date(startTimeUnix * 1000).toISOString() : null;
        const endTime = detail.end_time_unix_secs ? new Date(detail.end_time_unix_secs * 1000).toISOString() : null;

        const estimatedCostUsd = duration > 0 ? (duration / 60) * COST_PER_MINUTE : 0;
        const callCostCredits = callData.call_cost_credits || null;
        const callCostUsd = callCostCredits ? callCostCredits * COST_PER_CREDIT : estimatedCostUsd;

        let outcome = 'completed';
        if (detail.analysis?.data_collection_results) {
          const dataResults = detail.analysis.data_collection_results as Record<string, unknown>;
          if (dataResults.callback_requested) outcome = 'callback_requested';
          else if (dataResults.declined) outcome = 'declined';
          else if (dataResults.confirmed) outcome = 'confirmed';
        }
        
        const callSuccessful = detail.analysis?.call_successful === true;
        const summary = detail.analysis?.summary || null;

        // Upsert call log
        const { data: existingLog } = await supabase
          .from('trucking_call_logs')
          .select('id')
          .eq('elevenlabs_conversation_id', conv.conversation_id)
          .maybeSingle();

        const callLogData = {
          owner_id: resolvedOwnerId,
          carrier_phone: callerPhone,
          receiver_number: receiverPhone,
          call_direction: phoneCallDirection,
          summary,
          transcript: transcriptText,
          recording_url: callData.recording_url || null,
          call_started_at: startTime,
          call_ended_at: endTime,
          duration_seconds: duration,
          connection_duration_seconds: callData.connection_duration_secs || null,
          outcome,
          estimated_cost_usd: callCostUsd,
          is_demo: false,
          elevenlabs_conversation_id: conv.conversation_id,
          elevenlabs_agent_id: conv.agent_id,
          elevenlabs_user_id: detail.user_id || null,
          call_cost_credits: callCostCredits,
          call_cost_usd: callCostUsd,
          llm_cost_usd_total: estimatedCostUsd * 0.3,
          llm_cost_usd_per_min: duration > 0 ? (estimatedCostUsd * 0.3) / (duration / 60) : 0,
          ended_reason: callData.ended_reason || null,
          call_status: detail.status,
          twilio_call_sid: twilioCallSid,
          twilio_stream_sid: twilioStreamSid,
          has_audio: detail.has_audio || false,
          has_user_audio: detail.has_user_audio || false,
          has_response_audio: detail.has_response_audio || false,
          branch_id: detail.branch_id || null,
          analysis_summary: detail.analysis?.summary || null,
          call_successful: callSuccessful,
          data_collection_results: detail.analysis?.data_collection_results || null,
          initiation_client_data: detail.conversation_initiation_client_data || null,
          elevenlabs_metadata: metadata,
        };

        let callLogId: string | null = null;
        
        if (existingLog) {
          callLogId = existingLog.id;
          await supabase.from('trucking_call_logs').update(callLogData).eq('id', existingLog.id);
        } else {
          const { data: insertedLog } = await supabase
            .from('trucking_call_logs')
            .insert(callLogData)
            .select('id')
            .single();
          callLogId = insertedLog?.id;
        }
        
        results.upserted_total++;

        // --- LEAD CREATION WITH PM REQUIREMENTS ---
        let leadCreated = false;
        let skipReason: string | undefined;
        let intentScore = 0;
        
        // Check if lead already exists for this conversation (strict dedupe by conversation_id)
        if (existingLeadConversationIds.has(conv.conversation_id)) {
          results.leads_skipped_existing++;
          skipReason = 'lead_exists_for_conversation';
        } else if (!callerPhone) {
          results.skipped_no_phone++;
          skipReason = 'no_callback_phone';
        } else if (transcriptText) {
          const intent = analyzeIntent(transcriptText);
          intentScore = intent.intentScore;
          
          console.log(`Call ${conv.conversation_id} intent: score=${intent.intentScore}, booking=${intent.hasStrongBookingPhrase}, verify=${intent.hasVerificationScript}, load=${intent.hasLoadReference}, rate=${intent.hasRateInfo}`);
          
          // Must have load reference to create lead
          if (!intent.hasLoadReference) {
            results.skipped_no_load_ref++;
            skipReason = 'no_load_reference';
          } else if (!intent.meetsIntentThreshold) {
            // 2-signal gate not met
            results.skipped_low_intent++;
            skipReason = 'low_intent_score';
          } else {
            // All requirements met - create lead
            let loadId: string | null = null;
            if (intent.loadReference && intent.loadReference !== 'detected') {
              const { data: matchedLoad } = await supabase
                .from('trucking_loads')
                .select('id')
                .ilike('reference_number', `%${intent.loadReference}%`)
                .limit(1)
                .maybeSingle();
              loadId = matchedLoad?.id || null;
            }
            
            const formattedPhone = callerPhone.replace(/\D/g, '').slice(-10);
            const displayPhone = formattedPhone.length === 10 
              ? `${formattedPhone.slice(0,3)}-${formattedPhone.slice(3,6)}-${formattedPhone.slice(6)}`
              : callerPhone;
            
            const leadData = {
              owner_id: resolvedOwnerId,
              phone: displayPhone,
              company_name: intent.carrierName || 'undisclosed',
              contact_name: intent.carrierName || 'undisclosed',
              load_id: loadId,
              call_log_id: callLogId,
              call_source: 'inbound',
              source: 'elevenlabs_backfill',
              status: 'new',
              rate_offered: intent.rateOffered,
              rate_requested: intent.rateRequested,
              requires_callback: intent.needsCallback,
              mc_pending: true,
              notes: `Intent score: ${intent.intentScore} | Load ref: ${intent.loadReference || 'N/A'} | Rate offered: ${intent.rateOffered || 'N/A'}`,
              is_confirmed: false,
              is_archived: false,
              // Provenance fields
              source_conversation_id: conv.conversation_id,
              source_call_sid: twilioCallSid,
              intent_score: intent.intentScore,
              extracted_carrier_name: intent.carrierName,
              extracted_rate_offered: intent.rateOffered,
              extracted_rate_requested: intent.rateRequested,
              extracted_load_reference: intent.loadReference,
              needs_review: !loadId, // Needs review if we couldn't match load
              review_reason: !loadId ? 'load_not_matched' : null,
            };
            
            const { error: leadError } = await supabase
              .from('trucking_carrier_leads')
              .insert(leadData);
            
            if (leadError) {
              console.error(`Lead creation error for ${conv.conversation_id}:`, leadError);
            } else {
              leadCreated = true;
              results.leads_created++;
              existingLeadConversationIds.add(conv.conversation_id); // Update set for subsequent iterations
              console.log(`Created lead for ${conv.conversation_id} - carrier: ${intent.carrierName}, phone: ${displayPhone}, intent: ${intent.intentScore}`);
            }
          }
        }
        
        results.details.push({ 
          conversation_id: conv.conversation_id, 
          status: existingLog ? 'updated' : 'created', 
          duration,
          lead_created: leadCreated,
          intent_score: intentScore,
          skip_reason: skipReason,
        });

        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (err) {
        console.error(`Error processing ${conv.conversation_id}:`, err);
        results.errors_total++;
        results.details.push({ 
          conversation_id: conv.conversation_id, 
          status: 'error', 
          error: err instanceof Error ? err.message : 'Unknown error' 
        });
      }
    }

    console.log('=== BACKFILL COMPLETE ===');
    console.log({
      mode: results.mode,
      fetched_total: results.fetched_total,
      upserted_total: results.upserted_total,
      leads_created: results.leads_created,
      leads_skipped_existing: results.leads_skipped_existing,
      skipped_no_phone: results.skipped_no_phone,
      skipped_no_load_ref: results.skipped_no_load_ref,
      skipped_low_intent: results.skipped_low_intent,
      errors_total: results.errors_total,
    });

    return new Response(JSON.stringify({
      success: true,
      agent_id: JESS_AGENT_ID,
      results: {
        mode: results.mode,
        fetched_total: results.fetched_total,
        upserted_total: results.upserted_total,
        skipped_already_exists: results.skipped_already_exists,
        leads_created: results.leads_created,
        leads_skipped_existing: results.leads_skipped_existing,
        skipped_no_phone: results.skipped_no_phone,
        skipped_no_load_ref: results.skipped_no_load_ref,
        skipped_low_intent: results.skipped_low_intent,
        errors_total: results.errors_total,
        pages_fetched: results.pages_fetched,
      },
      details: results.details,
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