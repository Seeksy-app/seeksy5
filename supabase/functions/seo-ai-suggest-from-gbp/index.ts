import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// SEO AI Suggestions schema for structured output
const suggestionsSchema = {
  type: "object",
  required: ["summary", "suggestions", "faq", "review_themes"],
  properties: {
    summary: {
      type: "object",
      required: ["why", "primary_focus_keywords", "secondary_keywords", "local_modifiers"],
      properties: {
        why: { type: "string" },
        primary_focus_keywords: { type: "array", items: { type: "string" } },
        secondary_keywords: { type: "array", items: { type: "string" } },
        local_modifiers: { type: "array", items: { type: "string" } },
      },
    },
    suggestions: {
      type: "array",
      items: {
        type: "object",
        required: ["id", "type", "priority", "risk", "current_value", "proposed_value", "rationale", "confidence", "checks"],
        properties: {
          id: { type: "string" },
          type: {
            type: "string",
            enum: ["meta_title", "meta_description", "h1", "og_title", "og_description", "og_alt", "twitter_title", "twitter_description", "schema_localbusiness", "schema_faq", "schema_review_snippet", "onpage_sections"],
          },
          priority: { type: "string", enum: ["high", "medium", "low"] },
          risk: { type: "string", enum: ["safe", "review", "risky"] },
          current_value: { type: ["string", "null"] },
          proposed_value: { type: "string" },
          rationale: { type: "string" },
          confidence: { type: "number" },
          checks: {
            type: "object",
            required: ["character_count_ok", "no_prohibited_claims", "no_sensitive_data"],
            properties: {
              character_count_ok: { type: "boolean" },
              no_prohibited_claims: { type: "boolean" },
              no_sensitive_data: { type: "boolean" },
            },
          },
        },
      },
    },
    faq: {
      type: "array",
      items: {
        type: "object",
        required: ["question", "answer", "source"],
        properties: {
          question: { type: "string" },
          answer: { type: "string" },
          source: { type: "string", enum: ["gbp_reviews", "gbp_services", "admin_input"] },
        },
      },
    },
    review_themes: {
      type: "array",
      items: {
        type: "object",
        required: ["theme", "evidence_count"],
        properties: {
          theme: { type: "string" },
          evidence_count: { type: "number" },
        },
      },
    },
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("[seo-ai-suggest-from-gbp] No authorization header");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      console.error("[seo-ai-suggest-from-gbp] LOVABLE_API_KEY not configured");
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create client with user's auth
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      console.error("[seo-ai-suggest-from-gbp] Auth error:", userError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify user is admin
    const { data: roles, error: rolesError } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    if (rolesError || !roles?.some((r) => r.role === "admin" || r.role === "super_admin")) {
      console.error("[seo-ai-suggest-from-gbp] User is not admin:", user.id);
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const {
      seo_page_id,
      gbp_location_id,
      tone = "Local",
      include_reviews = true,
      include_faq = true,
      use_pro_model = false,
    } = body;

    console.log("[seo-ai-suggest-from-gbp] Request:", { seo_page_id, gbp_location_id, tone, include_reviews, include_faq, use_pro_model });

    if (!seo_page_id || !gbp_location_id) {
      return new Response(JSON.stringify({ error: "seo_page_id and gbp_location_id are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify link exists
    const { data: link, error: linkError } = await supabaseClient
      .from("gbp_seo_links")
      .select("id")
      .eq("gbp_location_id", gbp_location_id)
      .eq("seo_page_id", seo_page_id)
      .maybeSingle();

    if (linkError || !link) {
      console.error("[seo-ai-suggest-from-gbp] No link found:", linkError);
      return new Response(JSON.stringify({ error: "Link SEO page to this location first." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch GBP location data
    const { data: gbpLocation, error: gbpError } = await supabaseClient
      .from("gbp_locations")
      .select("title, primary_category, website_url, phone, address_city, address_state, regular_hours_json, services_json")
      .eq("location_id", gbp_location_id)
      .maybeSingle();

    if (gbpError || !gbpLocation) {
      console.error("[seo-ai-suggest-from-gbp] GBP location not found:", gbpError);
      return new Response(JSON.stringify({ error: "GBP location not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch SEO page data
    const { data: seoPage, error: seoError } = await supabaseClient
      .from("seo_pages")
      .select("route_path, page_name, meta_title, meta_description, h1_override, og_title, og_description, og_image_url, og_image_alt, twitter_title, twitter_description, canonical_url, robots_directive, json_ld, seo_score, seo_breakdown")
      .eq("id", seo_page_id)
      .maybeSingle();

    if (seoError || !seoPage) {
      console.error("[seo-ai-suggest-from-gbp] SEO page not found:", seoError);
      return new Response(JSON.stringify({ error: "SEO page not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Optionally fetch reviews (redact reviewer names)
    let reviews: any[] = [];
    if (include_reviews) {
      const { data: reviewsData } = await supabaseClient
        .from("gbp_reviews")
        .select("star_rating, comment, create_time")
        .eq("location_id", gbp_location_id)
        .order("create_time", { ascending: false })
        .limit(10);

      reviews = (reviewsData || []).map((r) => ({
        rating: r.star_rating,
        comment: r.comment,
        date: r.create_time,
      }));
    }

    // Build input snapshot
    const inputSnapshot = {
      gbp: {
        title: gbpLocation.title,
        primary_category: gbpLocation.primary_category,
        website: gbpLocation.website_url,
        phone: gbpLocation.phone,
        city: gbpLocation.address_city,
        state: gbpLocation.address_state,
        hours: gbpLocation.regular_hours_json,
        services: gbpLocation.services_json,
      },
      seo: {
        route_path: seoPage.route_path,
        page_name: seoPage.page_name,
        meta_title: seoPage.meta_title,
        meta_description: seoPage.meta_description,
        h1: seoPage.h1_override,
        og_title: seoPage.og_title,
        og_description: seoPage.og_description,
        og_image_url: seoPage.og_image_url,
        og_image_alt: seoPage.og_image_alt,
        twitter_title: seoPage.twitter_title,
        twitter_description: seoPage.twitter_description,
        canonical: seoPage.canonical_url,
        robots: seoPage.robots_directive,
        json_ld: seoPage.json_ld,
        seo_score: seoPage.seo_score,
        seo_breakdown: seoPage.seo_breakdown,
      },
      reviews: include_reviews ? reviews : [],
      options: {
        tone,
        include_reviews,
        include_faq,
      },
    };

    // Select model
    const model = use_pro_model ? "openai/gpt-5" : "openai/gpt-5-mini";

    // Build system prompt
    const systemPrompt = `You are an expert Local SEO consultant. Your task is to analyze a Google Business Profile location and its linked SEO page, then generate specific, actionable SEO improvement suggestions.

CRITICAL RULES:
1. NEVER invent address, phone, hours, or services. Only use values present in the input data.
2. NO medical/legal/benefits guarantees. Avoid "best", "approved", "guaranteed", "top-rated" claims.
3. NO personal data from reviewers. Do not quote reviewer names or personal details.
4. Keep meta title <= 60 characters and meta description 120-160 characters.
5. If uncertain about any suggestion, mark risk='review' and keep copy conservative.
6. Match the requested tone: ${tone}

You must respond with ONLY valid JSON matching the required schema. No markdown, no explanations, just the JSON object.`;

    const userPrompt = `Analyze this GBP location and SEO page data, then generate improvement suggestions:

## GBP Location Data
- Business Name: ${inputSnapshot.gbp.title || "Not set"}
- Primary Category: ${inputSnapshot.gbp.primary_category || "Not set"}
- Website: ${inputSnapshot.gbp.website || "Not set"}
- Phone: ${inputSnapshot.gbp.phone || "Not set"}
- Location: ${inputSnapshot.gbp.city || "Unknown"}, ${inputSnapshot.gbp.state || "Unknown"}
- Services: ${JSON.stringify(inputSnapshot.gbp.services) || "None listed"}

## Current SEO Page Data
- Page: ${inputSnapshot.seo.page_name || "Unnamed"} (${inputSnapshot.seo.route_path})
- Meta Title: ${inputSnapshot.seo.meta_title || "Not set"}
- Meta Description: ${inputSnapshot.seo.meta_description || "Not set"}
- H1: ${inputSnapshot.seo.h1 || "Not set"}
- OG Title: ${inputSnapshot.seo.og_title || "Not set"}
- OG Description: ${inputSnapshot.seo.og_description || "Not set"}
- Current SEO Score: ${inputSnapshot.seo.seo_score || "Not calculated"}

${include_reviews && reviews.length > 0 ? `## Recent Reviews (${reviews.length} reviews)
${reviews.map((r, i) => `${i + 1}. ${r.rating}/5 stars: "${r.comment?.substring(0, 200) || 'No comment'}"`).join("\n")}` : ""}

## Required Output Format
Generate suggestions in this exact JSON structure:
{
  "summary": {
    "why": "Brief explanation of the SEO opportunity",
    "primary_focus_keywords": ["keyword1", "keyword2"],
    "secondary_keywords": ["keyword1", "keyword2"],
    "local_modifiers": ["city name", "nearby area"]
  },
  "suggestions": [
    {
      "id": "unique_id",
      "type": "meta_title|meta_description|h1|og_title|og_description|og_alt|twitter_title|twitter_description|schema_localbusiness|schema_faq|schema_review_snippet|onpage_sections",
      "priority": "high|medium|low",
      "risk": "safe|review|risky",
      "current_value": "current text or null",
      "proposed_value": "your suggested improvement",
      "rationale": "why this change helps SEO",
      "confidence": 0.0-1.0,
      "checks": {
        "character_count_ok": true/false,
        "no_prohibited_claims": true/false,
        "no_sensitive_data": true/false
      }
    }
  ],
  "faq": [
    {
      "question": "Question derived from reviews or services",
      "answer": "Helpful answer",
      "source": "gbp_reviews|gbp_services|admin_input"
    }
  ],
  "review_themes": [
    {
      "theme": "Common positive theme from reviews",
      "evidence_count": 3
    }
  ]
}

${include_faq ? "Include 3-5 FAQ suggestions based on reviews and services." : "Skip FAQ generation."}
Tone preference: ${tone}`;

    console.log("[seo-ai-suggest-from-gbp] Calling Lovable AI with model:", model);

    // Call Lovable AI with tool calling for structured output
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "seo_suggestions",
              description: "Return structured SEO improvement suggestions",
              parameters: suggestionsSchema,
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "seo_suggestions" } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        console.error("[seo-ai-suggest-from-gbp] Rate limited");
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        console.error("[seo-ai-suggest-from-gbp] Payment required");
        return new Response(JSON.stringify({ error: "AI usage limit reached, please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await aiResponse.text();
      console.error("[seo-ai-suggest-from-gbp] AI error:", aiResponse.status, errorText);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    console.log("[seo-ai-suggest-from-gbp] AI response received");

    // Extract structured output from tool call
    let outputJson: any;
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      try {
        outputJson = JSON.parse(toolCall.function.arguments);
      } catch (e) {
        console.error("[seo-ai-suggest-from-gbp] Failed to parse tool call arguments:", e);
        return new Response(JSON.stringify({ error: "AI returned invalid JSON response" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      // Fallback: try to parse from content
      const content = aiData.choices?.[0]?.message?.content;
      if (content) {
        try {
          outputJson = JSON.parse(content);
        } catch (e) {
          console.error("[seo-ai-suggest-from-gbp] Failed to parse content as JSON:", e);
          return new Response(JSON.stringify({ error: "AI returned invalid JSON response" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } else {
        console.error("[seo-ai-suggest-from-gbp] No tool call or content in response");
        return new Response(JSON.stringify({ error: "AI returned empty response" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Validate required top-level keys
    const requiredKeys = ["summary", "suggestions", "faq", "review_themes"];
    for (const key of requiredKeys) {
      if (!(key in outputJson)) {
        console.error("[seo-ai-suggest-from-gbp] Missing required key:", key);
        return new Response(JSON.stringify({ error: `AI response missing required field: ${key}` }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Insert suggestion record
    const { data: suggestion, error: insertError } = await supabaseClient
      .from("seo_ai_suggestions")
      .insert({
        created_by: user.id,
        seo_page_id,
        gbp_location_id,
        status: "draft",
        model,
        tone,
        include_reviews,
        include_faq,
        input_snapshot: inputSnapshot,
        output_json: outputJson,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("[seo-ai-suggest-from-gbp] Failed to insert suggestion:", insertError);
      return new Response(JSON.stringify({ error: "Failed to save suggestions" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Log audit event
    await supabaseClient.from("gbp_audit_log").insert({
      user_id: user.id,
      action_type: "SEO_AI_SUGGESTION_GENERATED",
      entity_type: "seo_ai_suggestions",
      entity_id: suggestion.id,
      details: {
        gbp_location_id,
        seo_page_id,
        model,
        tone,
        include_reviews,
        include_faq,
        suggestions_count: outputJson.suggestions?.length || 0,
        faq_count: outputJson.faq?.length || 0,
      },
    });

    console.log("[seo-ai-suggest-from-gbp] Success, suggestion ID:", suggestion.id);

    return new Response(
      JSON.stringify({
        ok: true,
        seo_ai_suggestion_id: suggestion.id,
        output_json: outputJson,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[seo-ai-suggest-from-gbp] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
