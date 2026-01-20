import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { decryptToken } from "../_shared/token-encryption.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  payload: {
    headers: Array<{ name: string; value: string }>;
    mimeType: string;
    body?: { data?: string; size?: number };
    parts?: Array<{
      mimeType: string;
      body?: { data?: string; size?: number };
    }>;
  };
  internalDate: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify user authentication
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[sync-gmail-inbox] Starting inbox sync for user: ${user.id}`);

    // Get user's Gmail account(s) from email_accounts table
    const { data: emailAccounts, error: accountsError } = await supabaseClient
      .from('email_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'gmail')
      .not('access_token', 'is', null);

    if (accountsError) {
      console.error('[sync-gmail-inbox] Error fetching email accounts:', accountsError);
      throw accountsError;
    }

    if (!emailAccounts || emailAccounts.length === 0) {
      // Try gmail_connections as fallback
      const { data: gmailConnections } = await supabaseClient
        .from('gmail_connections')
        .select('*')
        .eq('user_id', user.id);

      if (!gmailConnections || gmailConnections.length === 0) {
        return new Response(
          JSON.stringify({ message: 'No Gmail accounts connected' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Use gmail_connections
      console.log(`[sync-gmail-inbox] Using ${gmailConnections.length} gmail_connections`);
      
      let totalEmails = 0;
      let newEmails = 0;

      for (const connection of gmailConnections) {
        const result = await syncGmailAccount(
          supabaseClient,
          user.id,
          connection.email,
          connection.access_token,
          connection.refresh_token
        );
        totalEmails += result.totalEmails;
        newEmails += result.newEmails;
      }

      return new Response(
        JSON.stringify({ success: true, totalEmails, newEmails }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use email_accounts
    console.log(`[sync-gmail-inbox] Using ${emailAccounts.length} email_accounts`);
    
    let totalEmails = 0;
    let newEmails = 0;

    for (const account of emailAccounts) {
      // Decrypt access token
      const accessToken = await decryptToken(account.access_token);
      
      const result = await syncGmailAccount(
        supabaseClient,
        user.id,
        account.email_address,
        accessToken,
        account.refresh_token ? await decryptToken(account.refresh_token) : null
      );
      totalEmails += result.totalEmails;
      newEmails += result.newEmails;
    }

    return new Response(
      JSON.stringify({
        success: true,
        totalEmails,
        newEmails,
        message: `Synced ${newEmails} new emails from ${emailAccounts.length} accounts`,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[sync-gmail-inbox] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function syncGmailAccount(
  supabase: any,
  userId: string,
  emailAddress: string,
  accessToken: string,
  refreshToken: string | null
): Promise<{ totalEmails: number; newEmails: number }> {
  console.log(`[sync-gmail-inbox] Syncing account: ${emailAddress}`);

  let totalEmails = 0;
  let newEmails = 0;

  try {
    // Fetch recent inbox messages (last 50)
    const listUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=50&labelIds=INBOX`;
    
    const listResponse = await fetch(listUrl, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    if (!listResponse.ok) {
      const errorText = await listResponse.text();
      console.error(`[sync-gmail-inbox] Gmail API list failed: ${listResponse.status}`, errorText);
      
      // Token might be expired, try to refresh if we have a refresh token
      if (listResponse.status === 401 && refreshToken) {
        console.log('[sync-gmail-inbox] Token expired, would need to refresh');
      }
      return { totalEmails: 0, newEmails: 0 };
    }

    const listData = await listResponse.json();
    const messages = listData.messages || [];
    totalEmails = messages.length;

    console.log(`[sync-gmail-inbox] Found ${messages.length} messages in inbox`);

    // Fetch details for each message
    for (const msg of messages) {
      try {
        // Check if we already have this message
        const { data: existing } = await supabase
          .from('inbox_messages')
          .select('id')
          .eq('gmail_message_id', msg.id)
          .single();

        if (existing) {
          console.log(`[sync-gmail-inbox] Message ${msg.id} already exists, skipping`);
          continue;
        }

        // Fetch full message
        const messageUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`;
        const messageResponse = await fetch(messageUrl, {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        });

        if (!messageResponse.ok) {
          console.error(`[sync-gmail-inbox] Failed to fetch message ${msg.id}`);
          continue;
        }

        const messageData: GmailMessage = await messageResponse.json();
        const headers = messageData.payload.headers;

        // Extract headers
        const fromHeader = headers.find((h) => h.name.toLowerCase() === 'from')?.value || '';
        const toHeader = headers.find((h) => h.name.toLowerCase() === 'to')?.value || '';
        const subjectHeader = headers.find((h) => h.name.toLowerCase() === 'subject')?.value || '(No Subject)';
        const dateHeader = headers.find((h) => h.name.toLowerCase() === 'date')?.value || '';

        // Parse from address
        const fromMatch = fromHeader.match(/^(.*?)\s*<(.+?)>$/);
        const fromName = fromMatch ? fromMatch[1].replace(/"/g, '').trim() : '';
        const fromAddress = fromMatch ? fromMatch[2].trim() : fromHeader.trim();

        // Parse date
        let receivedAt: string;
        try {
          receivedAt = new Date(parseInt(messageData.internalDate)).toISOString();
        } catch {
          receivedAt = new Date(dateHeader).toISOString();
        }

        // Check if unread
        const isUnread = messageData.labelIds?.includes('UNREAD') || false;

        // Extract body content
        let bodyHtml = '';
        let bodyText = '';
        
        const extractBody = (payload: GmailMessage['payload']) => {
          // Check for direct body on payload
          if (payload.body?.data) {
            try {
              const decoded = atob(payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
              if (payload.mimeType === 'text/html') {
                bodyHtml = decoded;
              } else {
                bodyText = decoded;
              }
            } catch (e) {
              console.error('[sync-gmail-inbox] Error decoding body:', e);
            }
          }
          
          // Check parts for multipart messages
          if (payload.parts) {
            for (const part of payload.parts) {
              if (part.body?.data) {
                try {
                  const decoded = atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
                  if (part.mimeType === 'text/html') {
                    bodyHtml = decoded;
                  } else if (part.mimeType === 'text/plain' && !bodyText) {
                    bodyText = decoded;
                  }
                } catch (e) {
                  console.error('[sync-gmail-inbox] Error decoding part:', e);
                }
              }
              // Handle nested parts (multipart/alternative inside multipart/mixed)
              if ((part as any).parts) {
                for (const nestedPart of (part as any).parts) {
                  if (nestedPart.body?.data) {
                    try {
                      const decoded = atob(nestedPart.body.data.replace(/-/g, '+').replace(/_/g, '/'));
                      if (nestedPart.mimeType === 'text/html') {
                        bodyHtml = decoded;
                      } else if (nestedPart.mimeType === 'text/plain' && !bodyText) {
                        bodyText = decoded;
                      }
                    } catch (e) {
                      console.error('[sync-gmail-inbox] Error decoding nested part:', e);
                    }
                  }
                }
              }
            }
          }
        };
        
        extractBody(messageData.payload);
        
        // If no HTML body, convert plain text to simple HTML
        const finalBody = bodyHtml || (bodyText ? `<pre style="white-space: pre-wrap; font-family: inherit;">${bodyText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>` : '');

        // Insert the message
        const { error: insertError } = await supabase
          .from('inbox_messages')
          .insert({
            user_id: userId,
            gmail_message_id: msg.id,
            gmail_thread_id: messageData.threadId,
            from_address: fromAddress,
            from_name: fromName,
            to_address: toHeader,
            subject: subjectHeader,
            snippet: messageData.snippet,
            body_html: finalBody,
            received_at: receivedAt,
            is_read: !isUnread,
            email_account: emailAddress,
            labels: messageData.labelIds || [],
          });

        if (insertError) {
          console.error(`[sync-gmail-inbox] Error inserting message:`, insertError);
          continue;
        }

        newEmails++;
        console.log(`[sync-gmail-inbox] Added message from ${fromAddress}: ${subjectHeader}`);
      } catch (msgError) {
        console.error(`[sync-gmail-inbox] Error processing message ${msg.id}:`, msgError);
        continue;
      }
    }
  } catch (error) {
    console.error(`[sync-gmail-inbox] Error syncing account ${emailAddress}:`, error);
  }

  return { totalEmails, newEmails };
}