import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    console.log('Keys vault function called');
    console.log('Supabase URL configured:', !!supabaseUrl);
    console.log('Auth header present:', !!req.headers.get('Authorization'));
    
    const supabaseClient = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    console.log('User check:', user?.email, 'Error:', userError?.message);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized', details: userError?.message }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify super_admin role
    const { data: roles, error: rolesError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);
    
    console.log('Roles check:', roles, 'Error:', rolesError?.message);
    
    const isSuperAdmin = roles?.some(r => r.role === 'super_admin');
    if (!isSuperAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden - super_admin role required', user: user.email, roles: roles }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, code, newCode, keyName, keyValue } = await req.json();

    // Verify access code
    if (action !== 'setup-code' && action !== 'request-recovery') {
      const { data: storedCode } = await supabaseClient
        .from('vault_access_codes')
        .select('code_hash')
        .eq('user_id', user.id)
        .single();

      if (!storedCode) {
        return new Response(JSON.stringify({ error: 'No access code set' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const encoder = new TextEncoder();
      const data = encoder.encode(code);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const codeHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      if (codeHash !== storedCode.code_hash) {
        await supabaseClient.from('keys_vault_audit').insert({
          user_id: user.id,
          action: 'access_denied',
          metadata: { reason: 'Invalid code' }
        });
        
        return new Response(JSON.stringify({ error: 'Invalid access code' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Handle actions
    switch (action) {
      case 'setup-code': {
        const encoder = new TextEncoder();
        const data = encoder.encode(newCode);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const codeHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        await supabaseClient.from('vault_access_codes').upsert({
          user_id: user.id,
          code_hash: codeHash,
          updated_at: new Date().toISOString()
        });

        await supabaseClient.from('keys_vault_audit').insert({
          user_id: user.id,
          action: 'code_setup',
          metadata: { timestamp: new Date().toISOString() }
        });

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'request-recovery': {
        // Generate a new random code
        const recoveryCode = Array.from(crypto.getRandomValues(new Uint8Array(4)))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('')
          .toUpperCase();

        const encoder = new TextEncoder();
        const data = encoder.encode(recoveryCode);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const codeHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        await supabaseClient.from('vault_access_codes').upsert({
          user_id: user.id,
          code_hash: codeHash,
          updated_at: new Date().toISOString()
        });

        await supabaseClient.from('keys_vault_audit').insert({
          user_id: user.id,
          action: 'code_recovery',
          metadata: { timestamp: new Date().toISOString() }
        });

        return new Response(JSON.stringify({ recoveryCode }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get-keys': {
        const { data: keys } = await supabaseClient
          .from('keys_vault')
          .select('*')
          .order('key_name');

        await supabaseClient.from('keys_vault_audit').insert({
          user_id: user.id,
          action: 'view_keys',
          metadata: { count: keys?.length || 0 }
        });

        return new Response(JSON.stringify({ keys }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'update-key': {
        // Update in Supabase secrets (this would need admin service role)
        // For now, just track metadata
        await supabaseClient
          .from('keys_vault')
          .update({
            is_configured: true,
            last_updated_at: new Date().toISOString(),
            last_updated_by: user.id
          })
          .eq('key_name', keyName);

        await supabaseClient.from('keys_vault_audit').insert({
          user_id: user.id,
          action: 'update_key',
          key_name: keyName,
          metadata: { timestamp: new Date().toISOString() }
        });

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get-audit-log': {
        const { data: logs } = await supabaseClient
          .from('keys_vault_audit')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        return new Response(JSON.stringify({ logs }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('Keys vault error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});