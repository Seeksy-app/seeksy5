import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Music library endpoint called");
    
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY not configured');
    }

    // Fetch music tracks from ElevenLabs Sound Effects API
    const response = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
      method: 'GET',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('ElevenLabs API error:', error);
      
      // Return hardcoded tracks as fallback
      return new Response(JSON.stringify({ 
        music: [
          { name: "Chill", icon: "👑", genre: "Chill" },
          { name: "Downtempo", icon: "▶", genre: "Downtempo" },
          { name: "Chill Hop", icon: "▶", genre: "Chill Hop" },
          { name: "Hip hop", icon: "👑", genre: "Hip hop" },
          { name: "Lo-Fi", icon: "▶", genre: "Lo-Fi" },
          { name: "Lounge", icon: "👑", genre: "Lounge" },
          { name: "R&B", icon: "👑", genre: "R&B" }
        ]
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    console.log(`Successfully fetched music data`);
    
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in elevenlabs-get-music:", error);
    
    // Return hardcoded tracks as fallback
    return new Response(
      JSON.stringify({ 
        music: [
          { name: "Chill", icon: "👑", genre: "Chill" },
          { name: "Downtempo", icon: "▶", genre: "Downtempo" },
          { name: "Chill Hop", icon: "▶", genre: "Chill Hop" },
          { name: "Hip hop", icon: "👑", genre: "Hip hop" },
          { name: "Lo-Fi", icon: "▶", genre: "Lo-Fi" },
          { name: "Lounge", icon: "👑", genre: "Lounge" },
          { name: "R&B", icon: "👑", genre: "R&B" }
        ]
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
