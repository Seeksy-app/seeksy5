import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.83.0';
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// AWS Signature V4 helper functions for presigned URLs
async function hmac(key: Uint8Array, data: string): Promise<Uint8Array> {
  const keyArray = new Uint8Array(key);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyArray,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(data));
  return new Uint8Array(signature);
}

async function getSignatureKey(
  key: string,
  dateStamp: string,
  region: string,
  service: string
): Promise<Uint8Array> {
  const kDate = await hmac(new TextEncoder().encode('AWS4' + key), dateStamp);
  const kRegion = await hmac(kDate, region);
  const kService = await hmac(kRegion, service);
  const kSigning = await hmac(kService, 'aws4_request');
  return kSigning;
}

function toHex(buffer: Uint8Array): string {
  return Array.from(buffer)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const accountId = Deno.env.get('CLOUDFLARE_R2_ACCOUNT_ID')!;
    const accessKeyId = Deno.env.get('CLOUDFLARE_R2_ACCESS_KEY_ID')!;
    const secretAccessKey = Deno.env.get('CLOUDFLARE_R2_SECRET_ACCESS_KEY')!;
    const bucketName = Deno.env.get('CLOUDFLARE_R2_BUCKET_NAME')!.trim();
    const publicUrl = Deno.env.get('CLOUDFLARE_R2_PUBLIC_URL')!.trim();

    // Parse the multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;
    const fileName = formData.get('fileName') as string;

    if (!file || !userId || !fileName) {
      throw new Error('Missing required fields');
    }

    console.log(`Starting R2 upload for ${fileName} (${file.size} bytes)`);

    // Generate unique file path
    const timestamp = Date.now();
    const filePath = `${userId}/${timestamp}-${fileName}`;
    
    // URL encode the path components for AWS signature
    const encodedPath = filePath.split('/').map(encodeURIComponent).join('/');

    // Create signed PUT request for R2
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:\-]|\.\d{3}/g, '');
    const dateStamp = amzDate.slice(0, 8);
    const region = 'auto';
    const service = 's3';
    const host = `${accountId}.r2.cloudflarestorage.com`;
    const endpoint = `https://${host}/${bucketName}/${encodedPath}`;

    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
    const algorithm = 'AWS4-HMAC-SHA256';

    // Read file content
    const fileBuffer = await file.arrayBuffer();
    const payloadHash = toHex(
      new Uint8Array(await crypto.subtle.digest('SHA-256', fileBuffer))
    );

    // Create canonical request with encoded path
    const canonicalHeaders = `content-type:${file.type}\nhost:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
    const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';

    const canonicalRequest = [
      'PUT',
      `/${bucketName}/${encodedPath}`,
      '',
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join('\n');

    // Create string to sign
    const hashedCanonicalRequest = toHex(
      new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonicalRequest)))
    );

    const stringToSign = [
      algorithm,
      amzDate,
      credentialScope,
      hashedCanonicalRequest,
    ].join('\n');

    // Calculate signature
    const signingKey = await getSignatureKey(secretAccessKey, dateStamp, region, service);
    const signature = toHex(await hmac(signingKey, stringToSign));

    // Create authorization header
    const authorizationHeader = `${algorithm} Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    // Upload to R2 using fetch
    const uploadResponse = await fetch(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
        'x-amz-date': amzDate,
        'x-amz-content-sha256': payloadHash,
        'Authorization': authorizationHeader,
      },
      body: fileBuffer,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('R2 upload failed:', uploadResponse.status, errorText);
      throw new Error(`R2 upload failed: ${uploadResponse.status} ${errorText}`);
    }

    console.log('R2 upload successful');

    // Construct the public URL
    const fileUrl = `${publicUrl}/${filePath}`;

    // Create database record
    const { data: mediaFile, error: dbError } = await supabase
      .from('media_files')
      .insert({
        user_id: userId,
        file_name: fileName,
        file_url: fileUrl,
        file_type: file.type.startsWith('video') ? 'video' : 'audio',
        file_size_bytes: file.size,
        source: 'upload',
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw dbError;
    }

    console.log('Database record created:', mediaFile.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        fileUrl,
        mediaFile 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in r2-upload:', error);
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
