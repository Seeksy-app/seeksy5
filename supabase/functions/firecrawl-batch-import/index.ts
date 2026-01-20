/**
 * Firecrawl Batch Import Edge Function
 * Scrapes multiple URLs and imports them into knowledge_articles table
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ArticleToImport {
  url: string;
  title: string;
  date: string;
  readTime: string;
  excerpt: string;
  imageUrl?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { articles, portal = 'admin', section = 'Creator Economy', category = 'Industry News' } = await req.json();

    if (!articles || !Array.isArray(articles) || articles.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Articles array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY_1') || Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl connector not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const results: any[] = [];
    const errors: any[] = [];

    for (const article of articles as ArticleToImport[]) {
      try {
        console.log(`[Batch Import] Scraping: ${article.url}`);
        
        // Scrape the article content
        const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: article.url,
            formats: ['markdown'],
            onlyMainContent: true,
          }),
        });

        const scrapeData = await scrapeResponse.json();

        if (!scrapeResponse.ok || !scrapeData.success) {
          errors.push({ url: article.url, error: scrapeData.error || 'Scrape failed' });
          continue;
        }

        const markdown = scrapeData.data?.markdown || scrapeData.markdown || '';
        const slug = article.url.split('/p/')[1] || article.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

        // Check if article already exists
        const { data: existing } = await supabase
          .from('knowledge_articles')
          .select('id')
          .eq('source_url', article.url)
          .single();

        if (existing) {
          console.log(`[Batch Import] Article already exists: ${article.title}`);
          results.push({ url: article.url, status: 'skipped', reason: 'Already exists' });
          continue;
        }

        // Insert into knowledge_articles
        const { data: inserted, error: insertError } = await supabase
          .from('knowledge_articles')
          .insert({
            portal,
            section,
            category,
            title: article.title,
            slug,
            excerpt: article.excerpt,
            content: markdown,
            source_url: article.url,
            is_published: true,
            screenshot_urls: article.imageUrl ? [article.imageUrl] : null,
          })
          .select()
          .single();

        if (insertError) {
          errors.push({ url: article.url, error: insertError.message });
        } else {
          results.push({ url: article.url, status: 'imported', id: inserted.id, title: article.title });
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        errors.push({ url: article.url, error: errorMessage });
      }
    }

    console.log(`[Batch Import] Complete - ${results.length} imported, ${errors.length} errors`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        imported: results.filter(r => r.status === 'imported').length,
        skipped: results.filter(r => r.status === 'skipped').length,
        failed: errors.length,
        results, 
        errors 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Batch Import] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to import articles';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
