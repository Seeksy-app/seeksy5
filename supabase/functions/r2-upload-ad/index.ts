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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get auth header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) throw new Error('Missing authorization header');

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !user) throw new Error('Unauthorized');

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const advertiserId = formData.get('advertiserId') as string;
    const adDescription = formData.get('adDescription') as string;
    const ctaUrl = formData.get('ctaUrl') as string;
    const ctaText = formData.get('ctaText') as string;
    const duration = parseInt(formData.get('duration') as string || '0');
    const thumbnailUrl = formData.get('thumbnailUrl') as string;

    if (!file || !advertiserId) {
      throw new Error('Missing required fields: file, advertiserId');
    }

    console.log('Uploading ad file:', file.name, 'size:', file.size);

    // Verify user owns this advertiser account
    const { data: advertiser, error: advertiserError } = await supabase
      .from('advertisers')
      .select('id, user_id')
      .eq('id', advertiserId)
      .eq('user_id', user.id)
      .single();

    if (advertiserError || !advertiser) {
      throw new Error('Unauthorized: Advertiser account not found');
    }

    // Get R2 credentials
    const accountId = Deno.env.get('CLOUDFLARE_R2_ACCOUNT_ID')!;
    const accessKeyId = Deno.env.get('CLOUDFLARE_R2_ACCESS_KEY_ID')!;
    const secretAccessKey = Deno.env.get('CLOUDFLARE_R2_SECRET_ACCESS_KEY')!;
    const bucketName = Deno.env.get('CLOUDFLARE_R2_BUCKET_NAME')!;
    const publicUrl = Deno.env.get('CLOUDFLARE_R2_PUBLIC_URL')!;

    // Generate unique file path
    const timestamp = Date.now();
    const fileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${user.id}/${timestamp}-${fileName}`;
    const fileUrl = `${publicUrl}/${filePath}`;

    // Upload to R2 using AWS SDK
    const encoder = new TextEncoder();
    const fileBytes = new Uint8Array(await file.arrayBuffer());

    // Create AWS Signature V4
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:\-]|\.\d{3}/g, '');
    const dateStamp = amzDate.slice(0, 8);
    const region = 'auto';
    const service = 's3';
    const host = `${accountId}.r2.cloudflarestorage.com`;
    const endpoint = `https://${host}/${bucketName}/${filePath}`;

    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
    const algorithm = 'AWS4-HMAC-SHA256';

    // Create canonical request
    const canonicalHeaders = `content-type:${file.type}\nhost:${host}\nx-amz-content-sha256:UNSIGNED-PAYLOAD\nx-amz-date:${amzDate}\n`;
    const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';
    const canonicalRequest = `PUT\n/${bucketName}/${filePath}\n\n${canonicalHeaders}\n${signedHeaders}\nUNSIGNED-PAYLOAD`;

    // Create string to sign
    const hashedCanonicalRequest = Array.from(
      new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(canonicalRequest)))
    ).map(b => b.toString(16).padStart(2, '0')).join('');

    const stringToSign = `${algorithm}\n${amzDate}\n${credentialScope}\n${hashedCanonicalRequest}`;

    // Calculate signature
    const getSignatureKey = async (key: string, dateStamp: string, region: string, service: string) => {
      const kDate = await crypto.subtle.sign(
        'HMAC',
        await crypto.subtle.importKey('raw', encoder.encode('AWS4' + key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']),
        encoder.encode(dateStamp)
      );
      const kRegion = await crypto.subtle.sign(
        'HMAC',
        await crypto.subtle.importKey('raw', new Uint8Array(kDate), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']),
        encoder.encode(region)
      );
      const kService = await crypto.subtle.sign(
        'HMAC',
        await crypto.subtle.importKey('raw', new Uint8Array(kRegion), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']),
        encoder.encode(service)
      );
      const kSigning = await crypto.subtle.sign(
        'HMAC',
        await crypto.subtle.importKey('raw', new Uint8Array(kService), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']),
        encoder.encode('aws4_request')
      );
      return new Uint8Array(kSigning);
    };

    const signingKey = await getSignatureKey(secretAccessKey, dateStamp, region, service);
    const signature = Array.from(
      new Uint8Array(
        await crypto.subtle.sign(
          'HMAC',
          await crypto.subtle.importKey('raw', signingKey, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']),
          encoder.encode(stringToSign)
        )
      )
    ).map(b => b.toString(16).padStart(2, '0')).join('');

    // Upload to R2
    const authorizationHeader = `${algorithm} Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    const uploadResponse = await fetch(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
        'x-amz-date': amzDate,
        'x-amz-content-sha256': 'UNSIGNED-PAYLOAD',
        'Authorization': authorizationHeader,
      },
      body: fileBytes,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('R2 upload failed:', uploadResponse.status, errorText);
      throw new Error(`R2 upload failed: ${uploadResponse.status} ${errorText}`);
    }

    console.log('File uploaded to R2 successfully');

    // Create audio ad record
    const { data: audioAd, error: dbError } = await supabase
      .from('audio_ads')
      .insert({
        advertiser_id: advertiserId,
        ad_type: 'standard',
        audio_url: fileUrl,
        thumbnail_url: thumbnailUrl || null,
        script: adDescription || 'Uploaded pre-made ad',
        voice_id: 'uploaded',
        status: 'completed',
        duration_seconds: duration || null,
        conversation_config: {
          cta_url: ctaUrl,
          cta_text: ctaText,
        },
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw dbError;
    }

    console.log('Audio ad record created:', audioAd.id);

    return new Response(
      JSON.stringify({ 
        success: true,
        audioAd,
        fileUrl
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error uploading ad:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: String(error)
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
