import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface InsightSchema {
  insight_type: 'competitor_move' | 'market_trend' | 'pricing_update' | 'funding_announcement' | 'product_launch' | 'industry_shift' | 'regulatory_change';
  title: string;
  summary: string;
  key_points: string[];
  relevance_score: number;
  published_date?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, sourceId, query, category } = await req.json();
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    console.log(`[Market Intelligence] Action: ${action}, Source: ${sourceId}, Query: ${query}`);

    if (action === 'refresh_source' && sourceId) {
      return await refreshSource(supabase, sourceId);
    } else if (action === 'search' && query) {
      return await searchWeb(supabase, query, category);
    } else if (action === 'refresh_all') {
      return await refreshAllSources(supabase);
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Use refresh_source, search, or refresh_all' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('[Market Intelligence] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function refreshSource(supabase: any, sourceId: string) {
  // Get source details
  const { data: source, error: sourceError } = await supabase
    .from('market_intelligence_sources')
    .select('*')
    .eq('id', sourceId)
    .single();

  if (sourceError || !source) {
    return new Response(
      JSON.stringify({ error: 'Source not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Create job record
  const { data: job } = await supabase
    .from('market_intelligence_jobs')
    .insert({
      job_type: 'source_refresh',
      source_id: sourceId,
      status: 'running',
      started_at: new Date().toISOString()
    })
    .select()
    .single();

  try {
    // Scrape the source URL using Firecrawl
    const scrapeResult = await scrapeUrl(source.url);
    
    if (!scrapeResult.success) {
      throw new Error(scrapeResult.error || 'Failed to scrape source');
    }

    const markdown = scrapeResult.markdown || '';
    
    // Cache the raw content
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour cache

    const { data: cache } = await supabase
      .from('market_intelligence_cache')
      .insert({
        source_id: sourceId,
        raw_content: markdown,
        content_hash: await hashContent(markdown),
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    // Process with AI to extract structured insights
    const insights = await extractInsights(markdown, source.name, source.category);

    // Store insights
    let insertedCount = 0;
    for (const insight of insights) {
      if (insight.relevance_score >= 0.7) {
        await supabase
          .from('market_intelligence_insights')
          .insert({
            source_id: sourceId,
            cache_id: cache?.id,
            insight_type: insight.insight_type,
            title: insight.title,
            summary: insight.summary,
            key_points: insight.key_points,
            source_url: source.url,
            source_name: source.name,
            relevance_score: insight.relevance_score,
            published_date: insight.published_date || null,
            audience: getAudienceForType(insight.insight_type)
          });
        insertedCount++;
      }
    }

    // Update source last_fetched_at
    await supabase
      .from('market_intelligence_sources')
      .update({ last_fetched_at: new Date().toISOString() })
      .eq('id', sourceId);

    // Complete job
    await supabase
      .from('market_intelligence_jobs')
      .update({
        status: 'completed',
        results_count: insertedCount,
        completed_at: new Date().toISOString()
      })
      .eq('id', job.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        insights_created: insertedCount,
        source: source.name 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    // Mark job as failed
    await supabase
      .from('market_intelligence_jobs')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        completed_at: new Date().toISOString()
      })
      .eq('id', job.id);

    throw error;
  }
}

async function searchWeb(supabase: any, query: string, category?: string) {
  // Create job record
  const { data: job } = await supabase
    .from('market_intelligence_jobs')
    .insert({
      job_type: 'search',
      query,
      status: 'running',
      started_at: new Date().toISOString()
    })
    .select()
    .single();

  try {
    // Get domain filter from active sources if category specified
    let domainFilter: string[] = [];
    if (category) {
      const { data: sources } = await supabase
        .from('market_intelligence_sources')
        .select('url')
        .eq('category', category)
        .eq('is_active', true);
      
      if (sources) {
        domainFilter = sources.map((s: any) => new URL(s.url).hostname);
      }
    }

    // Search using Firecrawl
    const searchResult = await searchFirecrawl(query, domainFilter);
    
    if (!searchResult.success) {
      throw new Error(searchResult.error || 'Search failed');
    }

    // Process results with AI
    const resultsData = searchResult.data || [];
    const combinedContent = resultsData
      .map((r: any) => `## ${r.title}\nURL: ${r.url}\n${r.markdown || r.description || ''}`)
      .join('\n\n---\n\n');

    const insights = await extractInsights(combinedContent, 'Web Search', category || 'general');

    // Store high-quality insights
    let insertedCount = 0;
    for (const insight of insights) {
      if (insight.relevance_score >= 0.7) {
        await supabase
          .from('market_intelligence_insights')
          .insert({
            insight_type: insight.insight_type,
            title: insight.title,
            summary: insight.summary,
            key_points: insight.key_points,
            source_name: 'Web Search',
            relevance_score: insight.relevance_score,
            published_date: insight.published_date || null,
            audience: getAudienceForType(insight.insight_type),
            metadata: { query, category }
          });
        insertedCount++;
      }
    }

    // Complete job
    await supabase
      .from('market_intelligence_jobs')
      .update({
        status: 'completed',
        results_count: insertedCount,
        completed_at: new Date().toISOString()
      })
      .eq('id', job.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        insights_created: insertedCount,
        query 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    await supabase
      .from('market_intelligence_jobs')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        completed_at: new Date().toISOString()
      })
      .eq('id', job.id);

    throw error;
  }
}

async function refreshAllSources(supabase: any) {
  const { data: sources } = await supabase
    .from('market_intelligence_sources')
    .select('id, name')
    .eq('is_active', true);

  if (!sources || sources.length === 0) {
    return new Response(
      JSON.stringify({ success: true, message: 'No active sources to refresh' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const results = [];
  for (const source of sources) {
    try {
      // Small delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const response = await refreshSource(supabase, source.id);
      const data = await response.json();
      results.push({ source: source.name, ...data });
    } catch (error) {
      results.push({ 
        source: source.name, 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  return new Response(
    JSON.stringify({ success: true, results }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function scrapeUrl(url: string): Promise<{ success: boolean; markdown?: string; error?: string }> {
  if (!FIRECRAWL_API_KEY) {
    console.error('[Market Intelligence] FIRECRAWL_API_KEY not configured');
    return { success: false, error: 'Firecrawl not configured' };
  }

  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['markdown'],
        onlyMainContent: true,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return { success: false, error: data.error || 'Scrape failed' };
    }

    return { success: true, markdown: data.data?.markdown || data.markdown };
  } catch (error) {
    console.error('[Market Intelligence] Scrape error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Scrape failed' };
  }
}

async function searchFirecrawl(query: string, domainFilter: string[] = []): Promise<{ success: boolean; data?: any[]; error?: string }> {
  if (!FIRECRAWL_API_KEY) {
    return { success: false, error: 'Firecrawl not configured' };
  }

  try {
    const body: any = {
      query,
      limit: 10,
    };

    if (domainFilter.length > 0) {
      body.search_domain_filter = domainFilter;
    }

    const response = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return { success: false, error: data.error || 'Search failed' };
    }

    return { success: true, data: data.data || [] };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Search failed' };
  }
}

async function extractInsights(content: string, sourceName: string, category: string): Promise<InsightSchema[]> {
  if (!LOVABLE_API_KEY) {
    console.error('[Market Intelligence] LOVABLE_API_KEY not configured');
    return [];
  }

  const systemPrompt = `You are a market intelligence analyst for Seeksy, a creator economy platform competing with Spotify, Riverside, Restream, and podcast networks.

Extract structured insights from the provided content. Focus on:
- Competitor moves (pricing changes, feature launches, acquisitions)
- Market trends (industry growth, user behavior shifts)
- Funding announcements in the creator/podcast space
- Product launches relevant to our market
- Industry shifts and regulatory changes

Only return insights with relevance_score >= 0.7. Be selective and focus on actionable intelligence.`;

  try {
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
          { role: 'user', content: `Source: ${sourceName}\nCategory: ${category}\n\nContent:\n${content.slice(0, 15000)}` }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'extract_insights',
              description: 'Extract structured market intelligence insights from content',
              parameters: {
                type: 'object',
                properties: {
                  insights: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        insight_type: { 
                          type: 'string', 
                          enum: ['competitor_move', 'market_trend', 'pricing_update', 'funding_announcement', 'product_launch', 'industry_shift', 'regulatory_change']
                        },
                        title: { type: 'string', description: 'Concise headline (max 100 chars)' },
                        summary: { type: 'string', description: 'Executive summary (2-3 sentences)' },
                        key_points: { 
                          type: 'array', 
                          items: { type: 'string' },
                          description: '3-5 key takeaways'
                        },
                        relevance_score: { 
                          type: 'number', 
                          description: 'Relevance to Seeksy (0-1, only return if >= 0.7)' 
                        },
                        published_date: { 
                          type: 'string', 
                          description: 'ISO date if mentioned in content' 
                        }
                      },
                      required: ['insight_type', 'title', 'summary', 'key_points', 'relevance_score']
                    }
                  }
                },
                required: ['insights']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'extract_insights' } }
      }),
    });

    if (!response.ok) {
      console.error('[Market Intelligence] AI extraction failed:', response.status);
      return [];
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      return parsed.insights || [];
    }

    return [];
  } catch (error) {
    console.error('[Market Intelligence] AI extraction error:', error);
    return [];
  }
}

function getAudienceForType(type: string): string[] {
  switch (type) {
    case 'competitor_move':
    case 'product_launch':
      return ['ceo', 'board', 'cfo'];
    case 'pricing_update':
    case 'funding_announcement':
      return ['cfo', 'board'];
    case 'market_trend':
    case 'industry_shift':
      return ['ceo', 'board', 'cfo'];
    case 'regulatory_change':
      return ['ceo', 'board'];
    default:
      return ['board', 'cfo', 'ceo'];
  }
}

async function hashContent(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
