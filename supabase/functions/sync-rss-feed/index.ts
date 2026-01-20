import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { podcastId } = await req.json();
    
    if (!podcastId) {
      return new Response(
        JSON.stringify({ error: "Podcast ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get podcast with RSS feed URL
    const { data: podcast, error: podcastError } = await supabase
      .from("podcasts")
      .select("id, rss_feed_url, user_id")
      .eq("id", podcastId)
      .single();

    if (podcastError || !podcast) {
      throw new Error("Podcast not found");
    }

    if (!podcast.rss_feed_url) {
      return new Response(
        JSON.stringify({ error: "No RSS feed URL stored for this podcast" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Syncing RSS feed from:", podcast.rss_feed_url);

    // Fetch and parse RSS feed
    const response = await fetch(podcast.rss_feed_url);
    if (!response.ok) {
      throw new Error(`Failed to fetch RSS feed: ${response.statusText}`);
    }

    const rssText = await response.text();

    // Parse RSS (same logic as import-rss-feed)
    const stripHtml = (text: string): string => {
      return text
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .trim();
    };

    const getTagContent = (text: string, tagName: string): string => {
      const pattern = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\/${tagName}>`, "i");
      const match = text.match(pattern);
      return match ? stripHtml(match[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, "$1")) : "";
    };

    const getTagAttribute = (text: string, tagName: string, attrName: string): string => {
      const pattern = new RegExp(`<${tagName}[^>]*${attrName}=["']([^"']*)["']`, "i");
      const match = text.match(pattern);
      return match ? match[1] : "";
    };

    const channelMatch = rssText.match(/<channel>([\s\S]*?)<\/channel>/i);
    if (!channelMatch) {
      throw new Error("Invalid RSS feed");
    }
    const channelContent = channelMatch[1];

    // Parse episodes from RSS
    const itemMatches = [...channelContent.matchAll(/<item>([\s\S]*?)<\/item>/gi)];
    const rssEpisodes = itemMatches.map((match) => {
      const itemContent = match[1];
      const audioUrl = getTagAttribute(itemContent, "enclosure", "url");
      const duration = getTagContent(itemContent, "itunes:duration");
      
      let durationSeconds = 0;
      if (duration) {
        const parts = duration.split(":").map(Number);
        if (parts.length === 3) {
          durationSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
        } else if (parts.length === 2) {
          durationSeconds = parts[0] * 60 + parts[1];
        } else {
          durationSeconds = parseInt(duration) || 0;
        }
      }

      return {
        title: getTagContent(itemContent, "title"),
        description: getTagContent(itemContent, "description"),
        audio_url: audioUrl,
        file_size_bytes: parseInt(getTagAttribute(itemContent, "enclosure", "length") || "0"),
        duration_seconds: durationSeconds,
        publish_date: getTagContent(itemContent, "pubDate"),
        episode_number: parseInt(getTagContent(itemContent, "itunes:episode")) || null,
        season_number: parseInt(getTagContent(itemContent, "itunes:season")) || null,
      };
    }).filter(ep => ep.audio_url);

    console.log(`Found ${rssEpisodes.length} episodes in RSS feed`);

    // Get existing episodes
    const { data: existingEpisodes, error: episodesError } = await supabase
      .from("episodes")
      .select("audio_url")
      .eq("podcast_id", podcastId);

    if (episodesError) {
      throw episodesError;
    }

    const existingAudioUrls = new Set(existingEpisodes?.map(ep => ep.audio_url) || []);

    // Filter for new episodes only
    const newEpisodes = rssEpisodes.filter(ep => !existingAudioUrls.has(ep.audio_url));

    console.log(`Importing ${newEpisodes.length} new episodes`);

    if (newEpisodes.length === 0) {
      return new Response(
        JSON.stringify({ message: "No new episodes found", newEpisodesCount: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert new episodes
    const episodesData = newEpisodes.map((ep) => ({
      podcast_id: podcastId,
      title: ep.title,
      description: ep.description,
      audio_url: ep.audio_url,
      file_size_bytes: ep.file_size_bytes,
      duration_seconds: ep.duration_seconds,
      publish_date: ep.publish_date || new Date().toISOString(),
      episode_number: ep.episode_number,
      season_number: ep.season_number,
      is_published: true,
    }));

    const { error: insertError } = await supabase
      .from("episodes")
      .insert(episodesData);

    if (insertError) {
      throw insertError;
    }

    console.log(`Successfully imported ${newEpisodes.length} new episodes`);

    return new Response(
      JSON.stringify({ 
        message: `Successfully imported ${newEpisodes.length} new episodes`,
        newEpisodesCount: newEpisodes.length 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("RSS Sync Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
