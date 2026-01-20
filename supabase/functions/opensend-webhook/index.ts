import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-opensend-signature',
};

// OpenSend webhook signature header name
const SIGNATURE_HEADER = 'x-opensend-signature';

// Rate limit config
const RATE_LIMIT_WINDOW_MS = 60000;
const RATE_LIMIT_MAX_REQUESTS = 100;

async function verifyWebhookSignature(payload: string, signature: string, secret: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(payload)
    );
    
    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    return signature === expectedSignature || signature === `sha256=${expectedSignature}`;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

async function generateDedupeKey(provider: string, eventType: string, occurredAt: string, externalIds: Record<string, any>, url?: string): Promise<string> {
  const data = JSON.stringify({ provider, eventType, occurredAt, externalIds, url });
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function sanitizePayload(payload: any): any {
  // Remove contact fields from payload before storage
  const sanitized = { ...payload };
  const contactFields = ['email', 'phone', 'phone_number', 'address', 'first_name', 'last_name', 'full_name', 'postal_address'];
  
  for (const field of contactFields) {
    if (sanitized[field]) {
      sanitized[`${field}_present`] = true;
      delete sanitized[field];
    }
  }
  
  // Recursively sanitize nested objects
  if (sanitized.contact) {
    sanitized.contact_present = true;
    delete sanitized.contact;
  }
  if (sanitized.visitor) {
    const visitorCopy = { ...sanitized.visitor };
    for (const field of contactFields) {
      if (visitorCopy[field]) {
        visitorCopy[`${field}_present`] = true;
        delete visitorCopy[field];
      }
    }
    sanitized.visitor = visitorCopy;
  }
  
  return sanitized;
}

function hashIdentifier(value: string): string {
  // Simple hash for identifiers when contact_level is disabled
  const encoder = new TextEncoder();
  let hash = 0;
  for (const byte of encoder.encode(value)) {
    hash = ((hash << 5) - hash) + byte;
    hash = hash & hash;
  }
  return `hashed_${Math.abs(hash).toString(16)}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const webhookSecret = Deno.env.get('OPENSEND_WEBHOOK_SECRET');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get raw body for signature verification
    const rawBody = await req.text();
    const signature = req.headers.get(SIGNATURE_HEADER);

    // Verify webhook signature if secret is configured (optional)
    if (webhookSecret && signature) {
      const isValid = await verifyWebhookSignature(rawBody, signature, webhookSecret);
      if (!isValid) {
        console.error('Invalid webhook signature');
        return new Response(JSON.stringify({ error: 'Invalid signature' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }
    // Note: If no webhook secret configured, we accept all requests (rely on obscurity of URL)

    // Parse webhook payload
    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract key fields from OpenSend webhook (matching their actual payload structure)
    // OpenSend fields: email, user_geolocation, source_domain, user_agent, user_ip, 
    // source_url, timestamp, event_data, event_type, md5_email, oir_source
    const eventType = payload.event_type || payload.event || payload.type || 'identity';
    const occurredAt = payload.timestamp || payload.occurred_at || new Date().toISOString();
    const visitorId = payload.visitor_id || payload.anonymous_id || payload.md5_email;
    const pageUrl = payload.source_url || payload.page_url || payload.url;
    const accountId = payload.account_id || payload.workspace_id;
    const sourceDomain = payload.source_domain;
    const userGeolocation = payload.user_geolocation;
    const userAgent = payload.user_agent;
    const userIp = payload.user_ip;
    const md5Email = payload.md5_email;
    const oirSource = payload.oir_source;
    const eventData = payload.event_data;

    // Contact data (email, phone, etc.)
    const contactData = {
      email: payload.email || payload.contact?.email,
      phone: payload.phone || payload.contact?.phone,
      firstName: payload.first_name || payload.contact?.first_name,
      lastName: payload.last_name || payload.contact?.last_name,
      address: payload.address || payload.contact?.address,
    };

    const hasContactData = Boolean(contactData.email || contactData.phone);
    
    console.log('OpenSend webhook received:', { 
      eventType, 
      sourceDomain, 
      hasEmail: !!contactData.email,
      hasMd5Email: !!md5Email,
      userGeolocation 
    });

    // Find workspace by provider_account_id
    let workspaceId: string | null = null;
    let leadSource: any = null;

    if (accountId) {
      const { data: source } = await supabase
        .from('lead_sources')
        .select('*')
        .eq('provider', 'opensend')
        .eq('provider_account_id', accountId)
        .eq('is_active', true)
        .single();
      
      if (source) {
        workspaceId = source.workspace_id;
        leadSource = source;
      }
    }

    if (!workspaceId) {
      // Try to find by URL query param if present
      const url = new URL(req.url);
      workspaceId = url.searchParams.get('workspace_id');
      
      if (workspaceId) {
        const { data: source } = await supabase
          .from('lead_sources')
          .select('*')
          .eq('provider', 'opensend')
          .eq('workspace_id', workspaceId)
          .eq('is_active', true)
          .single();
        leadSource = source;
      }
    }

    // If still no workspace, try to find any active opensend source (single-tenant fallback)
    if (!workspaceId) {
      const { data: source } = await supabase
        .from('lead_sources')
        .select('*')
        .eq('provider', 'opensend')
        .eq('is_active', true)
        .limit(1)
        .single();
      
      if (source) {
        workspaceId = source.workspace_id;
        leadSource = source;
        console.log('Using fallback workspace:', workspaceId);
      }
    }

    if (!workspaceId || !leadSource) {
      console.error('Could not map webhook to workspace');
      return new Response(JSON.stringify({ error: 'Unknown workspace' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const contactLevelEnabled = leadSource.contact_level_enabled === true;

    // Generate deduplication key
    const dedupeKey = await generateDedupeKey(
      'opensend',
      eventType,
      occurredAt,
      { visitor_id: visitorId },
      pageUrl
    );

    // Check for duplicate
    const { data: existingEvent } = await supabase
      .from('lead_events')
      .select('id')
      .eq('dedupe_key', dedupeKey)
      .single();

    if (existingEvent) {
      return new Response(JSON.stringify({ success: true, deduplicated: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Upsert lead_identity
    let identityId: string | null = null;
    const externalId = visitorId || (contactData.email ? hashIdentifier(contactData.email) : null);

    if (externalId) {
      // Build contact_fields based on contact_level_enabled
      let contactFields: any = {};
      if (contactLevelEnabled && hasContactData) {
        contactFields = {
          email: contactData.email,
          phone: contactData.phone,
          first_name: contactData.firstName,
          last_name: contactData.lastName,
          address: contactData.address,
        };
        // Remove nulls
        Object.keys(contactFields).forEach(k => {
          if (!contactFields[k]) delete contactFields[k];
        });
      } else if (hasContactData) {
        // Store only hashed identifiers
        if (contactData.email) {
          contactFields.email_hash = hashIdentifier(contactData.email);
        }
        if (contactData.phone) {
          contactFields.phone_hash = hashIdentifier(contactData.phone);
        }
      }

      const { data: identity, error: identityError } = await supabase
        .from('lead_identities')
        .upsert({
          workspace_id: workspaceId,
          provider: 'opensend',
          identity_type: 'person',
          external_id: externalId,
          display_name: contactLevelEnabled && (contactData.firstName || contactData.lastName) 
            ? `${contactData.firstName || ''} ${contactData.lastName || ''}`.trim()
            : null,
          contact_fields: contactFields,
          last_seen_at: occurredAt,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'workspace_id,provider,external_id'
        })
        .select('id')
        .single();

      if (identity) {
        identityId = identity.id;
      }
    }

    // Create or find lead
    let leadId: string | null = null;
    if (identityId) {
      // Check if lead exists for this identity
      const { data: existingLead } = await supabase
        .from('leads')
        .select('id, intent_score')
        .eq('identity_id', identityId)
        .single();

      if (existingLead) {
        leadId = existingLead.id;
        // Increment intent score
        const newScore = Math.min(100, (existingLead.intent_score || 0) + 5);
        await supabase
          .from('leads')
          .update({ 
            intent_score: newScore,
            last_activity_at: occurredAt,
            updated_at: new Date().toISOString()
          })
          .eq('id', leadId);
      } else {
        // Create new lead
        const { data: newLead } = await supabase
          .from('leads')
          .insert({
            workspace_id: workspaceId,
            identity_id: identityId,
            intent_score: 10,
            status: 'new',
            first_seen_at: occurredAt,
            last_activity_at: occurredAt,
          })
          .select('id')
          .single();
        
        if (newLead) {
          leadId = newLead.id;
        }
      }
    }

    // Insert lead_event with sanitized payload
    const sanitizedPayload = sanitizePayload(payload);
    
    const { error: eventError } = await supabase
      .from('lead_events')
      .insert({
        workspace_id: workspaceId,
        identity_id: identityId,
        lead_id: leadId,
        provider: 'opensend',
        event_type: eventType,
        occurred_at: occurredAt,
        page_url: pageUrl,
        dedupe_key: dedupeKey,
        payload: sanitizedPayload,
      });

    if (eventError) {
      console.error('Error inserting lead event:', eventError);
    }

    // Update webhook health on lead_source
    await supabase
      .from('lead_sources')
      .update({
        webhook_health: {
          last_received_at: new Date().toISOString(),
          last_event_type: eventType,
          last_error: null,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', leadSource.id);

    // Bill credits
    const creditsLedgerEntries: any[] = [];

    // 1 credit for ingested event
    creditsLedgerEntries.push({
      workspace_id: workspaceId,
      event_type: 'opensend_webhook_event_ingested',
      units: 1,
      provider: 'opensend',
      lead_id: leadId,
      occurred_at: occurredAt,
    });

    // 12 credits for first contact match
    if (contactLevelEnabled && hasContactData && identityId) {
      // Check if this is first contact resolution
      const { count } = await supabase
        .from('credits_ledger')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
        .eq('event_type', 'opensend_contact_match')
        .eq('identity_id', identityId);
      
      if (count === 0) {
        creditsLedgerEntries.push({
          workspace_id: workspaceId,
          event_type: 'opensend_contact_match',
          units: 12,
          provider: 'opensend',
          lead_id: leadId,
          identity_id: identityId,
          occurred_at: occurredAt,
        });
      }
    }

    // Insert credit entries
    for (const entry of creditsLedgerEntries) {
      const ledgerKey = await generateDedupeKey(
        entry.workspace_id,
        entry.event_type,
        entry.provider,
        { lead_id: entry.lead_id, identity_id: entry.identity_id },
        entry.occurred_at
      );
      
      await supabase
        .from('credits_ledger')
        .upsert({
          ...entry,
          ledger_key: ledgerKey,
        }, {
          onConflict: 'ledger_key'
        });
    }

    return new Response(JSON.stringify({ 
      success: true,
      event_id: dedupeKey,
      lead_id: leadId,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('OpenSend webhook error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
