import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { duration, topic, tone, style } = await req.json();

    if (!duration || !topic) {
      throw new Error('Missing required fields: duration or topic');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Determine word count based on duration
    const wordCount = duration === '2 minutes' ? 250 : 3500;

    const systemPrompt = `You are a professional scriptwriter specializing in voice recording scripts. Generate natural-sounding, engaging scripts that are easy to read aloud. The script should flow smoothly and sound conversational.`;

    const userPrompt = `Generate a ${duration} voice recording script (approximately ${wordCount} words) about: ${topic}

Tone: ${tone}
Style: ${style}

Requirements:
- Write in a natural, conversational style that's easy to read aloud
- Include varied sentence structures and natural pauses
- Make it engaging and authentic
- Avoid overly complex vocabulary
- Include emotional variety to capture different voice characteristics
- Format with proper paragraphs for easy reading

Generate ONLY the script text, no additional commentary or instructions.`;

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
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }),
          {
            status: 402,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error('AI gateway error');
    }

    const data = await response.json();
    const script = data.choices?.[0]?.message?.content;

    if (!script) {
      throw new Error('No script generated');
    }

    return new Response(
      JSON.stringify({ script }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error generating script:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
