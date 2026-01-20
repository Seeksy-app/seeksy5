import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Niche multipliers for pricing
const NICHE_MULTIPLIERS: Record<string, number> = {
  "beauty": 1.8,
  "fashion": 1.8,
  "business": 2.0,
  "finance": 2.0,
  "weddings": 2.5,
  "events": 2.5,
  "fitness": 1.6,
  "health": 1.6,
  "wellness": 1.6,
  "lifestyle": 1.0,
  "general": 1.0,
};

// Default engagement rates by platform (used when no posts synced)
const DEFAULT_ENGAGEMENT_RATES: Record<string, number> = {
  instagram: 3.0,
  youtube: 4.5,
  facebook: 1.5,
};

// Base CPM rates by platform
const BASE_CPM: Record<string, Record<string, number>> = {
  instagram: { reel: 12, feed_post: 10, story: 8 },
  youtube: { dedicated_video: 25, integration: 15, short: 8 },
  facebook: { feed_post: 8, story: 5, video: 12 },
};

// Platform multipliers
const PLATFORM_MULTIPLIERS: Record<string, number> = {
  instagram: 1.0,
  youtube: 1.5,
  facebook: 0.8,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { profile_id, user_id: bodyUserId, _service_role } = body;
    
    let userId: string;

    const authHeader = req.headers.get("Authorization");
    if (_service_role && authHeader?.includes(supabaseKey)) {
      if (!bodyUserId) {
        return new Response(JSON.stringify({ error: "Missing user_id for service role call" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      userId = bodyUserId;
      console.log(`[valuation] Service role call for user: ${userId}, profile: ${profile_id}`);
    } else if (authHeader) {
      const { data: { user }, error: authError } = await supabase.auth.getUser(
        authHeader.replace("Bearer ", "")
      );
      if (authError || !user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      userId = user.id;
    } else {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile, error: profileError } = await supabase
      .from("social_media_profiles")
      .select("*")
      .eq("id", profile_id)
      .eq("user_id", userId)
      .single();

    if (profileError || !profile) {
      console.error(`[valuation] Profile not found: ${profile_id} for user ${userId}`);
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const platform = profile.platform || "instagram";
    const followers = profile.followers_count || 0;
    
    console.log(`[valuation] Calculating for ${platform}: ${profile.username}, followers: ${followers}`);

    const { data: posts } = await supabase
      .from("social_media_posts")
      .select("like_count, comment_count, reach, impressions, view_count")
      .eq("profile_id", profile_id)
      .order("timestamp", { ascending: false })
      .limit(20);

    const postCount = posts?.length || 0;
    let avgLikes = 0;
    let avgComments = 0;
    let avgReach = 0;

    if (posts && posts.length > 0) {
      avgLikes = Math.round(posts.reduce((sum, p) => sum + (p.like_count || 0), 0) / postCount);
      avgComments = Math.round(posts.reduce((sum, p) => sum + (p.comment_count || 0), 0) / postCount);
      avgReach = Math.round(posts.reduce((sum, p) => sum + (p.reach || 0), 0) / postCount);
    }

    // Calculate engagement rate with fallback
    let engagementRate = 0;
    let usingDefaultEngagement = false;
    
    if (followers > 0) {
      if (postCount > 0 && (avgLikes > 0 || avgComments > 0)) {
        engagementRate = ((avgLikes + avgComments) / followers) * 100;
      } else {
        // Use default engagement rate when no posts synced
        engagementRate = DEFAULT_ENGAGEMENT_RATES[platform] || 2.5;
        usingDefaultEngagement = true;
        console.log(`[valuation] No posts, using default engagement: ${engagementRate}%`);
      }
    }

    const nicheTags = profile.niche_tags || [];
    let nicheMultiplier = 1.0;
    for (const tag of nicheTags) {
      const normalizedTag = tag.toLowerCase();
      for (const [niche, mult] of Object.entries(NICHE_MULTIPLIERS)) {
        if (normalizedTag.includes(niche) && mult > nicheMultiplier) {
          nicheMultiplier = mult;
        }
      }
    }

    const platformMultiplier = PLATFORM_MULTIPLIERS[platform] || 1.0;
    const totalMultiplier = nicheMultiplier * platformMultiplier;
    const estReachPerPost = avgReach > 0 ? avgReach : Math.round(followers * (engagementRate / 100) * 10);
    const platformCPM = BASE_CPM[platform] || BASE_CPM.instagram;

    const calculatePrices = (baseCpm: number) => {
      const baseValue = estReachPerPost > 0 ? estReachPerPost : Math.round(followers * (engagementRate / 100));
      const mid = (baseValue / 1000) * baseCpm * totalMultiplier;
      const minPrice = followers > 1000 ? 10 : 5;
      const adjustedMid = Math.max(mid, minPrice);
      
      return {
        low: Math.round(adjustedMid * 0.7 * 100) / 100,
        mid: Math.round(adjustedMid * 100) / 100,
        high: Math.round(adjustedMid * 1.3 * 100) / 100,
      };
    };

    let valuationData: Record<string, unknown>;
    
    if (platform === "youtube") {
      const dedicatedPrices = calculatePrices(platformCPM.dedicated_video);
      const integrationPrices = calculatePrices(platformCPM.integration);
      const shortPrices = calculatePrices(platformCPM.short);
      
      valuationData = {
        user_id: userId, profile_id, platform,
        calculated_at: new Date().toISOString(),
        followers, engagement_rate: Math.round(engagementRate * 100) / 100,
        avg_likes_per_post: avgLikes, avg_comments_per_post: avgComments,
        est_reach_per_post: estReachPerPost,
        reel_price_low: dedicatedPrices.low, reel_price_mid: dedicatedPrices.mid, reel_price_high: dedicatedPrices.high,
        feed_post_price_low: integrationPrices.low, feed_post_price_mid: integrationPrices.mid, feed_post_price_high: integrationPrices.high,
        story_price_low: shortPrices.low, story_price_mid: shortPrices.mid, story_price_high: shortPrices.high,
        currency: "USD",
        assumptions_json: {
          niche_multiplier: nicheMultiplier, platform_multiplier: platformMultiplier,
          niche_tags: nicheTags, base_cpm: platformCPM, posts_analyzed: postCount,
          using_default_engagement: usingDefaultEngagement,
          content_types: { reel: "dedicated_video", feed_post: "integration", story: "short" },
        },
        updated_at: new Date().toISOString(),
      };
    } else if (platform === "facebook") {
      const feedPrices = calculatePrices(platformCPM.feed_post);
      const storyPrices = calculatePrices(platformCPM.story);
      const videoPrices = calculatePrices(platformCPM.video);
      
      valuationData = {
        user_id: userId, profile_id, platform,
        calculated_at: new Date().toISOString(),
        followers, engagement_rate: Math.round(engagementRate * 100) / 100,
        avg_likes_per_post: avgLikes, avg_comments_per_post: avgComments,
        est_reach_per_post: estReachPerPost,
        reel_price_low: videoPrices.low, reel_price_mid: videoPrices.mid, reel_price_high: videoPrices.high,
        feed_post_price_low: feedPrices.low, feed_post_price_mid: feedPrices.mid, feed_post_price_high: feedPrices.high,
        story_price_low: storyPrices.low, story_price_mid: storyPrices.mid, story_price_high: storyPrices.high,
        currency: "USD",
        assumptions_json: {
          niche_multiplier: nicheMultiplier, platform_multiplier: platformMultiplier,
          niche_tags: nicheTags, base_cpm: platformCPM, posts_analyzed: postCount,
          using_default_engagement: usingDefaultEngagement,
          content_types: { reel: "video", feed_post: "feed_post", story: "story" },
        },
        updated_at: new Date().toISOString(),
      };
    } else {
      const reelPrices = calculatePrices(platformCPM.reel);
      const feedPostPrices = calculatePrices(platformCPM.feed_post);
      const storyPrices = calculatePrices(platformCPM.story);
      
      valuationData = {
        user_id: userId, profile_id, platform,
        calculated_at: new Date().toISOString(),
        followers, engagement_rate: Math.round(engagementRate * 100) / 100,
        avg_likes_per_post: avgLikes, avg_comments_per_post: avgComments,
        est_reach_per_post: estReachPerPost || Math.round(followers * 0.1),
        reel_price_low: reelPrices.low, reel_price_mid: reelPrices.mid, reel_price_high: reelPrices.high,
        feed_post_price_low: feedPostPrices.low, feed_post_price_mid: feedPostPrices.mid, feed_post_price_high: feedPostPrices.high,
        story_price_low: storyPrices.low, story_price_mid: storyPrices.mid, story_price_high: storyPrices.high,
        currency: "USD",
        assumptions_json: {
          niche_multiplier: nicheMultiplier, platform_multiplier: platformMultiplier,
          niche_tags: nicheTags, base_cpm: platformCPM, posts_analyzed: postCount,
          using_default_engagement: usingDefaultEngagement,
        },
        updated_at: new Date().toISOString(),
      };
    }

    console.log(`[valuation] Calculated for ${platform}:`, { followers, engagementRate, usingDefaultEngagement, estReachPerPost });

    const { data: existingVal } = await supabase
      .from("creator_valuations")
      .select("id")
      .eq("profile_id", profile_id)
      .eq("user_id", userId)
      .single();

    let valuation;
    if (existingVal) {
      const { data, error } = await supabase
        .from("creator_valuations")
        .update(valuationData)
        .eq("id", existingVal.id)
        .select()
        .single();
      if (error) throw error;
      valuation = data;
    } else {
      const { data, error } = await supabase
        .from("creator_valuations")
        .insert(valuationData)
        .select()
        .single();
      if (error) throw error;
      valuation = data;
    }

    // Update agency_discovery_profiles
    const discoveryData = {
      platform, username: profile.username,
      profile_picture_url: profile.profile_picture,
      followers, engagement_rate: Math.round(engagementRate * 100) / 100,
      niche_tags: nicheTags, location: profile.location, email: profile.email,
      estimated_value_per_post: valuation.feed_post_price_mid,
      source: "connected_creator", linked_profile_id: profile_id,
      last_refreshed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: existingDiscovery } = await supabase
      .from("agency_discovery_profiles")
      .select("id")
      .eq("linked_profile_id", profile_id)
      .single();

    if (existingDiscovery) {
      await supabase.from("agency_discovery_profiles").update(discoveryData).eq("id", existingDiscovery.id);
    } else {
      await supabase.from("agency_discovery_profiles").insert(discoveryData);
    }

    console.log(`[valuation] Saved for ${platform}: ${profile.username}`);

    return new Response(JSON.stringify({ success: true, valuation }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[valuation] Error:", error);
    const errMsg = error instanceof Error ? error.message : "Failed to calculate valuation";
    return new Response(
      JSON.stringify({ error: errMsg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
