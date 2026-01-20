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

    const DAILY_API_KEY = Deno.env.get('DAILY_API_KEY');
    if (!DAILY_API_KEY) {
      throw new Error('DAILY_API_KEY not configured');
    }

    // Generate unique room name
    const roomName = `studio-${user.id}-${Date.now()}`;

    console.log('Creating Daily room:', roomName);

    // Create Daily room with recording enabled
    const response = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DAILY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: roomName,
        properties: {
          enable_recording: 'cloud',
          enable_advanced_chat: true,
          enable_screenshare: true,
          max_participants: 10,
          exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Daily API error:', error);
      throw new Error(`Daily API error: ${response.status}`);
    }

    const roomData = await response.json();
    console.log('Room created:', roomData.name);

    // Store session in database
    const { data: session, error: dbError } = await supabaseClient
      .from('studio_sessions')
      .insert({
        user_id: user.id,
        room_name: roomData.name,
        daily_room_url: roomData.url,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw dbError;
    }

    return new Response(
      JSON.stringify({
        sessionId: session.id,
        roomUrl: roomData.url,
        roomName: roomData.name,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in daily-create-room:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});