import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { decryptToken } from "../_shared/token-encryption.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    console.log(`[sync-gmail-replies] Starting sync for user: ${user.id}`);

    // Get user's Gmail account(s)
    const { data: emailAccounts, error: accountsError } = await supabaseClient
      .from('email_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'gmail')
      .not('access_token', 'is', null);

    if (accountsError) {
      console.error('[sync-gmail-replies] Error fetching email accounts:', accountsError);
      throw accountsError;
    }

    if (!emailAccounts || emailAccounts.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No Gmail accounts connected' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let totalRepliesFound = 0;
    let newRepliesAdded = 0;

    for (const account of emailAccounts) {
      console.log(`[sync-gmail-replies] Syncing account: ${account.email_address}`);

      // Decrypt access token before using
      const accessToken = await decryptToken(account.access_token);

      // Get sent emails from this user that have a resend_email_id (meaning they were sent from Seeksy)
      const { data: sentEmails, error: sentError } = await supabaseClient
        .from('email_events')
        .select('id, resend_email_id, to_email, subject, occurred_at, metadata')
        .eq('user_id', user.id)
        .eq('event_type', 'email.sent')
        .not('resend_email_id', 'is', null)
        .order('occurred_at', { ascending: false })
        .limit(50); // Sync last 50 sent emails

      if (sentError) {
        console.error('[sync-gmail-replies] Error fetching sent emails:', sentError);
        continue;
      }

      if (!sentEmails || sentEmails.length === 0) {
        console.log('[sync-gmail-replies] No sent emails found for this account');
        continue;
      }

      console.log(`[sync-gmail-replies] Found ${sentEmails.length} sent emails to check for replies`);

      // For each sent email, check Gmail for replies
      for (const sentEmail of sentEmails) {
        try {
          // Search Gmail for emails in the same thread
          const messageId = sentEmail.metadata?.message_id;
          if (!messageId) {
            console.log(`[sync-gmail-replies] No message_id for email ${sentEmail.id}, skipping`);
            continue;
          }

          // Query Gmail API for replies
          // We search for emails that reference this message ID in their In-Reply-To or References headers
          const searchQuery = `to:${account.email_address} subject:"${sentEmail.subject}"`;
          const gmailSearchUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(searchQuery)}`;

          const searchResponse = await fetch(gmailSearchUrl, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          });

          if (!searchResponse.ok) {
            console.error(`[sync-gmail-replies] Gmail API search failed: ${searchResponse.status}`);
            continue;
          }

          const searchData = await searchResponse.json();
          const messages = searchData.messages || [];
          
          console.log(`[sync-gmail-replies] Found ${messages.length} potential replies for email ${sentEmail.id}`);
          totalRepliesFound += messages.length;

          // Fetch details for each message to verify it's a reply
          for (const message of messages) {
            const messageUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}?format=full`;
            const messageResponse = await fetch(messageUrl, {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
              },
            });

            if (!messageResponse.ok) {
              console.error(`[sync-gmail-replies] Failed to fetch message ${message.id}`);
              continue;
            }

            const messageData = await messageResponse.json();
            const headers = messageData.payload.headers;

            // Extract headers
            const fromHeader = headers.find((h: any) => h.name.toLowerCase() === 'from')?.value || '';
            const subjectHeader = headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value || '';
            const dateHeader = headers.find((h: any) => h.name.toLowerCase() === 'date')?.value || '';
            const inReplyTo = headers.find((h: any) => h.name.toLowerCase() === 'in-reply-to')?.value || '';
            const references = headers.find((h: any) => h.name.toLowerCase() === 'references')?.value || '';

            // Check if this is actually a reply to our sent email
            const isReply = inReplyTo.includes(messageId) || references.includes(messageId);
            
            if (!isReply) {
              console.log(`[sync-gmail-replies] Message ${message.id} is not a reply to our email, skipping`);
              continue;
            }

            // Extract snippet (first 160 chars of body)
            let snippet = messageData.snippet || '';
            if (snippet.length > 160) {
              snippet = snippet.substring(0, 160) + '...';
            }

            // Parse from address and name
            const fromMatch = fromHeader.match(/^(.*?)\s*<(.+?)>$/);
            const fromName = fromMatch ? fromMatch[1].replace(/"/g, '').trim() : '';
            const fromAddress = fromMatch ? fromMatch[2].trim() : fromHeader.trim();

            // Parse date
            const receivedAt = new Date(dateHeader).toISOString();

            // Check if we already have this reply
            const { data: existingReply } = await supabaseClient
              .from('email_replies')
              .select('id')
              .eq('gmail_message_id', message.id)
              .single();

            if (existingReply) {
              console.log(`[sync-gmail-replies] Reply ${message.id} already exists, skipping`);
              continue;
            }

            // Insert the reply
            const { error: insertError } = await supabaseClient
              .from('email_replies')
              .insert({
                email_event_id: sentEmail.id,
                gmail_message_id: message.id,
                from_address: fromAddress,
                from_name: fromName,
                subject: subjectHeader,
                snippet,
                received_at: receivedAt,
                thread_id: messageData.threadId,
              });

            if (insertError) {
              console.error(`[sync-gmail-replies] Error inserting reply:`, insertError);
              continue;
            }

            newRepliesAdded++;
            console.log(`[sync-gmail-replies] Added new reply from ${fromAddress}`);
          }
        } catch (error) {
          console.error(`[sync-gmail-replies] Error processing email ${sentEmail.id}:`, error);
          continue;
        }
      }
    }

    console.log(`[sync-gmail-replies] Sync complete: ${totalRepliesFound} replies found, ${newRepliesAdded} new replies added`);

    return new Response(
      JSON.stringify({
        success: true,
        totalRepliesFound,
        newRepliesAdded,
        message: `Synced ${newRepliesAdded} new replies from ${emailAccounts.length} accounts`,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[sync-gmail-replies] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});