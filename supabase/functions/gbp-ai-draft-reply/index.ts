import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TONE_PROMPTS: Record<string, string> = {
  friendly: `Write in a warm, personable, and conversational tone. Use friendly language that makes the reviewer feel valued and appreciated. Be genuine and approachable.`,
  professional: `Write in a polished, business-appropriate tone. Be courteous and respectful while maintaining professionalism. Use clear, formal language without being stiff.`,
  concise: `Write a brief, direct response. Get to the point quickly while still being polite. Keep the reply short but meaningful - aim for 2-3 sentences maximum.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      review_comment, 
      reviewer_name, 
      star_rating, 
      business_name,
      tone = "friendly",
      use_pro_model = false,
      connection_id,
      review_id,
      actor_user_id
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Select model based on tier
    const model = use_pro_model ? "openai/gpt-5" : "openai/gpt-5-mini";
    
    console.log("AI Draft Reply request:", {
      reviewer_name,
      star_rating,
      tone,
      model,
      review_id
    });

    const toneInstruction = TONE_PROMPTS[tone] || TONE_PROMPTS.friendly;

    const systemPrompt = `You are a professional business owner responding to customer reviews on Google Business Profile.

${toneInstruction}

Guidelines:
- Thank the customer for their feedback
- Address any specific points they mentioned
- If negative, acknowledge concerns without being defensive
- If positive, express genuine gratitude
- Include a subtle invitation to return or continue the relationship
- Do NOT include placeholder text like [Business Name] - use the actual business name provided
- Do NOT start with "Dear" - start more naturally
- Keep response under 200 words
- Do NOT use emojis unless the original review used them`;

    const userPrompt = `Business: ${business_name || "Our business"}
Reviewer: ${reviewer_name || "Customer"}
Rating: ${star_rating} star${star_rating !== 1 ? 's' : ''}
Review: ${review_comment || "(No comment provided)"}

Write a ${tone} reply to this review.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits depleted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const draftReply = data.choices?.[0]?.message?.content || "";

    console.log("Generated draft length:", draftReply.length);

    // Log AI draft event to audit log
    if (connection_id && actor_user_id) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      await supabase.from("gbp_audit_log").insert({
        connection_id,
        action_type: "AI_DRAFT_REPLY",
        actor_user_id,
        target_type: "review",
        target_id: review_id,
        details: {
          tone,
          model,
          star_rating,
          draft_length: draftReply.length
        }
      });
    }

    return new Response(
      JSON.stringify({ 
        draft: draftReply,
        model_used: model,
        tone
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("AI Draft Reply error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
