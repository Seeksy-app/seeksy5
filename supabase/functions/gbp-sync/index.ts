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

// Refresh access token if expired
async function refreshAccessToken(connection: any, supabase: any): Promise<string | null> {
  if (!connection.refresh_token) {
    console.error('No refresh token available');
    return null;
  }

  const expiresAt = new Date(connection.expires_at);
  const now = new Date();
  
  // If token is still valid, return it
  if (expiresAt > now) {
    return connection.access_token;
  }

  console.log('Access token expired, refreshing...');

  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID!,
        client_secret: GOOGLE_CLIENT_SECRET!,
        refresh_token: connection.refresh_token,
        grant_type: 'refresh_token',
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.error('Token refresh error:', data);
      await supabase
        .from('gbp_connections')
        .update({ status: 'expired' })
        .eq('id', connection.id);
      return null;
    }

    const newExpiresAt = new Date(Date.now() + (data.expires_in * 1000)).toISOString();

    await supabase
      .from('gbp_connections')
      .update({
        access_token: data.access_token,
        expires_at: newExpiresAt,
        status: 'connected',
      })
      .eq('id', connection.id);

    return data.access_token;
  } catch (err) {
    console.error('Token refresh failed:', err);
    return null;
  }
}

// Fetch locations from Google Business Profile API
async function fetchLocations(accessToken: string, accountName: string): Promise<any[]> {
  const url = `https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations?readMask=name,title,storefrontAddress,phoneNumbers,websiteUri,regularHours,specialHours,categories,storeCode,profile`;
  
  console.log('Fetching locations from:', url);
  
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to fetch locations:', error);
    throw new Error(`Failed to fetch locations: ${response.status}`);
  }

  const data = await response.json();
  return data.locations || [];
}

// Fetch accounts from Google Business Profile API
async function fetchAccounts(accessToken: string): Promise<any[]> {
  const url = 'https://mybusinessaccountmanagement.googleapis.com/v1/accounts';
  
  console.log('Fetching accounts...');
  
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to fetch accounts:', error);
    throw new Error(`Failed to fetch accounts: ${response.status}`);
  }

  const data = await response.json();
  return data.accounts || [];
}

// Fetch reviews for a location
async function fetchReviews(accessToken: string, locationName: string): Promise<any[]> {
  // locationName format: "locations/123" - need to get account from parent
  const url = `https://mybusiness.googleapis.com/v4/${locationName}/reviews`;
  
  console.log('Fetching reviews from:', url);
  
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to fetch reviews:', error);
    // Reviews API might not be available - return empty
    return [];
  }

  const data = await response.json();
  return data.reviews || [];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

  try {
    const { connection_id } = await req.json();

    if (!connection_id) {
      return new Response(JSON.stringify({ error: 'connection_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get the connection
    const { data: connection, error: connError } = await supabase
      .from('gbp_connections')
      .select('*')
      .eq('id', connection_id)
      .single();

    if (connError || !connection) {
      return new Response(JSON.stringify({ error: 'Connection not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get valid access token
    const accessToken = await refreshAccessToken(connection, supabase);
    if (!accessToken) {
      return new Response(JSON.stringify({ 
        error: 'Unable to get valid access token. Please reconnect your Google account.',
        needsReconnect: true 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let syncResults = {
      accounts: 0,
      locations: 0,
      reviews: 0,
      errors: [] as string[],
    };

    // Fetch all accounts
    const accounts = await fetchAccounts(accessToken);
    syncResults.accounts = accounts.length;
    console.log(`Found ${accounts.length} accounts`);

    // For each account, fetch locations
    for (const account of accounts) {
      try {
        const locations = await fetchLocations(accessToken, account.name);
        console.log(`Found ${locations.length} locations for account ${account.name}`);

        for (const location of locations) {
          // Upsert location into database
          const { data: upsertedLocation, error: locError } = await supabase
            .from('gbp_locations')
            .upsert({
              connection_id,
              google_location_name: location.name,
              google_account_name: account.name,
              title: location.title || 'Unnamed Location',
              store_code: location.storeCode,
              address_json: location.storefrontAddress,
              phone: location.phoneNumbers?.primaryPhone,
              website: location.websiteUri,
              primary_category: location.categories?.primaryCategory?.displayName,
              description: location.profile?.description,
              regular_hours_json: location.regularHours,
              special_hours_json: location.specialHours,
              last_synced_at: new Date().toISOString(),
            }, {
              onConflict: 'google_location_name',
              ignoreDuplicates: false,
            })
            .select()
            .single();

          if (locError) {
            console.error('Error upserting location:', locError);
            syncResults.errors.push(`Location ${location.name}: ${locError.message}`);
          } else {
            syncResults.locations++;

            // Fetch reviews for this location
            try {
              const reviews = await fetchReviews(accessToken, location.name);
              console.log(`Found ${reviews.length} reviews for ${location.title}`);

              for (const review of reviews) {
                const { error: reviewError } = await supabase
                  .from('gbp_reviews')
                  .upsert({
                    connection_id,
                    location_id: upsertedLocation.id,
                    google_review_name: review.name,
                    reviewer_display_name: review.reviewer?.displayName,
                    reviewer_profile_photo_url: review.reviewer?.profilePhotoUrl,
                    star_rating: review.starRating === 'FIVE' ? 5 : 
                                 review.starRating === 'FOUR' ? 4 :
                                 review.starRating === 'THREE' ? 3 :
                                 review.starRating === 'TWO' ? 2 : 1,
                    comment: review.comment,
                    create_time: review.createTime,
                    update_time: review.updateTime,
                    has_reply: !!review.reviewReply,
                    reply_comment: review.reviewReply?.comment,
                    reply_update_time: review.reviewReply?.updateTime,
                  }, {
                    onConflict: 'google_review_name',
                    ignoreDuplicates: false,
                  });

                if (!reviewError) {
                  syncResults.reviews++;
                }
              }
            } catch (reviewErr: any) {
              console.warn('Could not fetch reviews:', reviewErr.message);
            }
          }
        }
      } catch (accErr: any) {
        console.error('Error processing account:', accErr);
        syncResults.errors.push(`Account ${account.name}: ${accErr.message}`);
      }
    }

    const durationMs = Date.now() - startTime;

    // Log the sync in audit log
    await supabase
      .from('gbp_audit_log')
      .insert({
        connection_id,
        action_type: 'SYNC_READ',
        status: syncResults.errors.length > 0 ? 'error' : 'success',
        response_json: syncResults,
        error_message: syncResults.errors.length > 0 ? syncResults.errors.join('; ') : null,
        duration_ms: durationMs,
      });

    return new Response(JSON.stringify({
      success: true,
      ...syncResults,
      duration_ms: durationMs,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('GBP Sync error:', errorMessage);

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
