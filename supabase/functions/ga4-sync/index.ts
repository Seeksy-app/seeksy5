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

    // Check if GA4 is enabled
    const enabledProducts = connection.enabled_products || [];
    if (!enabledProducts.includes('ga4')) {
      return new Response(JSON.stringify({ error: 'GA4 not enabled for this connection' }), {
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

    // Fetch GA4 account summaries to get properties
    console.log('Fetching GA4 properties...');
    const accountsResponse = await fetch('https://analyticsadmin.googleapis.com/v1beta/accountSummaries', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!accountsResponse.ok) {
      const errText = await accountsResponse.text();
      console.error('GA4 accounts error:', errText);
      return new Response(JSON.stringify({ error: 'Failed to fetch GA4 accounts', details: errText }), {
        status: accountsResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const accountsData = await accountsResponse.json();
    const accounts = accountsData.accountSummaries || [];

    // Extract all properties
    const properties: { property_id: string; display_name: string }[] = [];
    for (const account of accounts) {
      const propertySummaries = account.propertySummaries || [];
      for (const prop of propertySummaries) {
        // prop.property is like "properties/123456"
        const propertyId = prop.property?.replace('properties/', '') || '';
        properties.push({
          property_id: propertyId,
          display_name: prop.displayName || `Property ${propertyId}`,
        });
      }
    }

    console.log(`Found ${properties.length} GA4 properties`);

    // Upsert properties
    for (const prop of properties) {
      await supabase
        .from('ga4_properties')
        .upsert({
          workspace_id,
          property_id: prop.property_id,
          display_name: prop.display_name,
        }, { onConflict: 'workspace_id,property_id' });
    }

    // Get workspace analytics settings
    const { data: settings } = await supabase
      .from('workspace_analytics_settings')
      .select('ga4_property_id')
      .eq('workspace_id', workspace_id)
      .single();

    let metricsCount = 0;

    // If a property is selected, fetch page metrics
    if (settings?.ga4_property_id) {
      console.log(`Fetching page metrics for property ${settings.ga4_property_id} (${days} days)...`);
      
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const reportUrl = `https://analyticsdata.googleapis.com/v1beta/properties/${settings.ga4_property_id}:runReport`;
      
      const reportResponse = await fetch(reportUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateRanges: [{
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
          }],
          dimensions: [
            { name: 'date' },
            { name: 'pagePath' },
          ],
          metrics: [
            { name: 'sessions' },
            { name: 'engagementRate' },
            { name: 'averageSessionDuration' },
            { name: 'conversions' },
          ],
          limit: 10000,
        }),
      });

      if (reportResponse.ok) {
        const reportData = await reportResponse.json();
        const rows = reportData.rows || [];

        console.log(`Got ${rows.length} GA4 metric rows`);

        for (const row of rows) {
          const date = row.dimensionValues?.[0]?.value;
          const pagePath = row.dimensionValues?.[1]?.value || '/';
          
          // Format date from YYYYMMDD to YYYY-MM-DD
          const formattedDate = date ? 
            `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}` : 
            new Date().toISOString().split('T')[0];

          const sessions = parseInt(row.metricValues?.[0]?.value || '0', 10);
          const engagementRate = parseFloat(row.metricValues?.[1]?.value || '0');
          const avgEngagementTime = parseFloat(row.metricValues?.[2]?.value || '0');
          const conversions = parseFloat(row.metricValues?.[3]?.value || '0');

          await supabase
            .from('ga4_page_daily')
            .upsert({
              workspace_id,
              date: formattedDate,
              page_path: pagePath,
              sessions,
              engagement_rate: engagementRate,
              avg_engagement_time: avgEngagementTime,
              conversions,
            }, { onConflict: 'workspace_id,date,page_path' });
          
          metricsCount++;
        }
      } else {
        console.error('Failed to fetch GA4 report:', await reportResponse.text());
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
          action_type: 'GA4_SYNC',
          status: 'success',
          request_json: { workspace_id, days, properties_count: properties.length, metrics_count: metricsCount },
        });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      properties_synced: properties.length,
      metrics_synced: metricsCount,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    console.error('GA4 sync error:', errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
