import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encryptToken, isTokenEncrypted } from "../_shared/token-encryption.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * One-time migration script to encrypt existing plaintext OAuth tokens.
 * This function is idempotent - safe to run multiple times.
 * Only processes tokens that are not already encrypted.
 */
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[migrate-encrypt-tokens] Starting token encryption migration');

    // Verify admin authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[migrate-encrypt-tokens] No authorization header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user is admin
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error('[migrate-encrypt-tokens] Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: roles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const userRoles = roles?.map(r => r.role) || [];
    const isAdmin = userRoles.some(r => ['admin', 'super_admin'].includes(r));

    if (!isAdmin) {
      console.error('[migrate-encrypt-tokens] User is not admin:', user.id);
      return new Response(
        JSON.stringify({ error: 'Forbidden - admin only' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[migrate-encrypt-tokens] Admin verified:', user.id);

    // Use service role for actual migration
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const results: Record<string, { migrated: number; skipped: number; errors: number }> = {};

    // Table configurations
    const tables = [
      { name: 'email_accounts', tokenColumns: ['access_token', 'refresh_token'] },
      { name: 'calendar_connections', tokenColumns: ['access_token', 'refresh_token'] },
      { name: 'zoom_connections', tokenColumns: ['access_token', 'refresh_token'] },
      { name: 'microsoft_connections', tokenColumns: ['access_token', 'refresh_token'] },
      { name: 'social_media_profiles', tokenColumns: ['access_token', 'refresh_token'] },
    ];

    for (const table of tables) {
      console.log(`[migrate-encrypt-tokens] Processing table: ${table.name}`);
      results[table.name] = { migrated: 0, skipped: 0, errors: 0 };

      // Fetch all rows
      const { data: rows, error: fetchError } = await supabaseAdmin
        .from(table.name)
        .select('id, ' + table.tokenColumns.join(', '));

      if (fetchError) {
        console.error(`[migrate-encrypt-tokens] Error fetching ${table.name}:`, fetchError);
        results[table.name].errors++;
        continue;
      }

      if (!rows || !Array.isArray(rows) || rows.length === 0) {
        console.log(`[migrate-encrypt-tokens] No rows in ${table.name}`);
        continue;
      }

      console.log(`[migrate-encrypt-tokens] Found ${rows.length} rows in ${table.name}`);

      for (const row of rows) {
        // Cast to any to access dynamic properties
        const rowData = row as unknown as Record<string, string | null>;
        const rowId = rowData.id;
        
        try {
          const updates: Record<string, string> = {};
          let needsUpdate = false;

          for (const col of table.tokenColumns) {
            const token = rowData[col] as string | null;
            if (token && !isTokenEncrypted(token)) {
              const encrypted = await encryptToken(token);
              updates[col] = encrypted;
              needsUpdate = true;
            }
          }

          if (needsUpdate) {
            const { error: updateError } = await supabaseAdmin
              .from(table.name)
              .update(updates)
              .eq('id', rowId);

            if (updateError) {
              console.error(`[migrate-encrypt-tokens] Error updating ${table.name} row ${rowId}:`, updateError);
              results[table.name].errors++;
            } else {
              results[table.name].migrated++;
            }
          } else {
            results[table.name].skipped++;
          }
        } catch (rowError) {
          console.error(`[migrate-encrypt-tokens] Error processing ${table.name} row ${rowId}:`, rowError);
          results[table.name].errors++;
        }
      }

      console.log(`[migrate-encrypt-tokens] ${table.name} complete:`, results[table.name]);
    }

    console.log('[migrate-encrypt-tokens] Migration complete:', results);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Token encryption migration complete',
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[migrate-encrypt-tokens] Unhandled error:', error);
    return new Response(
      JSON.stringify({ error: 'Migration failed', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
