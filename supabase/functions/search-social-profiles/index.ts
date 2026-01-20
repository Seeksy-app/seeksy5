import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InstagramProfile {
  username: string;
  full_name: string;
  profile_pic_url: string;
  follower_count: number;
  is_verified: boolean;
  biography: string;
  external_url: string | null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[search-social-profiles] Starting profile lookup');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { username, platform = 'instagram' } = await req.json();

    if (!username) {
      throw new Error('Username is required');
    }

    const RAPIDAPI_KEY = Deno.env.get('RAPIDAPI_KEY');
    if (!RAPIDAPI_KEY) {
      throw new Error('RAPIDAPI_KEY not configured');
    }

    console.log(`[search-social-profiles] Looking up ${platform} profile: ${username}`);

    let profile: InstagramProfile | null = null;

    if (platform === 'instagram') {
      // Fetch Instagram profile using RapidAPI
      const response = await fetch('https://instagram120.p.rapidapi.com/api/instagram/userinfo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-RapidAPI-Host': 'instagram120.p.rapidapi.com',
          'X-RapidAPI-Key': RAPIDAPI_KEY,
        },
        body: JSON.stringify({
          username: username.replace('@', ''),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[search-social-profiles] Instagram API error:', response.status, errorText);
        throw new Error(`Instagram API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('[search-social-profiles] Instagram response keys:', Object.keys(data));

      // Parse Instagram user info - adjust based on actual API response
      const userData = data.user || data.result?.user || data;
      if (userData) {
        profile = {
          username: userData.username || username,
          full_name: userData.full_name || '',
          profile_pic_url: userData.profile_pic_url || userData.profile_pic_url_hd || '',
          follower_count: userData.follower_count || userData.edge_followed_by?.count || 0,
          is_verified: userData.is_verified || false,
          biography: userData.biography || '',
          external_url: userData.external_url || null,
        };
      }
    } else if (platform === 'tiktok') {
      // TikTok profile lookup - would need different API
      console.log('[search-social-profiles] TikTok lookup not yet implemented');
      throw new Error('TikTok lookup not yet supported');
    }

    if (!profile) {
      throw new Error('Profile not found');
    }

    console.log(`[search-social-profiles] Found profile: @${profile.username}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        profile,
        platform,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[search-social-profiles] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
