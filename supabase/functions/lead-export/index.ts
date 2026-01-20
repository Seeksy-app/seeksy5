import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExportRequest {
  workspace_id: string;
  filters?: {
    status?: string[];
    intent_min?: number;
    intent_max?: number;
    source?: string[];
    date_from?: string;
    date_to?: string;
    tags?: string[];
  };
  include_pii?: boolean;
  format?: 'csv' | 'json';
  lead_ids?: string[];
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

    // Get auth user
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: ExportRequest = await req.json();
    console.log('Lead export request:', { workspace_id: body.workspace_id, user_id: user.id });

    if (!body.workspace_id) {
      return new Response(
        JSON.stringify({ error: 'workspace_id required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check workspace access and PII permissions
    const { data: workspace } = await supabase
      .from('lead_workspaces')
      .select('id, mode, allow_pii_export, owner_user_id')
      .eq('id', body.workspace_id)
      .single();

    if (!workspace) {
      return new Response(
        JSON.stringify({ error: 'Workspace not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check user has access
    const isOwner = workspace.owner_user_id === user.id;
    const { data: membership } = await supabase
      .from('lead_workspace_memberships')
      .select('role')
      .eq('workspace_id', body.workspace_id)
      .eq('user_id', user.id)
      .single();

    if (!isOwner && !membership) {
      return new Response(
        JSON.stringify({ error: 'Access denied' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check PII export permission for agency mode
    const canExportPii = isOwner || (workspace.allow_pii_export && membership?.role !== 'viewer');
    const includePii = body.include_pii && canExportPii;

    // Check credits
    const { data: credits } = await supabase
      .from('lead_workspace_credits')
      .select('balance')
      .eq('workspace_id', body.workspace_id)
      .single();

    if (!credits || credits.balance < 5) {
      return new Response(
        JSON.stringify({ error: 'Insufficient credits for export' }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build query
    let query = supabase
      .from('lead_intel_leads')
      .select('*')
      .eq('workspace_id', body.workspace_id);

    // Apply filters
    if (body.lead_ids && body.lead_ids.length > 0) {
      query = query.in('id', body.lead_ids);
    }

    if (body.filters) {
      if (body.filters.status && body.filters.status.length > 0) {
        query = query.in('status', body.filters.status);
      }
      if (body.filters.intent_min !== undefined) {
        query = query.gte('intent_score', body.filters.intent_min);
      }
      if (body.filters.intent_max !== undefined) {
        query = query.lte('intent_score', body.filters.intent_max);
      }
      if (body.filters.source && body.filters.source.length > 0) {
        query = query.in('source', body.filters.source);
      }
      if (body.filters.date_from) {
        query = query.gte('first_seen_at', body.filters.date_from);
      }
      if (body.filters.date_to) {
        query = query.lte('first_seen_at', body.filters.date_to);
      }
      if (body.filters.tags && body.filters.tags.length > 0) {
        query = query.overlaps('tags', body.filters.tags);
      }
    }

    const { data: leads, error: leadsError } = await query.order('intent_score', { ascending: false });

    if (leadsError) {
      console.error('Failed to fetch leads:', leadsError);
      throw new Error('Failed to fetch leads');
    }

    // Process leads for export
    const exportData = leads?.map(lead => {
      const row: Record<string, unknown> = {
        id: lead.id,
        lead_type: lead.lead_type,
        company_name: lead.company_name,
        company_domain: lead.company_domain,
        company_industry: lead.company_industry,
        company_size: lead.company_size,
        person_name: lead.person_name,
        person_title: lead.person_title,
        source: lead.source,
        confidence: lead.confidence,
        intent_score: lead.intent_score,
        status: lead.status,
        tags: lead.tags?.join(', '),
        first_seen_at: lead.first_seen_at,
        last_seen_at: lead.last_seen_at,
      };

      // Include PII only if permitted
      if (includePii) {
        row.email = lead.email;
        row.phone = lead.phone;
        row.geo_country = lead.geo?.country;
        row.geo_city = lead.geo?.city;
      }

      return row;
    }) || [];

    // Consume credits
    await supabase.rpc('use_lead_credits', {
      _workspace_id: body.workspace_id,
      _event: 'lead_export',
      _units: 5,
      _meta: { lead_count: exportData.length, include_pii: includePii },
    });

    // Create audit log
    await supabase
      .from('lead_audit_log')
      .insert({
        workspace_id: body.workspace_id,
        actor_user_id: user.id,
        event: 'leads_exported',
        target_type: 'export',
        details: {
          lead_count: exportData.length,
          filters: body.filters,
          include_pii: includePii,
          format: body.format || 'json',
        },
      });

    // Create action record
    await supabase
      .from('lead_intel_actions')
      .insert({
        workspace_id: body.workspace_id,
        lead_id: leads?.[0]?.id, // First lead as reference
        action_type: 'export',
        payload: {
          lead_count: exportData.length,
          filters: body.filters,
        },
        status: 'sent',
        created_by: user.id,
      });

    // Return based on format
    if (body.format === 'csv') {
      // Generate CSV
      if (exportData.length === 0) {
        return new Response(
          '',
          { 
            status: 200, 
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'text/csv',
              'Content-Disposition': 'attachment; filename="leads.csv"',
            } 
          }
        );
      }

      const headers = Object.keys(exportData[0]);
      const csvRows = [
        headers.join(','),
        ...exportData.map(row => 
          headers.map(h => {
            const val = row[h];
            if (val === null || val === undefined) return '';
            const str = String(val);
            return str.includes(',') || str.includes('"') || str.includes('\n')
              ? `"${str.replace(/"/g, '""')}"`
              : str;
          }).join(',')
        ),
      ];

      return new Response(
        csvRows.join('\n'),
        { 
          status: 200, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="leads.csv"',
          } 
        }
      );
    }

    console.log('Lead export complete:', { count: exportData.length });

    return new Response(
      JSON.stringify({ 
        ok: true, 
        count: exportData.length,
        data: exportData,
        pii_included: includePii,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Lead export error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
