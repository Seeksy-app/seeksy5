# Email Reply Tracking - Phase 1 Implementation

## ✅ Completed

Phase 1 reply tracking has been implemented with the following components:

### 1. Database Schema

Created `email_replies` table with:
- `email_event_id` - Links to original sent email
- `gmail_message_id` - For deduplication
- `from_address` / `from_name` - Reply sender info
- `subject` - Reply subject line
- `snippet` - First 160 chars of reply body
- `received_at` - When reply was received
- `thread_id` - Gmail thread ID

RLS policies restrict users to see only replies to their own sent emails.

### 2. Gmail OAuth Scopes

Gmail OAuth (`gmail-auth` function) already includes the required scopes:
- ✅ `gmail.readonly` - Read Gmail messages
- ✅ `gmail.send` - Send emails
- ✅ `gmail.compose` - Compose drafts
- ✅ `userinfo.email` - User email address

No changes needed - existing OAuth flow supports reply tracking.

### 3. Sync Edge Function

Created `sync-gmail-replies` edge function that:
- Fetches user's connected Gmail accounts
- Queries last 50 sent emails from Seeksy
- Searches Gmail for replies using subject matching
- Validates replies by checking In-Reply-To and References headers
- Stores new replies in `email_replies` table (deduped by `gmail_message_id`)
- Returns sync stats: `totalRepliesFound`, `newRepliesAdded`

**Manual sync**: Call from UI via "Sync Replies" button
**Future**: Can be scheduled via cron/interval for automatic polling

### 4. UI Updates

#### Email List (Inbox/Sent views)
- Added reply count badge showing `X replies` next to each email with replies
- Badge only appears if `reply_count > 0`
- Uses Mail icon + count

#### Email Detail View
- New **Replies Panel** displays after tracking pills
- Shows reply list with sender avatar, name, email, snippet, received time
- **"Open in Gmail"** button for each reply (opens Gmail in new tab)
- **"Sync Replies"** button to manually trigger reply fetch
- Empty state: "No replies yet. Click 'Sync Replies' to check Gmail."

### 5. Sender Configuration

Updated `send-email` edge function:
- **Default sender**: `hello@seeksy.io` (for transactional/system emails)
- **User emails**: Uses connected Gmail account if `fromAccountId` provided
- **Metadata**: Stores `message_id` for reply matching

## 🔧 Required Environment Variables

The following Gmail API credentials need to be added to Lovable Cloud secrets:

1. **GMAIL_CLIENT_ID** - OAuth client ID from Google Cloud Console
2. **GMAIL_CLIENT_SECRET** - OAuth client secret
3. **GMAIL_REDIRECT_URI** - Already configured in `gmail-auth` function

These are already wired up as placeholders in the code - just drop the real values into environment.

## 📋 Testing Checklist

Once credentials are added:

1. ✅ Send a test email from Seeksy
2. ✅ Reply to that email from Gmail/another client
3. ✅ In Seeksy email detail view, click "Sync Replies"
4. ✅ Verify reply appears in Replies panel with correct metadata
5. ✅ Click "Open in Gmail" - should open correct thread
6. ✅ Verify reply count badge appears in email list
7. ✅ Send another reply - sync again to verify deduplication works

## 🚀 Phase 2 Preparation

Architecture is ready for Phase 2 enhancements:
- Full reply body rendering (read-only)
- Threading UI (original + replies in single view)
- Reply-from-Seeksy composer
- Auto-sync on interval/webhook

## 📸 Screenshots

See email list with reply badges and detail view with replies panel.
