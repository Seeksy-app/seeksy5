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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { sessionId, roomName } = await req.json();

    if (!roomName) {
      throw new Error('Room name is required');
    }

    const DAILY_API_KEY = Deno.env.get('DAILY_API_KEY');
    if (!DAILY_API_KEY) {
      throw new Error('DAILY_API_KEY not configured');
    }

    console.log('Fetching recordings for room:', roomName);

    // Get recordings from Daily API
    const response = await fetch(`https://api.daily.co/v1/recordings?room_name=${roomName}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${DAILY_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Daily API error:', error);
      throw new Error(`Daily API error: ${response.status}`);
    }

    const data = await response.json();
    const recordings = data.data || [];

    console.log(`Found ${recordings.length} recordings`);

    // Store recordings in database
    for (const recording of recordings) {
      if (recording.status === 'finished' && recording.download_link) {
        await supabaseClient
          .from('studio_recordings')
          .upsert({
            session_id: sessionId,
            user_id: user.id,
            daily_recording_id: recording.id,
            recording_url: recording.download_link,
            duration_seconds: recording.duration,
            status: 'ready',
          }, {
            onConflict: 'daily_recording_id',
          });
      }
    }

    return new Response(
      JSON.stringify({ recordings }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in daily-get-recordings:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});