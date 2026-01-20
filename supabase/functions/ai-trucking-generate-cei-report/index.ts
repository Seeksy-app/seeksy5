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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { report_date } = await req.json();
    
    if (!report_date) {
      throw new Error('report_date is required (YYYY-MM-DD format)');
    }

    console.log('Generating CEI report for:', report_date);

    // Get all calls for the date
    const startOfDay = `${report_date}T00:00:00.000Z`;
    const endOfDay = `${report_date}T23:59:59.999Z`;

    const { data: calls, error: callsError } = await supabase
      .from('trucking_calls')
      .select('*')
      .gte('created_at', startOfDay)
      .lte('created_at', endOfDay)
      .order('created_at', { ascending: true });

    if (callsError) {
      throw new Error(`Failed to fetch calls: ${callsError.message}`);
    }

    const totalCalls = calls?.length || 0;
    
    if (totalCalls === 0) {
      // Create empty report
      const { data: report, error: reportError } = await supabase
        .from('trucking_daily_reports')
        .upsert({
          report_date,
          total_calls: 0,
          resolved_without_handoff_pct: 0,
          handoff_requested_pct: 0,
          lead_created_pct: 0,
          avg_cei_score: 0,
          cei_band_breakdown: { '90-100': 0, '75-89': 0, '50-74': 0, '25-49': 0, '0-24': 0 },
          top_frustration_phrases: [],
          top_success_signals: [],
          ai_summary_text: 'No calls recorded for this date.',
          ai_insights_json: {},
        }, { onConflict: 'report_date' })
        .select()
        .single();

      return new Response(JSON.stringify({ success: true, report }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculate stats
    const resolvedWithoutHandoff = calls.filter((c: any) => !c.handoff_requested).length;
    const handoffRequested = calls.filter((c: any) => c.handoff_requested).length;
    const leadCreated = calls.filter((c: any) => c.lead_created).length;
    const avgCeiScore = calls.reduce((sum: number, c: any) => sum + (c.cei_score || 0), 0) / totalCalls;

    const ceiBandBreakdown = calls.reduce((acc: Record<string, number>, c: any) => {
      const band = c.cei_band || '50-74';
      acc[band] = (acc[band] || 0) + 1;
      return acc;
    }, { '90-100': 0, '75-89': 0, '50-74': 0, '25-49': 0, '0-24': 0 });

    // Get events for frustration/success analysis
    const callIds = calls.map((c: any) => c.id);
    const { data: events } = await supabase
      .from('trucking_call_events')
      .select('*')
      .in('call_id', callIds);

    // Analyze phrases
    const frustrationPhrases: Record<string, number> = {};
    const successSignals: Record<string, number> = {};

    events?.forEach((e: any) => {
      if (['dispatch_requested', 'human_requested', 'impatience_phrase_detected', 'confusion_correction_detected', 'hard_frustration_detected'].includes(e.event_type)) {
        const key = e.phrase || e.event_type;
        frustrationPhrases[key] = (frustrationPhrases[key] || 0) + 1;
      }
      if (['caller_thanked', 'booking_interest_confirmed', 'call_resolved_without_handoff', 'alternate_load_provided'].includes(e.event_type)) {
        successSignals[e.event_type] = (successSignals[e.event_type] || 0) + 1;
      }
    });

    const topFrustrationPhrases = Object.entries(frustrationPhrases)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([phrase]) => phrase);

    const topSuccessSignals = Object.entries(successSignals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([signal]) => signal);

    // Generate AI summary
    let aiSummaryText = '';
    let aiInsightsJson = {};

    if (lovableApiKey) {
      const rollups = {
        total_calls: totalCalls,
        resolved_without_handoff_pct: Math.round((resolvedWithoutHandoff / totalCalls) * 100),
        handoff_requested_pct: Math.round((handoffRequested / totalCalls) * 100),
        lead_created_pct: Math.round((leadCreated / totalCalls) * 100),
        avg_cei_score: Math.round(avgCeiScore),
        cei_band_breakdown: ceiBandBreakdown,
        top_frustration_phrases: topFrustrationPhrases,
        top_success_signals: topSuccessSignals,
      };

      const callsSummary = calls.slice(0, 10).map((c: any) => ({
        call_outcome: c.call_outcome,
        cei_score: c.cei_score,
        handoff_requested: c.handoff_requested,
        lead_created: c.lead_created,
        primary_load_id: c.primary_load_id,
      }));

      const systemPrompt = `You are an operations analyst for a freight brokerage. Write a concise end-of-day performance report for D and L Transport's AI phone agent (Jess). Use ONLY the provided data. Do not invent. Use short sentences. No fluff. Focus on outcomes, sales impact, and what to change tomorrow.

OUTPUT FORMAT (EXACT):
1) Daily Scorecard (5 bullets max)
2) What Went Well (3 bullets max)
3) What Went Wrong (3 bullets max)
4) Dispatch Impact (2 bullets max)
5) Tomorrow's Fixes (5 bullets max)
6) Call Experience Index (CEI) Breakdown (single line)
7) Notable Calls (max 3 bullets: load_id + 1 sentence)

RULES:
- If handoff_requested_pct > 20%, include a Tomorrow's Fix about faster escalation.
- If avg_cei_score < 75, include a Tomorrow's Fix about reducing intro + shorter answers.
- Always include one concrete recommendation about load lookup (by city, destination, or load_id).
- Keep it tight.`;

      const userPrompt = `Report Date: ${report_date}

Rollups:
${JSON.stringify(rollups, null, 2)}

Calls (summarized):
${JSON.stringify(callsSummary, null, 2)}`;

      try {
        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          aiSummaryText = aiData.choices?.[0]?.message?.content || 'AI summary unavailable';
          console.log('AI summary generated');
        } else {
          console.error('AI API error:', await aiResponse.text());
          aiSummaryText = generateFallbackSummary(rollups);
        }
      } catch (aiError) {
        console.error('AI generation error:', aiError);
        aiSummaryText = generateFallbackSummary(rollups);
      }
    } else {
      console.log('LOVABLE_API_KEY not set, using fallback summary');
      aiSummaryText = generateFallbackSummary({
        total_calls: totalCalls,
        resolved_without_handoff_pct: Math.round((resolvedWithoutHandoff / totalCalls) * 100),
        handoff_requested_pct: Math.round((handoffRequested / totalCalls) * 100),
        lead_created_pct: Math.round((leadCreated / totalCalls) * 100),
        avg_cei_score: Math.round(avgCeiScore),
      });
    }

    // Upsert report
    const { data: report, error: reportError } = await supabase
      .from('trucking_daily_reports')
      .upsert({
        report_date,
        total_calls: totalCalls,
        resolved_without_handoff_pct: Math.round((resolvedWithoutHandoff / totalCalls) * 100),
        handoff_requested_pct: Math.round((handoffRequested / totalCalls) * 100),
        lead_created_pct: Math.round((leadCreated / totalCalls) * 100),
        avg_cei_score: Math.round(avgCeiScore * 10) / 10,
        cei_band_breakdown: ceiBandBreakdown,
        top_frustration_phrases: topFrustrationPhrases,
        top_success_signals: topSuccessSignals,
        ai_summary_text: aiSummaryText,
        ai_insights_json: aiInsightsJson,
      }, { onConflict: 'report_date' })
      .select()
      .single();

    if (reportError) {
      throw new Error(`Failed to save report: ${reportError.message}`);
    }

    console.log('Report saved:', report?.id);

    return new Response(JSON.stringify({ success: true, report }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating CEI report:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateFallbackSummary(rollups: any): string {
  return `**Daily Scorecard**
- Total Calls: ${rollups.total_calls}
- Avg CEI Score: ${rollups.avg_cei_score}
- Resolved Without Dispatch: ${rollups.resolved_without_handoff_pct}%
- Handoff Requests: ${rollups.handoff_requested_pct}%
- Leads Created: ${rollups.lead_created_pct}%

**Summary**
${rollups.avg_cei_score >= 75 ? 'Good performance day.' : 'Room for improvement in call handling.'}
${rollups.handoff_requested_pct > 20 ? 'High handoff rate - review escalation triggers.' : ''}
${rollups.lead_created_pct < 30 ? 'Lead conversion below target.' : 'Lead conversion on track.'}`;
}
