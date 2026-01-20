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
    const { campaignId, podcastId } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from('ad_campaigns')
      .select('name, targeting_rules, cpm_bid')
      .eq('id', campaignId)
      .single();

    if (campaignError) throw campaignError;

    // Fetch podcast details
    const { data: podcast, error: podcastError } = await supabase
      .from('podcasts')
      .select('title, description, category')
      .eq('id', podcastId)
      .single();

    if (podcastError) throw podcastError;

    // Fetch recent episodes for content analysis
    const { data: episodes } = await supabase
      .from('episodes')
      .select('title, description')
      .eq('podcast_id', podcastId)
      .order('publish_date', { ascending: false })
      .limit(5);

    // Build context for AI
    const podcastContext = {
      title: podcast.title,
      description: podcast.description || '',
      category: podcast.category || 'General',
      recentEpisodes: episodes?.map(e => ({
        title: e.title,
        description: e.description || ''
      })) || []
    };

    const campaignContext = {
      name: campaign.name,
      targetingRules: campaign.targeting_rules || {},
      cpmBid: campaign.cpm_bid
    };

    // Call Lovable AI for matching
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
            content: `You are an advertising match expert. Analyze how well an ad campaign fits a podcast based on:
1. Category alignment (podcast category vs campaign targeting)
2. Content relevance (podcast/episode topics vs campaign theme)
3. Audience fit (inferred from podcast description and episode titles)

Return a JSON object with:
- score: number 0-100 (100 = perfect match)
- reasoning: brief explanation of the score
- strengths: array of 2-3 key alignment points
- considerations: array of 1-2 potential mismatches (if any)`
          },
          {
            role: 'user',
            content: `Campaign: ${JSON.stringify(campaignContext, null, 2)}

Podcast: ${JSON.stringify(podcastContext, null, 2)}

Analyze the match quality.`
          }
        ],
        tools: [{
          type: "function",
          function: {
            name: "return_match_score",
            description: "Return the campaign-podcast match analysis",
            parameters: {
              type: "object",
              properties: {
                score: { 
                  type: "number",
                  description: "Match score from 0-100"
                },
                reasoning: { 
                  type: "string",
                  description: "Brief explanation of the score"
                },
                strengths: {
                  type: "array",
                  items: { type: "string" },
                  description: "Key alignment points"
                },
                considerations: {
                  type: "array",
                  items: { type: "string" },
                  description: "Potential mismatches"
                }
              },
              required: ["score", "reasoning", "strengths"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "return_match_score" } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits depleted. Please add funds.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error('AI matching failed');
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices[0].message.tool_calls?.[0];
    const matchData = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify(matchData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Match error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
