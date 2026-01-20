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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify admin user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Not authenticated');
    }

    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (rolesError || !roles || !['admin', 'super_admin'].includes(roles.role)) {
      throw new Error('Unauthorized - Admin access required');
    }

    const { query, searchType = 'all' } = await req.json();

    if (!query) {
      throw new Error('Search query is required');
    }

    // Fetch all relevant data for AI to search through
    const [profilesData, contactsData, creditsData, subscriptionsData, meetingsData, ticketsData] = await Promise.all([
      supabase.from('profiles').select('id, account_full_name, username, email, created_at'),
      supabase.from('contacts').select('id, name, email, phone, company, created_at'),
      supabase.from('user_credits').select('user_id, balance, total_purchased, total_spent'),
      supabase.from('subscriptions').select('user_id, plan_name, status'),
      supabase.from('meetings').select('id, title, attendee_name, meeting_date, user_id'),
      supabase.from('tickets').select('id, title, ticket_number, status, created_at, user_id'),
    ]);

    // Prepare context for AI
    const searchContext = {
      profiles: profilesData.data || [],
      contacts: contactsData.data || [],
      credits: creditsData.data || [],
      subscriptions: subscriptionsData.data || [],
      meetings: meetingsData.data || [],
      tickets: ticketsData.data || [],
    };

    // Use AI to analyze and match the search query
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
            content: `You are an intelligent search assistant for Seeksy admin panel. Your job is to find matching records from the provided data based on natural language queries.

Search capabilities:
- Match partial names, usernames, emails (case-insensitive, fuzzy matching)
- Find dates in natural language ("last week", "November 2025", etc.)
- Match ticket numbers, meeting titles, company names
- Handle typos and variations (e.g., "Johnny Rocket" matches "johnny rocket" or "johnnyrocket")

Return ONLY a JSON array of matching results in this exact format:
[
  {
    "id": "user-id-here",
    "type": "profile",
    "name": "Full Name",
    "matchReason": "Matched username",
    "relevanceScore": 95,
    "additionalInfo": {
      "username": "username",
      "email": "email@example.com",
      "credits": 10,
      "plan": "pro",
      "joinedDate": "2025-11-26"
    }
  }
]

Match types can be: "profile", "contact", "meeting", "ticket"
Relevance score should be 0-100 based on match quality.
If no matches found, return an empty array: []

Be generous with fuzzy matching - "johnny rocket" should match "Johnny Rocket", "johnnyRocket", "johnny-rocket", etc.`
          },
          {
            role: "user",
            content: `Search query: "${query}"\n\nSearch type: ${searchType}\n\nAvailable data:\n${JSON.stringify(searchContext, null, 2)}`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_search_results",
              description: "Return the search results as a JSON array",
              parameters: {
                type: "object",
                properties: {
                  results: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        type: { type: "string", enum: ["profile", "contact", "meeting", "ticket"] },
                        name: { type: "string" },
                        matchReason: { type: "string" },
                        relevanceScore: { type: "number" },
                        additionalInfo: { type: "object" }
                      },
                      required: ["id", "type", "name", "matchReason", "relevanceScore"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["results"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "return_search_results" } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI gateway error:', aiResponse.status, errorText);
      throw new Error(`AI search failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall?.function?.arguments) {
      throw new Error('No results from AI');
    }

    const searchResults = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify({
        success: true,
        results: searchResults.results || [],
        query: query
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-admin-search:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
