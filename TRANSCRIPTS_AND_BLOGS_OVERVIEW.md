# Transcripts and Blogs Overview

This document describes the Seeksy transcription and blog creation pipeline, including how Studio recordings automatically generate transcripts and how creators can convert transcripts into blog posts.

## Architecture Overview

```
Studio Recording → Transcription → Transcript Library → Blog Creation → Blog Library → Content Certification
```

## Transcripts

### Database Schema

**Table: `transcripts`**

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid (PK) | Unique transcript identifier |
| `user_id` | uuid (FK → auth.users) | Owner of the transcript |
| `source_type` | text | Type: `studio_recording`, `podcast_episode`, `upload` |
| `asset_id` | uuid | Reference to source media file or episode |
| `raw_text` | text | Full transcript text |
| `ai_model` | text | AI model used (e.g., `elevenlabs-stt-v1`) |
| `language` | text | Language code (e.g., `en`) |
| `word_timestamps` | jsonb | Optional word-level timing data |
| `metadata` | jsonb | Additional metadata (title, duration, etc.) |
| `created_at` | timestamptz | Creation timestamp |
| `updated_at` | timestamptz | Last update timestamp |

**RLS Policies:**
- `Users can view own transcripts` (SELECT): Creators can only see transcripts they created (`owner_profile_id = auth.uid()`)
- `Users can insert own transcripts` (INSERT): Creators can create transcripts linked to their profile
- `Users can update own transcripts` (UPDATE): Creators can edit their own transcript metadata
- `Users can delete own transcripts` (DELETE): Creators can remove their own transcripts
- `Admins can view all transcripts` (SELECT): Admins and super_admins can see all transcripts via `has_role()` function
- `Admins can manage all transcripts` (ALL): Admins have full CRUD access for moderation

### Transcription Flow

**1. Auto-Transcription Trigger**

When a creator completes a recording in any Studio:

1. System checks user's `auto_transcribe_enabled` preference (default: `true`)
2. If enabled, calls `transcribe-audio` edge function with:
   - `asset_id`: Episode, recording, or clip ID
   - `audio_url`: URL of the audio/video file
   - `language`: Language code (default: `en`)
   - `source_type`: `podcast_episode`, `studio_recording`, `video_recording`, or `clip`
3. Edge function attempts **ElevenLabs Speech-to-Text API** first
4. Falls back to alternative provider if ElevenLabs fails
5. Stores result in `transcripts` table

**Supported Studio Types:**
- **Podcast Studio**: Audio episodes → auto-transcribe after export
- **Video Studio** (BroadcastStudio): Video recordings → auto-transcribe after save
- **Media Studio**: Studio recordings → auto-transcribe after upload
- **Clip Studio**: Manual "Generate Transcript" button for clips without transcripts

**2. Edge Function: `transcribe-audio`**

Location: `supabase/functions/transcribe-audio/index.ts`

**Input:**
```json
{
  "asset_id": "uuid",
  "audio_url": "https://...",
  "language": "en",
  "source_type": "podcast_episode"
}
```

**Output:**
```json
{
  "transcript_id": "uuid",
  "text": "transcribed text...",
  "model": "elevenlabs-stt-v1",
  "word_timestamps": [...],
  "confidence": 0.95
}
```

**Fallback Logic:**
- Primary: ElevenLabs API (`https://api.elevenlabs.io/v1/speech-to-text`)
- Fallback: Alternative transcription provider (configured in edge function)
- Error handling: Returns error status with retry suggestion

### Transcript Library

**Route:** `/transcripts`

**Features:**
- List all transcripts with filtering (All / Podcasts / Studio / Uploads)
- Display source type, language, duration, status, certification status
- Search functionality
- Actions: View, Create Blog Post, Certify

**Transcript Detail View**

**Route:** `/transcripts/:id`

**Features:**
- Full transcript text with search highlighting
- Metadata sidebar (language, duration, AI model, source link)
- Quick actions:
  - Copy transcript
  - Send to Blog Studio (creates blog draft)
  - Certify on-chain (if not already certified)
- Certification status display with public verification link

### Creator Settings

**Location:** Settings → Content & Automation

**Toggle:** "Auto-transcribe my Studio recordings"

