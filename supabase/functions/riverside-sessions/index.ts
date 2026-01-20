import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('=== riverside-sessions function called ===');

  // Riverside integration is coming soon - return placeholder
  return new Response(
    JSON.stringify({
      status: 'coming_soon',
      message: "Riverside integration is coming soon. You'll be able to pull episodes directly from your Riverside studio.",
      sessions: [],
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
