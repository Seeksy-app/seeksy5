import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CaptureRequest {
  url: string;
  pageName: string;
  category: 'advertiser-tools' | 'creator-tools' | 'internal' | 'external' | 'onboarding';
  description?: string;
  healthCheck?: boolean; // If true, just test API connectivity
}

// Map HTTP status codes to user-friendly messages
function mapErrorToMessage(status: number, body: string): { code: string; message: string } {
  switch (status) {
    case 401:
    case 403:
      return { code: 'AUTH_ERROR', message: 'Invalid ScreenshotOne API key or access denied.' };
    case 429:
      return { code: 'RATE_LIMIT', message: 'Rate limit reached, try again later.' };
    case 400:
      return { code: 'BAD_REQUEST', message: `Invalid request: ${body}` };
    case 500:
    case 502:
    case 503:
    case 504:
      return { code: 'PROVIDER_ERROR', message: 'Screenshot provider is temporarily unavailable.' };
    default:
      return { code: 'UNKNOWN_ERROR', message: `ScreenshotOne API error (HTTP ${status}): ${body}` };
  }
}

serve(async (req) => {
  // Boot diagnostics
  console.log('[capture-screenshot] Function invoked');
  console.log('[capture-screenshot] SCREENSHOTONE_API_KEY present:', !!Deno.env.get('SCREENSHOTONE_API_KEY'));
  console.log('[capture-screenshot] SUPABASE_URL present:', !!Deno.env.get('SUPABASE_URL'));

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check Authorization header first
    const authHeader = req.headers.get('Authorization');
    console.log('[capture-screenshot] Authorization header present:', !!authHeader);
    
    if (!authHeader) {
      console.error('[capture-screenshot] No Authorization header provided');
      return new Response(JSON.stringify({ 
        error: 'Authorization header required. Please ensure you are logged in.', 
        code: 'UNAUTHORIZED' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error('[capture-screenshot] Auth error:', userError?.message || 'No user found');
      return new Response(JSON.stringify({ 
        error: 'Session expired or invalid. Please log in again.', 
        code: 'UNAUTHORIZED' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.log('[capture-screenshot] Authenticated user:', user.id, 'email:', user.email);

    // Verify admin role
    const { data: roles, error: rolesError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);
    
    console.log('[capture-screenshot] Roles query result:', { 
      roles, 
      error: rolesError?.message,
      userId: user.id 
    });
    
    const isAdmin = roles?.some(r => r.role === 'admin' || r.role === 'super_admin');
    if (!isAdmin) {
      console.error('[capture-screenshot] Not admin:', { 
        userId: user.id, 
        email: user.email,
        rolesFound: roles,
        rolesError: rolesError?.message
      });
      return new Response(JSON.stringify({ 
        error: 'Admin access required. Your roles: ' + (roles?.map(r => r.role).join(', ') || 'none'),
        code: 'FORBIDDEN' 
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.log('[capture-screenshot] Admin verified, proceeding...');

    const body = await req.json();
    const { url, pageName, category, description, healthCheck }: CaptureRequest = body;

    console.log('[capture-screenshot] Request params:', { url, pageName, category, healthCheck });

    // Health check mode - just test API connectivity
    if (healthCheck) {
      const screenshotOneKey = Deno.env.get('SCREENSHOTONE_API_KEY');
      if (!screenshotOneKey) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'ScreenshotOne API key not configured',
          code: 'MISSING_API_KEY'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Test with example.com
      const testParams = new URLSearchParams({
        access_key: screenshotOneKey,
        url: 'https://example.com',
        format: 'jpeg',
        viewport_width: '800',
        viewport_height: '600',
        device_scale_factor: '1',
        full_page: 'false',
      });

      console.log('[capture-screenshot] Health check - calling ScreenshotOne API');
      const startTime = Date.now();
      
      const testResponse = await fetch(`https://api.screenshotone.com/take?${testParams.toString()}`);
      const elapsed = Date.now() - startTime;
      
      console.log('[capture-screenshot] Health check response:', {
        status: testResponse.status,
        statusText: testResponse.statusText,
        elapsed: `${elapsed}ms`
      });

      if (!testResponse.ok) {
        const errorText = await testResponse.text();
        console.error('[capture-screenshot] Health check failed:', errorText);
        const mapped = mapErrorToMessage(testResponse.status, errorText);
        return new Response(JSON.stringify({ 
          success: false, 
          error: mapped.message,
          code: mapped.code,
          status: testResponse.status,
          rawError: errorText
        }), {
          status: 200, // Return 200 so frontend can display the error details
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const imageSize = (await testResponse.arrayBuffer()).byteLength;
      console.log('[capture-screenshot] Health check success, image size:', imageSize);

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'ScreenshotOne API is working correctly',
        elapsed: `${elapsed}ms`,
        imageSize: `${imageSize} bytes`
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Normal capture mode
    if (!url || !pageName || !category) {
      return new Response(JSON.stringify({ error: 'Missing required fields', code: 'MISSING_FIELDS' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Call ScreenshotOne API
    const screenshotOneKey = Deno.env.get('SCREENSHOTONE_API_KEY');
    if (!screenshotOneKey) {
      console.error('[capture-screenshot] SCREENSHOTONE_API_KEY not found in environment');
      return new Response(JSON.stringify({ 
        error: 'ScreenshotOne API key not configured', 
        code: 'MISSING_API_KEY' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const screenshotParams = new URLSearchParams({
      access_key: screenshotOneKey,
      url: url,
      format: 'jpeg',
      viewport_width: '1920',
      viewport_height: '1080',
      device_scale_factor: '1',
      full_page: 'false',
      block_ads: 'true',
      block_cookie_banners: 'true',
      block_trackers: 'true',
      cache: 'false',
    });

    console.log('[capture-screenshot] Calling ScreenshotOne API for:', url);
    console.log('[capture-screenshot] API key length:', screenshotOneKey?.length);
    
    const startTime = Date.now();
    const screenshotResponse = await fetch(
      `https://api.screenshotone.com/take?${screenshotParams.toString()}`
    );
    const elapsed = Date.now() - startTime;

    console.log('[capture-screenshot] ScreenshotOne response:', {
      status: screenshotResponse.status,
      statusText: screenshotResponse.statusText,
      elapsed: `${elapsed}ms`
    });

    if (!screenshotResponse.ok) {
      const errorText = await screenshotResponse.text();
      console.error('[capture-screenshot] ScreenshotOne API error:', {
        status: screenshotResponse.status,
        statusText: screenshotResponse.statusText,
        body: errorText,
        url: url
      });
      
      const mapped = mapErrorToMessage(screenshotResponse.status, errorText);
      return new Response(JSON.stringify({ 
        error: mapped.message, 
        code: mapped.code,
        status: screenshotResponse.status 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const imageBuffer = await screenshotResponse.arrayBuffer();
    console.log('[capture-screenshot] Screenshot captured, size:', imageBuffer.byteLength, 'bytes');

    // Generate file path
    const timestamp = new Date().getTime();
    const sanitizedPageName = pageName.replace(/[^a-zA-Z0-9-_]/g, '_').toLowerCase();
    const fileName = `${sanitizedPageName}_${timestamp}.jpeg`;
    const storagePath = `${category}/${fileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('ui-screenshots')
      .upload(storagePath, imageBuffer, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (uploadError) {
      console.error('[capture-screenshot] Storage upload error:', uploadError);
      return new Response(JSON.stringify({ 
        error: `Storage upload failed: ${uploadError.message}`,
        code: 'STORAGE_ERROR'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('[capture-screenshot] Screenshot uploaded to storage:', storagePath);

    // Get public URL
    const { data: { publicUrl } } = supabaseClient.storage
      .from('ui-screenshots')
      .getPublicUrl(storagePath);

    // Save metadata to database
    const { data: dbData, error: dbError } = await supabaseClient
      .from('ui_screenshots')
      .insert({
        page_name: pageName,
        url: url,
        category: category,
        screenshot_path: storagePath,
        created_by: user.id,
        metadata: {
          description: description || null,
          public_url: publicUrl,
        },
      })
      .select()
      .single();

    if (dbError) {
      console.error('[capture-screenshot] Database insert error:', dbError);
      return new Response(JSON.stringify({ 
        error: `Database insert failed: ${dbError.message}`,
        code: 'DATABASE_ERROR'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('[capture-screenshot] Screenshot metadata saved to database');

    return new Response(
      JSON.stringify({
        success: true,
        screenshot: {
          id: dbData.id,
          page_name: dbData.page_name,
          url: dbData.url,
          category: dbData.category,
          screenshot_path: dbData.screenshot_path,
          public_url: publicUrl,
          created_at: dbData.created_at,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[capture-screenshot] Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage, code: 'UNEXPECTED_ERROR' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
