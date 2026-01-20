import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { owner_id, timezone = 'America/Chicago' } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get today's date in specified timezone
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    
    console.log('=== GENERATING TRUCKING DAILY BRIEF ===');
    console.log('Owner ID:', owner_id);
    console.log('Date:', today.toISOString());

    // 1. Get all call logs for today
    const { data: calls, error: callsError } = await supabase
      .from('trucking_call_logs')
      .select('*')
      .eq('owner_id', owner_id)
      .eq('is_demo', false)
      .gte('call_started_at', startOfDay.toISOString())
      .order('call_started_at', { ascending: false });

    if (callsError) {
      console.error('Error fetching calls:', callsError);
      throw callsError;
    }

    console.log('Total calls today:', calls?.length || 0);

    // 2. Get load statistics
    const { data: loads, error: loadsError } = await supabase
      .from('trucking_loads')
      .select('id, status, load_number, origin_city, origin_state, destination_city, destination_state, target_rate, floor_rate')
      .eq('owner_id', owner_id);

    if (loadsError) {
      console.error('Error fetching loads:', loadsError);
      throw loadsError;
    }

    // 3. Get leads created today
    const { data: leads, error: leadsError } = await supabase
      .from('trucking_carrier_leads')
      .select('*')
      .eq('owner_id', owner_id)
      .gte('created_at', startOfDay.toISOString());

    if (leadsError) {
      console.error('Error fetching leads:', leadsError);
      throw leadsError;
    }

    // Calculate analytics
    const totalCalls = calls?.length || 0;
    const answeredCalls = calls?.filter(c => c.outcome !== 'missed' && c.outcome !== 'voicemail').length || 0;
    const missedCalls = calls?.filter(c => c.outcome === 'missed').length || 0;
    const voicemails = calls?.filter(c => c.outcome === 'voicemail' || c.routed_to_voicemail).length || 0;
    
    // Duration analytics
    const callsWithDuration = calls?.filter(c => c.duration_seconds && c.duration_seconds > 0) || [];
    const avgCallSeconds = callsWithDuration.length > 0 
      ? Math.round(callsWithDuration.reduce((sum, c) => sum + (c.duration_seconds || 0), 0) / callsWithDuration.length)
      : 0;
    const quickHangups = calls?.filter(c => c.duration_seconds && c.duration_seconds < 30).length || 0;
    const longCalls = calls?.filter(c => c.duration_seconds && c.duration_seconds > 120).length || 0;
    
    // Outcome analytics
    const completedCalls = calls?.filter(c => c.call_outcome === 'completed' || c.outcome === 'completed').length || 0;
    const callbackRequested = calls?.filter(c => c.call_outcome === 'callback_requested' || c.outcome === 'callback_requested').length || 0;
    const declinedCalls = calls?.filter(c => c.call_outcome === 'declined' || c.outcome === 'declined').length || 0;
    const confirmedCalls = calls?.filter(c => c.call_outcome === 'confirmed' || c.outcome === 'confirmed').length || 0;

    // Load analytics
    const openLoads = loads?.filter(l => l.status === 'open').length || 0;
    const pendingLoads = loads?.filter(l => l.status === 'pending').length || 0;
    const confirmedLoads = loads?.filter(l => l.status === 'confirmed').length || 0;
    const loadsWithCalls = new Set(calls?.map(c => c.load_id).filter(Boolean)).size;

    // Extract transcripts for AI analysis
    const transcriptsForAnalysis = calls
      ?.filter(c => c.transcript && c.transcript.length > 50)
      .slice(0, 10) // Limit to 10 most recent transcripts
      .map(c => ({
        outcome: c.call_outcome || c.outcome,
        duration: c.duration_seconds,
        transcript: c.transcript?.substring(0, 1000) // Limit each transcript
      })) || [];

    console.log('Analytics computed:', {
      totalCalls, answeredCalls, missedCalls, voicemails,
      avgCallSeconds, quickHangups, longCalls,
      completedCalls, callbackRequested, declinedCalls, confirmedCalls,
      openLoads, pendingLoads, confirmedLoads
    });

    // Build AI prompt
    const systemPrompt = `You are an AI sales analyst for a trucking freight brokerage. 
Your job is to analyze daily call performance and provide actionable insights.
Focus on:
- Call volume and answer rates
- Call duration patterns (quick hangups indicate disinterest, long calls indicate engagement)
- Outcome patterns (completed, callback requested, declined, confirmed)
- Lead generation effectiveness
- Load booking success rates
- Specific recommendations to improve close rates

Be concise, data-driven, and focus on actionable insights.
Keep the executive summary to 5-6 sentences max.
Provide max 6 insights and max 6 short-term recommendations.`;

    const userPrompt = `Generate a daily sales brief for today's trucking operations.

TODAY'S METRICS:
- Total Calls: ${totalCalls}
- Answered: ${answeredCalls} | Missed: ${missedCalls} | Voicemails: ${voicemails}
- Average Call Duration: ${avgCallSeconds} seconds
- Quick Hangups (<30s): ${quickHangups}
- Long Calls (>2min): ${longCalls}

CALL OUTCOMES:
- Completed: ${completedCalls}
- Callback Requested: ${callbackRequested}
- Declined: ${declinedCalls}
- Confirmed Bookings: ${confirmedCalls}

LOAD STATUS:
- Open Loads: ${openLoads}
- Pending (awaiting confirmation): ${pendingLoads}
- Confirmed Bookings: ${confirmedLoads}
- Loads with Call Activity: ${loadsWithCalls}

LEADS CREATED TODAY: ${leads?.length || 0}

${transcriptsForAnalysis.length > 0 ? `
SAMPLE CALL TRANSCRIPTS (for context):
${transcriptsForAnalysis.map((t, i) => `
Call ${i + 1} (${t.outcome}, ${t.duration}s):
${t.transcript}
`).join('\n')}
` : ''}

Return your response as JSON with this exact structure:
{
  "executive_summary": "5-6 sentence summary of the day's performance focusing on sales impact",
  "insights": [
    {"category": "calls|engagement|conversion|rates", "title": "short title", "detail": "explanation", "impact": "high|medium|low"}
  ],
  "short_term_recs": [
    {"priority": 1, "action": "specific recommendation", "expected_impact": "what this will improve"}
  ],
  "flags": [
    {"type": "warning|success|info", "message": "any alerts or notable patterns"}
  ],
  "long_term_index": {
    "close_rate_trend": "improving|stable|declining",
    "engagement_quality": "high|medium|low",
    "rate_acceptance": "strong|moderate|weak"
  }
}`;

    console.log('Calling AI for analysis...');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content;
    console.log('AI response received');

    // Parse AI response
    let parsedBrief;
    try {
      const jsonMatch = aiContent.match(/```json\n?([\s\S]*?)\n?```/) || 
                        aiContent.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : aiContent;
      parsedBrief = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiContent);
      parsedBrief = {
        executive_summary: "Unable to generate summary - please check call data.",
        insights: [],
        short_term_recs: [],
        flags: [],
        long_term_index: { close_rate_trend: 'stable', engagement_quality: 'medium', rate_acceptance: 'moderate' }
      };
    }

    // Build per_load analysis
    const perLoadData = loads?.slice(0, 20).map(load => {
      const loadCalls = calls?.filter(c => c.load_id === load.id) || [];
      return {
        load_number: load.load_number,
        route: `${load.origin_city}, ${load.origin_state} → ${load.destination_city}, ${load.destination_state}`,
        status: load.status,
        call_count: loadCalls.length,
        outcomes: loadCalls.map(c => c.call_outcome || c.outcome),
        target_rate: load.target_rate,
        floor_rate: load.floor_rate
      };
    }) || [];

    // Store brief in database
    const dateLocal = today.toISOString().split('T')[0];
    
    const briefData = {
      owner_id,
      date_local: dateLocal,
      timezone,
      total_calls: totalCalls,
      answered_calls: answeredCalls,
      missed_calls: missedCalls,
      voicemails,
      avg_call_seconds: avgCallSeconds,
      avg_time_to_qualify_seconds: 0, // Could be calculated from first lead creation
      repeat_callers: 0, // Would need to track unique callers
      tech_issues_count: 0,
      loads_active: openLoads,
      loads_with_calls: loadsWithCalls,
      loads_confirmed: confirmedLoads,
      loads_declined: declinedCalls,
      loads_pending: pendingLoads,
      executive_summary: parsedBrief.executive_summary || '',
      insights: parsedBrief.insights || [],
      short_term_recs: parsedBrief.short_term_recs || [],
      long_term_index: parsedBrief.long_term_index || {},
      per_load: perLoadData,
      flags: parsedBrief.flags || [],
      source_window: { start: startOfDay.toISOString(), end: today.toISOString() },
      status: 'generated'
    };

    const { data: brief, error: briefError } = await supabase
      .from('ai_daily_briefs')
      .upsert(briefData, {
        onConflict: 'owner_id,date_local',
      })
      .select()
      .single();

    if (briefError) {
      console.error('Error storing brief:', briefError);
      throw briefError;
    }

    console.log('Brief stored successfully:', brief?.id);

    return new Response(JSON.stringify({ 
      success: true, 
      brief,
      metrics: {
        totalCalls,
        answeredCalls,
        avgCallSeconds,
        quickHangups,
        openLoads,
        confirmedLoads,
        leadsToday: leads?.length || 0
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Generate trucking daily brief error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
