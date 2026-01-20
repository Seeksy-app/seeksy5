import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const systemPrompt = `You are a strategic business advisor generating executive briefings for a board of directors. 
Write a concise, professional board briefing that covers:
1. Vision Progress summary
2. KPI Movement Summary with key metrics
3. Rocks Status (quarterly priorities)
4. Risks & Blockers (highlight any at-risk items)
5. Recommended Next Steps (3-4 actionable items)
6. 90-Day CEO Priorities

Use markdown formatting with headers (##). Be direct and data-driven. Keep total length under 500 words.`;

    const userPrompt = `Generate a CEO board briefing based on this company data:

Vision: ${context.vision}
3-Year Picture: ${context.threeYearPicture}

Key Metrics:
- ARR: $${context.kpis?.arr?.toLocaleString() || 'N/A'}
- Creator Count: ${context.kpis?.creatorCount?.toLocaleString() || 'N/A'}
- Verified Creators: ${context.kpis?.verifiedCreators?.toLocaleString() || 'N/A'}
- AI Tool Adoption: ${context.kpis?.aiToolAdoption || 'N/A'}%
- Runway: ${context.kpis?.runway || 'N/A'} months

Quarterly Rocks:
${context.rocks?.map((r: any) => `- ${r.name} (${r.status}) - Owner: ${r.owner}`).join('\n') || 'None'}

Rocks At Risk: ${context.rocksAtRisk?.join(', ') || 'None'}

Upcoming Milestones:
${context.milestones?.map((m: any) => `- ${m.title} (Due: ${m.deadline}, Status: ${m.status})`).join('\n') || 'None'}

Current Slider Settings:
- Creator Growth: ${context.sliders?.creatorGrowth}%
- Advertising Demand: ${context.sliders?.advertisingDemand}%
- AI Automation Efficiency: ${context.sliders?.aiAutomation}x
- Identity Verification Adoption: ${context.sliders?.identityVerification}%`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const briefing = data.choices?.[0]?.message?.content || "Unable to generate briefing.";

    return new Response(JSON.stringify({ briefing }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating briefing:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
