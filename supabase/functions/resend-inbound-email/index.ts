import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-resend-signature',
};

interface ResendInboundEmailData {
  from: string;
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  headers?: Record<string, string>;
  attachments?: Array<{
    filename: string;
    content: string;
    content_type: string;
  }>;
}

// Resend webhook wraps data in { type, created_at, data }
interface ResendWebhookPayload {
  type?: string;
  created_at?: string;
  data?: ResendInboundEmailData;
  // Also handle direct payload format
  from?: string;
  to?: string | string[];
  subject?: string;
  text?: string;
  html?: string;
  headers?: Record<string, string>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('=== resend-inbound-email webhook received ===');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const rawPayload: ResendWebhookPayload = await req.json();
    console.log('Raw webhook payload type:', rawPayload.type);
    console.log('Raw payload keys:', Object.keys(rawPayload));
    
    // Resend can send data in either wrapped format or direct format
    const payload = rawPayload.data || rawPayload;
    console.log('Inbound email from:', payload.from);
    console.log('To:', payload.to);
    console.log('Subject:', payload.subject);

    // Extract the sender email for matching
    const fromString = payload.from || '';
    const fromMatch = fromString.match(/<([^>]+)>$/);
    const senderEmail = fromMatch ? fromMatch[1] : fromString;
    
    console.log('Sender email:', senderEmail);

    // Try to find the original email by subject line and recipient
    let originalEmail = null;
    if (payload.subject) {
      // Remove Re: / Fwd: prefixes for matching
      const cleanSubject = payload.subject.replace(/^(Re:|Fwd:|RE:|FWD:)\s*/gi, '').trim();
      console.log('Looking for original email with subject:', cleanSubject);
      
      const { data: emailEvents, error: searchError } = await supabase
        .from('email_events')
        .select('*')
        .eq('event_type', 'sent')
        .ilike('email_subject', `%${cleanSubject}%`)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (searchError) {
        console.error('Error searching for original email:', searchError);
      } else {
        console.log('Found', emailEvents?.length || 0, 'potential matches');
        
        // Find the most likely match (to the same recipient who is now replying)
        originalEmail = emailEvents?.find(e => 
          e.to_email?.toLowerCase() === senderEmail.toLowerCase()
        ) || emailEvents?.[0];
        
        if (originalEmail) {
          console.log('Matched original email:', originalEmail.id, 'to:', originalEmail.to_email);
        }
      }
    }

    // Parse sender info
    const fromName = fromMatch ? fromString.split('<')[0].trim() : senderEmail;
    const toAddress = Array.isArray(payload.to) ? payload.to[0] : payload.to;
    
    // Find the user who owns this receiving email address
    let userId: string | null = null;
    
    if (originalEmail) {
      console.log('Found original email:', originalEmail.id, 'from user:', originalEmail.user_id);
      userId = originalEmail.user_id;
      
      // Store the reply in email_replies table
      const { data: reply, error: insertError } = await supabase
        .from('email_replies')
        .insert({
          email_event_id: originalEmail.id,
          from_address: senderEmail,
          from_name: fromName,
          subject: payload.subject,
          snippet: (payload.text || payload.html?.replace(/<[^>]*>/g, '') || '').substring(0, 500),
          received_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('Error inserting reply:', insertError);
      } else {
        console.log('Reply stored successfully:', reply?.id);
      }
    } else {
      console.log('No matching original email found - looking up user by email address');
      
      // Try to find user by the receiving email address in gmail_connections
      const { data: gmailConnection, error: gmailError } = await supabase
        .from('gmail_connections')
        .select('user_id, email_address')
        .eq('email_address', toAddress)
        .maybeSingle();
      
      if (gmailError) {
        console.error('Error looking up gmail connection:', gmailError);
      } else if (gmailConnection) {
        userId = gmailConnection.user_id;
        console.log('Found user from gmail_connections:', userId);
      }
      
      // If not found in gmail_connections, try email_accounts
      if (!userId) {
        const { data: emailAccount, error: emailError } = await supabase
          .from('email_accounts')
          .select('user_id, email_address')
          .eq('email_address', toAddress)
          .maybeSingle();
        
        if (emailError) {
          console.error('Error looking up email account:', emailError);
        } else if (emailAccount) {
          userId = emailAccount.user_id;
          console.log('Found user from email_accounts:', userId);
        }
      }
    }
    
    // Store in inbox_messages if we found a user
    if (userId) {
      const { error: inboxError } = await supabase
        .from('inbox_messages')
        .insert({
          user_id: userId,
          from_address: senderEmail,
          from_name: fromName,
          to_address: toAddress,
          subject: payload.subject,
          snippet: (payload.text || payload.html?.replace(/<[^>]*>/g, '') || '').substring(0, 500),
          body_text: payload.text || '',
          body_html: payload.html || '',
          received_at: new Date().toISOString(),
          is_read: false,
          is_starred: false,
          is_archived: false,
        });
      
      if (inboxError) {
        console.error('Error inserting to inbox_messages:', inboxError);
      } else {
        console.log('Email stored in inbox_messages for user:', userId);
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          matched: !!originalEmail,
          user_id: userId,
          original_email_id: originalEmail?.id
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      console.log('Could not find user for email address:', toAddress);
      return new Response(
        JSON.stringify({ 
          success: true, 
          matched: false,
          message: 'No user found for receiving email address: ' + toAddress
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error: unknown) {
    console.error('Error processing inbound email:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
