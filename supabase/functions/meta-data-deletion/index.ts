import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the signed request from Meta
    const body = await req.json();
    const signedRequest = body.signed_request;

    if (!signedRequest) {
      throw new Error('No signed_request provided');
    }

    // Parse the signed request
    // Format: base64url_encoded_signature.base64url_encoded_payload
    const [encodedSignature, encodedPayload] = signedRequest.split('.');
    
    // Decode the payload (Meta uses base64url encoding)
    const payload = JSON.parse(atob(encodedPayload.replace(/-/g, '+').replace(/_/g, '/')));
    
    // Verify the signature using app secret
    const metaAppSecret = Deno.env.get('META_APP_SECRET');
    if (!metaAppSecret) {
      throw new Error('META_APP_SECRET not configured');
    }

    // Create HMAC-SHA256 signature
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(metaAppSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign(
      'HMAC',
      key,
      new TextEncoder().encode(encodedPayload)
    );

    // Convert signature to base64url
    const signatureArray = Array.from(new Uint8Array(signature));
    const signatureBase64 = btoa(String.fromCharCode(...signatureArray))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    // Verify signature matches
    if (signatureBase64 !== encodedSignature) {
      console.error('Invalid signature');
      throw new Error('Invalid signature');
    }

    console.log('Meta data deletion request verified:', payload);

    // Extract user_id from Meta's payload
    const metaUserId = payload.user_id;
    
    if (!metaUserId) {
      throw new Error('No user_id in payload');
    }

    // Delete all social media accounts associated with this Meta user_id
    const { error: deleteError } = await supabase
      .from('social_media_accounts')
      .delete()
      .eq('platform_user_id', metaUserId)
      .in('platform', ['instagram', 'facebook']);

    if (deleteError) {
      console.error('Error deleting social media accounts:', deleteError);
      throw deleteError;
    }

    console.log(`Deleted social media accounts for Meta user ${metaUserId}`);

    // Meta expects a JSON response with a confirmation URL and code
    const confirmationCode = `${metaUserId}_${Date.now()}`;
    const confirmationUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/meta-data-deletion-status?code=${confirmationCode}`;

    return new Response(
      JSON.stringify({ 
        url: confirmationUrl,
        confirmation_code: confirmationCode
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in meta-data-deletion:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
