import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Extract video ID from YouTube URL
function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const youtubeApiKey = Deno.env.get("YOUTUBE_API_KEY");
  const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { youtubeUrl, title: customTitle } = await req.json();
    
    if (!youtubeUrl) {
      return new Response(
        JSON.stringify({ error: "YouTube URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) {
      return new Response(
        JSON.stringify({ error: "Invalid YouTube URL" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[ingest-youtube-rd] Processing video: ${videoId}`);

    // Check if already exists
    const { data: existing } = await supabase
      .from("rd_feed_items")
      .select("id")
      .eq("item_guid", `youtube-${videoId}`)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ error: "This video has already been ingested", itemId: existing.id }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch video details from YouTube API
    let videoTitle = customTitle || `YouTube Video ${videoId}`;
    let videoDescription = "";
    let publishedAt = new Date().toISOString();
    let channelTitle = "YouTube";

    if (youtubeApiKey) {
      try {
        const ytResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${youtubeApiKey}`
        );
        
        if (ytResponse.ok) {
          const ytData = await ytResponse.json();
          const snippet = ytData.items?.[0]?.snippet;
          
          if (snippet) {
            videoTitle = customTitle || snippet.title || videoTitle;
            videoDescription = snippet.description || "";
            publishedAt = snippet.publishedAt || publishedAt;
            channelTitle = snippet.channelTitle || "YouTube";
          }
        }
      } catch (ytErr) {
        console.log("[ingest-youtube-rd] YouTube API error, using defaults");
      }
    }

    // For now, use the description as content (transcript would require additional processing)
    // In production, you'd integrate with a transcription service
    let transcriptText = videoDescription;
    let summary = videoDescription.substring(0, 300) + "...";
    let tags: string[] = ["YouTube", "Video"];

    // Try to generate AI summary
    if (lovableApiKey && videoDescription.length > 100) {
      try {
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${lovableApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              {
                role: "system",
                content: "You are an R&D analyst. Summarize video content and extract tags. Return JSON only."
              },
              {
                role: "user",
                content: `Summarize this YouTube video and return JSON with:
- summary: 2-3 sentence summary
- tags: array of 3-5 relevant tags

Title: ${videoTitle}
Description: ${videoDescription.substring(0, 2000)}

Return ONLY valid JSON, no markdown.`
              }
            ],
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const aiText = aiData.choices?.[0]?.message?.content || "";
          
          try {
            const jsonMatch = aiText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              summary = parsed.summary || summary;
              tags = parsed.tags || tags;
            }
          } catch (parseErr) {
            console.log("[ingest-youtube-rd] Could not parse AI response");
          }
        }
      } catch (aiErr) {
        console.log("[ingest-youtube-rd] AI processing failed");
      }
    }

    // Insert feed item
    const { data: feedItem, error: insertError } = await supabase
      .from("rd_feed_items")
      .insert({
        feed_id: null,
        item_guid: `youtube-${videoId}`,
        title: videoTitle,
        url: youtubeUrl,
        raw_content: videoDescription,
        cleaned_text: transcriptText,
        source_name: channelTitle,
        content_type: "youtube",
        published_at: publishedAt,
        processed: false,
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to insert item: ${insertError.message}`);
    }

    // Insert insight
    await supabase
      .from("rd_insights")
      .insert({
        feed_item_id: feedItem.id,
        summary: summary,
        tags: tags,
        stance: "neutral",
        topics: { title: videoTitle, source: channelTitle, videoId },
        visibility: "internal",
      });

    // Create kb_chunks for semantic search
    const contentToChunk = transcriptText || videoDescription;
    if (contentToChunk.length > 0) {
      const chunkSize = 400; // ~400 words per chunk
      const words = contentToChunk.split(/\s+/);
      let chunkIndex = 0;
      let currentChunk: string[] = [];

      for (const word of words) {
        currentChunk.push(word);
        if (currentChunk.length >= chunkSize) {
          await supabase
            .from("kb_chunks")
            .insert({
              source_item_id: feedItem.id,
              chunk_text: currentChunk.join(' '),
              chunk_index: chunkIndex,
              token_count: Math.ceil(currentChunk.join(' ').length / 4),
            });
          currentChunk = [];
          chunkIndex++;
        }
      }

      // Insert remaining chunk
      if (currentChunk.length > 0) {
        await supabase
          .from("kb_chunks")
          .insert({
            source_item_id: feedItem.id,
            chunk_text: currentChunk.join(' '),
            chunk_index: chunkIndex,
            token_count: Math.ceil(currentChunk.join(' ').length / 4),
          });
      }

      console.log(`[ingest-youtube-rd] Created ${chunkIndex + 1} kb_chunks`);
    }

    // Mark as processed
    await supabase
      .from("rd_feed_items")
      .update({ processed: true })
      .eq("id", feedItem.id);

    console.log(`[ingest-youtube-rd] Successfully ingested: ${videoTitle}`);

    return new Response(
      JSON.stringify({ 
        message: "YouTube video ingested successfully",
        itemId: feedItem.id,
        title: videoTitle,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("[ingest-youtube-rd] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
