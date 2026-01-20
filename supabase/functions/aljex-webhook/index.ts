import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate webhook secret
    const webhookSecret = Deno.env.get('ALJEX_WEBHOOK_SECRET');
    const providedSecret = req.headers.get('x-webhook-secret');
    
    if (webhookSecret && providedSecret !== webhookSecret) {
      console.error('Invalid webhook secret');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const payload = await req.json();
    console.log('Received Aljex webhook payload:', JSON.stringify(payload).slice(0, 500));

    // Handle both single load and array of loads
    const loads = Array.isArray(payload) ? payload : (payload.loads || payload.shipments || [payload]);
    
    if (!loads.length) {
      return new Response(JSON.stringify({ error: 'No loads in payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get owner_id from query param or payload
    const url = new URL(req.url);
    const ownerId = url.searchParams.get('owner_id') || payload.owner_id;
    
    if (!ownerId) {
      return new Response(JSON.stringify({ error: 'owner_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const mappedLoads = loads.map((load: any) => ({
      owner_id: ownerId,
      external_load_id: load.load_id || load.shipment_id || load.pro_number || null,
      origin_city: load.origin_city || load.pickup_city || null,
      origin_state: load.origin_state || load.pickup_state || null,
      destination_city: load.destination_city || load.delivery_city || load.dest_city || null,
      destination_state: load.destination_state || load.delivery_state || load.dest_state || null,
      equipment_type: load.equipment_type || load.equipment || load.trailer_type || null,
      weight_lbs: parseFloat(load.weight) || parseFloat(load.weight_lbs) || null,
      pickup_date: load.pickup_date || load.ship_date || null,
      delivery_date: load.delivery_date || load.del_date || null,
      target_rate: parseFloat(load.rate) || parseFloat(load.target_rate) || parseFloat(load.line_haul) || null,
      ceiling_rate: parseFloat(load.ceiling_rate) || parseFloat(load.max_rate) || null,
      commodity: load.commodity || load.description || null,
      notes: load.notes || load.comments || null,
      status: 'open',
      is_demo: false,
    }));

    // Upsert loads (update if external_load_id exists, insert if new)
    const { data, error } = await supabase
      .from('trucking_loads')
      .upsert(mappedLoads, {
        onConflict: 'owner_id,external_load_id',
        ignoreDuplicates: false,
      })
      .select();

    if (error) {
      console.error('Database error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Successfully processed ${data?.length || 0} loads from Aljex`);

    return new Response(JSON.stringify({ 
      success: true, 
      processed: data?.length || 0,
      loads: data 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Aljex webhook error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
