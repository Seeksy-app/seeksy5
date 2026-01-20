import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-shotstack-signature, x-shotstack-timestamp",
};

/**
 * Mint Certificate (Background Process)
 * 
 * Simulates blockchain minting for a finished clip.
 * Phase 1: Mock implementation with proper data structure.
 * 
 * Future integration points:
 * - Real wallet connection (user or platform wallet)
 * - Smart contract interaction (Polygon, Base, etc.)
 * - IPFS/Arweave metadata storage
 * - Real transaction submission and confirmation polling
 */
async function mintCertificate(supabase: any, clipId: string) {
  try {
    console.log(`→ Minting simulation started for clip: ${clipId}`);

    // Set status to minting
    await supabase
      .from('clips')
      .update({ cert_status: 'minting' })
      .eq('id', clipId);

    // Simulate minting delay (1-2 seconds)
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Generate mock certificate data
    const mockTxHash = `0x${Array.from({length: 64}, () => 
      Math.floor(Math.random() * 16).toString(16)).join('')}`;
    
    const mockTokenId = Math.floor(Math.random() * 1000000).toString();
    const chain = 'polygon'; // Default chain for Phase 1
    
    const explorerUrl = `https://polygonscan.com/tx/${mockTxHash}`;

    console.log(`→ Minting simulation completed`);
    console.log(`  Chain: ${chain}`);
    console.log(`  TX Hash: ${mockTxHash}`);
    console.log(`  Token ID: ${mockTokenId}`);
    console.log(`  Explorer: ${explorerUrl}`);

    // Update clip with certificate details
    const { error: certError } = await supabase
      .from('clips')
      .update({
        cert_status: 'minted',
        cert_chain: chain,
        cert_tx_hash: mockTxHash,
        cert_token_id: mockTokenId,
        cert_explorer_url: explorerUrl,
        cert_created_at: new Date().toISOString(),
      })
      .eq('id', clipId);

    if (certError) {
      throw certError;
    }

    console.log(`→ Certification written to database`);
    console.log(`✓ Clip ${clipId} certified successfully`);

  } catch (error) {
    console.error(`❌ Certification failed for clip ${clipId}:`, error);
    
    // Set status to failed
    await supabase
      .from('clips')
      .update({ cert_status: 'failed' })
      .eq('id', clipId);
  }
}

/**
 * Shotstack Webhook Handler
 * 
 * Receives status updates from Shotstack when render jobs complete.
 * 
 * Shotstack sends POST requests with:
 * - id: Shotstack render job ID
 * - status: queued, fetching, rendering, done, failed
 * - url: Final rendered video URL (when status === "done")
 * - error: Error message (when status === "failed")
 * 
 * Headers (for signature verification):
 * - x-shotstack-signature: HMAC signature
 * - x-shotstack-timestamp: Unix timestamp
 * 
 * Process:
 * 1. Parse webhook payload
 * 2. Look up clip by shotstack_job_id
 * 3. Update clip status based on Shotstack status
 * 4. When done, save final video URL and trigger certification
 */

interface ShotstackWebhookPayload {
  id: string; // Shotstack job ID
  owner: string;
  action: string; // "render-status"
  type: string; // "status"
  status: "queued" | "fetching" | "rendering" | "done" | "failed";
  url?: string; // Final video URL when status === "done"
  error?: string; // Error message when status === "failed"
  completed?: string; // ISO timestamp
  data?: {
    duration?: number;
    size?: number;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== SHOTSTACK WEBHOOK RECEIVED ===");

    // Optional: Verify webhook signature
    const signature = req.headers.get("x-shotstack-signature");
    const timestamp = req.headers.get("x-shotstack-timestamp");
    
    if (signature && timestamp) {
      // Future: Implement HMAC verification using SHOTSTACK_WEBHOOK_SECRET
      console.log("→ Webhook signature present (verification not yet implemented)");
    }

    // Parse payload
    const payload: ShotstackWebhookPayload = await req.json();
    console.log("→ Webhook payload:", JSON.stringify(payload, null, 2));

    const { id: shotstackJobId, status, url, error } = payload;

    if (!shotstackJobId) {
      throw new Error("Missing Shotstack job ID in webhook payload");
    }

    console.log(`→ Job: ${shotstackJobId}, Status: ${status}`);

    // Initialize Supabase with service role
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        global: {
          headers: {
            Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
        },
      }
    );

