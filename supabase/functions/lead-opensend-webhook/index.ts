import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-opensend-signature',
};

interface OpenSendPayload {
  event_type?: string;
  email?: string;
  md5_email?: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  source_domain?: string;
  source_url?: string;
  user_geolocation?: {
    country?: string;
    region?: string;
    city?: string;
    postal_code?: string;
  };
  user_agent?: string;
  user_ip?: string;
  timestamp?: string;
  event_data?: Record<string, unknown>;
  oir_source?: string;
  account_id?: string;
  visitor_id?: string;
  anonymous_id?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload: OpenSendPayload = await req.json();
    console.log('OpenSend webhook received:', { 
      event_type: payload.event_type,
      source_domain: payload.source_domain,
      has_email: Boolean(payload.email),
    });

    // Find workspace by provider account or domain
    let workspaceId: string | null = null;

    if (payload.account_id) {
      const { data: provider } = await supabase
        .from('lead_providers')
        .select('workspace_id, webhook_secret')
        .eq('provider', 'opensend')
        .eq('external_account_id', payload.account_id)
        .eq('status', 'connected')
        .single();

      if (provider) {
        workspaceId = provider.workspace_id;
      }
    }

    // Try by domain
    if (!workspaceId && payload.source_domain) {
      const { data: domain } = await supabase
        .from('lead_domains')
        .select('workspace_id')
        .eq('domain', payload.source_domain)
        .eq('status', 'verified')
        .single();

      if (domain) {
        workspaceId = domain.workspace_id;
      }
    }

    // Fallback: any active opensend provider
    if (!workspaceId) {
      const { data: fallbackProvider } = await supabase
        .from('lead_providers')
        .select('workspace_id')
        .eq('provider', 'opensend')
        .eq('status', 'connected')
        .limit(1)
        .single();

      if (fallbackProvider) {
        workspaceId = fallbackProvider.workspace_id;
        console.log('Using fallback workspace for OpenSend:', workspaceId);
      }
    }

    if (!workspaceId) {
      console.log('No workspace found for OpenSend webhook');
      return new Response(
        JSON.stringify({ error: 'No workspace configured' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find or create lead
    const visitorId = payload.visitor_id || payload.anonymous_id || payload.md5_email || crypto.randomUUID();
    
    const { data: existingLead } = await supabase
      .from('lead_intel_leads')
      .select('id, intent_score, email')
      .eq('workspace_id', workspaceId)
      .eq('external_id', visitorId)
      .single();

    let leadId: string;
    const hasNewContactData = Boolean(payload.email || payload.phone);
    const isNewIdentity = hasNewContactData && (!existingLead || !existingLead.email);

    // Parse name
    const personName = payload.full_name || 
      (payload.first_name && payload.last_name 
        ? `${payload.first_name} ${payload.last_name}` 
        : payload.first_name || payload.last_name);

    if (existingLead) {
      leadId = existingLead.id;
      
      // Update lead with identity data
      const updateData: Record<string, unknown> = {
        last_seen_at: new Date().toISOString(),
        source: 'opensend',
      };

      if (payload.email && !existingLead.email) updateData.email = payload.email;
      if (payload.phone) updateData.phone = payload.phone;
      if (personName) updateData.person_name = personName;
      if (payload.user_geolocation) updateData.geo = payload.user_geolocation;
      
      // Boost intent and confidence for identity resolution
      if (isNewIdentity) {
        updateData.confidence = Math.min(100, (existingLead.intent_score || 0) + 30);
        updateData.intent_score = Math.min(100, (existingLead.intent_score || 0) + 20);
      }

      await supabase
        .from('lead_intel_leads')
        .update(updateData)
        .eq('id', leadId);

    } else {
      // Create new lead
      const { data: newLead, error: leadError } = await supabase
        .from('lead_intel_leads')
        .insert({
          workspace_id: workspaceId,
          external_id: visitorId,
          source: 'opensend',
          lead_type: 'b2c',
          email: payload.email,
          phone: payload.phone,
          person_name: personName,
          geo: payload.user_geolocation || {},
          confidence: payload.email ? 70 : 30,
          intent_score: hasNewContactData ? 30 : 10,
          metadata: {
            oir_source: payload.oir_source,
            user_agent: payload.user_agent,
          },
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
    await supabase
      .from('lead_intel_events')
      .insert({
        workspace_id: workspaceId,
        lead_id: leadId,
        session_id: payload.visitor_id || payload.anonymous_id,
        event_type: payload.event_type || 'opensend_identity',
        url: payload.source_url,
        metadata: { 
          provider: 'opensend',
          oir_source: payload.oir_source,
          event_data: payload.event_data,
        },
        occurred_at: payload.timestamp || new Date().toISOString(),
      });

    // Consume credits for new identity match
    if (isNewIdentity) {
      await supabase.rpc('use_lead_credits', {
        _workspace_id: workspaceId,
        _event: 'opensend_identity_match',
        _units: 3,
        _meta: { lead_id: leadId, has_email: Boolean(payload.email) },
      });
    }

    // Create audit log
    await supabase
      .from('lead_audit_log')
      .insert({
        workspace_id: workspaceId,
        event: 'opensend_webhook_processed',
        target_type: 'lead',
        target_id: leadId,
        details: { 
          event_type: payload.event_type,
          is_new_identity: isNewIdentity,
          source_domain: payload.source_domain,
        },
      });

    console.log('OpenSend webhook processed:', { leadId, isNewIdentity });

    return new Response(
      JSON.stringify({ ok: true, lead_id: leadId }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('OpenSend webhook error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
