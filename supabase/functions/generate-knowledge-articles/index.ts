import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PORTALS = ['admin', 'creator', 'board'] as const;

// Industry sources to scrape if no RSS sources configured
const DEFAULT_SOURCES = [
  { name: 'TechCrunch Creator Economy', query: 'creator economy podcast platform', category: 'Industry Insights' },
  { name: 'Podnews', query: 'podcast industry news trends', category: 'Podcasting Industry' },
  { name: 'Creator Economy News', query: 'influencer monetization creator tools', category: 'Creator Growth & Monetization' },
  { name: 'AI Tools Trends', query: 'AI tools content creation automation', category: 'AI Tools & Trends' },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const { count = 3, useFirecrawl = true } = await req.json().catch(() => ({ count: 3, useFirecrawl: true }));

    console.log(`Generating ${count} knowledge articles (Firecrawl: ${useFirecrawl && !!FIRECRAWL_API_KEY})...`);

    // Fetch active RSS sources from database
    const { data: rssSources } = await supabase
      .from('blog_rss_sources')
      .select('*')
      .eq('is_active', true);

    const generatedArticles = [];
    const sourcesToUse = rssSources?.length ? rssSources : DEFAULT_SOURCES;

    for (let i = 0; i < count; i++) {
      const portal = PORTALS[i % PORTALS.length];
      const sourceIndex = i % sourcesToUse.length;
      const source = sourcesToUse[sourceIndex];
      const category = source.category || 'Industry Insights';

      // Create job record
      const { data: job, error: jobError } = await supabase
        .from('blog_generation_jobs')
        .insert({
          portal,
          category,
          status: 'running',
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (jobError) {
        console.error('Failed to create job:', jobError);
        continue;
      }

      try {
        let scrapedContent = '';
        let sourceUrl = '';

        // Use Firecrawl to scrape content if available
        if (useFirecrawl && FIRECRAWL_API_KEY) {
          console.log(`Scraping content for: ${source.name || source.query}`);
          
          try {
            // If source has URL (from RSS sources), scrape directly
            if ('url' in source && source.url) {
              const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  url: source.url,
                  formats: ['markdown'],
                  onlyMainContent: true,
                }),
              });

              const scrapeData = await scrapeResponse.json();
              if (scrapeData.success && scrapeData.data?.markdown) {
                scrapedContent = scrapeData.data.markdown.substring(0, 3000);
                sourceUrl = source.url;
              }
            } else {
              // Use search to find relevant content
              const searchQuery = 'query' in source ? source.query : `${source.name} latest news`;
              const searchResponse = await fetch('https://api.firecrawl.dev/v1/search', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  query: searchQuery,
                  limit: 3,
                  lang: 'en',
                  tbs: 'qdr:w', // Last week
                  scrapeOptions: {
                    formats: ['markdown']
                  }
                }),
              });

              const searchData = await searchResponse.json();
              if (searchData.success && searchData.data?.length) {
                // Combine content from multiple search results
                const combinedContent = searchData.data
                  .slice(0, 3)
                  .map((r: any) => `## ${r.title}\n${r.description || ''}\n${r.markdown?.substring(0, 800) || ''}`)
                  .join('\n\n');
                scrapedContent = combinedContent.substring(0, 4000);
                sourceUrl = searchData.data[0]?.url || '';
              }
            }

            // Update last_fetched_at for RSS sources
            if ('id' in source) {
              await supabase
                .from('blog_rss_sources')
                .update({ last_fetched_at: new Date().toISOString() })
                .eq('id', source.id);
            }

            console.log(`Scraped ${scrapedContent.length} chars from ${source.name || source.query}`);
          } catch (scrapeErr) {
            console.error('Firecrawl error:', scrapeErr);
          }
        }

        // Generate article with AI
        const audienceContext = {
          board: 'Board members and investors - strategic, high-level, financial focus. Use professional business language.',
          admin: 'Platform administrators - operational, technical, insights-driven. Focus on metrics and implementation.',
          creator: 'Content creators - practical, inspirational, actionable. Use friendly, motivating language.'
        };

        const systemPrompt = `You are a professional content writer for Seeksy, a creator platform.
Generate a high-quality, original knowledge article based on the provided industry context.

Target audience: ${audienceContext[portal]}

Category: ${category}

${scrapedContent ? `
IMPORTANT: Use the following real-world content as context and inspiration. DO NOT copy directly - synthesize, analyze, and add unique insights:

