import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple in-memory rate limiting (resets on function cold start)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 5; // max 5 requests per minute per IP
const RATE_WINDOW = 60000; // 1 minute in ms

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return false;
  }
  
  if (record.count >= RATE_LIMIT) {
    return true;
  }
  
  record.count++;
  return false;
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get client IP for rate limiting
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('cf-connecting-ip') || 
                     'unknown';
    
    // Rate limit check
    if (isRateLimited(clientIP)) {
      console.log(`Rate limited IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ success: false, error: 'Too many requests. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { email, source = 'website', name, cta_id } = await req.json();

    // Validate email
    if (!email || typeof email !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'Email is required.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();

    if (!isValidEmail(trimmedEmail)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid email format.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Basic bot detection - reject obvious honeypot patterns
    if (trimmedEmail.includes('test@test') || trimmedEmail.endsWith('.test')) {
      console.log(`Rejected suspicious email: ${trimmedEmail}`);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid email.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role key (bypasses RLS)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // STEP 1: Resolve tenant_id from CTA (if provided)
    let resolvedTenantId: string | null = null;
    let autoLists: string[] = [];

    if (cta_id) {
      console.log(`Looking up CTA: ${cta_id}`);
      const { data: cta, error: ctaError } = await supabase
        .from('cta_definitions')
        .select('tenant_id, auto_lists, is_active')
        .eq('id', cta_id)
        .single();

      if (ctaError) {
        console.warn(`CTA lookup failed: ${ctaError.message}`);
      } else if (cta && cta.is_active) {
        resolvedTenantId = cta.tenant_id;
        autoLists = cta.auto_lists || [];
        console.log(`CTA found: tenant_id=${resolvedTenantId}, auto_lists=${JSON.stringify(autoLists)}`);
      } else if (cta && !cta.is_active) {
        console.warn(`CTA ${cta_id} is inactive`);
      }
    }

    // STEP 2: Fallback to seeksy_platform tenant if no CTA or CTA has no tenant
    if (!resolvedTenantId) {
      console.log('No tenant from CTA, looking up seeksy_platform tenant...');
      const { data: platformTenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('tenant_type', 'seeksy_platform')
        .limit(1)
        .single();
      
      if (platformTenant) {
        resolvedTenantId = platformTenant.id;
        console.log(`Using platform tenant: ${resolvedTenantId}`);
      } else {
        console.warn('No seeksy_platform tenant found, proceeding without tenant_id');
      }
    }

    // STEP 3: Upsert subscriber with tenant_id
    const subscriberData: Record<string, unknown> = { 
      email: trimmedEmail, 
      name: name || null,
      source,
      status: 'active',
      subscribed_at: new Date().toISOString()
    };

    if (resolvedTenantId) {
      subscriberData.tenant_id = resolvedTenantId;
    }

    const { data: subscriber, error: upsertError } = await supabase
      .from('newsletter_subscribers')
      .upsert(subscriberData, { onConflict: 'email' })
      .select('id')
      .single();

    if (upsertError) {
      console.error('Supabase upsert error:', upsertError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to subscribe. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const subscriberId = subscriber?.id;
    console.log(`Subscriber upserted: ${subscriberId}`);

    // STEP 4: Attach to auto_lists from CTA (if any)
    if (subscriberId && autoLists.length > 0 && resolvedTenantId) {
      console.log(`Attaching subscriber to auto_lists: ${JSON.stringify(autoLists)}`);
      
      // Fetch list IDs by slug within the same tenant
      const { data: lists, error: listsError } = await supabase
        .from('subscriber_lists')
        .select('id, slug')
        .eq('tenant_id', resolvedTenantId)
        .in('slug', autoLists);

      if (listsError) {
        console.warn(`Lists lookup failed: ${listsError.message}`);
      } else if (lists && lists.length > 0) {
        const memberships = lists.map(list => ({
          subscriber_id: subscriberId,
          list_id: list.id,
          tenant_id: resolvedTenantId
        }));

        const { error: membershipError } = await supabase
          .from('subscriber_list_members')
          .upsert(memberships, { onConflict: 'subscriber_id,list_id' });

        if (membershipError) {
          console.warn(`List membership upsert failed: ${membershipError.message}`);
        } else {
          console.log(`Added subscriber to ${lists.length} lists`);
        }
      }
    }

    console.log(`Successfully subscribed: ${trimmedEmail} from ${source}, tenant: ${resolvedTenantId || 'none'}`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        subscriber_id: subscriberId,
        tenant_id: resolvedTenantId 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Subscribe newsletter error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'An unexpected error occurred.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
