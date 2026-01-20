import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('=== import-riverside-session function called ===');

  // Riverside import is coming soon - return placeholder
  return new Response(
    JSON.stringify({
      status: 'coming_soon',
      message: "Direct Riverside imports are not enabled yet, but the UI is wired for when the API is available. For now, please download from Riverside and upload to Seeksy manually.",
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
