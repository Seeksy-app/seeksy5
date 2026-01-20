import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encryptToken } from "../_shared/token-encryption.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[facebook-connect-page] Processing page connection');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[facebook-connect-page] User authenticated:', user.id);

    const body = await req.json();
    const { session_id, page_id } = body;

    if (!session_id || !page_id) {
      return new Response(
        JSON.stringify({ error: 'Missing session_id or page_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[facebook-connect-page] Connecting page:', page_id, 'for session:', session_id);

    // Fetch the session
    const { data: session, error: sessionError } = await supabase
      .from('facebook_oauth_sessions')
      .select('*')
      .eq('id', session_id)
      .eq('user_id', user.id)
      .single();

    if (sessionError || !session) {
      console.error('[facebook-connect-page] Session not found:', sessionError);
      return new Response(
        JSON.stringify({ error: 'Session not found or expired' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if session is already used
    if (session.used_at) {
      return new Response(
        JSON.stringify({ error: 'Session already used' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if session is expired (10 minutes)
    const sessionAge = Date.now() - new Date(session.created_at).getTime();
    if (sessionAge > 10 * 60 * 1000) {
      return new Response(
        JSON.stringify({ error: 'Session expired' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find the selected page in the session
    const pages = session.pages as Array<{
      id: string;
      name: string;
      picture: string;
      fans: number;
      access_token: string;
    }>;

    const selectedPage = pages.find(p => p.id === page_id);
    if (!selectedPage) {
      return new Response(
        JSON.stringify({ error: 'Page not found in session' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[facebook-connect-page] Selected page:', selectedPage.name);

    // Encrypt the page access token before storing
    const encryptedAccessToken = await encryptToken(selectedPage.access_token);
    console.log('[facebook-connect-page] Token encrypted');

    // Remove any existing Facebook profile for this user (different page)
    await supabase
      .from('social_media_profiles')
      .delete()
      .eq('user_id', user.id)
      .eq('platform', 'facebook');

    // Insert the new Facebook Page profile with encrypted token
    const { data: savedProfile, error: insertError } = await supabase
      .from('social_media_profiles')
      .insert({
        user_id: user.id,
        platform: 'facebook',
        platform_user_id: selectedPage.id,
        username: selectedPage.name,
        profile_picture: selectedPage.picture,
        account_type: 'page',
        followers_count: selectedPage.fans,
        access_token: encryptedAccessToken,
        connected_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        sync_status: 'pending',
      })
      .select()
      .single();

    if (insertError) {
      console.error('[facebook-connect-page] Failed to insert profile:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to save profile' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mark session as used
    await supabase
      .from('facebook_oauth_sessions')
      .update({ used_at: new Date().toISOString() })
      .eq('id', session_id);

    console.log('[facebook-connect-page] Profile saved with encrypted token, triggering sync...');

    // Trigger sync
    try {
      await fetch(`${supabaseUrl}/functions/v1/meta-sync-social-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          user_id: user.id,
          platform: 'facebook',
          profile_id: savedProfile?.id,
        }),
      });
    } catch (syncError) {
      console.error('[facebook-connect-page] Sync trigger failed (non-blocking):', syncError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        page: {
          id: selectedPage.id,
          name: selectedPage.name,
          picture: selectedPage.picture,
          fans: selectedPage.fans,
        },
        profile_id: savedProfile?.id,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[facebook-connect-page] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
