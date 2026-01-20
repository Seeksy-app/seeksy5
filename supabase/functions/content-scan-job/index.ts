import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ScanJobRequest {
  userId?: string;
  contentId?: string;
  platforms?: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { userId, contentId, platforms = ["youtube", "spotify", "instagram", "facebook"] } = 
      await req.json() as ScanJobRequest;

    console.log(`Starting content scan job - userId: ${userId}, contentId: ${contentId}`);

    // Get protected content to scan
    let contentQuery = supabaseClient
      .from("protected_content")
      .select("*")
      .eq("status", "active")
      .not("fingerprint_hash", "is", null);

    if (userId) {
      contentQuery = contentQuery.eq("user_id", userId);
    }
    if (contentId) {
      contentQuery = contentQuery.eq("id", contentId);
    }

    const { data: protectedContent, error: contentError } = await contentQuery;

    if (contentError) {
      console.error("Error fetching protected content:", contentError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch protected content" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!protectedContent || protectedContent.length === 0) {
      return new Response(
        JSON.stringify({ message: "No protected content to scan", scanned: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create scan job record
    const { data: scanJob, error: scanJobError } = await supabaseClient
      .from("content_scan_jobs")
      .insert({
        user_id: userId || null,
        status: "running",
        platforms_scanned: platforms,
        content_count: protectedContent.length,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (scanJobError) {
      console.error("Error creating scan job:", scanJobError);
      return new Response(
        JSON.stringify({ error: "Failed to create scan job" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let matchesFound = 0;
    const errors: string[] = [];

    // Scan each piece of protected content
    for (const content of protectedContent) {
      try {
        // Get monitoring sources for this user
        const { data: sources } = await supabaseClient
          .from("content_monitoring_sources")
          .select("*")
          .eq("user_id", content.user_id)
          .eq("is_active", true)
          .in("platform", platforms);

        if (!sources || sources.length === 0) {
          console.log(`No monitoring sources for user ${content.user_id}`);
          continue;
        }

        // Simulate scanning each platform (in production, this would call platform APIs)
        for (const source of sources) {
          const matches = await scanPlatformForContent(content, source);
          
          for (const match of matches) {
            // Check if this match already exists
            const { data: existingMatch } = await supabaseClient
              .from("content_matches")
              .select("id")
              .eq("content_id", content.id)
              .eq("platform_url", match.platformUrl)
              .single();

            if (!existingMatch) {
              // Insert new match
              const { error: matchError } = await supabaseClient
                .from("content_matches")
                .insert({
                  content_id: content.id,
                  user_id: content.user_id,
                  platform: source.platform,
                  platform_url: match.platformUrl,
                  platform_content_id: match.platformContentId,
                  similarity_score: match.similarityScore,
                  match_type: match.matchType,
                  detected_title: match.detectedTitle,
                  detected_channel: match.detectedChannel,
                  status: "pending_review",
                });

              if (matchError) {
                console.error("Error inserting match:", matchError);
                errors.push(`Failed to insert match for ${content.id}`);
              } else {
                matchesFound++;
                
                // Send notification for new match
                await sendMatchNotification(supabaseClient, content.user_id, content, match);
              }
            }
          }
        }
      } catch (error) {
        console.error(`Error scanning content ${content.id}:`, error);
        errors.push(`Error scanning ${content.id}: ${error}`);
      }
    }

    // Update scan job with results
    await supabaseClient
      .from("content_scan_jobs")
      .update({
        status: errors.length > 0 ? "completed_with_errors" : "completed",
        completed_at: new Date().toISOString(),
        matches_found: matchesFound,
        errors: errors.length > 0 ? errors : null,
      })
      .eq("id", scanJob.id);

    console.log(`Scan job completed - matches found: ${matchesFound}, errors: ${errors.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        scanJobId: scanJob.id,
        contentScanned: protectedContent.length,
        matchesFound,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Content scan job error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

interface ContentMatch {
  platformUrl: string;
  platformContentId: string;
  similarityScore: number;
  matchType: "audio" | "transcript" | "visual";
  detectedTitle?: string;
  detectedChannel?: string;
}

async function scanPlatformForContent(content: any, source: any): Promise<ContentMatch[]> {
  // In production, this would:
  // 1. Call platform-specific APIs (YouTube Data API, Spotify API, etc.)
  // 2. Search for content matching the creator's fingerprint
  // 3. Use ACRCloud for audio matching
  // 4. Use transcript similarity for semantic matching
  
  // For now, return empty array - actual implementation requires platform API integration
  console.log(`Scanning ${source.platform} for content: ${content.title}`);
  
  // Placeholder: In production, integrate with:
  // - YouTube Data API v3 for YouTube
  // - Spotify Web API for Spotify
  // - Instagram Graph API for Instagram
  // - Facebook Graph API for Facebook
  
  return [];
}

async function sendMatchNotification(
  supabase: any,
  userId: string,
  content: any,
  match: ContentMatch
): Promise<void> {
  try {
    // Get user email
    const { data: authData } = await supabase.auth.admin.getUserById(userId);
    const userEmail = authData?.user?.email;

    if (!userEmail) {
      console.log("No email found for user:", userId);
      return;
    }

    // Send email notification via Resend
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      console.log("Resend API key not configured");
      return;
    }

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: Deno.env.get("SENDER_EMAIL") || "notifications@seeksy.io",
        to: [userEmail],
        subject: `🔔 Content Match Detected - ${content.title}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #053877;">Content Match Alert</h2>
            <p>We detected potential use of your protected content:</p>
            
            <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <p><strong>Your Content:</strong> ${content.title}</p>
              <p><strong>Platform:</strong> ${match.platformUrl.includes('youtube') ? 'YouTube' : match.platformUrl.includes('spotify') ? 'Spotify' : 'Other'}</p>
              <p><strong>Match Score:</strong> ${Math.round(match.similarityScore * 100)}%</p>
              <p><strong>Match Type:</strong> ${match.matchType}</p>
              ${match.detectedTitle ? `<p><strong>Detected Title:</strong> ${match.detectedTitle}</p>` : ''}
            </div>
            
            <a href="${match.platformUrl}" style="display: inline-block; background: #2C6BED; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">View Content</a>
            
            <p style="margin-top: 24px; color: #666;">Log in to your Seeksy dashboard to review this match and take action.</p>
          </div>
        `,
      }),
    });

    if (!emailResponse.ok) {
      console.error("Failed to send notification email:", await emailResponse.text());
    } else {
      console.log("Match notification sent to:", userEmail);
    }
  } catch (error) {
    console.error("Error sending notification:", error);
  }
}
