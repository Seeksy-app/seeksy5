import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface GenerateBlogRequest {
  episodeId: string;
  userId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { episodeId, userId }: GenerateBlogRequest = await req.json();

    // Get episode with podcast info
    const { data: episode, error: episodeError } = await supabase
      .from("episodes")
      .select(`
        *,
        podcasts (
          id,
          title,
          user_id
        )
      `)
      .eq("id", episodeId)
      .single();

    if (episodeError || !episode) {
      throw new Error("Episode not found");
    }

    // Check if user owns this podcast
    if (episode.podcasts.user_id !== userId) {
      throw new Error("Unauthorized");
    }

    // Check if transcript exists
    if (!episode.transcript) {
      throw new Error("Episode must have a transcript to generate a blog post");
    }

    // Use Lovable AI to generate SEO-optimized blog content
    const prompt = `You are a professional content writer. Based on this podcast episode transcript, create an SEO-optimized blog post.

Episode Title: ${episode.title}
Podcast: ${episode.podcasts.title}
Transcript: ${episode.transcript}

Create a blog post with:
1. A catchy, SEO-optimized title (different from the episode title)
2. A compelling excerpt (2-3 sentences, max 160 characters for SEO)
3. Well-structured content with clear sections and headings
4. Natural keyword integration
5. Engaging introduction and conclusion
6. Formatted in readable paragraphs

Return ONLY a JSON object with this structure:
{
  "title": "blog post title",
  "excerpt": "brief excerpt",
  "content": "full blog post content with natural paragraph breaks",
  "seo_title": "SEO-optimized title (max 60 chars)",
  "seo_description": "SEO meta description (max 160 chars)",
  "seo_keywords": ["keyword1", "keyword2", "keyword3"]
}`;

    // Call Lovable AI
    const aiResponse = await fetch("https://api.lovable.app/v1/ai/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-5-mini",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", errorText);
      throw new Error("Failed to generate blog content");
    }

    const aiData = await aiResponse.json();
    const generatedContent = JSON.parse(
      aiData.choices[0].message.content
    );

    // Generate slug
    const slug = generatedContent.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Create blog post
    const { data: blogPost, error: blogError } = await supabase
      .from("blog_posts")
      .insert([{
        user_id: userId,
        title: generatedContent.title,
        slug,
        content: generatedContent.content,
        excerpt: generatedContent.excerpt,
        featured_image_url: episode.image_url || null,
        status: "draft",
        seo_title: generatedContent.seo_title,
        seo_description: generatedContent.seo_description,
        seo_keywords: generatedContent.seo_keywords,
        podcast_id: episode.podcasts.id,
        episode_id: episodeId,
        is_ai_generated: true,
      }])
      .select()
      .single();

    if (blogError) {
      console.error("Blog creation error:", blogError);
      throw blogError;
    }

    console.log("Blog post created successfully:", blogPost.id);

    return new Response(
      JSON.stringify({
        success: true,
        blogPost,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in generate-blog-from-podcast function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
