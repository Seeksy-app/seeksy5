import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encryptToken, isTokenEncrypted } from "../_shared/token-encryption.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin access
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user is admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const isAdmin = roles?.some(r => r.role === 'admin' || r.role === 'super_admin');
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all social media profiles with tokens
    const { data: profiles, error: fetchError } = await supabase
      .from('social_media_profiles')
      .select('id, platform, access_token, refresh_token')
      .or('access_token.not.is.null,refresh_token.not.is.null');

    if (fetchError) {
      throw fetchError;
    }

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const profile of profiles || []) {
      try {
        const updates: Record<string, string> = {};
        
        // Check and encrypt access_token if not already encrypted
        if (profile.access_token && !isTokenEncrypted(profile.access_token)) {
          updates.access_token = await encryptToken(profile.access_token);
        }
        
        // Check and encrypt refresh_token if not already encrypted
        if (profile.refresh_token && !isTokenEncrypted(profile.refresh_token)) {
          updates.refresh_token = await encryptToken(profile.refresh_token);
        }

        if (Object.keys(updates).length > 0) {
          const { error: updateError } = await supabase
            .from('social_media_profiles')
            .update(updates)
            .eq('id', profile.id);

          if (updateError) {
            console.error(`Failed to migrate profile ${profile.id}:`, updateError);
            errors++;
          } else {
            console.log(`Migrated tokens for ${profile.platform} profile ${profile.id}`);
            migrated++;
          }
        } else {
          skipped++;
        }
      } catch (err) {
        console.error(`Error processing profile ${profile.id}:`, err);
        errors++;
      }
    }

    // Log the migration as a security event
    await supabase.from('security_alerts').insert({
      alert_type: 'token_migration',
      severity: 'low',
      title: 'OAuth Token Encryption Migration Completed',
      description: `Migrated ${migrated} profiles, skipped ${skipped} already encrypted, ${errors} errors`,
      metadata: { migrated, skipped, errors, triggered_by: user.id }
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        migrated, 
        skipped, 
        errors,
        message: `Migration complete: ${migrated} encrypted, ${skipped} already encrypted, ${errors} errors`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Migration error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
