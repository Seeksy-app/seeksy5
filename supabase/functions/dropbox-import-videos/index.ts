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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Not authenticated');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { files, seriesName } = await req.json();
    
    if (!files || !Array.isArray(files) || files.length === 0) {
      throw new Error('No files provided');
    }

    console.log(`Starting import of ${files.length} files for series: ${seriesName}`);

    // Get Dropbox token from social_media_profiles
    const { data: profile } = await supabase
      .from('social_media_profiles')
      .select('access_token')
      .eq('user_id', user.id)
      .eq('platform', 'dropbox')
      .single();

    if (!profile?.access_token) {
      throw new Error('Dropbox not connected');
    }
    
    const integration = { access_token: profile.access_token };

    // Create import job
    const { data: job, error: jobError } = await supabase
      .from('dropbox_import_jobs')
      .insert({
        user_id: user.id,
        status: 'processing',
        total_files: files.length,
        series_name: seriesName,
        files: files.map((f: any) => ({ path: f.path_display, name: f.name, status: 'pending' })),
      })
      .select()
      .single();

    if (jobError) throw jobError;

    // Process files in background
    const processFiles = async () => {
      let processed = 0;
      let failed = 0;
      const results: any[] = [];

      for (const file of files) {
        try {
          console.log(`Processing: ${file.name}`);
          
          // Get temporary link from Dropbox
          const linkResponse = await fetch('https://api.dropboxapi.com/2/files/get_temporary_link', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${integration.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ path: file.path_display || file.path_lower }),
          });

          if (!linkResponse.ok) {
            throw new Error('Failed to get temporary link');
          }

          const { link, metadata } = await linkResponse.json();

          // Extract episode number from filename if present
          const episodeMatch = file.name.match(/(?:ep|episode|e)?\s*(\d+)/i);
          const episodeNumber = episodeMatch ? parseInt(episodeMatch[1]) : null;

          // Create TV content entry
          const { data: content, error: contentError } = await supabase
            .from('tv_content')
            .insert({
              user_id: user.id,
              title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
              video_url: link,
              series_name: seriesName,
              episode_number: episodeNumber,
              source: 'dropbox',
              source_id: file.id,
              duration_seconds: metadata?.media_info?.metadata?.duration ? Math.round(metadata.media_info.metadata.duration / 1000) : null,
              metadata: {
                original_path: file.path_display,
                size: file.size,
                dropbox_id: file.id,
              },
            })
            .select()
            .single();

          if (contentError) throw contentError;

          results.push({ file: file.name, status: 'success', id: content.id });
          processed++;
        } catch (err) {
          console.error(`Failed to process ${file.name}:`, err);
          results.push({ file: file.name, status: 'failed', error: err instanceof Error ? err.message : 'Unknown error' });
          failed++;
        }

        // Update job progress
        await supabase
          .from('dropbox_import_jobs')
          .update({
            processed_files: processed,
            failed_files: failed,
            files: files.map((f: any, i: number) => ({
              path: f.path_display,
              name: f.name,
              status: results[i]?.status || 'pending',
            })),
          })
          .eq('id', job.id);
      }

      // Mark job as complete
      await supabase
        .from('dropbox_import_jobs')
        .update({
          status: failed === files.length ? 'failed' : 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', job.id);

      console.log(`Import complete: ${processed} processed, ${failed} failed`);
    };

    // Run in background using globalThis for Deno Deploy compatibility
    (globalThis as any).EdgeRuntime?.waitUntil?.(processFiles()) || processFiles();

    return new Response(
      JSON.stringify({ 
        success: true, 
        jobId: job.id,
        message: `Started importing ${files.length} videos` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Dropbox import error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
