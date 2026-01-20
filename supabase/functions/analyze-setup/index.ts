import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are a professional video production coach analyzing a podcaster's setup. 
Analyze the provided image and give specific, actionable feedback in these categories:

1. **Background** - Evaluate clutter, distractions, depth, branding opportunities. Is it visually interesting but not distracting?

2. **Lighting** - Assess exposure, shadows on face, color temperature, key/fill light balance, any harsh shadows or overexposure.

3. **Colors** - Check color harmony, contrast with background, clothing choices for camera, any color cast issues.

4. **Composition** - Evaluate framing, headroom, eye-line placement (rule of thirds), distance from camera.

5. **Overall Score** - Rate the setup from 1-10.

For each category:
- Give a score from 1-10
- List 1-2 specific issues (if any)
- Provide 1-2 actionable improvements

Be encouraging but honest. Focus on changes that can be made quickly (in the next 5 minutes).
Keep feedback concise and practical.

Respond in this JSON format:
{
  "overall_score": 7,
  "summary": "One sentence overall impression",
  "categories": {
    "background": {
      "score": 8,
      "feedback": "Brief observation",
      "improvements": ["Specific suggestion 1", "Specific suggestion 2"]
    },
    "lighting": {
      "score": 6,
      "feedback": "Brief observation", 
      "improvements": ["Specific suggestion"]
    },
    "colors": {
      "score": 7,
      "feedback": "Brief observation",
      "improvements": ["Specific suggestion"]
    },
    "composition": {
      "score": 8,
      "feedback": "Brief observation",
      "improvements": ["Specific suggestion"]
    }
  },
  "quick_wins": ["Top 1-3 things to fix right now for biggest impact"]
}`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image_base64 } = await req.json();

    if (!image_base64) {
      return new Response(
        JSON.stringify({ error: "image_base64 is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Call Gemini via Lovable AI Gateway with the image
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
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this podcaster's video setup and provide feedback on how to improve their background, lighting, colors, and composition."
              },
              {
                type: "image_url",
                image_url: {
                  url: image_base64.startsWith("data:") ? image_base64 : `data:image/jpeg;base64,${image_base64}`
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to analyze image" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(
        JSON.stringify({ error: "No analysis generated" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse JSON from response (handle markdown code blocks)
    let analysis;
    try {
      // Remove markdown code blocks if present
      let jsonStr = content;
      if (content.includes("```json")) {
        jsonStr = content.replace(/```json\n?/g, "").replace(/```\n?/g, "");
      } else if (content.includes("```")) {
        jsonStr = content.replace(/```\n?/g, "");
      }
      analysis = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", content);
      // Return raw content if parsing fails
      analysis = {
        overall_score: 7,
        summary: content.substring(0, 200),
        categories: {},
        quick_wins: ["Could not parse detailed feedback"],
        raw_response: content
      };
    }

    return new Response(
      JSON.stringify({ success: true, analysis }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("analyze-setup error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
