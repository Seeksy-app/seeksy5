import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log("generate-board-meeting-content called");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("Request body received:", JSON.stringify(body).substring(0, 200));
    const { title, agendaNotes } = body;
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a professional board meeting content generator. Given a meeting title and agenda notes, generate comprehensive structured meeting content.

Return ONLY valid JSON with this exact structure:
{
  "agenda": ["1. Topic Title: Brief Description", "2. Topic Title: Brief Description", ...],
  "memo": {
    "purpose": "A comprehensive 3-5 sentence summary of the meeting purpose. Include the main objectives, the current state context, and expected outcomes. This should fully capture what will be discussed and decided.",
    "current_state": ["Current state bullet 1", "Current state bullet 2", "Current state bullet 3", "Current state bullet 4"],
    "key_questions": ["Key question 1?", "Key question 2?", "Key question 3?", "Key question 4?", "Key question 5?", "Key question 6?"],
    "objective": "A clear 1-2 sentence statement of the meeting's goals and desired outcomes."
  }
}

Guidelines:
- Generate 6-10 numbered agenda items with format "N. Topic Title: Brief Description"
- The purpose field should be 3-5 complete sentences that summarize the meeting comprehensively
- Generate 4-6 current_state bullets that describe the present situation
- Generate 4-8 key_questions that the meeting should address
- The objective field should be 1-2 sentences describing the meeting goals
- Be professional, specific, and business-focused
- Extract specific entities, projects, and names from the notes
- Do NOT generate any decisions array - only agenda and memo`;

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
          { role: "user", content: `Meeting Title: ${title}\n\nAgenda Notes:\n${agendaNotes}` }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI generation failed");
    }

    const data = await response.json();
    console.log("AI response received");
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error("No content in AI response:", JSON.stringify(data));
      throw new Error("No content generated");
    }

    console.log("Raw content:", content.substring(0, 200));

    // Parse JSON from response (handle markdown code blocks)
    let jsonStr = content;
    if (content.includes("```json")) {
      jsonStr = content.split("```json")[1].split("```")[0].trim();
    } else if (content.includes("```")) {
      jsonStr = content.split("```")[1].split("```")[0].trim();
    }

    const result = JSON.parse(jsonStr);
    console.log("Parsed result, agenda items:", result.agenda?.length);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("generate-board-meeting-content error:", error);
    const message = error instanceof Error ? error.message : "Failed to generate content";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
