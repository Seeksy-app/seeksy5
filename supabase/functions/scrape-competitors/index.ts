import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!FIRECRAWL_API_KEY) {
      throw new Error('FIRECRAWL_API_KEY not configured');
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Get all enabled competitors
    const { data: competitors, error: competitorsError } = await supabase
      .from('competitor_profiles')
      .select('*')
      .eq('tracking_enabled', true);

    if (competitorsError) throw competitorsError;

    console.log(`Scraping ${competitors?.length || 0} competitors`);

    const results = [];

    for (const competitor of competitors || []) {
      try {
        // Search for recent news about the competitor
        const searchQuery = `${competitor.name} podcast platform news updates 2024 2025`;
        
        const searchResponse = await fetch('https://api.firecrawl.dev/v1/search', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: searchQuery,
            limit: 5,
            lang: 'en',
            tbs: 'qdr:w', // Last week
          }),
        });

        const searchData = await searchResponse.json();

        if (searchData.success && searchData.data) {
          for (const result of searchData.data) {
            // Determine update type based on content
            const content = (result.title + ' ' + (result.description || '')).toLowerCase();
            let updateType = 'news';
            if (content.includes('feature') || content.includes('launch') || content.includes('new')) {
              updateType = 'product';
            } else if (content.includes('price') || content.includes('pricing') || content.includes('cost')) {
              updateType = 'pricing';
            } else if (content.includes('partner') || content.includes('integration')) {
              updateType = 'partnership';
            } else if (content.includes('funding') || content.includes('raise') || content.includes('invest')) {
              updateType = 'funding';
            }

            // Insert update
            const { error: insertError } = await supabase
              .from('competitor_updates')
              .insert({
                competitor_id: competitor.id,
                update_type: updateType,
                title: result.title,
                content: result.description || result.markdown?.substring(0, 500),
                source_url: result.url,
                relevance_score: 0.7,
              });

            if (insertError) {
              console.error('Insert error:', insertError);
            }
          }

          results.push({ competitor: competitor.name, updates: searchData.data.length });
        }

        // Update last scraped timestamp
        await supabase
          .from('competitor_profiles')
          .update({ last_scraped_at: new Date().toISOString() })
          .eq('id', competitor.id);

      } catch (err) {
        console.error(`Error scraping ${competitor.name}:`, err);
        results.push({ competitor: competitor.name, error: err instanceof Error ? err.message : 'Unknown error' });
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Scrape competitors error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
