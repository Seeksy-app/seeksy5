import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GenerateAvatarRequest {
  appId: string;
  appName: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { appId, appName }: GenerateAvatarRequest = await req.json();

    if (!appId || !appName) {
      throw new Error("Missing required parameters: appId and appName");
    }

    console.log(`Generating avatar for app: ${appName} (${appId})`);

    // Randomly select gender and ethnicity for diversity
    const genders = ['professional businesswoman', 'professional businessman'];
    const ethnicities = ['white', 'Asian', 'Hispanic', 'Black', 'Middle Eastern', 'mixed ethnicity'];
    const selectedGender = genders[Math.floor(Math.random() * genders.length)];
    const selectedEthnicity = ethnicities[Math.floor(Math.random() * ethnicities.length)];
    const isFemale = selectedGender.includes('woman');

    // Generate avatar image using Lovable AI
    const prompt = `Create a professional, friendly avatar portrait. The avatar should be a ${selectedEthnicity} ${selectedGender} that represents ${appName}. Modern, clean style with good lighting. Headshot format, warm genuine smile, professional business attire. High quality portrait photography style. 512x512 dimensions.`;

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

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable AI API error:", errorText);
      throw new Error(`Failed to generate avatar: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      throw new Error("No image URL in response");
    }

    // Upload to Supabase Storage
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    
    // Convert base64 to blob
    const base64Data = imageUrl.split(',')[1];
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    
    const filename = `app-audio/${appId}-avatar-${Date.now()}.png`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filename, byteArray, {
        contentType: 'image/png',
        upsert: true
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error(`Failed to upload avatar: ${uploadError.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filename);

    // Select appropriate voice based on avatar gender
    const femaleVoices = [
      'cgSgspJ2msm6clMCkdW9', // Jessica
      'EXAVITQu4vr4xnSDxMaL', // Sarah
      'FGY2WhTYpPnrIDTdsKH5', // Laura
      'XB0fDUnXU5powFXDhCwa', // Charlotte
      'Xb7hH8MSUJpSbSDYk0k2', // Alice
      'XrExE9yKIg1WjnnlVkGX', // Matilda
    ];
    const maleVoices = [
      'CwhRBWXzGAHq8TQ4Fs17', // Roger
      'IKne3meq5aSn9XLyUdCD', // Charlie
      'JBFqnCBsd6RMkjVDRZzb', // George
      'N2lVS1w4EtoT3dr4eOWO', // Callum
      'TX3LPaxmHKxFdv7VOQHJ', // Liam
      'bIHbv24MWmeRgasZH58o', // Will
      'cjVigY5qzO86Huf0OWal', // Eric
      'iP95p4xoKVk53GoZ742B', // Chris
      'nPczCjzI2devNBz1zQrb', // Brian
      'onwK4e9ZLuTAKqWW03F9', // Daniel
      'pqHfZKP75CvOlQylNhV4', // Bill
    ];
    
    const voicePool = isFemale ? femaleVoices : maleVoices;
    const selectedVoiceId = voicePool[Math.floor(Math.random() * voicePool.length)];

    // Update database with avatar and matched voice
    const { error: updateError } = await supabase
      .from('app_audio_descriptions')
      .update({ 
        avatar_url: publicUrl,
        voice_id: selectedVoiceId 
      })
      .eq('app_id', appId);

    if (updateError) {
      console.error("Database update error:", updateError);
      throw new Error(`Failed to update database: ${updateError.message}`);
    }

    console.log(`Successfully generated and stored avatar for ${appName} (${isFemale ? 'Female' : 'Male'}, Voice: ${selectedVoiceId})`);

    return new Response(
      JSON.stringify({ 
        avatarUrl: publicUrl,
        voiceId: selectedVoiceId,
        gender: isFemale ? 'female' : 'male'
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error generating avatar:", error);
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
