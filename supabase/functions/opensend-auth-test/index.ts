import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const opensendApiKey = Deno.env.get('OPENSEND_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify admin auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user is admin
    const { data: isAdmin } = await supabase.rpc('is_lead_intel_admin');
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!opensendApiKey) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'OPENSEND_API_KEY not configured',
        message: 'Please add your OpenSend API key in the Cloud secrets'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request body for workspace_id
    const body = await req.json().catch(() => ({}));
    const workspaceId = body.workspace_id;

    // Test OpenSend API - call their /me or account endpoint
    // OpenSend API docs: https://docs.opensend.com/api
    const opensendResponse = await fetch('https://api.opensend.com/v1/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${opensendApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!opensendResponse.ok) {
      const errorText = await opensendResponse.text();
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'OpenSend API validation failed',
        details: errorText,
        status: opensendResponse.status
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const accountData = await opensendResponse.json();

    // Store provider_account_id in lead_sources if workspace provided
    if (workspaceId && accountData?.id) {
      await supabase
        .from('lead_sources')
        .upsert({
          workspace_id: workspaceId,
          provider: 'opensend',
          provider_account_id: accountData.id,
          is_active: true,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'workspace_id,provider'
        });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'OpenSend API key validated successfully',
      account: {
        id: accountData.id,
        name: accountData.name || accountData.company_name,
        email: accountData.email,
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('OpenSend auth test error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
