import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// AWS Signature V4 helper functions
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
    const { fileName, fileType, userId, fileSize } = await req.json();

    if (!fileName || !fileType || !userId) {
      throw new Error('Missing required fields: fileName, fileType, userId');
    }

    const accountId = Deno.env.get('CLOUDFLARE_R2_ACCOUNT_ID')!;
    const accessKeyId = Deno.env.get('CLOUDFLARE_R2_ACCESS_KEY_ID')!;
    const secretAccessKey = Deno.env.get('CLOUDFLARE_R2_SECRET_ACCESS_KEY')!;
    const bucketName = Deno.env.get('CLOUDFLARE_R2_BUCKET_NAME')!;
    const publicUrl = Deno.env.get('CLOUDFLARE_R2_PUBLIC_URL')!;

    // Generate unique file path
    const timestamp = Date.now();
    const filePath = `${userId}/${timestamp}-${fileName}`;
    
    // URL encode the path components for AWS signature
    const encodedPath = filePath.split('/').map(encodeURIComponent).join('/');

    // Create presigned URL parameters
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:\-]|\.\d{3}/g, '');
    const dateStamp = amzDate.slice(0, 8);
    const region = 'auto';
    const service = 's3';
    const host = `${accountId}.r2.cloudflarestorage.com`;
    const endpoint = `https://${host}/${bucketName}/${encodedPath}`;

    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
    const algorithm = 'AWS4-HMAC-SHA256';
    const expiresIn = 7200; // 2 hours (for large file uploads)

    // Create canonical request components - MUST include content-type in signed headers
    const canonicalQueryString = [
      `X-Amz-Algorithm=${algorithm}`,
      `X-Amz-Credential=${encodeURIComponent(accessKeyId + '/' + credentialScope)}`,
      `X-Amz-Date=${amzDate}`,
      `X-Amz-Expires=${expiresIn}`,
      `X-Amz-SignedHeaders=content-type;host`,
    ].join('&');

    const canonicalHeaders = `content-type:${fileType}\nhost:${host}\n`;
    const signedHeaders = 'content-type;host';

    const canonicalRequest = [
      'PUT',
      `/${bucketName}/${encodedPath}`,
      canonicalQueryString,
      canonicalHeaders,
      signedHeaders,
      'UNSIGNED-PAYLOAD',
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

    // Build presigned URL
    const presignedUrl = `${endpoint}?${canonicalQueryString}&X-Amz-Signature=${signature}`;
    const fileUrl = `${publicUrl}/${filePath}`;

    console.log('Generated presigned URL for:', fileName);

    return new Response(
      JSON.stringify({ 
        success: true,
        presignedUrl,
        fileUrl,
        filePath
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error generating presigned URL:', error);
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
