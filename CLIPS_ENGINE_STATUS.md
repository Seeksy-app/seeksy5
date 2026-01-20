# Clips Engine - Phase 1 Status

## ✅ What's Working

### Pipeline Architecture
- **Database Schema**: `clips`, `ai_jobs`, and `ai_edited_assets` tables fully wired
- **Edge Functions**: `generate-clip` → `process-clip-ffmpeg` orchestration complete
- **UI Integration**: ClipsGallery displays real DB data with status polling
- **Job Tracking**: All processing tracked in `ai_jobs` with proper status transitions

### Clip Generation Flow
1. User clicks "Generate Clip" on viral moment
2. Creates `clips` record with `status: 'processing'`
3. Invokes `generate-clip` edge function
4. Generates BOTH vertical (9:16) and thumbnail clips in parallel
5. Updates `clips` table with `vertical_url` and `thumbnail_url`
6. Creates `ai_edited_assets` records for each output
7. UI polls for completion and displays download buttons

## ⚠️ Current Limitation: FFmpeg in Supabase Edge

### Issue
Supabase Edge Functions run on Deno Deploy, which **does not include FFmpeg** in the runtime environment.

### What Happens Now
- Edge function performs FFmpeg smoke test on first run
- If FFmpeg not available: job fails with clear error message
- Error stored in `ai_jobs.error_message` for debugging
- UI displays "Processing failed" status

### FFmpeg Test Output
```typescript
// Edge function logs will show:
"Testing FFmpeg availability..."
"❌ FFmpeg not available: [error details]"
"FFmpeg not available in Supabase Edge Functions. 
 Alternatives: Cloudflare Stream API or external worker service."
```

## 🎯 Next Steps: Alternative Implementations

### Option 1: Cloudflare Stream API (Recommended)
**Pros:**
- No server infrastructure needed
- Built-in video processing, transcoding, thumbnails
- Integrated with our existing R2 storage
- Pay-per-minute pricing ($1/1000 minutes)

**Implementation:**
```typescript
// Upload to Stream for processing
const streamUpload = await fetch(
  `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CLOUDFLARE_STREAM_API_TOKEN}`,
    },
    body: videoFile
  }
);

// Apply transformations via Stream API
const clipUrl = `https://customer-${subdomain}.cloudflarestream.com/${videoId}/manifest/video.m3u8`;
```

**Required Secrets:**
- `CLOUDFLARE_STREAM_API_TOKEN` (already configured)
- `CLOUDFLARE_ACCOUNT_ID` (already configured)

### Option 2: External Worker Service
**Pros:**
- Full FFmpeg control and customization
- Can run on serverless platform (AWS Lambda, Fly.io)
- One-time setup, then fully automated

**Cons:**
- Requires separate infrastructure
- Additional deployment complexity

**Stack:**
- AWS Lambda with FFmpeg layer
- OR Fly.io Machine with Docker + FFmpeg
- Triggered via webhook from Supabase edge function

### Option 3: Client-Side Processing (Not Recommended)
**Pros:**
- No server costs
- WebAssembly FFmpeg available

**Cons:**
- Slow for large videos
- Poor mobile experience
- Requires significant browser resources
- No background processing

## 📊 Current Metrics

### Database Records Created Per Clip
```
clips table:          1 row  (with status tracking)
ai_jobs table:        1 row  (for each format: vertical + thumbnail = 2 jobs)
ai_edited_assets:     2 rows (one per output format)
```

### Processing Flow
```
User Request
    ↓
Create clips record (status: processing)
    ↓
Invoke generate-clip edge function
    ↓
    ├─→ process-clip-ffmpeg (vertical)  → ai_job → ai_edited_asset
    │   └─→ Update clips.vertical_url
    │
    └─→ process-clip-ffmpeg (thumbnail) → ai_job → ai_edited_asset
        └─→ Update clips.thumbnail_url
    ↓
Update clips.status = 'ready'
    ↓
UI displays download buttons
```

## 🔄 Temporary Workaround

For testing the pipeline end-to-end without FFmpeg:

1. Mock the video processing with a simple trim operation
2. Generate placeholder clips that validate the storage/DB flow
3. Once alternative is chosen, swap out processing implementation

## 📋 Decision Needed

**Question for Product Team:**
Which alternative do you want to pursue?

1. **Cloudflare Stream** (fastest to implement, ~2-3 hours)
2. **External Worker** (more control, ~1-2 days)
3. **Hybrid Approach** (Stream for simple clips, Worker for advanced edits)

All three options will work with the existing pipeline architecture - we just need to swap the processing implementation inside `process-clip-ffmpeg/index.ts`.
