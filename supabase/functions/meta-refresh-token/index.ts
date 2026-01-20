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

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { accountId } = await req.json();

    if (!accountId) {
      throw new Error('Missing accountId');
    }

    // Get the account from database
    const { data: account, error: fetchError } = await supabase
      .from('social_media_accounts')
      .select('*')
      .eq('id', accountId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !account) {
      throw new Error('Account not found');
    }

    const metaAppId = Deno.env.get('META_APP_ID');
    const metaAppSecret = Deno.env.get('META_APP_SECRET');

    if (!metaAppId || !metaAppSecret) {
      throw new Error('Meta credentials not configured');
    }

    // Exchange current token for a new long-lived token
    const refreshResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?` +
      `grant_type=fb_exchange_token&` +
      `client_id=${metaAppId}&` +
      `client_secret=${metaAppSecret}&` +
      `fb_exchange_token=${account.access_token}`
    );

    if (!refreshResponse.ok) {
      const errorData = await refreshResponse.text();
      console.error('Token refresh failed:', errorData);
      throw new Error('Failed to refresh token. Please reconnect your account.');
    }

    const refreshData = await refreshResponse.json();
    const newAccessToken = refreshData.access_token;
    const expiresIn = refreshData.expires_in || 5184000; // Default to 60 days
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    // Update the token in database
    const { error: updateError } = await supabase
      .from('social_media_accounts')
      .update({
        access_token: newAccessToken,
        token_expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq('id', accountId);

    if (updateError) {
      console.error('Database update error:', updateError);
      throw updateError;
    }

    console.log(`Token refreshed for account ${accountId}, expires at ${expiresAt}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        expires_at: expiresAt,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in meta-refresh-token:', error);
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
