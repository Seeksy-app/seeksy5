import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// TEMPORARY BOOTSTRAP FUNCTION - DELETE AFTER USE
// This assigns super_admin role to specific email addresses
const ALLOWED_ADMIN_EMAILS = [
  'admin@seeksy.dev',
  'appletonab@gmail.com',
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the user from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create a client with user's auth
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Could not get user', details: userError?.message }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Bootstrap request from:', user.email);

    // Check if email is in allowed list
    if (!ALLOWED_ADMIN_EMAILS.includes(user.email?.toLowerCase() || '')) {
      return new Response(JSON.stringify({ 
        error: 'Email not authorized for bootstrap',
        email: user.email 
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create profile if it doesn't exist (using service role)
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .upsert({
        id: user.id,
        full_name: user.email?.split('@')[0] || 'Admin',
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (profileError) {
      console.log('Profile upsert note:', profileError.message);
    }

    // Assign super_admin role (using service role)
    const { error: roleError } = await supabaseClient
      .from('user_roles')
      .upsert({
        user_id: user.id,
        role: 'super_admin'
      }, { onConflict: 'user_id,role' });

    if (roleError) {
      console.error('Role assignment error:', roleError);
      return new Response(JSON.stringify({ 
        error: 'Failed to assign role', 
        details: roleError.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Successfully bootstrapped super_admin for:', user.email);

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Super admin role assigned to ${user.email}`,
      user_id: user.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Bootstrap error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
