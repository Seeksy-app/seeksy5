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
    // Use service role for cron jobs, or user auth for manual triggers
    const authHeader = req.headers.get('Authorization');
    const isServiceRole = !authHeader || authHeader.includes('service_role');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      isServiceRole ? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' : Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      isServiceRole ? {} : {
        global: {
          headers: { Authorization: authHeader! },
        },
      }
    );

    let userId: string | null = null;
    
    // For manual triggers, get user from auth
    if (!isServiceRole) {
      const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
      if (userError || !user) {
        throw new Error('Unauthorized');
      }
      userId = user.id;
    }

    const body = await req.json().catch(() => ({}));
    const { user_id } = body;
    
    // Allow specifying user_id for service role calls
    if (isServiceRole && user_id) {
      userId = user_id;
    }

    console.log(`Syncing protected content${userId ? ` for user ${userId}` : ' for all users'}`);

    // Get users with auto-sync enabled (or specific user)
    let usersQuery = supabaseClient
      .from("content_monitoring_sources")
      .select("user_id, platform, access_token, refresh_token, last_synced_at")
      .eq("is_active", true);
    
    if (userId) {
      usersQuery = usersQuery.eq("user_id", userId);
    }

    const { data: sources, error: sourcesError } = await usersQuery;

    if (sourcesError) throw sourcesError;

    if (!sources || sources.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No active sync sources found", synced: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${sources.length} active sync sources`);

    let totalSynced = 0;

    // Group by user for efficiency
    const userSources = sources.reduce((acc, source) => {
      if (!acc[source.user_id]) acc[source.user_id] = [];
      acc[source.user_id].push(source);
      return acc;
    }, {} as Record<string, typeof sources>);

    for (const [syncUserId, userSourceList] of Object.entries(userSources)) {
      for (const source of userSourceList) {
        try {
          if (source.platform === 'spotify') {
            // Call spotify-import-podcasts for this user
            const { data, error } = await supabaseClient.functions.invoke('spotify-import-podcasts', {
              body: { user_id: syncUserId },
            });
            
            if (error) {
              console.error(`Spotify sync error for user ${syncUserId}:`, error);
            } else {
              totalSynced += data?.imported || 0;
              console.log(`Synced ${data?.imported || 0} items from Spotify for user ${syncUserId}`);
            }
          } else if (source.platform === 'youtube') {
            // Call youtube-import-videos for this user
            const { data, error } = await supabaseClient.functions.invoke('youtube-import-videos', {
              body: { user_id: syncUserId, purpose: 'content_protection' },
            });
            
            if (error) {
              console.error(`YouTube sync error for user ${syncUserId}:`, error);
            } else {
              totalSynced += data?.imported || 0;
              console.log(`Synced ${data?.imported || 0} items from YouTube for user ${syncUserId}`);
            }
          }

          // Update last_synced_at
          await supabaseClient
            .from("content_monitoring_sources")
            .update({ last_synced_at: new Date().toISOString() })
            .eq("user_id", syncUserId)
            .eq("platform", source.platform);

        } catch (syncError) {
          console.error(`Error syncing ${source.platform} for user ${syncUserId}:`, syncError);
        }
      }
    }

    console.log(`Sync complete: ${totalSynced} total items synced`);

    return new Response(
      JSON.stringify({
        success: true,
        synced: totalSynced,
        sources_processed: sources.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in sync-protected-content:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