**Description:** "When enabled, Seeksy will automatically generate transcripts from finished recordings and save them to your Transcript Library."

**Default:** ON for new creators

**Database:** Stored in `user_preferences.auto_transcribe_enabled`

---

## Blogs

### Database Schema

**Table: `blog_posts`**

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid (PK) | Unique blog post identifier |
| `user_id` | uuid (FK → auth.users) | Blog post owner |
| `source_type` | text | Type: `transcript`, `manual`, `import` |
| `transcript_id` | uuid (nullable) | Link to source transcript |
| `title` | text | Blog post title |
| `slug` | text | URL-friendly slug (unique per user) |
| `excerpt` | text | Short description |
| `content` | text | Full blog content |
| `status` | text | `draft`, `published`, `archived` |
| `cover_image_url` | text (nullable) | Cover image URL |
| `tags` | text[] | Content tags |
| `published_at` | timestamptz (nullable) | Publication timestamp |
| `created_at` | timestamptz | Creation timestamp |
| `updated_at` | timestamptz | Last update timestamp |

**RLS Policies:**
- `Users can view own blog posts` (SELECT): Creators can only see blog posts they authored (`author_id = auth.uid()`)
- `Users can insert own blog posts` (INSERT): Creators can create blog posts linked to their profile
- `Users can update own blog posts` (UPDATE): Creators can edit their own blog content
- `Users can delete own blog posts` (DELETE): Creators can remove their own blog posts
- `Public can view published blogs` (SELECT): Any user can see blog posts with `is_published = true`
- `Admins can view all blog posts` (SELECT): Admins and super_admins can see all blogs via `has_role()` function
- `Admins can manage all blog posts` (ALL): Admins have full CRUD access for moderation

### Blog Creation Flow

**From Transcript:**

1. User opens transcript detail page (`/transcripts/:id`)
2. Clicks **"Send to Blog Studio"**
3. System creates new `blog_posts` row with:
   - `source_type = "transcript"`
   - `transcript_id` = transcript ID
   - `title` = transcript title
   - `slug` = auto-generated from title
   - `excerpt` = first 200 characters of transcript
   - `content` = full transcript text
   - `status = "draft"`
4. User is redirected to Blog Editor (`/blog/:id/edit`)

**Manual Creation:**

1. User navigates to Blog Library (`/blog`)
2. Clicks **"New Blog Post"**
3. Opens Blog Editor with blank form
4. `source_type = "manual"`

### Blog Editor

**Route:** `/blog/:id/edit` or `/blog/new`

**Features:**
- Title (required)
- Slug (auto-normalized, kebab-case, editable)
- Excerpt (optional)
- Content (required, textarea with rich text support)
- Tags (optional)
- Side panel (if transcript-based):
  - Shows source transcript in scrollable view
  - "Insert Transcript" button to copy text into content
- Actions:
  - Save Draft
  - Publish
  - Certify (if saved)

**Certification Toggle:**
- **Checkbox:** "Certify on publish"
- **Description:** "Mint a verifiable content credential so others can verify this blog was authored by you"
- When enabled and user publishes:
  - Automatically calls `mint-content-credential` edge function
  - Creates on-chain record
  - Links credential to blog post

### Blog Library

**Route:** `/blog`

**Features:**
- List all blog posts with filtering (All / Draft / Published)
- Display title, source type, status, certification badge
- Actions:
  - Edit
  - View
  - Publish/Unpublish
  - Delete
  - Certify

---

## Content Certification

### Database Schema

**Table: `content_credentials`**

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid (PK) | Unique credential identifier |
| `user_id` | uuid (FK → auth.users) | Content owner |
| `content_type` | text | `transcript` or `blog_post` |
| `transcript_id` | uuid (nullable) | Link to transcript (if applicable) |
| `blog_post_id` | uuid (nullable) | Link to blog post (if applicable) |
| `content_hash` | text | SHA-256 hash of content |
| `title` | text | Content title |
| `summary` | text | Brief description |
| `chain` | text | Blockchain (e.g., `polygon`) |
| `tx_hash` | text (nullable) | Transaction hash (set after minting) |
| `status` | text | `pending`, `minting`, `minted`, `failed` |
| `metadata` | jsonb | Additional metadata (token_id, etc.) |
| `created_at` | timestamptz | Creation timestamp |
| `updated_at` | timestamptz | Last update timestamp |

