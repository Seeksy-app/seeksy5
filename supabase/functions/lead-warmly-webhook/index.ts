import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-warmly-signature',
};

interface WarmlyPayload {
  event_type: string;
  account_id?: string;
  workspace_id?: string;
  visitor?: {
    id?: string;
    email?: string;
    name?: string;
    title?: string;
    phone?: string;
  };
  company?: {
    name?: string;
    domain?: string;
    industry?: string;
    size?: string;
  };
  session?: {
    id?: string;
    page_url?: string;
    referrer?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
  };
  geo?: {
    country?: string;
    region?: string;
    city?: string;
  };
  confidence?: number;
  timestamp?: string;
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

    const payload: WarmlyPayload = await req.json();
    console.log('Warmly webhook received:', { event_type: payload.event_type, company: payload.company?.name });

    // Find workspace by provider account
    let workspaceId: string | null = null;
    const accountId = payload.account_id || payload.workspace_id;

    if (accountId) {
      const { data: provider } = await supabase
        .from('lead_providers')
        .select('workspace_id, webhook_secret')
        .eq('provider', 'warmly')
        .eq('external_account_id', accountId)
        .eq('status', 'connected')
        .single();

      if (provider) {
        workspaceId = provider.workspace_id;

        // Verify webhook signature if secret is set
        const signature = req.headers.get('x-warmly-signature');
        if (provider.webhook_secret && signature) {
          // In production, verify HMAC signature here
          console.log('Webhook signature present, would verify');
        }
      }
    }

    // Fallback: find any active warmly provider (single-tenant)
    if (!workspaceId) {
      const { data: fallbackProvider } = await supabase
        .from('lead_providers')
        .select('workspace_id')
        .eq('provider', 'warmly')
        .eq('status', 'connected')
        .limit(1)
        .single();

      if (fallbackProvider) {
        workspaceId = fallbackProvider.workspace_id;
        console.log('Using fallback workspace for Warmly:', workspaceId);
      }
    }

    if (!workspaceId) {
      console.log('No workspace found for Warmly webhook');
      return new Response(
        JSON.stringify({ error: 'No workspace configured for this account' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find or create lead
    const visitorId = payload.visitor?.id || payload.session?.id || crypto.randomUUID();
    
    const { data: existingLead } = await supabase
      .from('lead_intel_leads')
      .select('id, intent_score, confidence')
      .eq('workspace_id', workspaceId)
      .eq('external_id', visitorId)
      .single();

    let leadId: string;
    const hasContactData = Boolean(payload.visitor?.email || payload.visitor?.phone);

    if (existingLead) {
      leadId = existingLead.id;
      
      // Update lead with enrichment data
      const updateData: Record<string, unknown> = {
        last_seen_at: new Date().toISOString(),
        source: 'warmly',
      };

      if (payload.company?.name) updateData.company_name = payload.company.name;
      if (payload.company?.domain) updateData.company_domain = payload.company.domain;
      if (payload.company?.industry) updateData.company_industry = payload.company.industry;
      if (payload.company?.size) updateData.company_size = payload.company.size;
      if (payload.visitor?.name) updateData.person_name = payload.visitor.name;
      if (payload.visitor?.title) updateData.person_title = payload.visitor.title;
      if (payload.visitor?.email) updateData.email = payload.visitor.email;
      if (payload.visitor?.phone) updateData.phone = payload.visitor.phone;
      if (payload.geo) updateData.geo = payload.geo;
      if (payload.confidence) updateData.confidence = payload.confidence;
      if (payload.company) updateData.lead_type = 'b2b';

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
          source: 'warmly',
          lead_type: payload.company ? 'b2b' : 'unknown',
          company_name: payload.company?.name,
          company_domain: payload.company?.domain,
          company_industry: payload.company?.industry,
          company_size: payload.company?.size,
          person_name: payload.visitor?.name,
          person_title: payload.visitor?.title,
          email: payload.visitor?.email,
          phone: payload.visitor?.phone,
          geo: payload.geo || {},
          confidence: payload.confidence || 0,
          intent_score: hasContactData ? 25 : 10,
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
    if (payload.session?.page_url) {
      await supabase
        .from('lead_intel_events')
        .insert({
          workspace_id: workspaceId,
          lead_id: leadId,
          session_id: payload.session.id,
          event_type: payload.event_type || 'warmly_enrichment',
          url: payload.session.page_url,
          referrer: payload.session.referrer,
          utm: {
            source: payload.session.utm_source,
            medium: payload.session.utm_medium,
            campaign: payload.session.utm_campaign,
          },
          metadata: { provider: 'warmly', raw: payload },
          occurred_at: payload.timestamp || new Date().toISOString(),
        });
    }

    // Consume credits for identity match
    if (hasContactData && !existingLead) {
      await supabase.rpc('use_lead_credits', {
        _workspace_id: workspaceId,
        _event: 'warmly_identity_match',
        _units: 3,
        _meta: { lead_id: leadId },
      });
    } else if (payload.company && !existingLead) {
      await supabase.rpc('use_lead_credits', {
        _workspace_id: workspaceId,
        _event: 'warmly_company_match',
        _units: 1,
        _meta: { lead_id: leadId },
      });
    }

    // Create audit log
    await supabase
      .from('lead_audit_log')
      .insert({
        workspace_id: workspaceId,
        event: 'warmly_webhook_processed',
        target_type: 'lead',
        target_id: leadId,
        details: { 
          event_type: payload.event_type,
          has_contact: hasContactData,
          has_company: Boolean(payload.company),
        },
      });

    console.log('Warmly webhook processed:', { leadId, hasContactData });

    return new Response(
      JSON.stringify({ ok: true, lead_id: leadId }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Warmly webhook error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
