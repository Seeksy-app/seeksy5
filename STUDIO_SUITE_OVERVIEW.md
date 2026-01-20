# Studio Suite Overview

## Introduction

The Seeksy Studio Suite is a comprehensive content creation and post-production system that enables creators to record, edit, transcribe, and publish content across multiple platforms. The system supports audio podcasts, video recordings, live streaming, and blog content creation.

## Core Components

### 1. Master Studio (`/studio`)
**Entry Point**: Unified hub for all creation workflows

The Master Studio serves as the central routing layer for all content creation types:
- **Video Studio** (`/studio/video`) - Multi-track video recording with guest management
- **Solo Video Mode** (`/studio/solo`) - Single-person video recording
- **Live Stream** (`/studio/live`) - Live broadcasting capabilities
- **Podcast Audio Studio** - Links to dedicated podcast recording interface

**Key Features**:
- Template selection for quick starts
- Credit-based system for activity tracking
- Direct access to all studio modes
- Recent recordings dashboard

---

### 2. Podcast Studio
**Entry Point**: `/podcasts/:podcastId/studio`

Four-panel workflow for professional podcast production:

**Panel A - Script**:
- Script editor with word count
- AI script generation
- Organized sections (Intro, Outro, Segments, Sponsor)
- Auto-save support

**Panel B - Recording**:
- Audio recording with waveform visualization
- Playback controls
- Upload audio option
- Host-only recording (MVP)

**Panel C - Editing**:
- Remove filler words
- Noise reduction
- Trim silence
- Auto-leveling
- "Send to AI Cleanup" processing

**Panel D - Markers**:
- Add clip markers for highlights
- Add ad markers for monetization
- Host Ad Read pop-ups with advertiser scripts
- Timestamp-based marker management

**Episode Workflow**:
- Save as Draft
- Attach to Existing Episode
- Create New Episode
- Publish Episode
- Routes to `/podcasts/:id/episodes/new-from-studio`

---

### 3. Media Studio (Video)
**Entry Point**: `/studio/video`

Professional video recording with post-production capabilities:
- Multi-track recording support
- Guest invitation system
- Real-time transcription integration
- Direct routing to post-production pipeline

**Automatic Transcription**:
When a video recording completes:
1. System calls `transcribe-audio` edge function
2. Transcript saved to `transcripts` table
3. Creator receives background notification
4. Transcript appears in Transcript Library

---

### 4. Media Library
**Entry Point**: `/media-library`

Central repository for all recorded content:
- Video recordings
- Audio files
- Podcast episodes
- Uploaded media

**Actions Available**:
- View details
- Download
- Edit in Post-Production Studio
- Generate clips
- Transcribe (if not already done)
- Delete

---

### 5. Transcript Library
**Entry Point**: `/transcripts`

Manage all transcriptions across content types:

**List View Features**:
- Filter by source (Podcast / Video / Upload)
- Status tracking (Pending / Complete / Error)
- Duration display
- Creation date
- Quick open action

**Detail View** (`/transcripts/:id`):
- Full transcript text with timestamps
- Search within transcript
- Copy all text
- **Send to Blog Studio** - Creates blog draft
- Source link (episode, recording, etc.)
- Metadata display (language, duration, AI model)

**Integration Points**:
- Auto-generated from Podcast Studio recordings
- Auto-generated from Media Studio videos
- Manual trigger from Clip Studio
- Available for blog creation

---

### 6. Blog Studio
**Entry Point**: `/blog-library` or `/blog`

Transform transcripts into publishable blog content:

**Blog Library**:
- Draft and published posts
- Filter by status
- Links to source transcripts
- Edit / Publish / Certify actions

**Blog Editor** (`/blog/:id/edit`):
- Title and slug management
- Rich text content editor
- Excerpt field
- Tags
- Side panel shows source transcript (if applicable)
- "Insert Transcript" quick action
- Save as draft or publish

**Blog Creation from Transcript**:
1. User clicks "Send to Blog Studio" in transcript detail
2. System creates `blog_posts` row with:
   - `source_type: "transcript"`
   - `transcript_id: [id]`
   - Pre-filled content from transcript
3. Redirects to Blog Editor

---

### 7. Clip Studio
**Entry Point**: `/create-clips`

AI-powered clip generation from recordings:
- Auto-attach transcript if available
- One-click "Generate Transcript" if missing
- Highlight detection using transcript
- Caption generation
- Key moment identification

**Transcript Integration**:
- Loads existing transcript automatically
- Offers manual generation option
- Uses transcript for AI clip detection

---

### 8. Post-Production Studio
**Entry Point**: `/post-production`

Advanced editing tools:
- Multi-track editing
- AI cleanup tools
- Export options
- Timeline markers from studio recording

**Automatic Data Flow**:
- Receives timeline markers from Podcast/Media Studio
- Receives transcripts for editing reference
- Exports to Media Library

---

## Content Certification

### Voice Certification
**Route**: `/my-voice-identity`

