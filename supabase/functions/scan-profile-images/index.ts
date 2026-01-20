import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScanRequest {
  platform: 'instagram' | 'tiktok';
  searchQuery?: string;
  limit?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { platform, searchQuery, limit = 50 }: ScanRequest = await req.json();

    // Get user's verified face hash
    const { data: faceAsset, error: faceError } = await supabase
      .from('identity_assets')
      .select('face_hash, face_metadata_uri')
      .eq('user_id', user.id)
      .eq('type', 'face_identity')
      .eq('cert_status', 'minted')
      .single();

    if (faceError || !faceAsset?.face_hash) {
      return new Response(JSON.stringify({ 
        error: 'Face not verified',
        message: 'Please verify your face first before scanning for impersonators'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create scan record
    const { data: scan, error: scanError } = await supabase
      .from('profile_image_scans')
      .insert({
        user_id: user.id,
        platform,
        scan_status: 'running',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (scanError) {
      console.error('Failed to create scan:', scanError);
      return new Response(JSON.stringify({ error: 'Failed to create scan' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Starting ${platform} profile scan for user ${user.id}, scan ${scan.id}`);

    // For MVP: Simulate profile scanning
    // In production, this would use RapidAPI or similar to fetch real profiles
    const mockProfiles = generateMockProfiles(platform, searchQuery, limit);
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const matches: any[] = [];

    // Compare each profile image against user's face
    for (const profile of mockProfiles) {
      try {
        // Use AI to compare face similarity
        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'system',
                content: `You are a face comparison expert. Given a reference face hash and a profile image, determine if the profile image could be the same person or an impersonation attempt. 
                
                Respond with a JSON object:
                {
                  "is_match": boolean,
                  "confidence": number (0-100),
                  "match_type": "impersonation" | "fan_account" | "verified" | "no_match",
                  "reasoning": "brief explanation"
                }`
              },
              {
                role: 'user',
                content: `Reference face hash: ${faceAsset.face_hash}
                
                Profile to check:
                - Username: ${profile.username}
                - Platform: ${platform}
                - Profile image URL: ${profile.profile_image_url}
                - Bio snippet: ${profile.bio || 'N/A'}
                
                Analyze if this profile could be impersonating the verified user.`
              }
            ],
          }),
        });

        if (response.ok) {
          const aiData = await response.json();
          const content = aiData.choices?.[0]?.message?.content || '';
          
          try {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const result = JSON.parse(jsonMatch[0]);
              
              if (result.is_match && result.confidence > 60) {
                matches.push({
                  scan_id: scan.id,
                  user_id: user.id,
                  platform,
                  username: profile.username,
                  profile_url: profile.profile_url,
                  profile_image_url: profile.profile_image_url,
                  match_confidence: result.confidence,
                  match_type: result.match_type,
                  status: 'new',
                });
              }
            }
          } catch (parseError) {
            console.log('Could not parse AI response for profile:', profile.username);
          }
        }
      } catch (error) {
        console.error('Error analyzing profile:', profile.username, error);
      }
    }

    // Insert matches
    if (matches.length > 0) {
      const { error: matchError } = await supabase
        .from('profile_image_matches')
        .insert(matches);
      
      if (matchError) {
        console.error('Failed to insert matches:', matchError);
      }
    }

    // Update scan as completed
    await supabase
      .from('profile_image_scans')
      .update({
        scan_status: 'completed',
        profiles_scanned: mockProfiles.length,
        matches_found: matches.length,
        completed_at: new Date().toISOString(),
      })
      .eq('id', scan.id);

    return new Response(JSON.stringify({
      success: true,
      scan_id: scan.id,
      profiles_scanned: mockProfiles.length,
      matches_found: matches.length,
      matches: matches.map(m => ({
        username: m.username,
        profile_url: m.profile_url,
        confidence: m.match_confidence,
        match_type: m.match_type,
      })),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Profile scan error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Mock profile generator for MVP
function generateMockProfiles(platform: string, query?: string, limit: number = 50) {
  const profiles = [];
  const usernames = [
    'creator_fan_2024', 'official_support', 'real_creator_page', 'creator_updates',
    'fan_club_creator', 'creator_daily', 'the_real_creator', 'creator_zone',
    'creator_highlights', 'best_of_creator', 'creator_moments', 'creator_vibes'
  ];

  for (let i = 0; i < Math.min(limit, usernames.length); i++) {
    const username = query ? `${query}_${usernames[i]}` : usernames[i];
    profiles.push({
      username,
      profile_url: platform === 'instagram' 
        ? `https://instagram.com/${username}`
        : `https://tiktok.com/@${username}`,
      profile_image_url: `https://picsum.photos/seed/${username}/200/200`,
      bio: `Fan page for amazing content | Not affiliated | DM for collabs`,
      followers: Math.floor(Math.random() * 50000) + 1000,
    });
  }

  return profiles;
}
