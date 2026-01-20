import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // ALWAYS return 200 with ok: true/false - never 500
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    console.log('=== CREATE LEAD CALLED ===');
    console.log('Raw body:', JSON.stringify(body, null, 2));

    // ElevenLabs sends parameters at top level OR nested
    const params = body.parameters || body;
    
    // Extract all possible fields - accept multiple phone field names
    const { 
      // OWNER ID - can be passed directly from ElevenLabs agent config
      owner_id: direct_owner_id,
      user_id,
      account_id,
      // Load identification
      load_id,
      load_number,
      company_name,
      rate_offered,
      // Accept ALL variations of phone field names
      callback_phone,    // PM preferred name
      contact_number,    // ElevenLabs config name
      phone,             // Alternative
      // Other fields
      mc_number,
      action,
      dot_number,
      contact_name,
      email,
      truck_type,
      rate_requested,
      notes 
    } = params;

    console.log('Parsed params:', { 
      load_id, 
      load_number,
      company_name, 
      rate_offered, 
      callback_phone,
      contact_number, 
      phone,
      mc_number, 
      action 
    });

    // Map any phone field to one value - callback_phone takes priority
    const phoneValue = callback_phone || contact_number || phone;

    // CRITICAL: Phone number is REQUIRED (MC is optional)
    if (!phoneValue) {
      console.error('Phone number is REQUIRED for lead creation');
      return new Response(JSON.stringify({
        ok: false,
        success: false,
        error: "callback_phone is required",
        requires_phone: true,
        message: "I need a callback number to proceed. What's the best number to reach you at?"
      }), {
        status: 200, // Always 200
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Use load_id from ElevenLabs (could be UUID or load_number string)
    const searchLoadIdentifier = load_id || load_number;
    
    // Find the load - check if it's a UUID or load_number
    let actualLoadId = null;
    // Use direct owner_id first if passed
    let owner_id = direct_owner_id || user_id || account_id || null;
    console.log('Direct owner_id from params:', owner_id);
    
    if (searchLoadIdentifier) {
      // Check if it's a valid UUID (36 chars with dashes)
      const isUUID = typeof searchLoadIdentifier === 'string' && 
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(searchLoadIdentifier);
      
      if (isUUID) {
        console.log('Searching for load by UUID:', searchLoadIdentifier);
        const { data: loadData, error: loadError } = await supabase
          .from('trucking_loads')
          .select('id, owner_id, load_number')
          .eq('id', searchLoadIdentifier)
          .maybeSingle();
        
        if (loadData) {
          actualLoadId = loadData.id;
          owner_id = owner_id || loadData.owner_id; // Keep direct owner_id if provided
          console.log('Found load by UUID:', loadData);
        } else {
          console.log('Load not found by UUID:', searchLoadIdentifier, loadError?.message);
        }
      } else {
        // Search by load_number (normalize by removing non-alphanumeric chars)
        const normalizedLoadNumber = String(searchLoadIdentifier).replace(/[^a-zA-Z0-9]/g, '');
        console.log('Searching for load by load_number:', normalizedLoadNumber);
        
        const { data: loadData, error: loadError } = await supabase
          .from('trucking_loads')
          .select('id, owner_id, load_number')
          .ilike('load_number', `%${normalizedLoadNumber}%`)
          .limit(1)
          .maybeSingle();
        
        if (loadData) {
          actualLoadId = loadData.id;
          owner_id = owner_id || loadData.owner_id; // Keep direct owner_id if provided
          console.log('Found load by load_number:', loadData);
        } else {
          console.log('Load not found by load_number:', normalizedLoadNumber, loadError?.message);
        }
      }
    }

    // If no load found but we need to create lead anyway, get default owner
    if (!owner_id) {
      const { data: defaultOwner } = await supabase
        .from('trucking_loads')
        .select('owner_id')
        .limit(1)
        .single();
      
      if (defaultOwner) {
        owner_id = defaultOwner.owner_id;
        console.log('Using default owner_id:', owner_id);
      }
    }

    // Use rate_offered from ElevenLabs, fallback to rate_requested
    const rateValue = rate_offered || rate_requested;

    // Create the lead - MC is NULLABLE, phone is REQUIRED
    const leadData = {
      owner_id,
      load_id: actualLoadId,
      company_name: company_name || null,
      mc_number: mc_number || null, // MC is optional
      dot_number: dot_number || null,
      contact_name: contact_name || company_name || null,
      phone: phoneValue, // REQUIRED
      email: email || null,
      truck_type: truck_type || null,
      rate_requested: rateValue ? parseFloat(String(rateValue).replace(/[^0-9.]/g, '')) : null,
      notes: notes || `Rate offered: ${rateValue || 'N/A'}${!mc_number ? ' | MC pending - dispatch to confirm' : ''}`,
      source: 'ai_voice_agent',
      status: 'new',
      is_confirmed: false,
      requires_callback: true,
      call_source: 'inbound',
      mc_pending: !mc_number
    };
    
    console.log('Creating lead with data:', JSON.stringify(leadData, null, 2));

    const { data: lead, error } = await supabase
      .from('trucking_carrier_leads')
      .insert(leadData)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return new Response(JSON.stringify({
        ok: false,
        success: false,
        error: error.message,
        message: "I couldn't save that lead. Let me get your callback number again."
      }), {
        status: 200, // Always 200
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Lead created successfully:', lead.id);

    // Build response message
    let responseMessage = `Great! I've recorded your interest`;
    if (actualLoadId) {
      responseMessage += ` in the load`;
    }
    responseMessage += `. Our broker will call you back at ${phoneValue}`;
    if (!mc_number) {
      responseMessage += `. They'll also confirm your MC number on the callback`;
    }
    responseMessage += `. Is there anything else I can help you with?`;

    return new Response(JSON.stringify({
      ok: true,
      success: true,
      message: responseMessage,
      lead_id: lead.id,
      mc_collected: !!mc_number,
      phone_collected: true
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('Error in ai-trucking-create-lead:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Never return 500 - always 200 with ok: false
    return new Response(JSON.stringify({
      ok: false,
      success: false,
      error: errorMessage,
      message: "I ran into a technical issue. Let me confirm your callback number so our broker can reach you."
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
