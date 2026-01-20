import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.83.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error('Authentication failed:', authError);
      throw new Error('Not authenticated');
    }

    console.log('User authenticated:', user.id);

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const fileName = formData.get('fileName') as string || file?.name;

    if (!file) {
      throw new Error('No file provided');
    }

    console.log(`Processing upload: ${fileName} (${file.size} bytes)`);

    const accountId = Deno.env.get('CLOUDFLARE_ACCOUNT_ID');
    const apiToken = Deno.env.get('CLOUDFLARE_STREAM_API_TOKEN');

    if (!accountId || !apiToken) {
      console.error('Cloudflare credentials missing');
      throw new Error('Cloudflare credentials not configured');
    }

    // Upload directly to Cloudflare Stream via their simple upload API
    const uploadResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
        },
        body: await file.arrayBuffer(),
      }
    );

    console.log('Cloudflare upload response status:', uploadResponse.status);

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Cloudflare Stream upload error:', errorText);
      throw new Error(`Upload failed: ${errorText}`);
    }

    const result = await uploadResponse.json();
    const streamUid = result.result?.uid;

    if (!streamUid) {
      console.error('No stream UID in response:', result);
      throw new Error('No stream ID returned from Cloudflare');
    }

    console.log('Upload successful! Stream ID:', streamUid);

    // Construct public URL
    const publicUrl = `https://customer-${accountId}.cloudflarestream.com/${streamUid}/manifest/video.m3u8`;

    // Save to database
    const { error: dbError } = await supabaseClient
      .from('media_files')
      .insert({
        user_id: user.id,
        file_name: fileName,
        file_type: file.type.startsWith('video') ? 'video' : 'audio',
        file_url: publicUrl,
        file_size_bytes: file.size,
        cloudflare_uid: streamUid
      });

    if (dbError) {
      console.error('Database error:', dbError);
      throw dbError;
    }

    return new Response(
      JSON.stringify({ 
        streamUid,
        publicUrl,
        accountId,
        message: 'Upload successful'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in cloudflare-stream-upload:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
