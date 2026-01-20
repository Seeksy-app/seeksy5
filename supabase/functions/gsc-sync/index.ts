import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_BUSINESS_CLIENT_ID');
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_BUSINESS_CLIENT_SECRET');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID!,
        client_secret: GOOGLE_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    const data = await response.json();
    if (data.access_token) {
      return data.access_token;
    }
    console.error('Failed to refresh token:', data);
    return null;
  } catch (err) {
    console.error('Token refresh error:', err);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { workspace_id, days = 30, user_id } = await req.json();

    if (!workspace_id) {
      return new Response(JSON.stringify({ error: 'workspace_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Get Google connection for this workspace
    const { data: connection, error: connError } = await supabase
      .from('google_connections')
      .select('*')
      .eq('workspace_id', workspace_id)
      .eq('provider', 'google')
      .single();

    if (connError || !connection) {
      return new Response(JSON.stringify({ error: 'No Google connection found for workspace' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if GSC is enabled
    const enabledProducts = connection.enabled_products || [];
    if (!enabledProducts.includes('gsc')) {
      return new Response(JSON.stringify({ error: 'GSC not enabled for this connection' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Refresh token if expired
    let accessToken = connection.access_token;
    if (new Date(connection.expires_at) <= new Date()) {
      console.log('Token expired, refreshing...');
      const newToken = await refreshAccessToken(connection.refresh_token);
      if (!newToken) {
        return new Response(JSON.stringify({ error: 'Failed to refresh token' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      accessToken = newToken;
      
      // Update stored token
      await supabase
        .from('google_connections')
        .update({ 
          access_token: newToken, 
          expires_at: new Date(Date.now() + 3600000).toISOString() 
        })
        .eq('id', connection.id);
    }

    // Fetch GSC sites list
    console.log('Fetching GSC sites...');
    const sitesResponse = await fetch('https://www.googleapis.com/webmasters/v3/sites', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!sitesResponse.ok) {
      const errText = await sitesResponse.text();
      console.error('GSC sites error:', errText);
      return new Response(JSON.stringify({ error: 'Failed to fetch GSC sites', details: errText }), {
        status: sitesResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const sitesData = await sitesResponse.json();
    const sites = sitesData.siteEntry || [];

    console.log(`Found ${sites.length} GSC sites`);

    // Upsert sites
    for (const site of sites) {
      await supabase
        .from('gsc_sites')
        .upsert({
          workspace_id,
          site_url: site.siteUrl,
          permission_level: site.permissionLevel,
        }, { onConflict: 'workspace_id,site_url' });
    }

    // Get workspace analytics settings
    const { data: settings } = await supabase
      .from('workspace_analytics_settings')
      .select('gsc_site_url')
      .eq('workspace_id', workspace_id)
      .single();

    let metricsCount = 0;

    // If a site is selected, fetch page metrics
    if (settings?.gsc_site_url) {
      console.log(`Fetching page metrics for ${settings.gsc_site_url} (${days} days)...`);
      
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const searchAnalyticsUrl = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(settings.gsc_site_url)}/searchAnalytics/query`;
      
      const analyticsResponse = await fetch(searchAnalyticsUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          dimensions: ['date', 'page'],
          rowLimit: 10000,
        }),
      });

      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json();
        const rows = analyticsData.rows || [];

        console.log(`Got ${rows.length} page metric rows`);

        // Process in batches
        for (const row of rows) {
          const [date, fullUrl] = row.keys;
          // Extract path from URL
          let pagePath = '/';
          try {
            const urlObj = new URL(fullUrl);
            pagePath = urlObj.pathname;
          } catch {
            pagePath = fullUrl;
          }

          await supabase
            .from('gsc_page_daily')
            .upsert({
              workspace_id,
              date,
              page: pagePath,
              clicks: row.clicks || 0,
              impressions: row.impressions || 0,
              ctr: row.ctr || 0,
              position: row.position || 0,
            }, { onConflict: 'workspace_id,date,page' });
          
          metricsCount++;
        }
      } else {
        console.error('Failed to fetch search analytics:', await analyticsResponse.text());
      }
    }

    // Update last_synced_at
    await supabase
      .from('workspace_analytics_settings')
      .upsert({
        workspace_id,
        last_synced_at: new Date().toISOString(),
      }, { onConflict: 'workspace_id' });

    // Audit log
    if (user_id) {
      await supabase
        .from('gbp_audit_log')
        .insert({
          actor_user_id: user_id,
          action_type: 'GSC_SYNC',
          status: 'success',
          request_json: { workspace_id, days, sites_count: sites.length, metrics_count: metricsCount },
        });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      sites_synced: sites.length,
      metrics_synced: metricsCount,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    console.error('GSC sync error:', errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