---
${scrapedContent}
---
` : ''}

Return ONLY valid JSON with this structure:
{
  "title": "Compelling, specific article title (not generic)",
  "excerpt": "2-3 sentence summary highlighting key insights",
  "purpose": "Why this topic matters right now (2-3 sentences)",
  "expected_outcomes": "What readers will learn and be able to do (2-3 sentences)",
  "key_takeaways": ["takeaway 1", "takeaway 2", "takeaway 3", "takeaway 4", "takeaway 5"],
  "content": "Full article content in markdown format (minimum 1000 words with ## headings, real examples, data points)",
  "execution_steps": ["step 1", "step 2", "step 3", "step 4"],
  "questions": ["reflection question 1?", "question 2?", "question 3?", "question 4?", "question 5?"],
  "screenshot_urls": []
}`;

        const userPrompt = scrapedContent 
          ? `Based on the industry context provided, write a comprehensive, original article about trends and insights in the ${category} category for ${portal === 'board' ? 'board members' : portal === 'admin' ? 'administrators' : 'creators'}.

Synthesize the information, add your analysis, and provide actionable recommendations. Make it timely and relevant. Minimum 1000 words.`
          : `Write a comprehensive knowledge article about a current trending topic in the ${category} category for ${portal === 'board' ? 'board members' : portal === 'admin' ? 'administrators' : 'creators'}.

Make it insightful, actionable, and relevant to current industry trends. Include specific examples and data points. Minimum 1000 words.`;

        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.7,
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`AI API error: ${response.status} - ${errText}`);
        }

        const aiResult = await response.json();
        const content = aiResult.choices?.[0]?.message?.content;

        if (!content) {
          throw new Error('No content returned from AI');
        }

        // Parse JSON from response - handle various formats
        let articleData;
        try {
          // Try to extract JSON from markdown code blocks
          let jsonStr = content;
          const jsonMatch = content.match(/```json\s*([\s\S]*?)```/);
          const plainMatch = content.match(/```\s*([\s\S]*?)```/);
          
          if (jsonMatch) {
            jsonStr = jsonMatch[1];
          } else if (plainMatch) {
            jsonStr = plainMatch[1];
          }
          
          // Clean up the JSON string
          jsonStr = jsonStr.trim();
          
          // Try parsing directly first
          try {
            articleData = JSON.parse(jsonStr);
          } catch {
            // Try to find JSON object in the string
            const objectMatch = jsonStr.match(/\{[\s\S]*\}/);
            if (objectMatch) {
              articleData = JSON.parse(objectMatch[0]);
            } else {
              throw new Error('No valid JSON found');
            }
          }
        } catch (parseErr) {
          console.error('Failed to parse AI response:', content.substring(0, 800));
          // Create fallback article data from raw content
          articleData = {
            title: `Industry Insights: ${category}`,
            excerpt: 'Latest insights and trends in the creator economy.',
            purpose: 'Stay informed about industry developments.',
            expected_outcomes: 'Understanding of current market trends.',
            key_takeaways: ['Industry is evolving rapidly', 'New opportunities emerging', 'Technology driving change'],
            content: content.replace(/```json[\s\S]*?```/g, '').substring(0, 5000) || 'Article content being generated...',
            execution_steps: ['Review the insights', 'Apply to your strategy', 'Monitor results'],
            questions: ['How does this apply to you?', 'What actions can you take?'],
            screenshot_urls: []
          };
          console.log('Using fallback article structure');
        }

        // Generate slug
        const slug = articleData.title
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .substring(0, 100);

        // Determine section based on category and portal
        const sectionMap: Record<string, Record<string, string>> = {
          admin: {
            'Seeksy Updates': 'Overview',
            'Industry Insights': 'Overview',
            'Creator Growth & Monetization': 'Monetization',
            'AI Tools & Trends': 'AI Systems',
            'Podcasting Industry': 'Creator Tools',
            'Meetings & Events Industry': 'Meetings & Events',
            'How-To Articles': 'Creator Tools'
          },
          creator: {
            'Seeksy Updates': 'Getting Started',
            'Industry Insights': 'Growth',
            'Creator Growth & Monetization': 'Monetization',
            'AI Tools & Trends': 'Studio Tools',
            'Podcasting Industry': 'Studio Tools',
            'Meetings & Events Industry': 'Meetings',
            'How-To Articles': 'Getting Started'
          },
          board: {
            'Seeksy Updates': 'Company Health',
            'Industry Insights': 'Competitive Landscape',
            'Creator Growth & Monetization': 'Capital Strategy',
            'AI Tools & Trends': 'Milestones',
            'Podcasting Industry': 'Competitive Landscape',
            'Meetings & Events Industry': 'Milestones',
            'How-To Articles': 'Team & Org'
          }
        };

        const section = sectionMap[portal]?.[category] || 'Overview';

        // Insert article
        const { data: article, error: articleError } = await supabase
          .from('knowledge_articles')
          .insert({
            portal,
            section,
            category,
            title: articleData.title,
            slug: `${slug}-${Date.now()}`,
            excerpt: articleData.excerpt,
            content: articleData.content,
            purpose: articleData.purpose,
            expected_outcomes: articleData.expected_outcomes,
            key_takeaways: articleData.key_takeaways,
            execution_steps: articleData.execution_steps,
            questions: articleData.questions,
            screenshot_urls: articleData.screenshot_urls,
            source_url: sourceUrl || null,
            is_published: true,
            view_count: 0,
            version: 1
          })
          .select()
          .single();

        if (articleError) throw articleError;

        // Update job as completed
        await supabase
          .from('blog_generation_jobs')
          .update({
            status: 'completed',
            generated_article_id: article.id,
            completed_at: new Date().toISOString()
          })
          .eq('id', job.id);

        generatedArticles.push(article);
        console.log(`Generated article: ${article.title} (source: ${sourceUrl || 'AI-generated'})`);

      } catch (genError) {
        console.error(`Failed to generate article:`, genError);
        await supabase
          .from('blog_generation_jobs')
          .update({
            status: 'failed',
            error_message: genError instanceof Error ? genError.message : 'Unknown error',
            completed_at: new Date().toISOString()
          })
          .eq('id', job.id);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        generated: generatedArticles.length,
        articles: generatedArticles,
        usedFirecrawl: useFirecrawl && !!FIRECRAWL_API_KEY
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Generation error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
