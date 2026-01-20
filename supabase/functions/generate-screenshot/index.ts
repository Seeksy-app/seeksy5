import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GenerateScreenshotRequest {
  pageName: string;
  pageDescription: string;
  category: string;
  fileName: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pageName, pageDescription, category, fileName }: GenerateScreenshotRequest = await req.json();

    // Construct detailed prompt for high-quality screenshot generation
    const prompt = `Create a professional, clean UI screenshot of a web application page for ${pageName}.

Description: ${pageDescription}

Requirements:
- Modern, professional design with clean interface
- Consistent branding and color scheme (use professional blues, whites, and grays)
- Include realistic but fake data (no personally identifying information)
- Clean UI elements with proper spacing and alignment
- Professional typography and icons
- Desktop view at 1920x1080 resolution
- No browser chrome, just the application interface
- No cursor or mouse pointer visible
- Subtle shadows for depth
- High quality, crisp rendering suitable for tutorials and documentation

Style: Modern SaaS application interface, clean and professional`;

    console.log("Generating screenshot with Lovable AI:", { pageName, category });

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        modalities: ["image", "text"]
      })
    });

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      throw new Error("Failed to generate screenshot image");
    }

    // Convert base64 to binary
    const base64Data = imageUrl.split(',')[1];
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    // Upload to Supabase Storage
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    
    const storagePath = `${category}/${fileName}.png`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('ui-screenshots')
      .upload(storagePath, binaryData, {
        contentType: 'image/png',
        upsert: true
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      throw new Error(`Failed to upload screenshot: ${uploadError.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('ui-screenshots')
      .getPublicUrl(storagePath);

    console.log("Screenshot generated and uploaded:", publicUrl);

    return new Response(
      JSON.stringify({ 
        success: true,
        imageUrl: publicUrl,
        storagePath 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error generating screenshot:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
