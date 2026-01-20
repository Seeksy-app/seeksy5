import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { metrics, assumptions, periodStart, periodEnd } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Generating investor talking points...');

    const systemPrompt = `You are an expert CFO and strategic advisor preparing executive-level investor talking points. 
Your goal is to create clear, concise, and compelling narratives that highlight business performance, growth trajectory, and strategic positioning.

Format talking points into these sections:
1. **Executive Summary** - One paragraph overview
2. **Revenue & Growth** - Subscription, ad revenue, sponsorship performance
3. **Unit Economics** - CAC, LTV, payback period, margins
4. **Cost Structure** - Infrastructure, creator payouts, operational costs
5. **Market Position** - Competitive advantages and differentiation
6. **Forward Guidance** - Next quarter projections and strategic initiatives
7. **Key Risks & Mitigation** - Challenges and how we're addressing them
8. **Strategic Highlights** - Major wins and milestones

Use data-driven language, specific numbers, and percentages. Be confident but realistic.`;

    const userPrompt = `Generate investor talking points for the period ${periodStart} to ${periodEnd}.

**Current Metrics:**
- Total Revenue: $${metrics.totalRevenue?.toLocaleString()}
- MRR: $${metrics.mrr?.toLocaleString()}
- ARR: $${metrics.arr?.toLocaleString()}
- Ad Revenue: $${metrics.adRevenue?.toLocaleString()}
- Sponsorship Revenue: $${metrics.sponsorshipRevenue?.toLocaleString()}
- Total Users: ${metrics.totalUsers?.toLocaleString()}
- Active Creators: ${metrics.activeCreators?.toLocaleString()}
- Total Podcasts: ${metrics.totalPodcasts?.toLocaleString()}
- Total Episodes: ${metrics.totalEpisodes?.toLocaleString()}
- Ad Impressions: ${metrics.totalImpressions?.toLocaleString()}
- Average CPM: $${metrics.averageCpm?.toFixed(2)}
- Fill Rate: ${metrics.fillRate?.toFixed(1)}%
- Total Costs: $${metrics.totalCosts?.toLocaleString()}
- Creator Payouts: $${metrics.creatorPayouts?.toLocaleString()}
- Gross Margin: ${metrics.grossMargin?.toFixed(1)}%
- Burn Rate: $${metrics.burnRate?.toLocaleString()}/month
- Runway: ${metrics.runwayMonths} months

**Growth Rates (assumptions):**
${assumptions.map((a: any) => `- ${a.name}: ${a.value}${a.unit || ''}`).join('\n')}

Create comprehensive, investor-ready talking points that tell a compelling story about the business.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
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

    if (!response.ok) {
      const error = await response.text();
      console.error('AI gateway error:', error);
      throw new Error('Failed to generate talking points');
    }

    const data = await response.json();
    const talkingPoints = data.choices[0].message.content;

    console.log('Talking points generated successfully');

    return new Response(
      JSON.stringify({
        success: true,
        talkingPoints,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error generating talking points:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
