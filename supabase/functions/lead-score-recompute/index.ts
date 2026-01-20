import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScoringRule {
  field: string;
  operator: string;
  value: string | number;
  points: number;
}

interface ScoreRequest {
  workspace_id?: string;
  lead_id?: string;
  batch_size?: number;
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

    const body: ScoreRequest = await req.json();
    console.log('Lead score recompute request:', body);

    const workspaceId = body.workspace_id;
    const leadId = body.lead_id;
    const batchSize = body.batch_size || 100;

    if (!workspaceId && !leadId) {
      return new Response(
        JSON.stringify({ error: 'workspace_id or lead_id required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get scoring rules for workspace
    let rulesQuery = supabase
      .from('lead_scoring_rules')
      .select('*')
      .eq('enabled', true);

    if (workspaceId) {
      rulesQuery = rulesQuery.eq('workspace_id', workspaceId);
    } else if (leadId) {
      // Get workspace from lead
      const { data: lead } = await supabase
        .from('lead_intel_leads')
        .select('workspace_id')
        .eq('id', leadId)
        .single();

      if (!lead) {
        return new Response(
          JSON.stringify({ error: 'Lead not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      rulesQuery = rulesQuery.eq('workspace_id', lead.workspace_id);
    }

    const { data: scoringRules, error: rulesError } = await rulesQuery.order('priority', { ascending: false });

    if (rulesError) {
      console.error('Failed to fetch scoring rules:', rulesError);
      throw new Error('Failed to fetch scoring rules');
    }

    // Get leads to score
    let leadsQuery = supabase
      .from('lead_intel_leads')
      .select('id, workspace_id, intent_score, status, tags');

    if (leadId) {
      leadsQuery = leadsQuery.eq('id', leadId);
    } else if (workspaceId) {
      leadsQuery = leadsQuery.eq('workspace_id', workspaceId).limit(batchSize);
    }

    const { data: leads, error: leadsError } = await leadsQuery;

    if (leadsError) {
      console.error('Failed to fetch leads:', leadsError);
      throw new Error('Failed to fetch leads');
    }

    if (!leads || leads.length === 0) {
      return new Response(
        JSON.stringify({ ok: true, processed: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const processedLeads: { id: string; old_score: number; new_score: number }[] = [];

    for (const lead of leads) {
      // Get events for this lead (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      
      const { data: events } = await supabase
        .from('lead_intel_events')
        .select('event_type, url, occurred_at, metadata')
        .eq('lead_id', lead.id)
        .gte('occurred_at', thirtyDaysAgo)
        .order('occurred_at', { ascending: false });

      // Calculate base score from events
      let score = 0;
      const eventCounts: Record<string, number> = {};
      
      if (events) {
        for (const event of events) {
          eventCounts[event.event_type] = (eventCounts[event.event_type] || 0) + 1;

          // Apply decay based on age
          const ageHours = (Date.now() - new Date(event.occurred_at).getTime()) / (1000 * 60 * 60);
          const decayFactor = Math.exp(-ageHours / (14 * 24)); // 14-day half-life default

          // Base points by event type
          let eventPoints = 0;
          switch (event.event_type) {
            case 'pageview':
              eventPoints = 1;
              break;
            case 'pricing_view':
              eventPoints = 10;
              break;
            case 'demo_click':
            case 'signup_start':
              eventPoints = 15;
              break;
            case 'form_submit':
              eventPoints = 20;
              break;
            case 'contact_click':
              eventPoints = 12;
              break;
            case 'warmly_enrichment':
            case 'opensend_identity':
              eventPoints = 10;
              break;
            default:
              eventPoints = 1;
          }

          score += eventPoints * decayFactor;
        }
      }

      // Apply custom scoring rules
      const workspaceRules = scoringRules?.filter(r => r.workspace_id === lead.workspace_id) || [];
      
      for (const ruleConfig of workspaceRules) {
        const rules = ruleConfig.rules as ScoringRule[];
        if (!Array.isArray(rules)) continue;

        for (const rule of rules) {
          let matches = false;

          // Check event-based rules
          if (rule.field.startsWith('event:')) {
            const eventType = rule.field.replace('event:', '');
            const count = eventCounts[eventType] || 0;
            
            switch (rule.operator) {
              case 'gte':
                matches = count >= Number(rule.value);
                break;
              case 'gt':
                matches = count > Number(rule.value);
                break;
              case 'eq':
                matches = count === Number(rule.value);
                break;
              case 'exists':
                matches = count > 0;
                break;
            }
          }

          // Check URL-based rules
          if (rule.field === 'url:contains' && events) {
            matches = events.some(e => e.url?.includes(String(rule.value)));
          }

          if (matches) {
            score += rule.points;
          }
        }
      }

      // Normalize to 0-100
      const newScore = Math.min(100, Math.max(0, Math.round(score)));

      // Update lead score
      await supabase
        .from('lead_intel_leads')
        .update({ intent_score: newScore, updated_at: new Date().toISOString() })
        .eq('id', lead.id);

      processedLeads.push({
        id: lead.id,
        old_score: lead.intent_score,
        new_score: newScore,
      });
    }

    console.log('Lead scoring complete:', { processed: processedLeads.length });

    return new Response(
      JSON.stringify({ 
        ok: true, 
        processed: processedLeads.length,
        leads: processedLeads,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Lead score recompute error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
