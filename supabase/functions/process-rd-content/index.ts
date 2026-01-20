import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Chunk text into smaller pieces for embeddings
function chunkText(text: string, maxTokens: number = 2000): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  let currentChunk: string[] = [];
  let currentLength = 0;

  for (const word of words) {
    // Rough token estimate: 1 token ≈ 4 characters
    const wordTokens = Math.ceil(word.length / 4);
    
    if (currentLength + wordTokens > maxTokens && currentChunk.length > 0) {
      chunks.push(currentChunk.join(' '));
      currentChunk = [word];
      currentLength = wordTokens;
    } else {
      currentChunk.push(word);
      currentLength += wordTokens;
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(' '));
  }

  return chunks;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { itemId, batchSize = 5, forceReprocess = false } = await req.json().catch(() => ({}));
    
    console.log("[process-rd-content] Starting processing...", 
      itemId ? `for item ${itemId}` : `batch of ${batchSize}`,
      forceReprocess ? "(force reprocess)" : ""
    );

    // Get items to process
    let query;
    
    if (itemId) {
      // Single item processing (can force reprocess)
      query = supabase
        .from("rd_feed_items")
        .select("*")
        .eq("id", itemId);
    } else {
      // Batch processing (only unprocessed)
      query = supabase
        .from("rd_feed_items")
        .select("*")
        .eq("processed", false)
        .order("created_at", { ascending: true })
        .limit(batchSize);
    }

    const { data: items, error: itemsError } = await query;

    if (itemsError) {
      throw new Error(`Failed to fetch items: ${itemsError.message}`);
    }

    if (!items || items.length === 0) {
      return new Response(
        JSON.stringify({ message: "No items found to process", processed: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let processed = 0;
    let errors = 0;

    for (const item of items) {
      try {
        // If force reprocessing, delete existing insights and chunks
        if (forceReprocess && itemId) {
          console.log(`[process-rd-content] Force reprocessing: deleting existing data for ${item.id}`);
          await supabase.from("kb_chunks").delete().eq("source_item_id", item.id);
          await supabase.from("rd_insights").delete().eq("feed_item_id", item.id);
        }

        const contentToProcess = item.cleaned_text || item.raw_content || item.title;
        
        if (!contentToProcess || contentToProcess.length < 50) {
          console.log(`[process-rd-content] Skipping item ${item.id}: content too short`);
          await supabase.from("rd_feed_items").update({ processed: true }).eq("id", item.id);
          continue;
        }

        // Generate AI summary and tags using Lovable AI
        let summary = contentToProcess.substring(0, 300) + "...";
        let tags: string[] = [];
        let stance = "neutral";

        if (lovableApiKey) {
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
                    content: "You are an R&D analyst. Analyze content and extract insights for a knowledge base. Return JSON only."
                  },
                  {
                    role: "user",
                    content: `Analyze this article and return JSON with:
- summary: 2-3 sentence summary (max 200 words)
- tags: array of 3-5 relevant tags (e.g., "AI", "Creator Economy", "Podcasting", "AdTech")
- stance: "bullish", "bearish", or "neutral" sentiment toward creator/podcast industry

Article title: ${item.title}
Content: ${contentToProcess.substring(0, 3000)}

Return ONLY valid JSON, no markdown.`
                  }
                ],
              }),
            });

            if (aiResponse.ok) {
              const aiData = await aiResponse.json();
              const aiText = aiData.choices?.[0]?.message?.content || "";
              
              try {
                // Try to parse JSON from response
                const jsonMatch = aiText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                  const parsed = JSON.parse(jsonMatch[0]);
                  summary = parsed.summary || summary;
                  tags = parsed.tags || [];
                  stance = parsed.stance || "neutral";
                }
              } catch (parseErr) {
                console.log("[process-rd-content] Could not parse AI response, using defaults");
              }
            }
          } catch (aiErr: any) {
            console.log("[process-rd-content] AI processing failed:", aiErr.message);
          }
        }

        // Insert or update rd_insights
        const { error: insightError } = await supabase
          .from("rd_insights")
          .upsert({
            feed_item_id: item.id,
            summary: summary,
            tags: tags,
            stance: stance,
            topics: { title: item.title, source: item.source_name },
            visibility: "internal",
            confidence_score: 0.8,
          }, { onConflict: "feed_item_id" });

        if (insightError) {
          console.error(`[process-rd-content] Insight insert error:`, insightError.message);
        }

        // Create kb_chunks for embedding
        const chunks = chunkText(contentToProcess, 2000);
        
        for (let i = 0; i < chunks.length; i++) {
          const { error: chunkError } = await supabase
            .from("kb_chunks")
            .insert({
              source_item_id: item.id,
              chunk_text: chunks[i],
              chunk_index: i,
              token_count: Math.ceil(chunks[i].length / 4),
            });

          if (chunkError) {
            console.error(`[process-rd-content] Chunk insert error:`, chunkError.message);
          }
        }

        // Mark item as processed
        await supabase
          .from("rd_feed_items")
          .update({ processed: true })
          .eq("id", item.id);

        processed++;
        console.log(`[process-rd-content] Processed: ${item.title}`);

      } catch (itemError: any) {
        console.error(`[process-rd-content] Error processing item ${item.id}:`, itemError.message);
        errors++;
      }
    }

    console.log(`[process-rd-content] Complete. Processed ${processed} items, ${errors} errors.`);

    return new Response(
      JSON.stringify({ 
        message: `Processed ${processed} items`,
        processed,
        errors,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("[process-rd-content] Fatal error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
