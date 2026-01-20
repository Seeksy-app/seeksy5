import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ArticleConfig {
  portal: 'admin' | 'creator' | 'board';
  section: string;
  title: string;
  slug: string;
  outline: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { articleId, regenerate, config } = await req.json();

    // If regenerating, fetch existing article
    let articleConfig: ArticleConfig;
    
    if (regenerate && articleId) {
      const { data: existing, error } = await supabase
        .from('knowledge_articles')
        .select('*')
        .eq('id', articleId)
        .single();
      
      if (error) throw error;
      
      articleConfig = {
        portal: existing.portal,
        section: existing.section,
        title: existing.title,
        slug: existing.slug,
        outline: ''
      };
    } else if (config) {
      articleConfig = config;
    } else {
      throw new Error('Either articleId with regenerate=true or config required');
    }

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Generate article content using AI
    const systemPrompt = `You are an expert content writer for Seeksy, a creator economy platform. 
Write detailed, actionable knowledge base articles that are:
- At least 1,000 words
- Written for ${articleConfig.portal === 'admin' ? 'platform administrators' : articleConfig.portal === 'creator' ? 'content creators and podcasters' : 'board members and investors'}
- Clear, professional, and educational
- Using markdown formatting with H2 and H3 headings
- Including practical examples and specific details about Seeksy's features

The article must include:
1. A clear purpose statement (1-2 sentences)
2. Expected outcomes for the reader
3. 3-5 key takeaways as bullet points
4. Main body content with multiple H2 sections (at least 1000 words)
5. 3-5 actionable execution steps
6. 2-3 thought-provoking questions

Return a JSON object with these fields:
- purpose: string
- expected_outcomes: string
- key_takeaways: string[] (3-5 items)
- content: string (markdown, 1000+ words)
- execution_steps: string[] (3-5 items)
- questions: string[] (2-3 items)
- excerpt: string (2-3 sentence summary)`;

    const userPrompt = `Write a comprehensive knowledge article about:

Title: ${articleConfig.title}
Section: ${articleConfig.section}
Audience: ${articleConfig.portal === 'admin' ? 'Platform administrators' : articleConfig.portal === 'creator' ? 'Content creators' : 'Board members'}

${articleConfig.outline ? `Outline to follow:\n${articleConfig.outline}` : ''}

Generate the full article with all required sections.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    let articleContent;
    
    try {
      // Try to parse as JSON
      let jsonStr = aiData.choices[0].message.content;
      // Remove markdown code blocks if present
      jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      articleContent = JSON.parse(jsonStr);
    } catch (e) {
      console.error('Failed to parse AI response as JSON:', e);
      // Fallback: use the raw content
      articleContent = {
        purpose: 'This article provides comprehensive guidance.',
        expected_outcomes: 'Readers will gain practical knowledge.',
        key_takeaways: ['Key insight 1', 'Key insight 2', 'Key insight 3'],
        content: aiData.choices[0].message.content,
        execution_steps: ['Step 1', 'Step 2', 'Step 3'],
        questions: ['What next steps will you take?'],
        excerpt: 'A comprehensive guide.'
      };
    }

    // Upsert the article
    const articleData = {
      portal: articleConfig.portal,
      section: articleConfig.section,
      title: articleConfig.title,
      slug: articleConfig.slug,
      excerpt: articleContent.excerpt,
      content: articleContent.content,
      purpose: articleContent.purpose,
      expected_outcomes: articleContent.expected_outcomes,
      key_takeaways: articleContent.key_takeaways,
      execution_steps: articleContent.execution_steps,
      questions: articleContent.questions,
      is_published: true,
      updated_at: new Date().toISOString()
    };

    let result;
    if (regenerate && articleId) {
      const { data, error } = await supabase
        .from('knowledge_articles')
        .update({ ...articleData, version: supabase.rpc('increment', { row_id: articleId }) })
        .eq('id', articleId)
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabase
        .from('knowledge_articles')
        .upsert(articleData, { onConflict: 'portal,slug' })
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    }

    console.log('Article generated:', result.title);

    return new Response(
      JSON.stringify({ success: true, article: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