Blockchain-based voice authentication:
- Voice fingerprinting
- NFT minting on Polygon
- Public verification URL: `/v/:username/voice-credential`

### Content Credentials
**Routes**: `/blog/:id/certify`, transcript certify options

Optional on-chain certification for:
- Transcripts
- Blog posts
- Recordings

**Process**:
1. User clicks "Certify on-Chain"
2. System hashes content
3. Calls `mint-content-credential` edge function
4. Mints credential on Polygon
5. Public verification URL: `/c/:id`

**Content Credential Card**:
- Status badge (Minted / Pending / Failed)
- Content type
- Created date
- Polygonscan link
- "View Public Credential Page" button
- "Download Certificate" button

---

## Data Flow

### Recording → Transcript → Blog Flow

```
1. Creator records in Podcast Studio or Media Studio
   ↓
2. Recording finalized & saved
   ↓
3. System calls transcribe-audio edge function (ElevenLabs)
   ↓
4. Transcript saved to database with metadata
   ↓
5. Toast notification: "We're generating your transcript..."
   ↓
6. Transcript appears in Transcript Library
   ↓
7. User clicks "Send to Blog Studio" in transcript detail
   ↓
8. Blog draft created with transcript content
   ↓
9. User edits in Blog Editor
   ↓
10. User publishes blog post
   ↓
11. (Optional) User certifies blog on-chain
```

### Advertiser → Script → Recording Flow

```
1. Advertiser creates campaign with ad scripts
   ↓
2. Creator opens Podcast Studio
   ↓
3. Adds ad marker in Panel D
   ↓
4. "Host Ad Read" pop-up shows advertiser scripts
   ↓
5. Creator records ad read
   ↓
6. Ad marker saved with timestamp
   ↓
7. Episode published with ad slots
   ↓
8. Analytics track ad impressions & revenue
```

---

## Main Routes

### Creator Routes
- `/studio` - Master Studio hub
- `/studio/video` - Video recording
- `/studio/live` - Live streaming
- `/podcasts/:id/studio` - Podcast Audio Studio
- `/media-library` - All recordings
- `/transcripts` - Transcript Library
- `/transcripts/:id` - Transcript detail
- `/blog-library` or `/blog` - Blog Library
- `/blog/:id/edit` - Blog Editor
- `/blog/:id/certify` - Blog Certification
- `/create-clips` - Clip generation
- `/post-production` - Advanced editing
- `/my-voice-identity` - Voice certification

### Public Routes
- `/:username` - Creator's My Page
- `/v/:username/voice-credential` - Public voice credential
- `/c/:id` - Public content credential
- `/blog/:slug` - Public blog post

### Admin Routes
- `/admin/analytics` - Platform analytics
- `/admin/voice-cloning` - Voice profile management
- `/admin/advertising` - Ad management

---

## Edge Functions

### `transcribe-audio`
- **Purpose**: Generate transcripts using ElevenLabs STT
- **Input**: `{ asset_id, audio_url, language, source_type }`
- **Fallback**: Graceful degradation to backup provider
- **Output**: Transcript record in database

### `mint-content-credential`
- **Purpose**: Create on-chain content credentials
- **Input**: `{ content_type, transcript_id?, blog_post_id? }`
- **Process**: Hash content, mint NFT on Polygon
- **Output**: Credential record with tx_hash

### Other Studio Functions
- `generate-ai-broll` - B-roll generation
- `generate-ai-thumbnail` - Thumbnail creation
- `detect-speakers` - Speaker identification
- `analyze-video-content` - Content analysis

---

## Key Tables

### `transcripts`
- `id` - UUID
- `asset_id` - Link to source recording
- `user_id` - Creator
- `source_type` - podcast / video / upload
- `language` - Language code
- `raw_text` - Full transcript
- `ai_model` - elevenlabs-stt-v1 / fallback
- `word_timestamps` - JSONB for time-coded text
- `metadata` - Additional info

### `blog_posts`
- `id` - UUID
- `user_id` - Creator
- `source_type` - transcript / manual / import
- `transcript_id` - Link to transcript (nullable)
- `title` - Blog title
- `slug` - URL-friendly slug
- `content` - Blog content
- `status` - draft / published / archived
- `published_at` - Publication timestamp

### `content_credentials`
- `id` - UUID
- `user_id` - Creator
- `content_type` - transcript / blog_post
- `transcript_id` - Nullable FK
- `blog_post_id` - Nullable FK
- `content_hash` - SHA-256 hash
- `chain` - polygon
- `tx_hash` - Blockchain transaction
- `status` - pending / minting / minted / failed
- `metadata` - Additional certification info

---

## Integration Philosophy

The Studio Suite is designed as a **unified content creation ecosystem** where:
1. All recording types generate transcripts automatically
2. Transcripts seamlessly convert to blog content
3. Content can be certified on-chain for authenticity
4. Analytics track engagement across all formats
5. Monetization opportunities (ads, sponsorships) integrate natively
6. Cross-module bridges ensure smooth workflows

This architecture eliminates silos and creates a cohesive creator experience from recording to publication to monetization.
