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
    const url = new URL(req.url);
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Extract slug from URL path (e.g., /rss/veteran-benefits-podcast)
    const pathParts = url.pathname.split('/').filter(p => p);
    const slug = pathParts[pathParts.length - 1];
    
    if (!slug) {
      return new Response("Invalid RSS feed URL - podcast slug required", { 
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "text/plain" }
      });
    }

    // Fetch podcast details by slug
    const { data: podcast, error: podcastError } = await supabase
      .from("podcasts")
      .select("*")
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();
    
    // Check if verification email has expired
    if (podcast && podcast.verification_email && !podcast.verification_email_permanent) {
      const now = new Date();
      const expiresAt = podcast.verification_email_expires_at ? new Date(podcast.verification_email_expires_at) : null;
      
      if (expiresAt && now > expiresAt) {
        // Auto-remove expired verification email
        await supabase
          .from("podcasts")
          .update({ verification_email: null, verification_email_expires_at: null })
          .eq("id", podcast.id);
        
        podcast.verification_email = null;
        podcast.verification_email_expires_at = null;
      }
    }

    if (podcastError || !podcast) {
      return new Response("Podcast not found", { status: 404 });
    }

    // Fetch published episodes
    const { data: episodes, error: episodesError } = await supabase
      .from("episodes")
      .select("*")
      .eq("podcast_id", podcast.id)
      .eq("is_published", true)
      .order("publish_date", { ascending: false });

    if (episodesError) {
      console.error("Error fetching episodes:", episodesError);
      return new Response("Error fetching episodes", { status: 500 });
    }

    // Generate RSS feed
    const rssXml = generateRSS(podcast, episodes || [], req.url);

    return new Response(rssXml, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/xml; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("RSS Feed Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function generateRSS(podcast: any, episodes: any[], feedUrl: string): string {
  const escapeXml = (str: string) => {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toUTCString();
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return "00:00:00";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
     xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
     xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${escapeXml(podcast.title)}</title>
    <link>${escapeXml(podcast.website_url || feedUrl)}</link>
    <description>${escapeXml(podcast.description || "")}</description>
    <language>${escapeXml(podcast.language || "en")}</language>
    ${podcast.cover_image_url ? `
    <image>
      <url>${escapeXml(podcast.cover_image_url)}</url>
      <title>${escapeXml(podcast.title)}</title>
      <link>${escapeXml(podcast.website_url || feedUrl)}</link>
    </image>
    <itunes:image href="${escapeXml(podcast.cover_image_url)}" />
    ` : ""}
    ${podcast.author_name ? `<itunes:author>${escapeXml(podcast.author_name)}</itunes:author>` : ""}
    ${(podcast.verification_email || podcast.author_email) ? `<itunes:owner>
      <itunes:email>${escapeXml(podcast.verification_email || podcast.author_email)}</itunes:email>
      ${podcast.author_name ? `<itunes:name>${escapeXml(podcast.author_name)}</itunes:name>` : ""}
    </itunes:owner>` : ""}
    ${podcast.category ? `<itunes:category text="${escapeXml(podcast.category)}" />` : ""}
    <itunes:explicit>${podcast.is_explicit ? "yes" : "no"}</itunes:explicit>
`;

  // Add episodes
  for (const episode of episodes) {
    xml += `
    <item>
      <title>${escapeXml(episode.title)}</title>
      <description>${escapeXml(episode.description || "")}</description>
      <pubDate>${formatDate(episode.publish_date)}</pubDate>
      <enclosure url="${escapeXml(episode.audio_url)}" 
                 ${episode.file_size_bytes ? `length="${episode.file_size_bytes}"` : 'length="0"'} 
                 type="audio/mpeg" />
      <guid isPermaLink="false">${escapeXml(episode.id)}</guid>
      ${episode.duration_seconds ? `<itunes:duration>${formatDuration(episode.duration_seconds)}</itunes:duration>` : ""}
      ${episode.episode_number ? `<itunes:episode>${episode.episode_number}</itunes:episode>` : ""}
      ${episode.season_number ? `<itunes:season>${episode.season_number}</itunes:season>` : ""}
    </item>`;
  }

  xml += `
  </channel>
</rss>`;

  return xml;
}
