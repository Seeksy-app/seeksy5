import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Free stock video URLs from Pexels (CC0 license)
const stockVideos = [
  "https://player.vimeo.com/external/434045526.sd.mp4?s=c27eecc69a27dbc4ff2b87d38afc35f1a9e7c02d&profile_id=164&oauth2_token_id=57447761",
  "https://player.vimeo.com/external/370467553.sd.mp4?s=96de8b923370055f5b6a2aae166cce6eae8cad7b&profile_id=164&oauth2_token_id=57447761",
  "https://player.vimeo.com/external/371867431.sd.mp4?s=e8ecd0b27a6b0dcb1e9a3d8f4a9a9c9a9c9a9c9a&profile_id=164&oauth2_token_id=57447761",
];

// Content templates for AI generation
const contentTemplates = {
  podcast_episodes: [
    { title: "The Future of AI in Creative Industries", category: "Technology", tags: ["AI", "creativity", "innovation"], duration: 2732 },
    { title: "Building a Personal Brand from Scratch", category: "Business", tags: ["branding", "marketing", "entrepreneurship"], duration: 2415 },
    { title: "Meditation and Mindfulness for Busy Professionals", category: "Health", tags: ["wellness", "meditation", "productivity"], duration: 1845 },
    { title: "The Untold Story: Cold Case Files", category: "True Crime", tags: ["mystery", "investigation", "justice"], duration: 3128 },
    { title: "Design Systems That Scale", category: "Design", tags: ["UI/UX", "systems", "scalability"], duration: 2156 },
    { title: "Startup Founders Share Their Journey", category: "Business", tags: ["startups", "founders", "growth"], duration: 2890 },
    { title: "The Science of Sleep and Recovery", category: "Health", tags: ["sleep", "health", "science"], duration: 2234 },
    { title: "Web3 and the Future of the Internet", category: "Technology", tags: ["web3", "blockchain", "decentralization"], duration: 2567 },
    { title: "Leadership Lessons from Top CEOs", category: "Business", tags: ["leadership", "management", "success"], duration: 2789 },
    { title: "The Art of Storytelling in Marketing", category: "Marketing", tags: ["storytelling", "content", "engagement"], duration: 1956 },
  ],
  ai_clips: [
    { title: "This AI Tool Changed Everything", category: "Technology", tags: ["AI", "tools", "viral"], duration: 58 },
    { title: "The One Habit You Need for Success", category: "Self-Help", tags: ["habits", "success", "motivation"], duration: 75 },
    { title: "Shocking Twist in the Investigation", category: "True Crime", tags: ["crime", "drama", "suspense"], duration: 45 },
    { title: "Design Hack You've Never Seen", category: "Design", tags: ["tips", "design", "creative"], duration: 62 },
    { title: "The Secret to Morning Productivity", category: "Productivity", tags: ["morning", "routine", "tips"], duration: 89 },
    { title: "What Nobody Tells You About Startups", category: "Business", tags: ["startups", "truth", "advice"], duration: 67 },
    { title: "This Meditation Technique Works in 60 Seconds", category: "Health", tags: ["meditation", "quick", "wellness"], duration: 60 },
    { title: "The Future of Work is Here", category: "Technology", tags: ["remote", "future", "trends"], duration: 54 },
  ],
  creator_spotlights: [
    { title: "Behind the Mic: A Day with Tech Daily", category: "Creator", tags: ["behind-scenes", "podcast", "day-in-life"], duration: 1234 },
    { title: "How I Built a 200K Audience in 2 Years", category: "Growth", tags: ["audience", "growth", "strategy"], duration: 1567 },
    { title: "From Side Hustle to Full-Time Creator", category: "Journey", tags: ["creator", "journey", "inspiration"], duration: 1890 },
    { title: "My Studio Setup Tour 2025", category: "Creator", tags: ["studio", "setup", "gear"], duration: 1123 },
  ],
};

