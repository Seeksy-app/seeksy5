import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper to strip HTML tags
function stripHtml(text: string): string {
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

// Extract tag content from XML
function getTagContent(text: string, tagName: string): string {
  const pattern = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i");
  const match = text.match(pattern);
  if (!match) return "";
  return stripHtml(match[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1"));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { feedId } = await req.json().catch(() => ({}));
    
    console.log("[sync-rd-feeds] Starting sync...", feedId ? `for feed ${feedId}` : "for all active feeds");

    // Get active feeds (or specific feed)
    let query = supabase
      .from("rd_feeds")
      .select("*")
      .eq("active", true)
      .eq("type", "blog");
    
    if (feedId) {
      query = query.eq("id", feedId);
    }

    const { data: feeds, error: feedsError } = await query;

    if (feedsError) {
      throw new Error(`Failed to fetch feeds: ${feedsError.message}`);
    }

    if (!feeds || feeds.length === 0) {
      return new Response(
        JSON.stringify({ message: "No active blog feeds to sync", synced: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let totalSynced = 0;
    let totalErrors = 0;
    const results: { feedId: string; title: string; synced: number; error?: string }[] = [];

    for (const feed of feeds) {
      try {
        console.log(`[sync-rd-feeds] Fetching RSS from: ${feed.rss_url}`);
        
        const response = await fetch(feed.rss_url, {
          headers: { "User-Agent": "Seeksy-RD-Bot/1.0" },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const rssText = await response.text();
        
        // Parse RSS items
        const itemMatches = [...rssText.matchAll(/<item>([\s\S]*?)<\/item>/gi)];
        console.log(`[sync-rd-feeds] Found ${itemMatches.length} items in feed: ${feed.title}`);

        let feedSynced = 0;

        for (const match of itemMatches) {
          const itemContent = match[1];
          
          const title = getTagContent(itemContent, "title");
          const link = getTagContent(itemContent, "link");
          const description = getTagContent(itemContent, "description");
          const content = getTagContent(itemContent, "content:encoded") || description;
          const pubDate = getTagContent(itemContent, "pubDate");
          const guid = getTagContent(itemContent, "guid") || link;

          if (!title || !link) continue;

          // Check if item already exists by URL
          const { data: existing } = await supabase
            .from("rd_feed_items")
            .select("id")
            .eq("url", link)
            .maybeSingle();

          if (existing) {
            console.log(`[sync-rd-feeds] Skipping duplicate: ${title}`);
            continue;
          }

          // Insert new item
          const { error: insertError } = await supabase
            .from("rd_feed_items")
            .insert({
              feed_id: feed.id,
              item_guid: guid,
              title: title,
              url: link,
              raw_content: content,
              cleaned_text: stripHtml(content),
              source_name: feed.title,
              content_type: "article",
              published_at: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
              processed: false,
            });

          if (insertError) {
            console.error(`[sync-rd-feeds] Insert error for "${title}":`, insertError.message);
          } else {
            feedSynced++;
            totalSynced++;
          }
        }

        // Update last_synced_at
        await supabase
          .from("rd_feeds")
          .update({ last_synced_at: new Date().toISOString() })
          .eq("id", feed.id);

        results.push({ feedId: feed.id, title: feed.title, synced: feedSynced });

      } catch (feedError: any) {
        console.error(`[sync-rd-feeds] Error syncing feed ${feed.title}:`, feedError.message);
        totalErrors++;
        results.push({ feedId: feed.id, title: feed.title, synced: 0, error: feedError.message });
      }
    }

    console.log(`[sync-rd-feeds] Complete. Synced ${totalSynced} articles from ${feeds.length} feeds.`);

    return new Response(
      JSON.stringify({ 
        message: `Synced ${totalSynced} articles from ${feeds.length} feeds`,
        totalSynced,
        totalErrors,
        results,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("[sync-rd-feeds] Fatal error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
