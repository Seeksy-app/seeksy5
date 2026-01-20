import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are Seeksy BoardView AI — an expert analyst specializing in startup milestone tracking, financial insights, operational risk detection, and board-level reporting.

Your job is to read structured milestone data and generate:

1. Executive-level milestone insights
2. Meaningful, non-generic Board Questions for the CEO
3. Actionable Board Support Recommendations
4. Risk assessment and early warning flags
5. Clear, short, non-technical explanations appropriate for board presentations

Speak concisely, in plain English, with a neutral, advisory tone.

RULES FOR GENERATION:
- Insights must be specific to the milestone data — never generic.
- If a milestone is behind schedule, explain WHY in plain language.
- If dependencies exist, analyze how they affect timelines.
- If progress is metric-driven, evaluate pace vs target using projected trajectory.
- Questions must reveal blind spots or assumptions.
- Actions must include what the board can actually do (remove blockers, open introductions, adjust scope, reallocate budget, etc.)
- Avoid filler advice ("communicate more", "monitor progress", etc.)
- If a milestone is healthy, explain what is working and why.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { milestones, metrics, stage, blockers } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const today = new Date().toISOString().split('T')[0];
    
    const userPrompt = `Analyze the following milestone dataset and generate structured outputs for the Board.

MILESTONE DATA:
${JSON.stringify(milestones, null, 2)}

CONTEXT FOR ANALYSIS:
- Today's Date: ${today}
- Company Stage: ${stage || "Seed"}
- Key Company Metrics: ${JSON.stringify(metrics || {}, null, 2)}
- Any delays or blockers observed: ${JSON.stringify(blockers || [], null, 2)}

Please output ONLY valid JSON using the schema below.

{
  "milestoneSummary": "string – executive summary of current status and progress",
  "insights": [
    "string – meaningful insight the board should understand"
  ],
  "boardQuestions": [
    "string – strategic questions the board should ask the CEO"
  ],
  "boardActions": [
    "string – actionable recommendations the board can do to support executive success"
  ],
  "riskAssessment": {
    "riskLevel": "Low | Medium | High",
    "reasons": ["string – concrete reasons for the assigned risk level"],
    "earlyWarnings": ["string – subtle indicators that future slippage is likely"]
  }
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    // Parse JSON from the response (handle markdown code blocks)
    let parsed;
    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                        content.match(/```\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      parsed = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      parsed = {
        milestoneSummary: content,
        insights: [],
        boardQuestions: [],
        boardActions: [],
        riskAssessment: { riskLevel: "Medium", reasons: [], earlyWarnings: [] }
      };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("board-ai-insights error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
