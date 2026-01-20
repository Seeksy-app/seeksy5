import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncResult {
  success: boolean;
  posts_synced: number;
  comments_synced: number;
  insights_synced: number;
  last_sync: string;
  error?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    let userId: string | null = null;
    let profileId: string | null = null;
    let platform: string | null = null;
    let isCronJob = false;
    let isServiceRoleCall = false;

    // Check if this is a cron job (no auth header), service role call, or user request
    const authHeader = req.headers.get('Authorization');
    
    // Parse body first to check for user_id (from callback)
    let bodyData: any = {};
    try {
      bodyData = await req.json();
      profileId = bodyData.profile_id || null;
      platform = bodyData.platform || null;
    } catch {
      // No body provided
    }
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      
      // Check if this is a service role key call (from internal functions like meta-callback)
      const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      if (token === serviceRoleKey) {
        // Service role call - trust the user_id from body
        isServiceRoleCall = true;
        userId = bodyData.user_id || null;
        console.log('Service role call detected, user_id from body:', userId);
      } else {
        // User JWT - validate it
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        
        if (authError || !user) {
          throw new Error('Unauthorized');
        }
        userId = user.id;
      }
    } else {
      // Cron job - sync all profiles
      isCronJob = true;
    }

    console.log(`Meta sync started - User: ${userId}, Profile: ${profileId}, Platform: ${platform}, Cron: ${isCronJob}`);

    let totalPostsSynced = 0;
    let totalCommentsSynced = 0;
    let totalInsightsSynced = 0;

    // Sync Instagram profiles
    if (!platform || platform === 'instagram') {
      const result = await syncInstagramProfiles(supabase, userId, profileId, isCronJob);
      totalPostsSynced += result.posts;
      totalCommentsSynced += result.comments;
      totalInsightsSynced += result.insights;
    }

    // Sync Facebook profiles
    if (!platform || platform === 'facebook') {
      const result = await syncFacebookProfiles(supabase, userId, profileId, isCronJob);
      totalPostsSynced += result.posts;
      totalCommentsSynced += result.comments;
      totalInsightsSynced += result.insights;
    }

    const result: SyncResult = {
      success: true,
      posts_synced: totalPostsSynced,
      comments_synced: totalCommentsSynced,
      insights_synced: totalInsightsSynced,
      last_sync: new Date().toISOString(),
    };

    console.log('Sync completed:', result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in meta-sync-social-data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function syncInstagramProfiles(supabase: any, userId: string | null, profileId: string | null, isCronJob: boolean) {
  let posts = 0, comments = 0, insights = 0;

  // Get Instagram profiles to sync
  let profilesQuery = supabase
    .from('social_media_profiles')
    .select('*')
    .eq('platform', 'instagram');

  if (userId && !isCronJob) {
    profilesQuery = profilesQuery.eq('user_id', userId);
  }
  
  if (profileId) {
    profilesQuery = profilesQuery.eq('id', profileId);
  }

  const { data: profiles, error: profilesError } = await profilesQuery;

  if (profilesError || !profiles || profiles.length === 0) {
    console.log('No Instagram profiles to sync');
    return { posts, comments, insights };
  }

  for (const profile of profiles) {
    try {
      console.log(`Syncing Instagram profile: ${profile.username} (${profile.id})`);

      // Check token expiry
      if (profile.token_expires_at && new Date(profile.token_expires_at) < new Date()) {
        console.log(`Token expired for profile ${profile.id}`);
        await supabase
          .from('social_media_profiles')
          .update({ sync_status: 'token_expired', sync_error: 'Access token has expired' })
          .eq('id', profile.id);
        continue;
      }

      const accessToken = profile.access_token;
      if (!accessToken) {
        console.log(`No access token for profile ${profile.id}`);
        continue;
      }

      // Update sync status
      await supabase
        .from('social_media_profiles')
        .update({ sync_status: 'syncing', sync_error: null })
        .eq('id', profile.id);

      // 1. Fetch and update profile data
      const profileResponse = await fetch(
        `https://graph.facebook.com/v18.0/${profile.platform_user_id}?` +
        `fields=id,username,account_type,media_count,followers_count,follows_count,biography,profile_picture_url&` +
        `access_token=${accessToken}`
      );

      if (!profileResponse.ok) {
        const errorData = await profileResponse.json();
        console.error('Profile fetch error:', errorData);
        
        if (errorData.error?.code === 190) {
          await supabase
            .from('social_media_profiles')
            .update({ sync_status: 'token_expired', sync_error: 'Access token has expired' })
            .eq('id', profile.id);
          continue;
        }
        
        throw new Error(errorData.error?.message || 'Failed to fetch profile');
      }

      const profileData = await profileResponse.json();
      
      await supabase
        .from('social_media_profiles')
        .update({
          username: profileData.username,
          account_type: profileData.account_type,
          media_count: profileData.media_count || 0,
          followers_count: profileData.followers_count || 0,
          follows_count: profileData.follows_count || 0,
          biography: profileData.biography,
          profile_picture: profileData.profile_picture_url,
        })
        .eq('id', profile.id);

      // 2. Fetch media (posts)
      const mediaResponse = await fetch(
        `https://graph.facebook.com/v18.0/${profile.platform_user_id}/media?` +
        `fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count&` +
        `limit=200&access_token=${accessToken}`
      );

      if (mediaResponse.ok) {
        const mediaData = await mediaResponse.json();
        const mediaPosts = mediaData.data || [];
        
        for (const post of mediaPosts) {
          const engagementRate = profile.followers_count > 0
            ? ((post.like_count || 0) + (post.comments_count || 0)) / profile.followers_count * 100
            : 0;

          const { error: postError } = await supabase
            .from('social_media_posts')
            .upsert({
              profile_id: profile.id,
              post_id: post.id,
              media_url: post.media_url,
              thumbnail_url: post.thumbnail_url,
              caption: post.caption,
              media_type: post.media_type,
              permalink: post.permalink,
              timestamp: post.timestamp,
              like_count: post.like_count || 0,
              comment_count: post.comments_count || 0,
              engagement_rate: engagementRate,
            }, { onConflict: 'profile_id,post_id' });

          if (!postError) posts++;

          // Fetch comments
          try {
            const commentsResponse = await fetch(
              `https://graph.facebook.com/v18.0/${post.id}/comments?` +
              `fields=id,text,username,timestamp,like_count&` +
              `limit=100&access_token=${accessToken}`
            );

            if (commentsResponse.ok) {
              const commentsData = await commentsResponse.json();
              const postComments = commentsData.data || [];

              const { data: dbPost } = await supabase
                .from('social_media_posts')
                .select('id')
                .eq('profile_id', profile.id)
                .eq('post_id', post.id)
                .single();

              if (dbPost) {
                for (const comment of postComments) {
                  const { error: commentError } = await supabase
                    .from('social_media_comments')
                    .upsert({
                      post_id: dbPost.id,
                      comment_id: comment.id,
                      text: comment.text,
                      username: comment.username,
                      timestamp: comment.timestamp,
                      like_count: comment.like_count || 0,
                    }, { onConflict: 'post_id,comment_id' });

                  if (!commentError) comments++;
                }
              }
            }
          } catch (commentErr) {
            console.log('Comments fetch skipped for post:', post.id);
          }

          // Fetch post insights
          try {
            const insightsResponse = await fetch(
              `https://graph.facebook.com/v18.0/${post.id}/insights?` +
              `metric=impressions,reach,saved&access_token=${accessToken}`
            );

            if (insightsResponse.ok) {
              const insightsData = await insightsResponse.json();
              const postInsights = insightsData.data || [];
              
              const impressions = postInsights.find((i: any) => i.name === 'impressions')?.values?.[0]?.value || 0;
              const reach = postInsights.find((i: any) => i.name === 'reach')?.values?.[0]?.value || 0;
              const saved = postInsights.find((i: any) => i.name === 'saved')?.values?.[0]?.value || 0;

              await supabase
                .from('social_media_posts')
                .update({ impressions, reach, saved })
                .eq('profile_id', profile.id)
                .eq('post_id', post.id);
            }
          } catch (insightErr) {
            console.log('Insights fetch skipped for post:', post.id);
          }
        }
      }

      // 3. Fetch account-level insights
      try {
        const accountInsightsResponse = await fetch(
          `https://graph.facebook.com/v18.0/${profile.platform_user_id}/insights?` +
          `metric=impressions,reach,profile_views,website_clicks,email_contacts,accounts_engaged,total_interactions&` +
          `period=day&access_token=${accessToken}`
        );

        if (accountInsightsResponse.ok) {
          const accountInsights = await accountInsightsResponse.json();
          const data = accountInsights.data || [];
          
          const impressions = data.find((i: any) => i.name === 'impressions')?.values?.[0]?.value || 0;
          const reach = data.find((i: any) => i.name === 'reach')?.values?.[0]?.value || 0;
          const profileViews = data.find((i: any) => i.name === 'profile_views')?.values?.[0]?.value || 0;
          const websiteClicks = data.find((i: any) => i.name === 'website_clicks')?.values?.[0]?.value || 0;
          const emailContacts = data.find((i: any) => i.name === 'email_contacts')?.values?.[0]?.value || 0;
          const accountsEngaged = data.find((i: any) => i.name === 'accounts_engaged')?.values?.[0]?.value || 0;
          const totalInteractions = data.find((i: any) => i.name === 'total_interactions')?.values?.[0]?.value || 0;

          const engagementRate = profile.followers_count > 0
            ? (totalInteractions / profile.followers_count) * 100
            : 0;

          const { error: snapshotError } = await supabase
            .from('social_insights_snapshots')
            .upsert({
              profile_id: profile.id,
              snapshot_date: new Date().toISOString().split('T')[0],
              impressions,
              reach,
              profile_views: profileViews,
              website_clicks: websiteClicks,
              email_contacts: emailContacts,
              follower_count: profile.followers_count || 0,
              engagement_rate: engagementRate,
              accounts_engaged: accountsEngaged,
              total_interactions: totalInteractions,
            }, { onConflict: 'profile_id,snapshot_date' });

          if (!snapshotError) insights++;
        }
      } catch (insightErr) {
        console.log('Account insights fetch failed:', insightErr);
      }

      // Update sync status to success
      await supabase
        .from('social_media_profiles')
        .update({ 
          sync_status: 'synced', 
          sync_error: null,
          last_sync_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      console.log(`Instagram profile ${profile.username} synced successfully`);

      // Trigger valuation calculation after successful sync
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        console.log(`[meta-sync] Triggering valuation calculation for Instagram profile: ${profile.id}`);
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
        console.log(`[meta-sync] Valuation calculation triggered for Instagram profile: ${profile.id}`);
      } catch (valError) {
        console.error(`[meta-sync] Valuation trigger failed (non-blocking):`, valError);
      }

    } catch (profileError) {
      console.error(`Error syncing Instagram profile ${profile.id}:`, profileError);
      const errorMsg = profileError instanceof Error ? profileError.message : 'Unknown error';
      
      await supabase
        .from('social_media_profiles')
        .update({ sync_status: 'error', sync_error: errorMsg })
        .eq('id', profile.id);
    }
  }

  return { posts, comments, insights };
}

async function syncFacebookProfiles(supabase: any, userId: string | null, profileId: string | null, isCronJob: boolean) {
  let posts = 0, comments = 0, insights = 0;

  // Get Facebook profiles to sync
  let profilesQuery = supabase
    .from('social_media_profiles')
    .select('*')
    .eq('platform', 'facebook');

  if (userId && !isCronJob) {
    profilesQuery = profilesQuery.eq('user_id', userId);
  }
  
  if (profileId) {
    profilesQuery = profilesQuery.eq('id', profileId);
  }

  const { data: profiles, error: profilesError } = await profilesQuery;

  if (profilesError || !profiles || profiles.length === 0) {
    console.log('No Facebook profiles to sync');
    return { posts, comments, insights };
  }

  for (const profile of profiles) {
    try {
      console.log(`Syncing Facebook Page: ${profile.username} (${profile.id})`);

      const accessToken = profile.access_token;
      if (!accessToken) {
        console.log(`No access token for profile ${profile.id}`);
        continue;
      }

      // Update sync status
      await supabase
        .from('social_media_profiles')
        .update({ sync_status: 'syncing', sync_error: null })
        .eq('id', profile.id);

      // 1. Fetch and update Page profile data
      const pageResponse = await fetch(
        `https://graph.facebook.com/v18.0/${profile.platform_user_id}?` +
        `fields=id,name,picture,fan_count,followers_count,about&` +
        `access_token=${accessToken}`
      );

      if (!pageResponse.ok) {
        const errorData = await pageResponse.json();
        console.error('Page fetch error:', errorData);
        
        if (errorData.error?.code === 190) {
          await supabase
            .from('social_media_profiles')
            .update({ sync_status: 'token_expired', sync_error: 'Access token has expired' })
            .eq('id', profile.id);
          continue;
        }
        
        throw new Error(errorData.error?.message || 'Failed to fetch page');
      }

      const pageData = await pageResponse.json();
      
      await supabase
        .from('social_media_profiles')
        .update({
          username: pageData.name,
          profile_picture: pageData.picture?.data?.url,
          followers_count: pageData.fan_count || pageData.followers_count || 0,
          biography: pageData.about,
        })
        .eq('id', profile.id);

      // 2. Fetch Page posts (feed)
      const feedResponse = await fetch(
        `https://graph.facebook.com/v18.0/${profile.platform_user_id}/feed?` +
        `fields=id,message,created_time,permalink_url,full_picture,type,shares,reactions.summary(true),comments.summary(true)&` +
        `limit=100&access_token=${accessToken}`
      );

      if (feedResponse.ok) {
        const feedData = await feedResponse.json();
        const feedPosts = feedData.data || [];
        
        for (const post of feedPosts) {
          const likeCount = post.reactions?.summary?.total_count || 0;
          const commentCount = post.comments?.summary?.total_count || 0;
          const shareCount = post.shares?.count || 0;
          
          const engagementRate = profile.followers_count > 0
            ? (likeCount + commentCount + shareCount) / profile.followers_count * 100
            : 0;

          const { error: postError } = await supabase
            .from('social_media_posts')
            .upsert({
              profile_id: profile.id,
              post_id: post.id,
              media_url: post.full_picture,
              caption: post.message,
              media_type: post.type || 'status',
              permalink: post.permalink_url,
              timestamp: post.created_time,
              like_count: likeCount,
              comment_count: commentCount,
              engagement_rate: engagementRate,
            }, { onConflict: 'profile_id,post_id' });

          if (!postError) posts++;

          // Fetch comments for each post
          try {
            const commentsResponse = await fetch(
              `https://graph.facebook.com/v18.0/${post.id}/comments?` +
              `fields=id,message,from,created_time,like_count&` +
              `limit=100&access_token=${accessToken}`
            );

            if (commentsResponse.ok) {
              const commentsData = await commentsResponse.json();
              const postComments = commentsData.data || [];

              const { data: dbPost } = await supabase
                .from('social_media_posts')
                .select('id')
                .eq('profile_id', profile.id)
                .eq('post_id', post.id)
                .single();

              if (dbPost) {
                for (const comment of postComments) {
                  const { error: commentError } = await supabase
                    .from('social_media_comments')
                    .upsert({
                      post_id: dbPost.id,
                      comment_id: comment.id,
                      text: comment.message,
                      username: comment.from?.name,
                      timestamp: comment.created_time,
                      like_count: comment.like_count || 0,
                    }, { onConflict: 'post_id,comment_id' });

                  if (!commentError) comments++;
                }
              }
            }
          } catch (commentErr) {
            console.log('FB Comments fetch skipped for post:', post.id);
          }
        }
      }

      // 3. Fetch Page insights
      try {
        const insightsResponse = await fetch(
          `https://graph.facebook.com/v18.0/${profile.platform_user_id}/insights?` +
          `metric=page_impressions,page_post_engagements,page_fans,page_views_total&` +
          `period=day&access_token=${accessToken}`
        );

        if (insightsResponse.ok) {
          const insightsData = await insightsResponse.json();
          const data = insightsData.data || [];
          
          const impressions = data.find((i: any) => i.name === 'page_impressions')?.values?.[0]?.value || 0;
          const postEngagements = data.find((i: any) => i.name === 'page_post_engagements')?.values?.[0]?.value || 0;
          const pageFans = data.find((i: any) => i.name === 'page_fans')?.values?.[0]?.value || profile.followers_count || 0;
          const pageViews = data.find((i: any) => i.name === 'page_views_total')?.values?.[0]?.value || 0;

          const engagementRate = pageFans > 0
            ? (postEngagements / pageFans) * 100
            : 0;

          const { error: snapshotError } = await supabase
            .from('social_insights_snapshots')
            .upsert({
              profile_id: profile.id,
              snapshot_date: new Date().toISOString().split('T')[0],
              impressions,
              reach: impressions,
              profile_views: pageViews,
              follower_count: pageFans,
              engagement_rate: engagementRate,
              total_interactions: postEngagements,
            }, { onConflict: 'profile_id,snapshot_date' });

          if (!snapshotError) insights++;
        }
      } catch (insightErr) {
        console.log('FB Page insights fetch failed:', insightErr);
      }

      // Update sync status to success
      await supabase
        .from('social_media_profiles')
        .update({ 
          sync_status: 'synced', 
          sync_error: null,
          last_sync_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      console.log(`Facebook Page ${profile.username} synced successfully`);

      // Trigger valuation calculation after successful sync
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        console.log(`[meta-sync] Triggering valuation calculation for Facebook profile: ${profile.id}`);
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
        console.log(`[meta-sync] Valuation calculation triggered for Facebook profile: ${profile.id}`);
      } catch (valError) {
        console.error(`[meta-sync] Valuation trigger failed (non-blocking):`, valError);
      }

    } catch (profileError) {
      console.error(`Error syncing Facebook Page ${profile.id}:`, profileError);
      const errorMsg = profileError instanceof Error ? profileError.message : 'Unknown error';
      
      await supabase
        .from('social_media_profiles')
        .update({ sync_status: 'error', sync_error: errorMsg })
        .eq('id', profile.id);
    }
  }

  return { posts, comments, insights };
}
