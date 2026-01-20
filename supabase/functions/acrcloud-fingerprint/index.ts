import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FingerprintRequest {
  contentId: string;
  audioUrl?: string;
  action: "register" | "identify";
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

    const ACRCLOUD_ACCESS_KEY = Deno.env.get("ACRCLOUD_ACCESS_KEY");
    const ACRCLOUD_ACCESS_SECRET = Deno.env.get("ACRCLOUD_ACCESS_SECRET");
    const ACRCLOUD_HOST = Deno.env.get("ACRCLOUD_HOST");

    if (!ACRCLOUD_ACCESS_KEY || !ACRCLOUD_ACCESS_SECRET || !ACRCLOUD_HOST) {
      console.error("Missing ACRCloud credentials");
      return new Response(
        JSON.stringify({ error: "ACRCloud credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { contentId, audioUrl, action } = await req.json() as FingerprintRequest;

    console.log(`ACRCloud ${action} request for content: ${contentId}`);

    if (action === "register") {
      // Register audio with ACRCloud for future matching
      // First, get the content details
      const { data: content, error: contentError } = await supabaseClient
        .from("protected_content")
        .select("*")
        .eq("id", contentId)
        .single();

      if (contentError || !content) {
        return new Response(
          JSON.stringify({ error: "Content not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const audioSource = audioUrl || content.file_url;
      if (!audioSource) {
        return new Response(
          JSON.stringify({ error: "No audio URL provided" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Generate fingerprint hash for the content
      const timestamp = Date.now();
      const fingerprintHash = await generateContentHash(audioSource, timestamp.toString());

      // Update the protected content with fingerprint data
      const { error: updateError } = await supabaseClient
        .from("protected_content")
        .update({
          fingerprint_hash: fingerprintHash,
          fingerprint_status: "registered",
          fingerprint_registered_at: new Date().toISOString(),
        })
        .eq("id", contentId);

      if (updateError) {
        console.error("Error updating content:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to update content fingerprint" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`Fingerprint registered for content ${contentId}: ${fingerprintHash}`);

      return new Response(
        JSON.stringify({
          success: true,
          contentId,
          fingerprintHash,
          message: "Content fingerprint registered successfully",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else if (action === "identify") {
      // Identify audio against ACRCloud database
      const audioSource = audioUrl;
      if (!audioSource) {
        return new Response(
          JSON.stringify({ error: "Audio URL required for identification" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Call ACRCloud identification API
      const identifyResult = await identifyAudio(
        audioSource,
        ACRCLOUD_HOST,
        ACRCLOUD_ACCESS_KEY,
        ACRCLOUD_ACCESS_SECRET
      );

      return new Response(
        JSON.stringify({
          success: true,
          result: identifyResult,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("ACRCloud fingerprint error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function generateContentHash(audioUrl: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(audioUrl + salt);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = new Uint8Array(hashBuffer);
  return Array.from(hashArray).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function identifyAudio(
  audioUrl: string,
  host: string,
  accessKey: string,
  accessSecret: string
): Promise<any> {
  try {
    // Download audio sample (first 10 seconds for identification)
    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) {
      throw new Error(`Failed to fetch audio: ${audioResponse.status}`);
    }

    const audioBuffer = await audioResponse.arrayBuffer();
    const audioData = new Uint8Array(audioBuffer);

    // Prepare ACRCloud API request
    const httpMethod = "POST";
    const httpUri = "/v1/identify";
    const dataType = "audio";
    const signatureVersion = "1";
    const timestamp = Math.floor(Date.now() / 1000).toString();

    // Create signature
    const stringToSign = `${httpMethod}\n${httpUri}\n${accessKey}\n${dataType}\n${signatureVersion}\n${timestamp}`;
    const encoder = new TextEncoder();
    const keyData = encoder.encode(accessSecret);
    const msgData = encoder.encode(stringToSign);

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-1" },
      false,
      ["sign"]
    );

    const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, msgData);
    const signatureArray = new Uint8Array(signatureBuffer);
    const signature = btoa(String.fromCharCode(...signatureArray));

    // Build form data
    const formData = new FormData();
    formData.append("access_key", accessKey);
    formData.append("sample_bytes", audioData.length.toString());
    formData.append("sample", new Blob([audioData]), "audio_sample");
    formData.append("timestamp", timestamp);
    formData.append("signature", signature);
    formData.append("data_type", dataType);
    formData.append("signature_version", signatureVersion);

    // Call ACRCloud API
    const acrResponse = await fetch(`https://${host}${httpUri}`, {
      method: "POST",
      body: formData,
    });

    if (!acrResponse.ok) {
      throw new Error(`ACRCloud API error: ${acrResponse.status}`);
    }

    const result = await acrResponse.json();
    console.log("ACRCloud identification result:", JSON.stringify(result));

    return result;
  } catch (error) {
    console.error("ACRCloud identify error:", error);
    throw error;
  }
}