**Constraints:**
- Unique `(transcript_id)` when not null
- Unique `(blog_post_id)` when not null
- Only one certified credential per content piece

### Minting Flow

**Edge Function:** `mint-content-credential`

**Input:**
```json
{
  "content_type": "transcript | blog_post",
  "transcript_id": "uuid (if transcript)",
  "blog_post_id": "uuid (if blog)"
}
```

**Process:**
1. Fetch content text (from `transcripts.raw_text` or `blog_posts.content`)
2. Normalize and generate SHA-256 hash
3. Create `content_credentials` row with `status = "pending"`
4. Call Polygon minting contract (similar to Voice Certification NFT)
   - Metadata includes: owner, content_type, title, hash, timestamp
5. Update credential with `tx_hash`, `token_id`, `status = "minted"`
6. Return success with credential ID

**On Failure:**
- Update `status = "failed"`
- Store error details in `metadata`
- User can retry via UI

### Public Verification

**Route:** `/c/:credentialId`

**Features:**
- Creator name and handle
- Content type (Blog / Transcript)
- Title and summary
- Creation timestamp
- Blockchain details:
  - Chain name (Polygon)
  - Transaction hash
  - Polygonscan link
- Downloadable certificate (PNG)
- Social sharing buttons

**Verification Message:**
> "This page verifies that this content's cryptographic hash was recorded on the Polygon blockchain via Seeksy. The on-chain record proves authorship and creation date."

---

## Integration Points

### Studio → Transcript

**Entry Point:** `StudioSuccess.tsx`

When episode is completed:
1. Check `user_preferences.auto_transcribe_enabled`
2. If `true`, call `transcribe-audio` edge function
3. Display transcription status:
   - "Transcription in progress..."
   - "Transcript ready!" (with link to Transcript Library)
   - "Transcription failed" (with retry option)

### Transcript → Blog

**Entry Point:** `TranscriptDetailPage.tsx`

**Button:** "Send to Blog Studio"

Creates blog draft with transcript content pre-filled, redirects to Blog Editor.

### Blog → Certification

**Entry Points:**
1. Blog Editor: "Certify on publish" toggle
2. Blog Library: "Certify" action button

Both trigger `mint-content-credential` edge function.

---

## User Experience Flow

**Typical Creator Journey:**

1. **Record** in Podcast Studio
2. **Complete** recording → auto-transcription starts
3. **View** transcript in Transcript Library
4. **Create** blog post from transcript
5. **Edit** blog in Blog Editor
6. **Publish** with optional auto-certification
7. **Share** public verification URL

**Admin Journey:**

- View all transcripts across all creators
- View all blog posts across all creators
- Monitor content credentials and on-chain activity
- Access analytics for transcription usage

---

## API Reference

### Edge Functions

**`transcribe-audio`**
- **Method:** POST
- **Auth:** Required
- **Input:** `{ asset_id, audio_url, language?, source_type }`
- **Output:** `{ transcript_id, text, model, word_timestamps, confidence }`

**`mint-content-credential`**
- **Method:** POST
- **Auth:** Required
- **Input:** `{ content_type, transcript_id?, blog_post_id? }`
- **Output:** `{ credential_id, tx_hash, status }`

---

## Configuration

**ElevenLabs API Key**
- Secret: `ELEVENLABS_API_KEY`
- Required for transcription
- Configured in Supabase secrets

**Polygon Configuration**
- Reuses existing Voice Certification blockchain setup
- Network: Polygon Mainnet
- Gas sponsorship: Biconomy (if configured)

---

## Error Handling

**Transcription Failures:**
- ElevenLabs timeout → fallback provider
- No audio URL → error message with retry
- Invalid format → error message

**Certification Failures:**
- Blockchain transaction failure → status = `failed`
- User can retry via UI
- Error details stored in `metadata`

**User Feedback:**
- Toast notifications for all actions
- Status badges on content items
- Clear error messages with actionable next steps

---

## Future Enhancements

- AI-powered blog summarization from transcripts
- Multi-language transcript support
- Transcript editing and correction UI
- Blog template library
- SEO optimization tools
- Analytics for blog performance
- RSS feed generation for blog
- Social media auto-posting
