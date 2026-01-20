import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_BUSINESS_CLIENT_ID');
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_BUSINESS_CLIENT_SECRET');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Allowed write actions (blocklist: UPDATE_NAME, UPDATE_ADDRESS, UPDATE_PRIMARY_CATEGORY)
const ALLOWED_ACTIONS = ['REPLY_REVIEW', 'UPDATE_HOURS', 'UPDATE_DESCRIPTION'];

// Refresh access token if expired
async function refreshAccessToken(connection: any, supabase: any): Promise<string | null> {
  if (!connection.refresh_token) {
    return null;
  }

  const expiresAt = new Date(connection.expires_at);
  const now = new Date();
  
  if (expiresAt > now) {
    return connection.access_token;
  }

  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID!,
        client_secret: GOOGLE_CLIENT_SECRET!,
        refresh_token: connection.refresh_token,
        grant_type: 'refresh_token',
      }),
    });

    const data = await response.json();
    if (data.error) return null;

    const newExpiresAt = new Date(Date.now() + (data.expires_in * 1000)).toISOString();
    await supabase
      .from('gbp_connections')
      .update({ access_token: data.access_token, expires_at: newExpiresAt, status: 'connected' })
      .eq('id', connection.id);

    return data.access_token;
  } catch {
    return null;
  }
}

// Reply to a review
async function replyToReview(accessToken: string, reviewName: string, replyText: string): Promise<any> {
  // Extract location path from review name (e.g., "accounts/123/locations/456/reviews/789")
  const locationPath = reviewName.replace(/\/reviews\/.*$/, '');
  const url = `https://mybusiness.googleapis.com/v4/${reviewName}/reply`;
  
  console.log('Replying to review:', url);

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ comment: replyText }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to reply: ${response.status} - ${error}`);
  }

  return await response.json();
}

// Update business hours
async function updateHours(accessToken: string, locationName: string, regularHours: any): Promise<any> {
  const url = `https://mybusinessbusinessinformation.googleapis.com/v1/${locationName}?updateMask=regularHours`;
  
  console.log('Updating hours:', url);

  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ regularHours }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to update hours: ${response.status} - ${error}`);
  }

  return await response.json();
}

// Update business description
async function updateDescription(accessToken: string, locationName: string, description: string): Promise<any> {
  const url = `https://mybusinessbusinessinformation.googleapis.com/v1/${locationName}?updateMask=profile.description`;
  
  console.log('Updating description:', url);

  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ profile: { description } }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to update description: ${response.status} - ${error}`);
  }

  return await response.json();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

  try {
    const { action_type, connection_id, location_id, payload, actor_user_id } = await req.json();

    // Validate action type
    if (!ALLOWED_ACTIONS.includes(action_type)) {
      return new Response(JSON.stringify({ 
        error: `Action "${action_type}" is not allowed. Allowed actions: ${ALLOWED_ACTIONS.join(', ')}` 
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if write mode is enabled
    const { data: settings } = await supabase
      .from('gbp_admin_settings')
      .select('write_mode_enabled')
      .single();

    if (!settings?.write_mode_enabled) {
      return new Response(JSON.stringify({ 
        error: 'Write mode is disabled. Enable write mode in GBP settings to make changes.',
        write_mode_required: true 
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get the connection
    const { data: connection, error: connError } = await supabase
      .from('gbp_connections')
      .select('*')
      .eq('id', connection_id)
      .single();

    if (connError || !connection) {
      return new Response(JSON.stringify({ error: 'Connection not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get valid access token
    const accessToken = await refreshAccessToken(connection, supabase);
    if (!accessToken) {
      return new Response(JSON.stringify({ 
        error: 'Unable to get valid access token. Please reconnect.',
        needsReconnect: true 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let result: any;
    let targetResource = '';

    // Execute the action
    switch (action_type) {
      case 'REPLY_REVIEW': {
        const { review_name, reply_text } = payload;
        if (!review_name || !reply_text) {
          throw new Error('review_name and reply_text are required');
        }
        targetResource = review_name;
        result = await replyToReview(accessToken, review_name, reply_text);
        
        // Update local review record
        await supabase
          .from('gbp_reviews')
          .update({
            has_reply: true,
            reply_comment: reply_text,
            reply_update_time: new Date().toISOString(),
          })
          .eq('google_review_name', review_name);
        break;
      }

      case 'UPDATE_HOURS': {
        const { location_name, regular_hours } = payload;
        if (!location_name || !regular_hours) {
          throw new Error('location_name and regular_hours are required');
        }
        targetResource = location_name;
        result = await updateHours(accessToken, location_name, regular_hours);
        
        // Update local location record
        await supabase
          .from('gbp_locations')
          .update({ regular_hours_json: regular_hours })
          .eq('google_location_name', location_name);
        break;
      }

      case 'UPDATE_DESCRIPTION': {
        const { location_name, description } = payload;
        if (!location_name || typeof description !== 'string') {
          throw new Error('location_name and description are required');
        }
        targetResource = location_name;
        result = await updateDescription(accessToken, location_name, description);
        
        // Update local location record
        await supabase
          .from('gbp_locations')
          .update({ description })
          .eq('google_location_name', location_name);
        break;
      }

      default:
        throw new Error('Unknown action type');
    }

    const durationMs = Date.now() - startTime;

    // Log the write in audit log
    await supabase
      .from('gbp_audit_log')
      .insert({
        actor_user_id,
        connection_id,
        location_id,
        action_type,
        target_google_resource: targetResource,
        request_json: payload,
        response_json: result,
        status: 'success',
        duration_ms: durationMs,
      });

    return new Response(JSON.stringify({
      success: true,
      result,
      duration_ms: durationMs,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('GBP Write error:', errorMessage);

    // Log the error
    try {
      const body = await req.clone().json();
      await supabase
        .from('gbp_audit_log')
        .insert({
          actor_user_id: body.actor_user_id,
          connection_id: body.connection_id,
          location_id: body.location_id,
          action_type: body.action_type,
          request_json: body.payload,
          status: 'error',
          error_message: errorMessage,
          duration_ms: Date.now() - startTime,
        });
    } catch {
      // Ignore logging errors
    }

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
