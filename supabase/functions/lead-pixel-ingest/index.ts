import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PixelEvent {
  workspace_id?: string;
  domain: string;
  session_id: string;
  event_type: string;
  url: string;
  referrer?: string;
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  };
  metadata?: Record<string, unknown>;
  visitor_id?: string;
  timestamp?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse event data
    const event: PixelEvent = await req.json();
    console.log('Lead pixel event received:', { domain: event.domain, event_type: event.event_type });

    // Validate required fields
    if (!event.domain || !event.session_id || !event.event_type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: domain, session_id, event_type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find verified domain and workspace
    const { data: domainData, error: domainError } = await supabase
      .from('lead_domains')
      .select('id, workspace_id')
      .eq('domain', event.domain)
      .eq('status', 'verified')
      .single();

    if (domainError || !domainData) {
      console.log('Domain not found or not verified:', event.domain);
      return new Response(
        JSON.stringify({ error: 'Domain not verified', ok: false }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const workspaceId = domainData.workspace_id;
    const domainId = domainData.id;

    // Rate limiting: Check for suspicious activity from same session
    const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
    const { count: recentEvents } = await supabase
      .from('lead_intel_events')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', event.session_id)
      .gte('created_at', oneMinuteAgo);

    if (recentEvents && recentEvents > 30) {
      console.log('Rate limit exceeded for session:', event.session_id);
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded', ok: false }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find or create lead by session/visitor
    let leadId: string | null = null;
    const visitorIdentifier = event.visitor_id || event.session_id;

    // Try to find existing lead by external_id (visitor/session)
    const { data: existingLead } = await supabase
      .from('lead_intel_leads')
      .select('id, intent_score')
      .eq('workspace_id', workspaceId)
      .eq('external_id', visitorIdentifier)
      .single();

    if (existingLead) {
      leadId = existingLead.id;
      // Update last_seen_at
      await supabase
        .from('lead_intel_leads')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('id', leadId);
    } else {
      // Create new lead
      const { data: newLead, error: leadError } = await supabase
        .from('lead_intel_leads')
        .insert({
          workspace_id: workspaceId,
          domain_id: domainId,
          external_id: visitorIdentifier,
          source: 'pixel',
          lead_type: 'unknown',
          first_seen_at: new Date().toISOString(),
          last_seen_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (leadError) {
        console.error('Failed to create lead:', leadError);
        throw new Error('Failed to create lead');
      }
      leadId = newLead.id;
    }

    // Insert event
    const { error: eventError } = await supabase
      .from('lead_intel_events')
      .insert({
        workspace_id: workspaceId,
        lead_id: leadId,
        session_id: event.session_id,
        event_type: event.event_type,
        url: event.url,
        referrer: event.referrer,
        utm: event.utm || {},
        metadata: event.metadata || {},
        occurred_at: event.timestamp || new Date().toISOString(),
      });

    if (eventError) {
      console.error('Failed to insert event:', eventError);
      throw new Error('Failed to insert event');
    }

    // Calculate intent score based on event type
    let intentBoost = 0;
    switch (event.event_type) {
      case 'pageview':
        intentBoost = 1;
        break;
      case 'pricing_view':
        intentBoost = 10;
        break;
      case 'demo_click':
      case 'signup_start':
        intentBoost = 15;
        break;
      case 'form_submit':
        intentBoost = 20;
        break;
      case 'contact_click':
        intentBoost = 12;
        break;
      default:
        intentBoost = 1;
    }

    // Calculate new intent score (cap at 100)
    const currentScore = existingLead?.intent_score || 0;
    const newScore = Math.min(100, currentScore + intentBoost);
    
    await supabase
      .from('lead_intel_leads')
      .update({ intent_score: newScore })
      .eq('id', leadId);

    console.log('Lead pixel processed successfully:', { leadId, intent_score: newScore });

    return new Response(
      JSON.stringify({ 
        ok: true, 
        lead_id: leadId, 
        intent_score: newScore 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Lead pixel ingest error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', ok: false }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
