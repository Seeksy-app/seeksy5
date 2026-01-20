import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mediaId, transcript, title } = await req.json();

    if (!transcript) {
      throw new Error("Transcript is required");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    console.log("Generating blog from transcript for:", mediaId);

    // Get auth token from request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authenticated");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error("Not authenticated");

    // Generate blog post using AI
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an expert content writer who creates engaging, SEO-optimized blog posts from video transcripts. 
Your posts should:
- Have a catchy, SEO-friendly title
- Include a compelling introduction
- Break down key points with clear headings
- Use natural, conversational language
- Include relevant keywords naturally
- End with a strong conclusion or call-to-action`
          },
          {
            role: "user",
            content: `Create a blog post from this video transcript. 
Original title: ${title || "Untitled Video"}

Transcript:
${transcript}

Generate a complete blog post with title, introduction, body sections with headings, and conclusion.`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_blog_post",
              description: "Generate a complete blog post",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string", description: "SEO-friendly blog title" },
                  excerpt: { type: "string", description: "Brief excerpt/summary (150-200 chars)" },
                  content: { type: "string", description: "Full blog post content in HTML" },
                  seo_title: { type: "string", description: "SEO meta title (under 60 chars)" },
                  seo_description: { type: "string", description: "SEO meta description (under 160 chars)" },
                  keywords: { type: "array", items: { type: "string" }, description: "5-10 relevant keywords" }
                },
                required: ["title", "excerpt", "content", "seo_title", "seo_description", "keywords"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "create_blog_post" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error("Failed to generate blog post");
    }

    const blogPost = JSON.parse(toolCall.function.arguments);

    // Create slug from title
    const slug = blogPost.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Insert blog post into database
    const { data: insertedPost, error: insertError } = await supabase
      .from("blog_posts")
      .insert({
        user_id: user.id,
        title: blogPost.title,
        slug: slug,
        content: blogPost.content,
        excerpt: blogPost.excerpt,
        seo_title: blogPost.seo_title,
        seo_description: blogPost.seo_description,
        seo_keywords: blogPost.keywords,
        status: "draft",
        is_ai_generated: true,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting blog post:", insertError);
      throw insertError;
    }

    console.log("Blog post created successfully:", insertedPost.id);

    return new Response(
      JSON.stringify({
        success: true,
        blogPost: insertedPost,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error generating blog from media:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
