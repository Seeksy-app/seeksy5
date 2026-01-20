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
    const { productDetails, targetAudience, keyMessage, duration, mode, existingScript } = await req.json();

    if (mode === 'refine' && !existingScript) {
      throw new Error('Existing script required for refinement');
    }

    if (mode === 'generate' && (!productDetails || !targetAudience || !keyMessage)) {
      throw new Error('Missing required fields for generation');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    let systemPrompt: string;
    let userPrompt: string;

    if (mode === 'refine') {
      systemPrompt = `You are an expert advertising copywriter. Return ONLY the refined script text with no preamble, options, or explanations. Just the final script ready to be read aloud.`;

      userPrompt = `Refine this ${duration || '30'}-second audio ad script. Return ONLY the improved script text:

${existingScript}

Make it compelling, clear, and professionally written. Match the ${duration || '30'} second duration (~${Math.floor((parseInt(duration || '30') * 150) / 60)} words).`;
    } else {
      systemPrompt = `You are an expert advertising copywriter. Return ONLY the ad script text with no preamble, options, or explanations. Just the final script ready to be read aloud.`;

      userPrompt = `Create a ${duration || '30'}-second audio ad script. Return ONLY the script text:

Product/Service: ${productDetails}
Target Audience: ${targetAudience}
Key Message: ${keyMessage}
Target: ~${Math.floor((parseInt(duration || '30') * 150) / 60)} words for ${duration || '30'} seconds

Important: Do NOT include any phone number or call-to-action in the script - these will be added automatically.
Return just the script, nothing else.`;
    }

    console.log('Generating ad script with Lovable AI...');

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
      const errorText = await response.text();
      console.error('Lovable AI API error:', response.status, errorText);
      throw new Error(`AI generation failed: ${response.status}`);
    }

    const data = await response.json();
    const generatedScript = data.choices[0].message.content;

    console.log('Ad script generated successfully');

    return new Response(
      JSON.stringify({ script: generatedScript }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error generating ad script:', error);
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
