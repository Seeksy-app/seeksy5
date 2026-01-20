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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { oldRssUrl, newRssUrl, migrationId } = await req.json();

    if (!oldRssUrl || !newRssUrl) {
      return new Response(
        JSON.stringify({ error: 'oldRssUrl and newRssUrl are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Checking redirect from ${oldRssUrl} to ${newRssUrl}`);

    // Fetch the old RSS URL and check for redirect
    const response = await fetch(oldRssUrl, {
      method: 'HEAD',
      redirect: 'manual', // Don't follow redirects automatically
    });

    console.log(`Response status: ${response.status}`);
    console.log(`Response headers:`, Object.fromEntries(response.headers.entries()));

    const isRedirect = response.status === 301 || response.status === 308;
    const locationHeader = response.headers.get('location');
    const redirectsToNewUrl = locationHeader === newRssUrl;

    let redirectStatus = 'not_configured';
    let statusMessage = '';

    if (isRedirect && redirectsToNewUrl) {
      redirectStatus = 'active';
      statusMessage = '301 redirect is correctly configured and pointing to your new Seeksy RSS feed!';
    } else if (isRedirect && !redirectsToNewUrl) {
      redirectStatus = 'failed';
      statusMessage = `301 redirect exists but points to wrong URL: ${locationHeader}`;
    } else if (response.status === 200) {
      redirectStatus = 'not_configured';
      statusMessage = 'Old RSS feed is still active with no redirect. Please set up the 301 redirect.';
    } else {
      redirectStatus = 'failed';
      statusMessage = `Unexpected response: HTTP ${response.status}`;
    }

    // Update migration record if migrationId provided
    if (migrationId) {
      const { error: updateError } = await supabase
        .from('rss_migrations')
        .update({
          redirect_status: redirectStatus,
          last_check_at: new Date().toISOString(),
          redirect_verified_at: redirectStatus === 'active' ? new Date().toISOString() : null,
        })
        .eq('id', migrationId);

      if (updateError) {
        console.error('Error updating migration record:', updateError);
      }
    }

    return new Response(
      JSON.stringify({
        success: redirectStatus === 'active',
        redirectStatus,
        statusMessage,
        httpStatus: response.status,
        locationHeader,
        redirectsToNewUrl,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error checking RSS redirect:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage, redirectStatus: 'failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
