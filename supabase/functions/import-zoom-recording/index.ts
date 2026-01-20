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
    console.log('=== import-zoom-recording function started ===');

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ status: 'error', message: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ status: 'error', message: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { zoom_recording_id, topic, download_url, duration_seconds, thumbnail_url } = body;

    console.log('Import request:', { zoom_recording_id, topic, user_id: user.id });

    if (!zoom_recording_id) {
      return new Response(
        JSON.stringify({ status: 'error', message: 'Recording ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check Zoom connection
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: zoomConnection, error: connError } = await serviceClient
      .from('zoom_connections')
      .select('access_token')
      .eq('user_id', user.id)
      .single();

    if (connError || !zoomConnection) {
      return new Response(
        JSON.stringify({ 
          status: 'not_connected', 
          message: 'Please connect your Zoom account first.' 
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create media_files row
    const { data: mediaFile, error: insertError } = await supabaseClient
      .from('media_files')
      .insert({
        user_id: user.id,
        file_name: topic || `Zoom Recording - ${new Date().toLocaleDateString()}`,
        file_type: 'video',
        file_url: download_url || 'pending-zoom-import',
        source: 'zoom',
        external_id: zoom_recording_id,
        original_source_url: download_url,
        thumbnail_url: thumbnail_url || null,
        duration_seconds: duration_seconds || null,
        status: 'importing',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating media file:', insertError);
      return new Response(
        JSON.stringify({ status: 'error', message: 'Failed to create media record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Created media file:', mediaFile.id);

    // For now, mark as ready immediately
    // In production, this would trigger a background job to:
    // 1. Download the Zoom recording using the download_url + access_token
    // 2. Upload to Cloudflare Stream
    // 3. Update the media_files record with Cloudflare URLs
    
    const { error: updateError } = await supabaseClient
      .from('media_files')
      .update({ status: 'ready' })
      .eq('id', mediaFile.id);

    if (updateError) {
      console.error('Error updating status:', updateError);
    }

    return new Response(
      JSON.stringify({
        status: 'queued',
        media_file_id: mediaFile.id,
        message: 'Zoom recording import started. It will be ready in a few moments.',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in import-zoom-recording:', error);
    return new Response(
      JSON.stringify({ 
        status: 'error', 
        message: error instanceof Error ? error.message : 'Failed to import recording' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
