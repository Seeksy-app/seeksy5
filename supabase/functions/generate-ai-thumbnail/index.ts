import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GenerateThumbnailRequest {
  videoTitle?: string;
  videoDescription?: string;
  style?: string;
  count?: number; // Number of thumbnails to generate
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { videoTitle, videoDescription, style = "eye-catching", count = 1 }: GenerateThumbnailRequest = await req.json();

    const prompt = videoTitle 
      ? `Create an eye-catching, professional YouTube-style thumbnail for a video titled "${videoTitle}". ${videoDescription ? `Video is about: ${videoDescription}.` : ''} Style: ${style}, bold, vibrant colors, professional composition, 16:9 aspect ratio, high resolution.`
      : `Create an eye-catching, professional YouTube-style thumbnail. Style: ${style}, bold, vibrant colors, professional composition, 16:9 aspect ratio, high resolution.`;

    console.log(`Generating ${count} thumbnail(s) with prompt: ${prompt}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        modalities: ["image", "text"]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits depleted. Please add more credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI Gateway returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log("AI Gateway response:", JSON.stringify(data, null, 2));
    
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      console.error("No image URL in response. Full response:", data);
      throw new Error("Failed to generate thumbnail - no image URL in response");
    }

    console.log("Successfully generated thumbnail:", imageUrl);

    // For multiple thumbnails, we'd need to generate them in sequence
    // For now, return single thumbnail with structure that supports multiple
    const thumbnails = [imageUrl];
    
    return new Response(
      JSON.stringify({ 
        imageUrl,  // Keep for backward compatibility
        thumbnails // Array format for multiple thumbnails
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error generating AI thumbnail:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to generate AI thumbnail" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
