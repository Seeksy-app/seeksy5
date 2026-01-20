import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("[ai-trucking-call-router] Received request:", JSON.stringify(body));

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle ElevenLabs webhook tool calls
    const action = body.action;

    if (action === "lookup_load") {
      return await handleLookupLoad(supabase, body);
    } else if (action === "create_lead") {
      return await handleCreateLead(supabase, body);
    } else if (action === "negotiate_rate") {
      return await handleNegotiateRate(supabase, body);
    } else if (action === "save_transcript") {
      return await handleSaveTranscript(supabase, body);
    } else if (action === "log_call") {
      return await handleLogCall(supabase, body);
    } else if (action === "confirm_booking") {
      return await handleConfirmBooking(supabase, body);
    } else if (action === "check_high_intent") {
      return await handleCheckHighIntent(supabase, body);
    } else if (action === "get_high_intent_keywords") {
      return await handleGetHighIntentKeywords(supabase);
    } else {
      // Legacy format or unknown action
      console.log("[ai-trucking-call-router] Unknown action:", action);
      return new Response(
        JSON.stringify({ 
          error: "Unknown action", 
          available_actions: ["lookup_load", "create_lead", "negotiate_rate", "save_transcript", "log_call", "confirm_booking", "check_high_intent", "get_high_intent_keywords"] 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("[ai-trucking-call-router] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function handleLookupLoad(supabase: any, body: any) {
  const { load_number, origin_city, destination_city } = body;
  
  console.log("[lookup_load] Searching for load:", { load_number, origin_city, destination_city });

  let loads: any[] = [];
  let searchStrategy = 'none';

  // STRATEGY 1: Search by load number first (most specific)
  if (load_number) {
    const normalizedLoadNumber = String(load_number).replace(/[^a-zA-Z0-9]/g, '');
    console.log('Strategy 1: Load number search:', normalizedLoadNumber);
    
    const { data, error } = await supabase
      .from('trucking_loads')
      .select('*')
      .ilike('load_number', `%${normalizedLoadNumber}%`)
      .limit(10);
    
    if (!error && data && data.length > 0) {
      loads = data;
      searchStrategy = 'load_number';
    }
  }

  // STRATEGY 2: Origin + Destination (full lane match)
  if (loads.length === 0 && origin_city && destination_city) {
    console.log('Strategy 2: Full lane search:', origin_city, '->', destination_city);
    
    const { data, error } = await supabase
      .from('trucking_loads')
      .select('*')
      .eq('is_active', true)
      .ilike('origin_city', `%${origin_city}%`)
      .ilike('destination_city', `%${destination_city}%`)
      .limit(10);
    
    if (!error && data && data.length > 0) {
      loads = data;
      searchStrategy = 'full_lane';
    }
  }

  // STRATEGY 3: Destination-only search (common for drivers shopping rates)
  if (loads.length === 0 && destination_city) {
    console.log('Strategy 3: Destination-only search:', destination_city);
    
    const { data, error } = await supabase
      .from('trucking_loads')
      .select('*')
      .eq('is_active', true)
      .ilike('destination_city', `%${destination_city}%`)
      .limit(10);
    
    if (!error && data && data.length > 0) {
      loads = data;
      searchStrategy = 'destination_only';
    }
  }

  // STRATEGY 4: Origin-only search
  if (loads.length === 0 && origin_city) {
    console.log('Strategy 4: Origin-only search:', origin_city);
    
    const { data, error } = await supabase
      .from('trucking_loads')
      .select('*')
      .eq('is_active', true)
      .ilike('origin_city', `%${origin_city}%`)
      .limit(10);
    
    if (!error && data && data.length > 0) {
      loads = data;
      searchStrategy = 'origin_only';
    }
  }

  // STRATEGY 5: Same-lane alternatives with state-level matching
  if (loads.length === 0 && (origin_city || destination_city)) {
    console.log('Strategy 5: Same-lane alternatives');
    
    let stateQuery = supabase
      .from('trucking_loads')
      .select('*')
      .eq('is_active', true);
    
    if (destination_city) {
      stateQuery = stateQuery.or(`destination_city.ilike.%${destination_city}%,destination_state.ilike.%${destination_city}%`);
    }
    if (origin_city) {
      stateQuery = stateQuery.or(`origin_city.ilike.%${origin_city}%,origin_state.ilike.%${origin_city}%`);
    }
    
    const { data, error } = await stateQuery.limit(10);
    
    if (!error && data && data.length > 0) {
      loads = data;
      searchStrategy = 'same_lane_alternatives';
    }
  }

  // STRATEGY 6: List all available loads if no criteria matched
  if (loads.length === 0) {
    console.log('Strategy 6: Listing all available loads');
    
    const { data, error } = await supabase
      .from('trucking_loads')
      .select('*')
      .eq('is_active', true)
      .order('pickup_date', { ascending: true })
      .limit(5);
    
    if (!error && data) {
      loads = data;
      searchStrategy = 'all_available';
    }
  }

  if (!loads || loads.length === 0) {
    return new Response(
      JSON.stringify({ 
        found: false, 
        message: "I don't have any loads available right now. What cities are you interested in? I can check for alternatives." 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // If multiple loads found, list them as options
  if (loads.length > 1) {
    const loadOptions = loads.map((l: any) => ({
      load_id: l.id,
      load_number: l.load_number,
      lane: `${l.origin_city}, ${l.origin_state} to ${l.destination_city}, ${l.destination_state}`,
      rate: Math.round(l.target_rate || 0),
      pickup_date: l.pickup_date,
      miles: l.miles
    }));
    
    const optionsText = loads.slice(0, 3).map((l: any) => 
      `Load ${l.load_number}: ${l.origin_city} to ${l.destination_city}, $${Math.round(l.target_rate || 0)}`
    ).join('. ');
    
    return new Response(
      JSON.stringify({
        found: true,
        multiple_loads: true,
        loads: loadOptions,
        search_strategy: searchStrategy,
        message: `I found ${loads.length} loads. ${optionsText}. Which one are you interested in?`
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Single load found - provide full details
  const load = loads[0];
  const rateText = formatRate(load);
  const distanceMiles = load.miles ? Math.round(load.miles) : null;
  const targetRate = load.target_rate ? Math.round(load.target_rate) : null;
  let ratePerMile: number | null = null;
  if (distanceMiles && distanceMiles > 0 && targetRate && targetRate > 0) {
    ratePerMile = targetRate / distanceMiles;
  }

  return new Response(
    JSON.stringify({
      found: true,
      load_id: load.id,
      load_number: load.load_number,
      origin: `${load.origin_city}, ${load.origin_state}`,
      destination: `${load.destination_city}, ${load.destination_state}`,
      pickup_date: load.pickup_date,
      pickup_window: `${load.pickup_window_start || 'TBD'} - ${load.pickup_window_end || 'TBD'}`,
      delivery_date: load.delivery_date,
      equipment_type: load.equipment_type || 'Dry Van',
      weight_lbs: load.weight_lbs,
      miles: distanceMiles,
      rate: rateText,
      target_rate: targetRate,
      floor_rate: load.floor_rate ? Math.round(load.floor_rate) : null,
      rate_per_mile: ratePerMile ? Math.round(ratePerMile * 100) / 100 : null,
      search_strategy: searchStrategy,
      message: buildLoadMessage(load, distanceMiles, targetRate, ratePerMile)
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleNegotiateRate(supabase: any, body: any) {
  const { load_id, carrier_offer } = body;
  
  console.log("[negotiate_rate] Negotiating rate:", { load_id, carrier_offer });

  if (!load_id) {
    return new Response(
      JSON.stringify({ success: false, message: "Load ID is required for negotiation." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { data: load, error: loadError } = await supabase
    .from('trucking_loads')
    .select('*')
    .eq('id', load_id)
    .single();

  if (loadError || !load) {
    console.error("[negotiate_rate] Load not found:", loadError);
    return new Response(
      JSON.stringify({ success: false, message: "Could not find the specified load." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const targetRate = Math.round(load.target_rate || 0);
  const ceilingRate = Math.round(load.floor_rate || targetRate);
  const INCREMENT = 25;
  const offerAmount = Math.round(parseFloat(carrier_offer) || 0);
  
  let counterOffer = targetRate;
  let shouldAccept = false;
  let message = "";

  if (offerAmount > 0 && offerAmount <= ceilingRate) {
    shouldAccept = true;
    counterOffer = offerAmount;
    message = `$${offerAmount} works for us! Let's book this load right now.`;
  } else if (offerAmount > ceilingRate && offerAmount <= targetRate) {
    shouldAccept = true;
    counterOffer = offerAmount;
    message = `That rate of $${offerAmount} works for us. Let's get this load booked!`;
  } else if (offerAmount > targetRate) {
    counterOffer = Math.max(offerAmount - INCREMENT, targetRate);
    shouldAccept = false;
    message = `I can do $${counterOffer}. That's a fair rate for this lane.`;
  } else if (offerAmount === 0) {
    counterOffer = targetRate;
    message = `The all-in rate for this load is $${targetRate}.`;
  } else {
    counterOffer = targetRate;
    message = `Our rate for this load is $${targetRate}.`;
  }

  return new Response(
    JSON.stringify({
      success: true,
      load_id: load.id,
      load_number: load.load_number,
      carrier_offer: offerAmount,
      counter_offer: counterOffer,
      target_rate: targetRate,
      ceiling_rate: ceilingRate,
      should_accept: shouldAccept,
      increment_amount: INCREMENT,
      message: message
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleCreateLead(supabase: any, body: any) {
  const { 
    load_id, 
    load_number, // Also accept load_number directly
    company_name, 
    mc_number, 
    contact_name, 
    phone, 
    rate_offered 
  } = body;

  console.log("[create_lead] Creating lead:", { load_id, load_number, company_name, mc_number, contact_name, phone, rate_offered });

  // CRITICAL: Phone number is REQUIRED
  if (!phone) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        requires_phone: true,
        message: "I need a callback number to proceed. What's the best number to reach you at?" 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Need either load_id (UUID) or load_number to identify the load
  const loadIdentifier = load_id || load_number;
  if (!loadIdentifier) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        requires_load_confirmation: true,
        message: "Which load would you like to book? Please confirm the load number or the cities." 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Check if load_id is a valid UUID (36 chars with dashes)
  const isUUID = typeof loadIdentifier === 'string' && 
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(loadIdentifier);

  let load = null;
  let loadError = null;

  if (isUUID) {
    // Search by UUID directly
    console.log("[create_lead] Searching by UUID:", loadIdentifier);
    const result = await supabase
      .from('trucking_loads')
      .select('*, trucking_profiles!trucking_loads_owner_id_fkey(auto_notify_email, contact_name, company_name)')
      .eq('id', loadIdentifier)
      .single();
    load = result.data;
    loadError = result.error;
  } else {
    // Search by load_number (ElevenLabs likely passes load_number, not UUID)
    const normalizedLoadNumber = String(loadIdentifier).replace(/[^a-zA-Z0-9]/g, '');
    console.log("[create_lead] Searching by load_number:", normalizedLoadNumber);
    const result = await supabase
      .from('trucking_loads')
      .select('*, trucking_profiles!trucking_loads_owner_id_fkey(auto_notify_email, contact_name, company_name)')
      .ilike('load_number', `%${normalizedLoadNumber}%`)
      .limit(1)
      .single();
    load = result.data;
    loadError = result.error;
  }

  if (loadError || !load) {
    console.error("[create_lead] Load not found:", loadError);
    return new Response(
      JSON.stringify({ success: false, message: "Could not find the specified load." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Create the carrier lead - MC is NULLABLE
  // CRITICAL: Use load.id (the actual UUID from DB lookup), NOT load_id (the input which might be a load_number string)
  const { data: lead, error: leadError } = await supabase
    .from('trucking_carrier_leads')
    .insert({
      owner_id: load.owner_id,
      load_id: load.id, // Use the actual UUID from the database, not the input parameter
      company_name: company_name || 'Unknown Company',
      mc_number: mc_number || null, // MC is optional
      contact_name: contact_name,
      phone: phone, // REQUIRED
      rate_offered: rate_offered || load.target_rate,
      status: 'interested',
      source: 'ai_call',
      notes: `AI agent booking. Load #${load.load_number}. Rate: $${rate_offered || load.target_rate}${!mc_number ? ' | MC pending - dispatch to confirm' : ''}`,
      mc_pending: !mc_number
    })
    .select()
    .single();

  if (leadError) {
    console.error("[create_lead] Error creating lead:", leadError);
    return new Response(
      JSON.stringify({ success: false, message: "Error creating lead. Please try again." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  console.log("[create_lead] Lead created:", lead.id);

  // Send email notification to broker
  await sendBrokerNotification(load, lead, company_name, mc_number, contact_name, phone, rate_offered);

  // Build response based on what info was collected
  let responseMessage = `Great! I've notified our broker about your interest in load ${load.load_number}. They will call you back at ${phone}`;
  if (!mc_number) {
    responseMessage += `. They'll also confirm your MC number on the callback`;
  }
  responseMessage += `. Is there anything else I can help you with?`;

  return new Response(
    JSON.stringify({
      success: true,
      lead_id: lead.id,
      mc_collected: !!mc_number,
      phone_collected: true,
      message: responseMessage
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// NEW: Separate log_call action - called unconditionally at end of every call
async function handleLogCall(supabase: any, body: any) {
  const { 
    caller_phone,
    load_id,
    lead_id,
    duration_seconds,
    outcome,
    transcript,
    summary,
    confirmed_load_number,
    final_rate,
    phone_captured,
    conversation_id
  } = body;

  console.log("[log_call] Logging call:", { caller_phone, load_id, lead_id, outcome });

  // Get owner_id from lead or load
  let owner_id = null;
  
  if (lead_id) {
    const { data: lead } = await supabase
      .from('trucking_carrier_leads')
      .select('owner_id')
      .eq('id', lead_id)
      .single();
    if (lead) owner_id = lead.owner_id;
  }
  
  if (!owner_id && load_id) {
    const { data: load } = await supabase
      .from('trucking_loads')
      .select('owner_id')
      .eq('id', load_id)
      .single();
    if (load) owner_id = load.owner_id;
  }
  
  // Fallback to default owner
  if (!owner_id) {
    const { data: anyOwner } = await supabase
      .from('trucking_loads')
      .select('owner_id')
      .limit(1)
      .single();
    if (anyOwner) owner_id = anyOwner.owner_id;
  }

  // Determine outcome - mark incomplete if no phone captured
  let finalOutcome = outcome || 'completed';
  if (!phone_captured && !lead_id) {
    finalOutcome = 'incomplete_no_phone';
  }

  const callLogData = {
    owner_id,
    load_id: load_id || null,
    caller_number: caller_phone || null,
    call_started_at: new Date().toISOString(),
    call_ended_at: new Date().toISOString(),
    duration_seconds: duration_seconds || 0,
    outcome: finalOutcome,
    transcript: transcript || null,
    ai_summary: summary || null,
    elevenlabs_conversation_id: conversation_id || null,
    is_demo: false,
    confirmed_load_number: confirmed_load_number || null,
    final_rate: final_rate || null,
    phone_captured: !!caller_phone,
    lead_created: !!lead_id
  };

  const { data: callLog, error } = await supabase
    .from('trucking_call_logs')
    .insert(callLogData)
    .select()
    .single();

  if (error) {
    console.error("[log_call] Error:", error);
    // Don't fail - still return success to not block call termination
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        message: "Call log failed but call can end." 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Update lead with call_log_id if applicable
  if (lead_id && callLog) {
    await supabase
      .from('trucking_carrier_leads')
      .update({ call_log_id: callLog.id })
      .eq('id', lead_id);
  }

  console.log("[log_call] Call logged:", callLog.id);

  return new Response(
    JSON.stringify({
      success: true,
      call_log_id: callLog.id,
      message: "Call logged successfully."
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// NEW: Confirm booking action - REQUIRED before ending call if multiple loads discussed
async function handleConfirmBooking(supabase: any, body: any) {
  const { 
    load_id,
    load_number,
    origin,
    destination,
    final_rate,
    phone,
    mc_number
  } = body;

  console.log("[confirm_booking] Confirming booking:", { load_id, load_number, origin, destination, final_rate });

  // Phone is REQUIRED before confirming
  if (!phone) {
    return new Response(
      JSON.stringify({
        success: false,
        confirmed: false,
        requires_phone: true,
        message: "Before I can confirm, I need your callback number. What's the best number to reach you at?"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Load must be specified
  if (!load_id && !load_number) {
    return new Response(
      JSON.stringify({
        success: false,
        confirmed: false,
        requires_load_selection: true,
        message: "Which load are you booking? Please confirm the load number or tell me the cities again."
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Look up load details if we only have load_number
  let loadDetails = null;
  if (load_id) {
    const { data } = await supabase
      .from('trucking_loads')
      .select('id, load_number, origin_city, origin_state, destination_city, destination_state, target_rate')
      .eq('id', load_id)
      .single();
    loadDetails = data;
  } else if (load_number) {
    const normalizedLoadNumber = String(load_number).replace(/[^a-zA-Z0-9]/g, '');
    const { data } = await supabase
      .from('trucking_loads')
      .select('id, load_number, origin_city, origin_state, destination_city, destination_state, target_rate')
      .ilike('load_number', `%${normalizedLoadNumber}%`)
      .limit(1)
      .single();
    loadDetails = data;
  }

  if (!loadDetails) {
    return new Response(
      JSON.stringify({
        success: false,
        confirmed: false,
        message: "I couldn't find that load. Can you tell me the cities again so I can confirm?"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Generate confirmation message
  const confirmMessage = `Just to confirm: We are proceeding with load ${loadDetails.load_number} from ${loadDetails.origin_city}, ${loadDetails.origin_state} to ${loadDetails.destination_city}, ${loadDetails.destination_state} at $${Math.round(final_rate || loadDetails.target_rate)}. Is that correct?`;

  return new Response(
    JSON.stringify({
      success: true,
      confirmed: true,
      load_id: loadDetails.id,
      load_number: loadDetails.load_number,
      origin: `${loadDetails.origin_city}, ${loadDetails.origin_state}`,
      destination: `${loadDetails.destination_city}, ${loadDetails.destination_state}`,
      final_rate: Math.round(final_rate || loadDetails.target_rate),
      phone_captured: !!phone,
      mc_captured: !!mc_number,
      confirmation_message: confirmMessage,
      message: confirmMessage
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleSaveTranscript(supabase: any, body: any) {
  const { 
    owner_id,
    load_id, 
    call_log_id,
    caller_phone,
    transcript_text, 
    summary,
    sentiment,
    key_topics,
    negotiation_outcome,
    rate_discussed,
    duration_seconds
  } = body;

  console.log("[save_transcript] Saving transcript:", { owner_id, load_id, caller_phone, duration_seconds });

  if (!transcript_text) {
    return new Response(
      JSON.stringify({ success: false, message: "Transcript text is required." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  let finalOwnerId = owner_id;
  if (!finalOwnerId && load_id) {
    const { data: load } = await supabase
      .from('trucking_loads')
      .select('owner_id')
      .eq('id', load_id)
      .single();
    finalOwnerId = load?.owner_id;
  }

  if (!finalOwnerId) {
    console.error("[save_transcript] No owner_id could be determined");
    return new Response(
      JSON.stringify({ success: false, message: "Could not determine owner for transcript." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { data: transcript, error: transcriptError } = await supabase
    .from('trucking_call_transcripts')
    .insert({
      owner_id: finalOwnerId,
      load_id: load_id || null,
      call_log_id: call_log_id || null,
      caller_phone: caller_phone,
      transcript_text: transcript_text,
      summary: summary || null,
      sentiment: sentiment || null,
      key_topics: key_topics || null,
      negotiation_outcome: negotiation_outcome || null,
      rate_discussed: rate_discussed ? Math.round(rate_discussed) : null,
      duration_seconds: duration_seconds || null,
    })
    .select()
    .single();

  if (transcriptError) {
    console.error("[save_transcript] Error saving transcript:", transcriptError);
    return new Response(
      JSON.stringify({ success: false, message: "Error saving transcript." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  console.log("[save_transcript] Transcript saved:", transcript.id);

  return new Response(
    JSON.stringify({
      success: true,
      transcript_id: transcript.id,
      message: "Transcript saved successfully for learning and analytics."
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function sendBrokerNotification(
  load: any, 
  lead: any, 
  companyName: string, 
  mcNumber: string, 
  contactName: string, 
  phone: string, 
  rateOffered: number
) {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const brokerEmail = "stephen@dltransport.com";

  if (!resendApiKey) {
    console.log("[sendBrokerNotification] RESEND_API_KEY not configured, skipping email");
    return;
  }

  try {
    const resend = new Resend(resendApiKey);

    const mcPendingNote = !mcNumber ? `
      <div style="background-color: #fef3c7; padding: 10px; border-radius: 4px; margin: 10px 0;">
        <strong>⚠️ MC Number Pending:</strong> Please confirm MC on callback.
      </div>
    ` : '';

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
          🚚 New Load Booking Request
        </h1>
        
        ${mcPendingNote}
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="margin-top: 0; color: #1f2937;">Load Details</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">Load Number:</td>
              <td style="padding: 8px 0; color: #1f2937;">${load.load_number}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">Origin:</td>
              <td style="padding: 8px 0; color: #1f2937;">${load.origin_city}, ${load.origin_state}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">Destination:</td>
              <td style="padding: 8px 0; color: #1f2937;">${load.destination_city}, ${load.destination_state}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">Pickup Date:</td>
              <td style="padding: 8px 0; color: #1f2937;">${load.pickup_date || 'TBD'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">Target Rate:</td>
              <td style="padding: 8px 0; color: #1f2937;">$${load.target_rate}</td>
            </tr>
          </table>
        </div>
        
        <div style="background-color: #dcfce7; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="margin-top: 0; color: #166534;">Carrier Information</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #166534;">Company:</td>
              <td style="padding: 8px 0; color: #1f2937;">${companyName || 'Not provided'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #166534;">MC Number:</td>
              <td style="padding: 8px 0; color: #1f2937;">${mcNumber || '⚠️ PENDING - Confirm on callback'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #166534;">Contact:</td>
              <td style="padding: 8px 0; color: #1f2937;">${contactName || 'Not provided'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #166534;">Phone:</td>
              <td style="padding: 8px 0; color: #1f2937; font-size: 18px; font-weight: bold;">
                <a href="tel:${phone}" style="color: #2563eb;">${phone || 'Not provided'}</a>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #166534;">Rate Offered:</td>
              <td style="padding: 8px 0; color: #1f2937; font-size: 18px; font-weight: bold;">$${rateOffered || load.target_rate}</td>
            </tr>
          </table>
        </div>
        
        <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <p style="margin: 0; color: #92400e;">
            <strong>⏰ Action Required:</strong> The carrier is expecting a call back to confirm this booking.
          </p>
        </div>
        
        <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
          This notification was sent by the D&L AI Trucking Agent.
        </p>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: "D&L Trucking AI <onboarding@resend.dev>",
      to: [brokerEmail],
      subject: `🚚 New Booking Request - Load ${load.load_number} - ${companyName || 'Carrier'}${!mcNumber ? ' [MC PENDING]' : ''}`,
      html: emailHtml,
    });

    if (error) {
      console.error("[sendBrokerNotification] Email error:", error);
    } else {
      console.log("[sendBrokerNotification] Email sent successfully:", data);
    }
  } catch (error) {
    console.error("[sendBrokerNotification] Error sending email:", error);
  }
}

function formatRate(load: any): string {
  if (load.rate_unit === 'per_mile' && load.miles) {
    const flatRate = Math.round(load.target_rate * load.miles);
    const perMile = Math.round(load.target_rate);
    return `$${flatRate} flat ($${perMile}/mile)`;
  }
  return `$${Math.round(load.target_rate || 0)} flat`;
}

function buildLoadMessage(load: any, distanceMiles: number | null, targetRate: number | null, ratePerMile: number | null): string {
  let msg = `I found load ${load.load_number}. `;
  msg += `It goes from ${load.origin_city}, ${load.origin_state} to ${load.destination_city}, ${load.destination_state}. `;
  
  if (distanceMiles) {
    msg += `About ${Math.round(distanceMiles)} miles. `;
  }
  
  msg += `Pickup is ${load.pickup_date || 'TBD'}. `;
  
  if (load.weight_lbs) {
    msg += `Weight is ${load.weight_lbs.toLocaleString()} pounds. `;
  }
  
  msg += `${load.equipment_type || 'Dry Van'}. `;
  
  if (targetRate) {
    const roundedRate = Math.round(targetRate);
    msg += `The all-in rate is $${roundedRate}. `;
    if (ratePerMile && distanceMiles) {
      const roundedRpm = Math.round(ratePerMile * 100) / 100;
      msg += `That's about $${roundedRpm.toFixed(2)} per mile. `;
    }
  }
  
  msg += `Does this sound like the load you're looking for?`;
  
  return msg;
}

// HIGH INTENT KEYWORD HANDLERS

async function handleCheckHighIntent(supabase: any, body: any) {
  const { text, load_number, origin_city, destination_city } = body;
  
  console.log("[check_high_intent] Checking:", { text, load_number, origin_city, destination_city });

  // Get all active (non-expired) high intent keywords
  const { data: keywords, error } = await supabase
    .from('trucking_high_intent_keywords')
    .select('*')
    .gte('expires_at', new Date().toISOString());

  if (error || !keywords || keywords.length === 0) {
    return new Response(
      JSON.stringify({ 
        is_high_intent: false, 
        message: null 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Check if any keyword matches
  const textLower = (text || '').toLowerCase();
  const loadNumberLower = (load_number || '').toLowerCase();
  const originLower = (origin_city || '').toLowerCase();
  const destLower = (destination_city || '').toLowerCase();

  let matchedKeyword = null;
  let matchedLoadId = null;

  for (const kw of keywords) {
    const kwLower = kw.keyword.toLowerCase();
    
    // Check against text (full transcript)
    if (textLower.includes(kwLower)) {
      matchedKeyword = kw;
      matchedLoadId = kw.load_id;
      break;
    }
    
    // Check against specific fields
    if (kw.keyword_type === 'load_number' && loadNumberLower.includes(kwLower)) {
      matchedKeyword = kw;
      matchedLoadId = kw.load_id;
      break;
    }
    if (kw.keyword_type === 'origin_city' && originLower.includes(kwLower)) {
      matchedKeyword = kw;
      matchedLoadId = kw.load_id;
      break;
    }
    if (kw.keyword_type === 'destination_city' && destLower.includes(kwLower)) {
      matchedKeyword = kw;
      matchedLoadId = kw.load_id;
      break;
    }
  }

  if (matchedKeyword) {
    console.log("[check_high_intent] MATCH FOUND:", matchedKeyword.keyword);
    
    const premiumResponse = "Congratulations! This is a premium load. Please provide your company name and phone number, and one of our dispatchers will call you right back.";
    
    return new Response(
      JSON.stringify({ 
        is_high_intent: true, 
        matched_keyword: matchedKeyword.keyword,
        keyword_type: matchedKeyword.keyword_type,
        load_id: matchedLoadId,
        message: premiumResponse,
        response_override: premiumResponse
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ 
      is_high_intent: false, 
      message: null 
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleGetHighIntentKeywords(supabase: any) {
  console.log("[get_high_intent_keywords] Fetching active keywords");

  const { data: keywords, error } = await supabase
    .from('trucking_high_intent_keywords')
    .select('keyword, keyword_type, load_id')
    .gte('expires_at', new Date().toISOString());

  if (error) {
    console.error("[get_high_intent_keywords] Error:", error);
    return new Response(
      JSON.stringify({ keywords: [], error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Return keywords grouped by type for easy ElevenLabs integration
  const keywordList = (keywords || []).map((k: any) => k.keyword);
  const byType: Record<string, string[]> = {
    origin_city: [],
    destination_city: [],
    load_number: [],
    custom: []
  };

  for (const kw of keywords || []) {
    if (byType[kw.keyword_type]) {
      byType[kw.keyword_type].push(kw.keyword);
    }
  }

  return new Response(
    JSON.stringify({ 
      keywords: keywordList,
      by_type: byType,
      count: keywordList.length,
      premium_response: "Congratulations! This is a premium load. Please provide your company name and phone number, and one of our dispatchers will call you right back."
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
