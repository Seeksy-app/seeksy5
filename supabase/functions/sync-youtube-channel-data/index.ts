import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decryptToken, encryptToken } from "../_shared/token-encryption.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Parse request body
    const body = await req.json().catch(() => ({}));
    const { user_id, profile_id } = body;

    console.log('YouTube sync started - user_id:', user_id, 'profile_id:', profile_id);

    // Get the YouTube profile(s) to sync
    let profilesQuery = supabase
      .from('social_media_profiles')
      .select('*')
      .eq('platform', 'youtube');

    if (profile_id) {
      profilesQuery = profilesQuery.eq('id', profile_id);
    } else if (user_id) {
      profilesQuery = profilesQuery.eq('user_id', user_id);
    }

    const { data: profiles, error: profilesError } = await profilesQuery;

    if (profilesError) {
      console.error('Failed to fetch profiles:', profilesError);
      throw new Error('Failed to fetch YouTube profiles');
    }

    if (!profiles || profiles.length === 0) {
      console.log('No YouTube profiles found to sync');
      return new Response(
        JSON.stringify({ success: true, message: 'No profiles to sync' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${profiles.length} YouTube profile(s) to sync`);

    const results = [];

    for (const profile of profiles) {
      try {
        console.log(`Syncing YouTube profile: ${profile.id} (${profile.username})`);

        // Decrypt tokens before using
        let accessToken = await decryptToken(profile.access_token);
        const refreshToken = profile.refresh_token ? await decryptToken(profile.refresh_token) : null;
        const tokenExpiry = profile.token_expires_at ? new Date(profile.token_expires_at) : null;
        
        console.log(`Token expiry: ${tokenExpiry}, current: ${new Date()}, has refresh: ${!!refreshToken}`);
        
        if (tokenExpiry && tokenExpiry < new Date() && refreshToken) {
          console.log('Token expired, refreshing...');
          const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              client_id: Deno.env.get('YOUTUBE_CLIENT_ID') || '',
              client_secret: Deno.env.get('YOUTUBE_CLIENT_SECRET') || '',
              refresh_token: refreshToken,
              grant_type: 'refresh_token',
            }),
          });

          if (refreshResponse.ok) {
            const tokens = await refreshResponse.json();
            accessToken = tokens.access_token;
            
            // Encrypt and update stored token
            const encryptedAccessToken = await encryptToken(tokens.access_token);
            await supabase
              .from('social_media_profiles')
              .update({
                access_token: encryptedAccessToken,
                token_expires_at: tokens.expires_in 
                  ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
                  : null,
                sync_status: 'pending',
              })
              .eq('id', profile.id);
            
            console.log('Token refreshed successfully');
          } else {
            const errorText = await refreshResponse.text();
            console.error('Token refresh failed:', errorText);
            await supabase
              .from('social_media_profiles')
              .update({ sync_status: 'token_expired' })
              .eq('id', profile.id);
            continue;
          }
        }

        // Fetch latest channel data
        const channelResponse = await fetch(
          'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true',
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );

        if (!channelResponse.ok) {
          const errorText = await channelResponse.text();
          console.error('Channel fetch failed:', errorText);
          
          if (channelResponse.status === 401) {
            await supabase
              .from('social_media_profiles')
              .update({ sync_status: 'token_expired' })
              .eq('id', profile.id);
          }
          continue;
        }

        const channelData = await channelResponse.json();
        const channel = channelData.items?.[0];

        if (!channel) {
          console.error('No channel data returned');
          continue;
        }

        // Update profile with latest data
        const updateData = {
          username: channel.snippet?.title || profile.username,
          profile_picture: channel.snippet?.thumbnails?.high?.url || profile.profile_picture,
          followers_count: parseInt(channel.statistics?.subscriberCount || '0', 10),
          media_count: parseInt(channel.statistics?.videoCount || '0', 10),
          last_sync_at: new Date().toISOString(),
          sync_status: 'synced',
        };

        const { error: updateError } = await supabase
          .from('social_media_profiles')
          .update(updateData)
          .eq('id', profile.id);

        if (updateError) {
          console.error('Failed to update profile:', updateError);
          continue;
        }

        // Fetch recent videos
        const videosResponse = await fetch(
          'https://www.googleapis.com/youtube/v3/search?part=snippet&forMine=true&type=video&maxResults=25&order=date',
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );

        if (videosResponse.ok) {
          const videosData = await videosResponse.json();
          const videoIds = videosData.items?.map((v: any) => v.id?.videoId).filter(Boolean).join(',');

          if (videoIds) {
            // Get video statistics
            const statsResponse = await fetch(
              `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoIds}`,
              {
                headers: { Authorization: `Bearer ${accessToken}` },
              }
            );

            if (statsResponse.ok) {
              const statsData = await statsResponse.json();
              
              for (const video of statsData.items || []) {
                const postData = {
                  profile_id: profile.id,
                  platform_post_id: video.id,
                  post_type: 'video',
                  caption: video.snippet?.title || '',
                  media_url: video.snippet?.thumbnails?.high?.url || '',
                  permalink: `https://www.youtube.com/watch?v=${video.id}`,
                  likes_count: parseInt(video.statistics?.likeCount || '0', 10),
                  comments_count: parseInt(video.statistics?.commentCount || '0', 10),
                  views_count: parseInt(video.statistics?.viewCount || '0', 10),
                  posted_at: video.snippet?.publishedAt || new Date().toISOString(),
                  engagement_rate: 0,
                };

                // Calculate engagement rate
                const totalEngagement = postData.likes_count + postData.comments_count;
                if (postData.views_count > 0) {
                  postData.engagement_rate = (totalEngagement / postData.views_count) * 100;
                }

                // Upsert post
                await supabase
                  .from('social_media_posts')
                  .upsert(postData, {
                    onConflict: 'profile_id,platform_post_id',
                  });
              }

              console.log(`Synced ${statsData.items?.length || 0} videos`);
            }
          }
        }

        // Save insights snapshot
        const insightData = {
          profile_id: profile.id,
          reach: parseInt(channel.statistics?.viewCount || '0', 10),
          impressions: parseInt(channel.statistics?.viewCount || '0', 10),
          profile_views: 0,
          engagement_count: 0,
          snapshot_date: new Date().toISOString().split('T')[0],
        };

        await supabase
          .from('social_insights_snapshots')
          .upsert(insightData, {
            onConflict: 'profile_id,snapshot_date',
          });

        results.push({
          profile_id: profile.id,
          username: channel.snippet?.title,
          success: true,
        });

        console.log(`Successfully synced profile: ${profile.id}`);

        // Trigger valuation calculation after successful sync
        try {
          console.log(`[youtube-sync] Triggering valuation calculation for profile: ${profile.id}`);
          await fetch(`${supabaseUrl}/functions/v1/calculate-creator-valuation`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${serviceRoleKey}`,
            },
            body: JSON.stringify({
              profile_id: profile.id,
              user_id: profile.user_id,
              _service_role: true,
            }),
          });
          console.log(`[youtube-sync] Valuation calculation triggered for profile: ${profile.id}`);
        } catch (valError) {
          console.error(`[youtube-sync] Valuation trigger failed (non-blocking):`, valError);
        }
      } catch (profileError) {
        console.error(`Error syncing profile ${profile.id}:`, profileError);
        results.push({
          profile_id: profile.id,
          success: false,
          error: profileError instanceof Error ? profileError.message : 'Unknown error',
        });
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('YouTube sync error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