// Channel templates
const channelTemplates = [
  { name: "Tech Insider Daily", category: "Technology", description: "Your daily dose of tech news, AI updates, and innovation stories" },
  { name: "The Wellness Hour", category: "Health", description: "Meditation, mindfulness, and health tips for busy professionals" },
  { name: "Business Unplugged", category: "Business", description: "Real stories from founders, CEOs, and business leaders" },
  { name: "Creative Studio", category: "Design", description: "Design systems, UI/UX tips, and creative inspiration" },
  { name: "True Crime Weekly", category: "True Crime", description: "Deep dives into cold cases and unsolved mysteries" },
  { name: "Startup Stories", category: "Business", description: "The highs, lows, and lessons from startup founders" },
  { name: "AI Frontiers", category: "Technology", description: "Exploring the cutting edge of artificial intelligence" },
  { name: "Mindful Living", category: "Health", description: "Simple practices for a balanced, mindful life" },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action = "seed_all", generateThumbnails = true } = await req.json().catch(() => ({}));

    console.log("Starting TV content seeding with action:", action);

    const results = {
      channels: [] as any[],
      content: [] as any[],
      thumbnails: [] as string[],
    };

    // Step 1: Create channels
    if (action === "seed_all" || action === "channels") {
      console.log("Creating channels...");
      
      for (const channel of channelTemplates) {
        let avatarUrl = null;
        let coverUrl = null;

        // Generate AI avatar for channel
        if (generateThumbnails && LOVABLE_API_KEY) {
          try {
            const avatarPrompt = `Professional podcast channel avatar logo for "${channel.name}", ${channel.category} theme, modern minimalist design, vibrant gradient background, clean vector style, square format`;
            
            const avatarResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${LOVABLE_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "google/gemini-2.5-flash-image-preview",
                messages: [{ role: "user", content: avatarPrompt }],
                modalities: ["image", "text"],
              }),
            });

            if (avatarResponse.ok) {
              const avatarData = await avatarResponse.json();
              avatarUrl = avatarData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
              console.log(`Generated avatar for ${channel.name}`);
            }

            // Generate cover image
            const coverPrompt = `Wide banner cover image for podcast channel "${channel.name}", ${channel.category} theme, cinematic, professional, abstract gradient with subtle patterns, 16:9 aspect ratio`;
            
            const coverResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${LOVABLE_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "google/gemini-2.5-flash-image-preview",
                messages: [{ role: "user", content: coverPrompt }],
                modalities: ["image", "text"],
              }),
            });

            if (coverResponse.ok) {
              const coverData = await coverResponse.json();
              coverUrl = coverData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
              console.log(`Generated cover for ${channel.name}`);
            }
          } catch (e) {
            console.error("Error generating images:", e);
          }
        }

        const slug = channel.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
        
        const { data: existingChannel } = await supabase
          .from("tv_channels")
          .select("id")
          .eq("slug", slug)
          .single();

        if (!existingChannel) {
          const { data: newChannel, error } = await supabase
            .from("tv_channels")
            .insert({
              name: channel.name,
              slug,
              description: channel.description,
              category: channel.category,
              avatar_url: avatarUrl,
              cover_url: coverUrl,
              is_verified: true,
              is_active: true,
              follower_count: Math.floor(Math.random() * 200000) + 5000,
              total_views: Math.floor(Math.random() * 1000000) + 10000,
            })
            .select()
            .single();

          if (error) {
            console.error("Error creating channel:", error);
          } else {
            results.channels.push(newChannel);
            console.log(`Created channel: ${channel.name}`);
          }
        }
      }
    }

    // Step 2: Get all channels for content assignment
    const { data: allChannels } = await supabase
      .from("tv_channels")
      .select("id, name, category")
      .eq("is_active", true);

    // Step 3: Create content
    if (action === "seed_all" || action === "content") {
      console.log("Creating content...");

      const allContent = [
        ...contentTemplates.podcast_episodes.map(c => ({ ...c, content_type: "episode" })),
        ...contentTemplates.ai_clips.map(c => ({ ...c, content_type: "clip" })),
        ...contentTemplates.creator_spotlights.map(c => ({ ...c, content_type: "spotlight" })),
      ];

      for (const content of allContent) {
        let thumbnailUrl = null;

        // Find matching channel by category
        const matchingChannel = allChannels?.find(ch => 
          ch.category?.toLowerCase() === content.category.toLowerCase() ||
          ch.name.toLowerCase().includes(content.category.toLowerCase())
        ) || allChannels?.[Math.floor(Math.random() * (allChannels?.length || 1))];

        // Generate AI thumbnail
        if (generateThumbnails && LOVABLE_API_KEY) {
          try {
            const thumbnailPrompt = content.content_type === "clip" 
              ? `YouTube Shorts/TikTok style thumbnail for "${content.title}", bold text overlay effect, vibrant colors, vertical 9:16, eye-catching, ${content.category} theme`
              : `Professional podcast episode thumbnail for "${content.title}", ${content.category} theme, modern design, cinematic lighting, engaging composition, 16:9 aspect ratio`;
            
            const thumbnailResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${LOVABLE_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "google/gemini-2.5-flash-image-preview",
                messages: [{ role: "user", content: thumbnailPrompt }],
                modalities: ["image", "text"],
              }),
            });

            if (thumbnailResponse.ok) {
              const thumbnailData = await thumbnailResponse.json();
              thumbnailUrl = thumbnailData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
              results.thumbnails.push(thumbnailUrl || "failed");
              console.log(`Generated thumbnail for: ${content.title}`);
            }
          } catch (e) {
            console.error("Error generating thumbnail:", e);
          }
        }

        // Check if content already exists
        const { data: existingContent } = await supabase
          .from("tv_content")
          .select("id")
          .eq("title", content.title)
          .single();

        if (!existingContent) {
          const { data: newContent, error } = await supabase
            .from("tv_content")
            .insert({
              title: content.title,
              description: `Watch "${content.title}" - an engaging ${content.content_type} about ${content.tags.join(", ")}.`,
              thumbnail_url: thumbnailUrl,
              video_url: stockVideos[Math.floor(Math.random() * stockVideos.length)],
              duration_seconds: content.duration,
              category: content.category,
              tags: content.tags,
              content_type: content.content_type,
              channel_id: matchingChannel?.id,
              is_published: true,
              published_at: new Date().toISOString(),
              view_count: Math.floor(Math.random() * 50000) + 1000,
              source: "ai_seeded",
            })
            .select()
            .single();

          if (error) {
            console.error("Error creating content:", error);
          } else {
            results.content.push(newContent);
            console.log(`Created content: ${content.title}`);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Seeded ${results.channels.length} channels and ${results.content.length} content items`,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Seeding error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
