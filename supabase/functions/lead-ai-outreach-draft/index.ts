import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OutreachRequest {
  workspace_id: string;
  lead_id: string;
  channel: 'email' | 'dm' | 'call_script';
  tone: 'friendly' | 'professional' | 'concise';
  use_pro_model?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableAiKey = Deno.env.get('LOVABLE_AI_KEY');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body: OutreachRequest = await req.json();
    const { workspace_id, lead_id, channel, tone, use_pro_model } = body;

    if (!workspace_id || !lead_id || !channel) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get lead source settings
    const { data: leadSource } = await supabase
      .from('lead_sources')
      .select('include_contact_in_ai, contact_level_enabled')
      .eq('workspace_id', workspace_id)
      .or('provider.eq.opensend,provider.eq.warmly')
      .single();

    const includeContactInAi = leadSource?.include_contact_in_ai === true && leadSource?.contact_level_enabled === true;

    // Get lead with identity and recent events
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select(`
        id,
        intent_score,
        status,
        first_seen_at,
        last_activity_at,
        identity:lead_identities!inner(
          id,
          display_name,
          identity_type,
          provider,
          contact_fields
        )
      `)
      .eq('id', lead_id)
      .eq('workspace_id', workspace_id)
      .single();

    if (leadError || !lead) {
      return new Response(JSON.stringify({ error: 'Lead not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get recent events for context
    const { data: events } = await supabase
      .from('lead_events')
      .select('event_type, occurred_at, page_url')
      .eq('lead_id', lead_id)
      .order('occurred_at', { ascending: false })
      .limit(10);

    // Build context for AI - NEVER include raw contact info unless explicitly allowed
    let contactContext = '';
    const identity = Array.isArray(lead.identity) ? lead.identity[0] : lead.identity;
    if (includeContactInAi && identity?.contact_fields) {
      const cf = identity.contact_fields as Record<string, string>;
      // Only allow email domain, not full email
      if (cf.email) {
        const domain = cf.email.split('@')[1];
        if (domain) {
          contactContext = `The lead appears to be from ${domain} organization.`;
        }
      }
      // NEVER include phone or address in AI context
    }

    // Build activity summary
    const activitySummary = events?.map(e => 
      `- ${e.event_type} on ${new Date(e.occurred_at).toLocaleDateString()}${e.page_url ? ` (${e.page_url})` : ''}`
    ).join('\n') || 'No recent activity recorded';

    // Tone instructions
    const toneInstructions: Record<string, string> = {
      friendly: 'Use a warm, approachable tone. Be conversational and personable.',
      professional: 'Use a professional, business-appropriate tone. Be clear and respectful.',
      concise: 'Keep the message brief and to the point. Focus on the key value proposition.',
    };

    // Channel-specific instructions
    const channelInstructions: Record<string, string> = {
      email: 'Write a professional email with subject line. Keep it under 150 words for the body.',
      dm: 'Write a short direct message suitable for LinkedIn or social media. Keep it under 100 words.',
      call_script: 'Write a brief call script with an opening, value prop, and ask. Include natural pause points.',
    };

    const systemPrompt = `You are an expert sales outreach copywriter for B2B technology services.
Your task is to draft outreach messages based on visitor activity signals.

CRITICAL PRIVACY RULES:
- NEVER include actual email addresses, phone numbers, or physical addresses in your output
- NEVER make up or guess personal contact information
- You may reference company/organization domains if provided
- Focus on the visitor's activity and intent signals, not personal details

${toneInstructions[tone] || toneInstructions.professional}
${channelInstructions[channel] || channelInstructions.email}`;

    const userPrompt = `Draft a ${channel} message for a lead with the following context:

Intent Score: ${lead.intent_score}/100 (${lead.intent_score >= 70 ? 'High intent' : lead.intent_score >= 40 ? 'Medium intent' : 'Low intent'})
First seen: ${new Date(lead.first_seen_at).toLocaleDateString()}
Last activity: ${new Date(lead.last_activity_at).toLocaleDateString()}
${contactContext}

Recent Activity:
${activitySummary}

Generate a compelling ${channel === 'email' ? 'email with subject line' : channel === 'dm' ? 'direct message' : 'call script'} that:
1. References their activity/interest without being creepy
2. Offers clear value
3. Has a specific call-to-action

Return your response as JSON with these fields:
- subject (for email only, null for others)
- body (the main message content)
- next_steps (array of 2-3 follow-up actions)`;

    // Call AI
    const model = use_pro_model ? 'openai/gpt-5' : 'openai/gpt-5-mini';
    
    const aiResponse = await fetch('https://ai.lovable.dev/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${lovableAiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', errorText);
      return new Response(JSON.stringify({ error: 'AI generation failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiResult = await aiResponse.json();
    const content = aiResult.choices?.[0]?.message?.content;
    
    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = {
        subject: null,
        body: content,
        next_steps: ['Review and personalize the message', 'Schedule follow-up'],
      };
    }

    // Bill credits
    const units = use_pro_model ? 20 : 8;
    const ledgerKey = `${workspace_id}_ai_outreach_${lead_id}_${Date.now()}`;
    
    await supabase
      .from('credits_ledger')
      .upsert({
        workspace_id,
        event_type: 'ai_outreach_draft',
        units,
        provider: 'ai',
        lead_id,
        occurred_at: new Date().toISOString(),
        ledger_key: ledgerKey,
        metadata: { channel, tone, model },
      }, {
        onConflict: 'ledger_key'
      });

    // Log the action
    await supabase
      .from('lead_actions')
      .insert({
        lead_id,
        action_type: 'ai_outreach_draft',
        performed_by: user.id,
        metadata: { channel, tone, model },
      });

    return new Response(JSON.stringify({
      success: true,
      channel,
      tone,
      draft: {
        subject: parsed.subject || null,
        body: parsed.body,
        next_steps: parsed.next_steps || [],
      },
      credits_used: units,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Lead AI outreach error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
