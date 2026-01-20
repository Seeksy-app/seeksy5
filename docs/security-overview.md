# Seeksy Security Overview

This document summarizes the security posture of the Seeksy platform, covering token encryption, edge function authentication, and XSS protection measures.

---

## 1. OAuth Token Encryption

### Overview
All OAuth tokens stored in the database are encrypted at rest using AES-256-GCM encryption. Tokens are encrypted before storage and decrypted only when needed for API calls.

### Encrypted Tables

| Table | Encrypted Columns |
|-------|-------------------|
| `email_accounts` | `access_token`, `refresh_token` |
| `calendar_connections` | `access_token`, `refresh_token` |
| `zoom_connections` | `access_token`, `refresh_token` |
| `microsoft_connections` | `access_token`, `refresh_token` |
| `social_media_profiles` | `access_token`, `refresh_token` |

### Encryption Implementation

- **Algorithm**: AES-256-GCM
- **Key Storage**: `TOKEN_ENCRYPTION_KEY` Supabase secret (32-byte base64-encoded)
- **Utilities**: `supabase/functions/_shared/token-encryption.ts`
  - `encryptToken(plaintext)` → Returns prefixed encrypted string (`enc_v1_...`)
  - `decryptToken(encrypted)` → Returns original plaintext
  - `isTokenEncrypted(token)` → Boolean check for encryption prefix

### Migration Script

The `migrate-encrypt-tokens` edge function handles one-time migration of existing plaintext tokens:

- **Endpoint**: `POST /functions/v1/migrate-encrypt-tokens`
- **Access**: Admin-only (requires JWT + admin/super_admin role)
- **Behavior**: Idempotent - safe to run multiple times, skips already-encrypted tokens
- **Admin UI**: Available at `/admin/system-tools`

---

## 2. Edge Function Authentication

### Functions Requiring JWT + Role Verification

| Function | Required Roles | Purpose |
|----------|---------------|---------|
| `cfo-ai-assistant` | admin, super_admin, cfo, board_member | Financial AI assistant with sensitive data |
| `automation-engine` | Owner or admin | Workflow automation processing |
| `process-meeting-intelligence` | Meeting owner or admin | Meeting transcription/analysis |
| `generate-master-blog-posts` | admin, editor | AI blog post generation |
| `test-ffmpeg` | admin | FFmpeg testing utility |
| `migrate-encrypt-tokens` | admin, super_admin | Token encryption migration |

### Authentication Pattern

All authenticated functions follow this pattern:
1. `verify_jwt = true` in `supabase/config.toml`
2. Parse JWT from Authorization header
3. Verify user roles from `user_roles` table
4. Return 401 (unauthenticated) or 403 (unauthorized) on failure

### Functions Intentionally Public

| Function | Reason |
|----------|--------|
| `gmail-callback` | OAuth redirect endpoint, validated via state parameter |
| `google-calendar-callback` | OAuth redirect endpoint, validated via state parameter |
| `microsoft-callback` | OAuth redirect endpoint, validated via state parameter |
| `zoom-callback` | OAuth redirect endpoint, validated via state parameter |
| `meta-callback` | OAuth redirect endpoint, validated via state parameter |
| `youtube-callback` | OAuth redirect endpoint, validated via state parameter |
| `facebook-connect-page` | OAuth page selection endpoint |
| `podcast-rss` | Public RSS feed generation, no sensitive data |
| `stripe-webhook-credits` | Stripe webhook with signature verification |
| `shotstack-webhook` | Video processing webhook with signature |
| `resend-webhook` | Email tracking webhook |
| `twilio-inbound-sms` | SMS webhook from Twilio |
| `zoom-deauthorization` | Zoom app deauthorization webhook |
| `send-admin-new-user-sms` | Internal trigger |
| `send-event-reminder-sms` | Scheduled cron job |
| `send-meeting-reminders` | Scheduled cron job |
| `send-meeting-followup` | Scheduled cron job |
| `daily-ai-blog-posts` | Scheduled cron job |
| `submit-public-ticket` | Public support form submission |

---

## 3. XSS Protection

### Implementation

All user-generated or external HTML content is sanitized before rendering using DOMPurify.

### Utility Functions

Located in `src/lib/sanitizeHtml.ts`:

```typescript
import DOMPurify from "dompurify";

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
}

export function sanitizeEmailHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ADD_TAGS: ['style'],
    ADD_ATTR: ['target', 'rel'],
  });
}
```

### Protected Components

| Component | Sanitizer Used |
|-----------|---------------|
| `MarkdownRenderer.tsx` | `sanitizeHtml` |
| `CFOAIChat.tsx` | `sanitizeHtml` |
| `ScribeAssistant.tsx` | `sanitizeHtml` |
| `EmailViewer.tsx` | `sanitizeEmailHtml` |
| `EmailView.tsx` | `sanitizeEmailHtml` |
| `EmailWebView.tsx` | `sanitizeEmailHtml` |
| `PublicBlogPost.tsx` | `sanitizeHtml` |
| `EmailTemplateCustomizer.tsx` | `sanitizeEmailHtml` |
| `EmailTemplateFullScreenEditor.tsx` | `sanitizeEmailHtml` |
| `Marketing.tsx` | `sanitizeEmailHtml` |
| `admin/EmailTemplates.tsx` | `sanitizeEmailHtml` |

### Usage Pattern

Replace:
```tsx
<div dangerouslySetInnerHTML={{ __html: content }} />
```

With:
```tsx
<div dangerouslySetInnerHTML={{ __html: sanitizeHtml(content || "") }} />
```

---

## 4. Role-Based Access Control

### Role Hierarchy

| Role | Access Level |
|------|-------------|
| `super_admin` | Full platform access |
| `admin` | Administrative functions |
| `cfo` | Financial data and reports |
| `board_member` | Investor portal access |
| `editor` | Content management |
| `member` | Standard user access |

### Implementation

- Roles stored in `user_roles` table (not in profiles)
- Security definer function `has_role(user_id, role)` for RLS policies
- Frontend role checks via `useUserRoles()` hook
- Backend role checks in edge functions via `verifyAuth()` helper

---

## 5. Security Contacts

For security concerns or vulnerability reports, contact the development team through appropriate channels.

---

*Last updated: December 2024*
