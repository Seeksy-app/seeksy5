import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type GenerateMode = "blog" | "linkedin_article" | "linkedin_post" | "facebook_post";

const MODE_FIELD_MAP: Record<GenerateMode, string> = {
  blog: "generated_blog",
  linkedin_article: "generated_linkedin_article",
  linkedin_post: "generated_linkedin_post",
  facebook_post: "generated_facebook_post",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const { aar_id, mode, client_safe = false } = await req.json();

    if (!aar_id || !mode) {
      return new Response(JSON.stringify({ error: "Missing aar_id or mode" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!["blog", "linkedin_article", "linkedin_post", "facebook_post"].includes(mode)) {
      return new Response(JSON.stringify({ error: "Invalid mode. Must be: blog, linkedin_article, linkedin_post, or facebook_post" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch AAR data
    const { data: aar, error: aarError } = await supabase
      .from("aars")
      .select("*")
      .eq("id", aar_id)
      .single();

    if (aarError || !aar) {
      console.error("Error fetching AAR:", aarError);
      return new Response(JSON.stringify({ error: "AAR not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch associated media
    const { data: media } = await supabase
      .from("aar_media")
      .select("caption, alt_text, seo_keywords, platform_intent")
      .eq("aar_id", aar_id)
      .order("display_order");

    // Build context for AI
    const eventTypeLabelMap: Record<string, string> = {
      meeting: "Meeting",
      community_event: "Community Event",
      activation: "Activation",
      conference: "Conference",
      sponsorship: "Sponsorship",
      webinar: "Webinar",
      campaign: "Campaign",
      other: "Event",
    };
    const eventTypeLabel = eventTypeLabelMap[aar.event_type as string] || "Event";

    // Filter internal-only content if client_safe
    const executiveSummary = aar.executive_summary || "";
    const eventPurpose = aar.event_purpose || "";
    const winsContent = [
      aar.wins_community_impact && `Community Impact: ${aar.wins_community_impact}`,
      aar.wins_relationship_building && `Relationship Building: ${aar.wins_relationship_building}`,
      aar.wins_business_support && `Business Support: ${aar.wins_business_support}`,
      aar.wins_esg_execution && `ESG Execution: ${aar.wins_esg_execution}`,
      aar.wins_civic_visibility && `Civic Visibility: ${aar.wins_civic_visibility}`,
    ].filter(Boolean).join("\n\n");

    const recommendationsContent = [
      ...(aar.recommendations_repeat || []).map((r: string) => `✓ ${r}`),
      ...(aar.recommendations_expand || []).map((r: string) => `→ ${r}`),
    ].join("\n");

    const metricsContent = [
      aar.attendance_count && `Attendance: ${aar.attendance_count.toLocaleString()}`,
      aar.engagement_interactions && `Interactions: ${aar.engagement_interactions.toLocaleString()}`,
      aar.leads_generated && `Leads Generated: ${aar.leads_generated}`,
      aar.total_spend && `Investment: $${aar.total_spend.toLocaleString()}`,
    ].filter(Boolean).join(", ");

    const mediaContext = (media || [])
      .map((m: { caption?: string; alt_text?: string }) => m.caption || m.alt_text)
      .filter(Boolean)
      .join("; ");

    // Build prompts based on mode
    let systemPrompt = "";
    let userPrompt = "";

    const baseContext = `
Event: ${aar.event_name}
Type: ${eventTypeLabel}
Date: ${aar.event_date_start || "N/A"}
Location: ${aar.location_venue || ""} ${aar.location_city_state || ""}
Hosted by: ${aar.hosted_by || "N/A"}

Executive Summary:
${executiveSummary}

Purpose:
${eventPurpose}

Wins & Impact:
${winsContent}

${metricsContent ? `Key Metrics: ${metricsContent}` : ""}

${recommendationsContent ? `Recommendations:\n${recommendationsContent}` : ""}

Final Assessment:
${aar.final_assessment || ""}

${mediaContext ? `Media highlights: ${mediaContext}` : ""}
`.trim();

    switch (mode as GenerateMode) {
      case "blog":
        systemPrompt = "You are a professional content writer specializing in event recaps and case studies. Write in a narrative, engaging style that tells a story while highlighting business value and community impact.";
        userPrompt = `Write a long-form blog article (800-1200 words) about this event. Make it SEO-friendly with clear headings, engaging storytelling, and strategic calls-to-action. ${client_safe ? "Keep the tone client-safe and professional - avoid any internal notes or sensitive information." : ""}

${baseContext}

Write the blog article in markdown format with:
- An engaging headline
- Introduction that hooks the reader
- Sections with H2/H3 headings covering highlights, impact, and takeaways
- Pull quotes or highlights in blockquotes
- A strong conclusion with next steps`;
        break;

      case "linkedin_article":
        systemPrompt = "You are a thought leadership content strategist writing for LinkedIn. Create professional, insightful content that positions the organization as a community leader and industry expert.";
        userPrompt = `Write a LinkedIn article (500-700 words) about this event. Focus on thought leadership, community impact, and professional insights. ${client_safe ? "Ensure the content is appropriate for external audiences." : ""}

${baseContext}

Format as a LinkedIn article with:
- A compelling headline that drives engagement
- Opening hook that connects to broader industry themes
- Key insights and takeaways
- Professional tone with personal touches
- Call-to-action for engagement`;
        break;

      case "linkedin_post":
        systemPrompt = "You are a social media expert crafting viral LinkedIn posts. Create engaging, authentic content that drives comments and shares.";
        userPrompt = `Write a LinkedIn post (150-280 words) about this event. Make it engaging, authentic, and shareable. ${client_safe ? "Keep it professional and external-audience appropriate." : ""}

${baseContext}

Include:
- Hook in the first line (no hashtags at start)
- 2-3 key highlights with line breaks for readability
- Authentic, human tone
- 3-5 relevant hashtags at the end
- A question or CTA to drive engagement`;
        break;

      case "facebook_post":
        systemPrompt = "You are a community-focused social media manager. Write warm, inclusive Facebook posts that celebrate community and drive engagement.";
        userPrompt = `Write a Facebook post (100-200 words) about this event. Make it warm, community-focused, and shareable. ${client_safe ? "Keep it appropriate for all audiences." : ""}

${baseContext}

Include:
- Warm, inclusive opening
- 2-3 highlights with appropriate emojis
- Photo/video call-out if relevant
- Tag placeholders for partners (use [Partner Name])
- Engaging question or thanks at the end`;
        break;
    }

    // Call Lovable AI Gateway
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Generating ${mode} content for AAR: ${aar_id}`);

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "Failed to generate content" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const generatedContent = aiData.choices?.[0]?.message?.content || "";

    if (!generatedContent) {
      return new Response(JSON.stringify({ error: "No content generated" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update AAR with generated content
    const fieldName = MODE_FIELD_MAP[mode as GenerateMode];
    const { error: updateError } = await supabase
      .from("aars")
      .update({
        [fieldName]: generatedContent,
        generated_at: new Date().toISOString(),
      })
      .eq("id", aar_id);

    if (updateError) {
      console.error("Error updating AAR:", updateError);
      return new Response(JSON.stringify({ error: "Failed to save generated content" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Successfully generated ${mode} content for AAR: ${aar_id}`);

    return new Response(
      JSON.stringify({
        success: true,
        mode,
        content: generatedContent,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in aar-generate-content:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
