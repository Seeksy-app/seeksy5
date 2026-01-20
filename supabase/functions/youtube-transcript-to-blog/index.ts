import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { youtubeUrl } = await req.json();
    
    if (!youtubeUrl) {
      throw new Error('YouTube URL is required');
    }

    // Extract video ID from URL
    const videoIdMatch = youtubeUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    if (!videoIdMatch) {
      throw new Error('Invalid YouTube URL');
    }
    const videoId = videoIdMatch[1];

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get video details using YouTube Data API
    const apiKey = Deno.env.get('YOUTUBE_API_KEY');
    
    // Fetch video details
    const videoResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`
    );

    if (!videoResponse.ok) {
      const errorText = await videoResponse.text();
      console.error('YouTube API error:', videoResponse.status, errorText);
      throw new Error(`Failed to fetch video details: ${videoResponse.status} ${errorText}`);
    }

    const videoData = await videoResponse.json();
    const video = videoData.items?.[0];
    
    if (!video) {
      throw new Error('Video not found');
    }

    const videoTitle = video.snippet.title;
    const videoDescription = video.snippet.description;

    // For now, we'll use the video description as "transcript"
    // In a production app, you'd use YouTube's caption API or a third-party service
    const transcript = videoDescription || "No transcript available";

    // Generate blog post using AI
    const prompt = `Create an SEO-optimized blog post from this YouTube video:

Title: ${videoTitle}
Content: ${transcript}

Please generate a blog post with:
1. An engaging title (30-60 characters)
2. SEO title (30-60 characters)
3. Meta description (120-160 characters)
4. Excerpt (50-100 characters)
5. Full blog content (minimum 300 words, formatted in Markdown)

Return ONLY a valid JSON object with this structure:
{
  "title": "Blog post title",
  "seo_title": "SEO optimized title",
  "seo_description": "Meta description",
  "excerpt": "Brief excerpt",
  "content": "Full markdown content"
}`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are an expert content writer specializing in SEO-optimized blog posts. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', errorText);
      throw new Error('Failed to generate blog post with AI');
    }

    const aiData = await aiResponse.json();
    const generatedContent = aiData.choices?.[0]?.message?.content;

    if (!generatedContent) {
      throw new Error('No content generated from AI');
    }

    // Parse the JSON response
    let blogData;
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = generatedContent.match(/```json\s*([\s\S]*?)\s*```/) || 
                       generatedContent.match(/```\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : generatedContent;
      blogData = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Failed to parse AI response:', generatedContent);
      throw new Error('Failed to parse AI-generated content');
    }

    return new Response(
      JSON.stringify({
        ...blogData,
        youtubeUrl,
        videoId,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('YouTube transcript error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
