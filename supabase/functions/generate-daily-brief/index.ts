import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const AUDIENCE_PROMPTS = {
  ceo: `You are creating a CEO Daily Brief for Seeksy, a creator economy platform competing with Spotify, YouTube, Riverside, and Restream.
Focus on:
- Strategic market positioning and competitive threats
- Key business metrics implications
- Revenue and growth opportunities
- Critical decisions needed
- Executive summary of market movements
Tone: Concise, strategic, decision-focused. Max 400 words.`,

  board: `You are creating a Board Member Daily Brief for Seeksy, a creator economy platform.
Focus on:
- Market landscape and competitive positioning
- Financial implications of market changes
- Risk assessment and mitigation
- Strategic recommendations
- Investment thesis validation
Tone: Professional, analytical, investor-focused. Max 500 words.`,

  investor: `You are creating an Investor Brief for Seeksy stakeholders.
Focus on:
- Market opportunity updates
- Competitive moat analysis
- Growth trajectory signals
- Industry tailwinds/headwinds
- Seeksy's differentiated position
Tone: Data-driven, opportunity-focused, bullish but realistic. Max 400 words.`,

  creator: `You are creating a Creator Brief for Seeksy users (podcasters, content creators).
Focus on:
- New features from competitors they should know about
- Industry trends affecting creators
- Monetization opportunities
- Platform comparisons that matter to creators
- Tips for leveraging current market conditions
Tone: Friendly, actionable, creator-first. Max 350 words.`,
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audienceType } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Get recent competitor updates (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: updates, error: updatesError } = await supabase
      .from('competitor_updates')
      .select(`
        *,
        competitor_profiles!inner(name, category)
      `)
      .gte('scraped_at', sevenDaysAgo.toISOString())
      .order('scraped_at', { ascending: false })
      .limit(30);

    if (updatesError) throw updatesError;

    // Format updates for AI context
    const updatesContext = (updates || []).map(u => 
      `[${u.competitor_profiles.name}] ${u.update_type.toUpperCase()}: ${u.title}\n${u.content || ''}\nSource: ${u.source_url}`
    ).join('\n\n');

    const today = new Date().toISOString().split('T')[0];
    const formattedDate = new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const systemPrompt = AUDIENCE_PROMPTS[audienceType as keyof typeof AUDIENCE_PROMPTS] || AUDIENCE_PROMPTS.ceo;

    // Generate brief using Lovable AI
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
          { 
            role: 'user', 
            content: `Generate today's (${formattedDate}) competitive intelligence brief based on these recent competitor updates:\n\n${updatesContext || 'No recent updates available. Provide general industry insights based on your knowledge of the podcast/creator economy space.'}\n\nIMPORTANT: Do NOT include the date in the title - the date will be displayed separately in the UI.\n\nReturn your response as JSON with this structure:
{
  "title": "Brief title without date",
  "summary": "Executive summary paragraph",
  "competitive_insights": [{"competitor": "name", "insight": "key insight", "impact": "high/medium/low"}],
  "market_trends": [{"trend": "description", "implication": "what it means for Seeksy"}],
  "strategy_assessment": {"seeksy_position": "assessment", "opportunities": ["list"], "threats": ["list"]},
  "action_items": [{"priority": 1, "action": "recommended action", "rationale": "why"}]
}`
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const briefContent = aiData.choices?.[0]?.message?.content;

    // Parse AI response
    let parsedBrief;
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = briefContent.match(/```json\n?([\s\S]*?)\n?```/) || 
                        briefContent.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : briefContent;
      parsedBrief = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response:', briefContent);
      parsedBrief = {
        title: `${audienceType.charAt(0).toUpperCase() + audienceType.slice(1)} Daily Brief - ${today}`,
        summary: briefContent,
        competitive_insights: [],
        market_trends: [],
        strategy_assessment: {},
        action_items: [],
      };
    }

    // Store brief in database
    const { data: brief, error: briefError } = await supabase
      .from('daily_briefs')
      .upsert({
        brief_date: today,
        audience_type: audienceType,
        title: parsedBrief.title,
        summary: parsedBrief.summary,
        competitive_insights: parsedBrief.competitive_insights,
        market_trends: parsedBrief.market_trends,
        strategy_assessment: parsedBrief.strategy_assessment,
        action_items: parsedBrief.action_items,
        sources: (updates || []).map(u => ({ url: u.source_url, title: u.title })),
      }, {
        onConflict: 'brief_date,audience_type',
      })
      .select()
      .single();

    if (briefError) throw briefError;

    return new Response(JSON.stringify({ success: true, brief }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Generate daily brief error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
