import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { requestId, topic, message } = await req.json();

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Authenticate the user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if user is staff or admin
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const isAuthorized = roles?.some(r => r.role === 'admin' || r.role === 'staff');
    if (!isAuthorized) {
      throw new Error('Unauthorized - admin or staff role required');
    }

    // Use Lovable AI to generate a neutral, informational response
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a helpful assistant drafting responses for elected officials to constituent requests. 
            
CRITICAL RULES:
- Be STRICTLY INFORMATIONAL, never persuasive
- NEVER include calls to vote, donate, or support any candidate/party
- NO demographic targeting or tailored political pitches
- Provide factual information only
- Be respectful, professional, and neutral
- Acknowledge the concern and provide relevant factual information
- Keep responses concise (2-3 paragraphs)
- Do NOT make policy promises
- Suggest appropriate next steps or resources when relevant

This is a DRAFT that staff will edit and approve. Focus on clarity and factual accuracy.`
          },
          {
            role: 'user',
            content: `Topic: ${topic}\n\nConstituent's Message:\n${message}\n\nPlease draft a neutral, informational response.`
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Lovable AI API error:', errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const suggestedResponse = aiData.choices[0].message.content;

    // Store the AI suggestion
    await supabase
      .from('constituent_requests')
      .update({ ai_suggested_response: suggestedResponse })
      .eq('id', requestId);

    return new Response(
      JSON.stringify({ suggestedResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
