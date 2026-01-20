import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.83.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { fileName, fileUrl, fileType, fileSize, userId } = await req.json();

    if (!fileName || !fileUrl || !userId) {
      throw new Error('Missing required fields: fileName, fileUrl, userId');
    }

    console.log('Confirming upload for:', fileName);

    // Create database record
    const { data: mediaFile, error: dbError } = await supabase
      .from('media_files')
      .insert({
        user_id: userId,
        file_name: fileName,
        file_url: fileUrl,
        file_type: fileType?.startsWith('video') ? 'video' : 'audio',
        file_size_bytes: fileSize || 0,
        source: 'upload',
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw dbError;
    }

    console.log('Database record created:', mediaFile.id);

    return new Response(
      JSON.stringify({ 
        success: true,
        mediaFile 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error confirming upload:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: String(error)
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
