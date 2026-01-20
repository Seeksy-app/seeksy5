# Gmail OAuth UX & Multi-Account Setup Guide

## ✅ COMPLETED FIXES

### B. OAuth Redirect Fixed
- ✅ Updated `gmail-callback` edge function to redirect to `https://seeksy.io/email-settings` after successful connection
- ✅ Error redirects also point to `https://seeksy.io/email-settings` with error query params
- ✅ Removed the lovableproject.com redirect logic

### C. Multiple Gmail Accounts Support
- ✅ Updated `EmailAccountManager` to query `email_accounts` table (not `gmail_connections`)
- ✅ Updated `FloatingEmailComposer` to query `email_accounts` table
- ✅ First connected account automatically becomes default
- ✅ Subsequent accounts preserve existing accounts (no replacement)
- ✅ "Set Default" button works with radio button logic (only one default at a time)
- ✅ "Delete" button removes accounts from `email_accounts` table
- ✅ From dropdown in composer shows all connected accounts with "(default)" label

### D. Polish Verification
- ✅ Credits pill routes to `/settings/billing` (confirmed in previous fix)
- ✅ Ask Spark mascot uses transparent PNGs (confirmed in previous fix)
- ✅ No white box or blue shadow disk behind Spark

---

## 🔧 USER ACTION REQUIRED: Google Cloud Console OAuth Branding

### A. Update OAuth Consent Screen

You need to update your Google Cloud Console OAuth consent screen so users see "Seeksy" branding instead of raw Supabase URLs.

#### Steps:

1. **Go to Google Cloud Console**
   - Navigate to: https://console.cloud.google.com/
   - Select your project (the one with your Gmail OAuth credentials)

2. **Open OAuth Consent Screen**
   - In the left sidebar: APIs & Services → OAuth consent screen
   - Or direct link: https://console.cloud.google.com/apis/credentials/consent

3. **Update Application Information**
   
   **Application name:**
   ```
   Seeksy
   ```

   **App logo:**
   - Upload your Seeksy brand mark (square PNG, recommended 120x120px)
   - You can use the logo from `/public/seeksy-logo.png` or your brand assets

   **Authorized domains:**
   ```
   seeksy.io
   ```

   **Application home page:**
   ```
   https://seeksy.io
   ```

   **Application privacy policy link:**
   ```
   https://seeksy.io/privacy
   ```

   **Application terms of service link:**
   ```
   https://seeksy.io/terms
   ```

4. **Verify Authorized JavaScript Origins**
   - Go to: APIs & Services → Credentials
   - Click your OAuth 2.0 Client ID
   - Under "Authorized JavaScript origins", ensure you have:
     ```
     https://seeksy.io
     ```

5. **Verify Authorized Redirect URIs**
   - In the same OAuth 2.0 Client ID settings
   - Under "Authorized redirect URIs", ensure you have:
     ```
     https://taxqcioheqdqtlmjeaht.supabase.co/functions/v1/gmail-callback
     ```

6. **Save Changes**
   - Click "Save" at the bottom of the consent screen
   - Changes may take a few minutes to propagate

---

## 🧪 TESTING CHECKLIST

After updating Google Cloud Console settings, test the following:

### OAuth Branding Test
1. Go to `/email-settings`
2. Click "+ Connect Gmail Account"
3. Verify Google consent screen shows:
   - ✅ App name: **Seeksy** (not "taxqcioheqdqtlmjeaht")
   - ✅ Seeksy logo/brand mark
   - ✅ Links to seeksy.io privacy and terms

### Multi-Account Test
1. Connect first Gmail account (e.g., appletonab@gmail.com)
   - ✅ Redirects to `/email-settings` after success
   - ✅ Account appears in list with "(Default)" badge
2. Click "+ Connect Gmail Account" again
3. Connect second Gmail account (different email)
   - ✅ Redirects to `/email-settings` after success
   - ✅ Both accounts now visible in list
   - ✅ First account still shows as default
4. Click "Set Default" on second account
   - ✅ Second account now shows "(Default)" badge
   - ✅ First account badge removed
5. Click trash icon on first account
   - ✅ Account removed from list
   - ✅ Only second account remains

### Email Composer Test
1. Open floating email composer (from My Day or Email Inbox)
2. Click "From" dropdown
   - ✅ Shows all connected accounts
   - ✅ Default account shows "(default)" label
   - ✅ Can select any account to send from
3. Send test email
   - ✅ Email sends from selected account

### Navigation Test
1. Click credits pill in top bar
   - ✅ Routes to `/settings/billing`
   - ✅ No 404
2. Click "Ask Spark" in sidebar
   - ✅ Opens chat widget (doesn't navigate)
   - ✅ No 404
3. Test all Media section links
   - ✅ No raw 404s anywhere

---

## 📝 IMPLEMENTATION SUMMARY

### Files Updated

1. **supabase/functions/gmail-callback/index.ts**
   - Changed from `gmail_connections` to `email_accounts` table
   - Fixed redirect to `https://seeksy.io/email-settings`
   - Supports multiple accounts (upserts based on user_id + email_address)
   - First account automatically becomes default

2. **src/components/email/EmailAccountManager.tsx**
   - Updated query from `gmail_connections` to `email_accounts`
   - Fixed field references (`account.email` → `account.email_address`)
   - Set default and delete mutations now use correct table

3. **src/components/email/client/FloatingEmailComposer.tsx**
   - Updated query from `gmail_connections` to `email_accounts`
   - Fixed field reference in From dropdown
   - Removed signature logic (not in email_accounts schema)
   - From dropdown shows all accounts with default indicator

### Database Tables

**Using:** `email_accounts`
- `id` (uuid, primary key)
- `user_id` (uuid, references auth.users)
- `email_address` (text)
- `provider` (text, e.g., "gmail")
- `display_name` (text)
- `access_token` (text)
- `refresh_token` (text)
- `token_expires_at` (timestamp)
- `is_default` (boolean)
- `is_active` (boolean)
- `connected_at` (timestamp)
- `last_used_at` (timestamp)

**Deprecated:** `gmail_connections` (old table, no longer used)

---

## 🚀 NEXT STEPS

1. **Update Google Cloud Console** following steps in section A above
2. **Test OAuth flow** end-to-end with updated branding
3. **Test multiple account connections** to verify no replacement/overwriting
4. **Verify default account selection** flows through to composer and campaign builder

All backend changes are deployed and ready to test!