    // Look up clip by shotstack_job_id (check both vertical and thumbnail fields)
    const { data: clip, error: clipError } = await supabase
      .from("clips")
      .select("*")
      .or(`shotstack_job_id.eq.${shotstackJobId},shotstack_job_id_thumbnail.eq.${shotstackJobId}`)
      .maybeSingle();

    if (clipError) {
      console.error("Database error looking up clip:", clipError);
      throw clipError;
    }

    if (!clip) {
      console.warn(`No clip found for Shotstack job ${shotstackJobId}`);
      // Return 200 anyway to prevent Shotstack from retrying
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`✓ Found clip: ${clip.id}`);
    
    // Determine which render type this is (vertical or thumbnail)
    const isVertical = clip.shotstack_job_id === shotstackJobId;
    const renderType = isVertical ? "vertical" : "thumbnail";
    console.log(`→ Render type: ${renderType}`);

    // Update clip based on status
    let updateData: any = {
      shotstack_status: status,
    };

    if (status === "done") {
      // Render complete - save final URL
      if (!url) {
        throw new Error("Shotstack returned 'done' status but no URL");
      }

      console.log(`✓ Render complete: ${url}`);

      updateData = {
        ...updateData,
        error_message: null, // Clear any previous errors
      };

      // Update the appropriate URL field based on render type
      if (isVertical) {
        updateData.vertical_url = url;
        updateData.storage_path = url; // Backwards compatibility
      } else {
        updateData.thumbnail_url = url;
      }

      // Only mark as "ready" when BOTH renders are complete
      const hasVertical = isVertical ? true : !!clip.vertical_url;
      const hasThumbnail = isVertical ? !!clip.thumbnail_url : true;
      
      if (hasVertical && hasThumbnail) {
        updateData.status = "ready";
        console.log("✓ Both vertical and thumbnail renders complete");
      } else {
        console.log(`→ Waiting for ${isVertical ? 'thumbnail' : 'vertical'} render to complete`);
      }

      // Blockchain certification trigger (only when both renders complete AND certification enabled)
      if (updateData.status === "ready" && clip.cert_status === 'not_requested' && clip.enable_certification === true) {
        console.log("→ Automatic certification enabled - will trigger mint-clip-certificate");
        updateData.cert_status = 'pending';
      }

      // Optional: Create ai_edited_assets record for tracking
      try {
        await supabase.from("ai_edited_assets").insert({
          source_media_id: clip.source_media_id,
          ai_job_id: clip.ai_job_id,
          output_type: renderType,
          storage_path: url,
          duration_seconds: clip.duration_seconds,
          metadata: {
            shotstack_job_id: shotstackJobId,
            processing_method: "shotstack_edit_api",
            completed_at: new Date().toISOString(),
          },
        });
        console.log(`✓ Created ai_edited_assets record for ${renderType}`);
      } catch (assetError) {
        console.error("Warning: Failed to create ai_edited_assets record:", assetError);
        // Don't throw - clip update is more important
      }

    } else if (status === "failed") {
      // Render failed
      const errorMessage = error || "Shotstack render failed (no error message provided)";
      console.error(`✗ Render failed: ${errorMessage}`);

      updateData = {
        ...updateData,
        status: "failed",
        error_message: errorMessage,
      };

    } else {
      // Intermediate statuses: queued, fetching, rendering
      console.log(`→ Status update: ${status}`);
    }

    // Update clip record
    const { error: updateError } = await supabase
      .from("clips")
      .update(updateData)
      .eq("id", clip.id);

    if (updateError) {
      console.error("Failed to update clip:", updateError);
      throw updateError;
    }

    console.log(`✓ Clip ${clip.id} updated successfully`);

    // If certification was triggered, call real minting function
    if (updateData.cert_status === 'pending') {
      console.log("→ Triggering automatic blockchain certification");
      
      // Call the mint-clip-certificate function using Supabase client (proper way)
      // Don't await - let it run in background
      supabase.functions.invoke('mint-clip-certificate', {
        body: { clipId: clip.id },
      })
        .then(({ data, error }) => {
          if (error) {
            console.error("❌ Certification function error:", error);
          } else {
            console.log("✓ Certification function completed:", data);
          }
        })
        .catch(err => {
          console.error("❌ Failed to call certification function:", err);
        });
    }

    return new Response(
      JSON.stringify({
        success: true,
        clipId: clip.id,
        status: status,
        message: `Webhook processed for job ${shotstackJobId}`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("❌ Webhook handler error:", error);
    
    // Return 200 even on error to prevent Shotstack from retrying
    // Log the error but acknowledge receipt
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
        acknowledged: true,
      }),
      {
        status: 200, // Return 200 to prevent retries
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
