import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.83.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// AWS Signature V4 implementation for IVS API calls
async function signRequest(
  method: string,
  url: string,
  body: string,
  accessKeyId: string,
  secretAccessKey: string,
  region: string,
  service: string
): Promise<Headers> {
  const encoder = new TextEncoder();
  const urlObj = new URL(url);
  const datetime = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
  const date = datetime.slice(0, 8);
  
  const headers = new Headers({
    'Content-Type': 'application/json',
    'Host': urlObj.host,
    'X-Amz-Date': datetime,
  });

  // Create canonical request
  const signedHeaders = 'content-type;host;x-amz-date';
  const payloadHash = await crypto.subtle.digest('SHA-256', encoder.encode(body));
  const payloadHashHex = Array.from(new Uint8Array(payloadHash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  const canonicalRequest = [
    method,
    urlObj.pathname,
    urlObj.search.slice(1),
    `content-type:application/json\nhost:${urlObj.host}\nx-amz-date:${datetime}\n`,
    signedHeaders,
    payloadHashHex,
  ].join('\n');

  // Create string to sign
  const canonicalRequestHash = await crypto.subtle.digest('SHA-256', encoder.encode(canonicalRequest));
  const canonicalRequestHashHex = Array.from(new Uint8Array(canonicalRequestHash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  const credentialScope = `${date}/${region}/${service}/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    datetime,
    credentialScope,
    canonicalRequestHashHex,
  ].join('\n');

  // Calculate signature
  const hmacSha256 = async (key: ArrayBuffer, data: Uint8Array): Promise<ArrayBuffer> => {
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      new Uint8Array(key),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    return crypto.subtle.sign('HMAC', cryptoKey, new Uint8Array(data));
  };

  const getSignatureKey = async (key: string, dateStamp: string, regionName: string, serviceName: string) => {
    const kDate = await hmacSha256(encoder.encode('AWS4' + key).buffer as ArrayBuffer, encoder.encode(dateStamp));
    const kRegion = await hmacSha256(kDate, encoder.encode(regionName));
    const kService = await hmacSha256(kRegion, encoder.encode(serviceName));
    const kSigning = await hmacSha256(kService, encoder.encode('aws4_request'));
    return kSigning;
  };

  const signingKey = await getSignatureKey(secretAccessKey, date, region, service);
  const signatureBuffer = await hmacSha256(signingKey, encoder.encode(stringToSign));
  const signature = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  headers.set(
    'Authorization',
    `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`
  );

  return headers;
}

async function callIvsApi(action: string, body: object, accessKeyId: string, secretAccessKey: string, region: string) {
  const url = `https://ivs.${region}.amazonaws.com/`;
  const bodyStr = JSON.stringify(body);
  
  const headers = await signRequest('POST', url, bodyStr, accessKeyId, secretAccessKey, region, 'ivs');
  headers.set('X-Amz-Target', `AmazonInteractiveVideoService.${action}`);

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: bodyStr,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`IVS API error: ${response.status} - ${errorText}`);
    throw new Error(`IVS API error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { action, channelId, channelName } = await req.json();
    
    const accessKeyId = Deno.env.get('AWS_IVS_ACCESS_KEY_ID');
    const secretAccessKey = Deno.env.get('AWS_IVS_SECRET_ACCESS_KEY');
    const region = Deno.env.get('AWS_IVS_REGION') || 'us-east-1';

    if (!accessKeyId || !secretAccessKey) {
      throw new Error('AWS IVS credentials not configured');
    }

    console.log(`Processing IVS action: ${action} for user: ${user.id}`);

    if (action === 'create_channel') {
      // Create IVS channel
      const ivsResponse = await callIvsApi('CreateChannel', {
        name: channelName || `seeksy-${user.id.slice(0, 8)}-${Date.now()}`,
        latencyMode: 'LOW',
        type: 'STANDARD',
        authorized: false,
      }, accessKeyId, secretAccessKey, region);

      console.log('IVS channel created:', ivsResponse);

      // Store channel in database
      const { data: channel, error: dbError } = await supabase
        .from('live_channels')
        .insert({
          user_id: user.id,
          channel_name: channelName || 'My Live Channel',
          channel_arn: ivsResponse.channel.arn,
          stream_key: ivsResponse.streamKey.value,
          ingest_endpoint: ivsResponse.channel.ingestEndpoint,
          playback_url: ivsResponse.channel.playbackUrl,
          status: 'offline',
          metadata: {
            latencyMode: ivsResponse.channel.latencyMode,
            type: ivsResponse.channel.type,
          }
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
        throw dbError;
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          channel,
          streamKey: ivsResponse.streamKey.value,
          ingestEndpoint: ivsResponse.channel.ingestEndpoint,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'delete_channel') {
      // Get channel from database
      const { data: channel, error: fetchError } = await supabase
        .from('live_channels')
        .select('*')
        .eq('id', channelId)
        .eq('user_id', user.id)
        .single();

      if (fetchError || !channel) {
        throw new Error('Channel not found');
      }

      // Delete from IVS
      if (channel.channel_arn) {
        await callIvsApi('DeleteChannel', {
          arn: channel.channel_arn,
        }, accessKeyId, secretAccessKey, region);
      }

      // Delete from database
      await supabase
        .from('live_channels')
        .delete()
        .eq('id', channelId);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'get_stream_key') {
      const { data: channel, error: fetchError } = await supabase
        .from('live_channels')
        .select('*')
        .eq('id', channelId)
        .eq('user_id', user.id)
        .single();

      if (fetchError || !channel) {
        throw new Error('Channel not found');
      }

      return new Response(
        JSON.stringify({ 
          success: true,
          streamKey: channel.stream_key,
          ingestEndpoint: channel.ingest_endpoint,
          rtmpUrl: `rtmps://${channel.ingest_endpoint}:443/app/${channel.stream_key}`,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'update_status') {
      const { status } = await req.json();
      
      await supabase
        .from('live_channels')
        .update({ 
          status,
          started_at: status === 'live' ? new Date().toISOString() : null,
          ended_at: status === 'offline' ? new Date().toISOString() : null,
        })
        .eq('id', channelId)
        .eq('user_id', user.id);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'list_channels') {
      const { data: channels, error: listError } = await supabase
        .from('live_channels')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (listError) throw listError;

      return new Response(
        JSON.stringify({ success: true, channels }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');
  } catch (error) {
    console.error('IVS channel management error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
