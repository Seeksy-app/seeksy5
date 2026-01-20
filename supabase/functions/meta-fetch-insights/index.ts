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

    // Get user's connected social media accounts
    const { data: accounts, error: accountsError } = await supabase
      .from('social_media_accounts')
      .select('*')
      .eq('user_id', user.id);

    if (accountsError) throw accountsError;

    const insights: any[] = [];

    // Fetch insights for each connected account
    for (const account of accounts || []) {
      console.log(`Fetching insights for ${account.platform} account: ${account.platform_user_id}`);
      
      // Check if token is expired
      const isExpired = new Date(account.token_expires_at) < new Date();
      if (isExpired) {
        insights.push({
          accountId: account.id,
          platform: account.platform,
          username: account.platform_username,
          error: 'Token expired. Please refresh or reconnect your account.',
          accountInfo: {},
          metrics: [],
        });
        continue;
      }
      
      try {
        if (account.platform === 'instagram') {
          // Fetch Instagram Business Account insights with timeout
          const metricsUrl = `https://graph.facebook.com/v18.0/${account.platform_user_id}/insights?` +
            `metric=impressions,reach,profile_views,follower_count&` +
            `period=day&` +
            `access_token=${account.access_token}`;
          
          const metricsResponse = await fetch(metricsUrl, {
            signal: AbortSignal.timeout(10000) // 10 second timeout
          });
          
          if (!metricsResponse.ok) {
            const errorText = await metricsResponse.text();
            console.error('Instagram insights API error:', errorText);
            
            // Check for token expiration
            try {
              const errorData = JSON.parse(errorText);
              if (errorData.error?.code === 190) {
                throw new Error('TOKEN_EXPIRED');
              }
            } catch (e) {
              // Not JSON or other parsing error
            }
          }
          
          const metricsData = await metricsResponse.json();
          console.log(`Instagram insights response:`, JSON.stringify(metricsData, null, 2));

          // Fetch account info with timeout
          const accountUrl = `https://graph.facebook.com/v18.0/${account.platform_user_id}?` +
            `fields=username,name,followers_count,follows_count,media_count,profile_picture_url&` +
            `access_token=${account.access_token}`;
          
          const accountResponse = await fetch(accountUrl, {
            signal: AbortSignal.timeout(10000) // 10 second timeout
          });
          const accountData = await accountResponse.json();
          
          console.log(`Instagram account info:`, JSON.stringify(accountData, null, 2));

          insights.push({
            accountId: account.id,
            platform: account.platform,
            username: account.platform_username,
            metrics: metricsData.data || [],
            accountInfo: accountData,
            error: metricsData.error || accountData.error,
          });

        } else if (account.platform === 'facebook') {
          // Fetch page basic info with timeout
          const pageUrl = `https://graph.facebook.com/v18.0/${account.platform_user_id}?` +
            `fields=name,fan_count,picture&` +
            `access_token=${account.access_token}`;
          
          const pageResponse = await fetch(pageUrl, {
            signal: AbortSignal.timeout(10000) // 10 second timeout
          });
          
          if (!pageResponse.ok) {
            const errorText = await pageResponse.text();
            console.error('Facebook page API error:', errorText);
            
            // Check for token expiration
            try {
              const errorData = JSON.parse(errorText);
              if (errorData.error?.code === 190) {
                throw new Error('TOKEN_EXPIRED');
              }
            } catch (e) {
              // Not JSON or other parsing error
            }
          }
          
          const pageData = await pageResponse.json();
          console.log(`Facebook page info:`, JSON.stringify(pageData, null, 2));

          // Try to fetch insights (requires pages_read_engagement permission)
          let metricsData: any = { data: [] };
          let insightsError: any = null;
          
          try {
            const metricsUrl = `https://graph.facebook.com/v18.0/${account.platform_user_id}/insights?` +
              `metric=page_impressions,page_engaged_users&` +
              `period=day&` +
              `access_token=${account.access_token}`;
            
            const metricsResponse = await fetch(metricsUrl, {
              signal: AbortSignal.timeout(10000) // 10 second timeout
            });
            metricsData = await metricsResponse.json();
            
            console.log(`Facebook insights response:`, JSON.stringify(metricsData, null, 2));
            
            if (metricsData.error) {
              insightsError = metricsData.error;
              console.log(`Facebook insights error - likely missing permissions:`, insightsError.message);
            }
          } catch (error) {
            console.log(`Could not fetch insights - permissions not granted yet`);
            insightsError = { message: 'Insights require app review approval', code: 'PERMISSION_REQUIRED' };
          }

          insights.push({
            accountId: account.id,
            platform: account.platform,
            username: account.platform_username,
            metrics: metricsData.data || [],
            accountInfo: pageData,
            error: pageData.error || insightsError,
          });
        }
      } catch (error) {
        console.error(`Error fetching insights for ${account.platform}:`, error);
        
        // Handle specific error cases
        let errorMessage = 'Unknown error';
        if (error instanceof Error) {
          if (error.message === 'TOKEN_EXPIRED') {
            errorMessage = 'Token expired. Please refresh or reconnect your account.';
          } else if (error.name === 'TimeoutError') {
            errorMessage = 'Request timed out. Please try again.';
          } else {
            errorMessage = error.message;
          }
        }
        
        insights.push({
          accountId: account.id,
          platform: account.platform,
          username: account.platform_username,
          error: errorMessage,
          accountInfo: {},
          metrics: [],
        });
      }
    }

    return new Response(
      JSON.stringify({ success: true, insights }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in meta-fetch-insights:', error);
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