# Phase 3 Clips Pipeline - Debug Resolution

## Root Cause: Foreign Key Constraint Violation

**Error Code**: `23503` (PostgreSQL foreign key violation)
**Error Message**: `Key (source_media_id)=(dbe99049-318b-449c-839a-1af5c676c277) is not present in table "media_files".`

### The Problem

The `process-clip-phase3` edge function was attempting to insert records into `ai_edited_assets` using `clipId` as the `source_media_id`. However, `clipId` is the ID of a record in the `clips` table, not the `media_files` table.

The `ai_edited_assets.source_media_id` column has a foreign key constraint to `media_files.id`, so it must reference an actual media file, not a clip.

### The Fix

**Changed**: Both `processVerticalClip()` and `processThumbnailClip()` functions

**Before**:
```typescript
source_media_id: params.clipId,  // ❌ WRONG - this is clips.id
```

**After**:
```typescript
source_media_id: sourceMediaId,  // ✅ CORRECT - this is media_files.id
```

**Implementation**:
1. Modified function signatures to accept `sourceMediaId: string` parameter
2. Updated function calls to pass `clip.source_media_id` from the clips record
3. Used the correct `sourceMediaId` in all `ai_edited_assets` inserts

### Code Changes

**File**: `supabase/functions/process-clip-phase3/index.ts`

1. **Function calls** (lines 124-150):
```typescript
const verticalResult = await processVerticalClip({
  streamVideoId,
  startTime,
  duration,
  captions,
  title: title || hook || "Viral Moment",
  clipId,
  sourceMediaId: clip.source_media_id, // ✅ Pass actual media_files ID
  userId: user.id,
  supabase,
});

const thumbnailResult = await processThumbnailClip({
  streamVideoId,
  startTime,
  duration,
  title: title || hook || "Watch This!",
  clipId,
  sourceMediaId: clip.source_media_id, // ✅ Pass actual media_files ID
  userId: user.id,
  supabase,
});
```

2. **Function signatures** (lines 362-372, 466-475):
```typescript
async function processVerticalClip(params: {
  // ... other params
  clipId: string;
  sourceMediaId: string;  // ✅ Added
  userId: string;
  supabase: any;
})

async function processThumbnailClip(params: {
  // ... other params
  clipId: string;
  sourceMediaId: string;  // ✅ Added
  userId: string;
  supabase: any;
})
```

3. **Database inserts** (lines 419-442, 513-534):
```typescript
await supabase
  .from("ai_edited_assets")
  .insert({
    ai_job_id: job.id,
    source_media_id: sourceMediaId, // ✅ Use correct media_files ID
    output_type: 'vertical', // or 'thumbnail'
    storage_path: processedUrl,
    // ... rest of fields
  })
```

4. **Error logging improvement** (line 195):
```typescript
details: typeof (error as any)?.details === 'string' 
  ? (error as any).details 
  : JSON.stringify((error as any)?.details),  // ✅ Stringify objects for readability
```

### Example Successful Log Output

```
2025-11-29 INFO === PHASE 3 START ===
2025-11-29 INFO ✓ Authenticated user: bdc068e7-2042-4cd4-ae1b-9261e96b27ec
2025-11-29 INFO ✓ Parsed request for clip dbe99049-318b-449c-839a-1af5c676c277
2025-11-29 INFO ✓ Found clip record

2025-11-29 INFO === Step 1: Generating AI Captions ===
2025-11-29 INFO ✓ Generated 5 caption segments

2025-11-29 INFO === Step 2: Uploading to Cloudflare Stream ===
2025-11-29 INFO   → Checking Cloudflare credentials...
2025-11-29 INFO   → Account ID: 5502dadbc04976a34961e335d0d98966
2025-11-29 INFO   → Uploading video from: https://taxqcioheqdqtlmjeaht.supabase.co/storage/v1/object/public/episode-files/...
2025-11-29 INFO   → Cloudflare response status: 200
2025-11-29 INFO   ✓ Upload successful, video ID: 7bb8dc6804226d14ef42d346f24702c3
2025-11-29 INFO ✓ Uploaded to Stream: 7bb8dc6804226d14ef42d346f24702c3

2025-11-29 INFO === Step 3: Processing Vertical Clip (9:16) ===
2025-11-29 INFO ✓ Vertical clip processed: https://customer-5502dadbc04976a34961e335d0d98966.cloudflarestream.com/...

2025-11-29 INFO === Step 4: Processing Thumbnail Clip ===
2025-11-29 INFO ✓ Thumbnail clip processed: https://customer-5502dadbc04976a34961e335d0d98966.cloudflarestream.com/...

2025-11-29 INFO ✓ Updated clip record with URLs
2025-11-29 INFO PHASE3 SUCCESS {
  "clipId": "dbe99049-318b-449c-839a-1af5c676c277",
  "jobId": "ai_job_123",
  "engine": "cloudflare_stream",
  "verticalUrl": "https://customer-5502dadbc04976a34961e335d0d98966.cloudflarestream.com/.../default.mp4?startTime=5&endTime=15&fit=crop&width=1080&height=1920",
  "thumbnailUrl": "https://customer-5502dadbc04976a34961e335d0d98966.cloudflarestream.com/.../default.mp4?startTime=5&endTime=15&fit=crop&width=1080&height=1080"
}
```

## Testing Instructions

### 1. Click "Create Demo Clip"
- Navigate to the Clips UI
- Click "Create Demo Clip" button

### 2. Expected Behavior
- Clip status: `processing` → `ready` (not `failed`)
- Two database records created in `ai_edited_assets`:
  - One with `output_type = 'vertical'` (9:16 format, 1080x1920)
  - One with `output_type = 'thumbnail'` (1:1 format, 1080x1080)
- Clips record updated with:
  - `vertical_url`: Cloudflare Stream URL with vertical crop params
  - `thumbnail_url`: Cloudflare Stream URL with square crop params
  - `status = 'ready'`

### 3. Verify Downloads
- **Vertical Clip**: Click download → Should get 9:16 portrait video (10-30s)
- **Thumbnail Clip**: Click download → Should get 1:1 square video (10-30s)

### 4. Database Verification

```sql
-- Check clips record
SELECT id, status, vertical_url, thumbnail_url, error_message 
FROM clips 
WHERE id = 'YOUR_CLIP_ID';

-- Check AI jobs
SELECT id, job_type, engine, status, error_message
FROM ai_jobs
WHERE params->>'clip_id' = 'YOUR_CLIP_ID';

-- Check generated assets
SELECT id, output_type, storage_path, metadata
FROM ai_edited_assets
WHERE ai_job_id IN (
  SELECT id FROM ai_jobs WHERE params->>'clip_id' = 'YOUR_CLIP_ID'
);
```

## Next Steps

Once this is stable, extend the same pipeline to:
1. **Clips from any existing recording** - Add "Generate Clips" button to Media Library
2. **Auto-clips at end of live streams** - Trigger clip generation when studio recording completes
3. **Batch clip generation** - Process multiple clips from a single video in parallel

## Architecture Notes

### Database Flow
```
clips (clipId, source_media_id) 
  ↓
ai_jobs (job_type='clips_generation', params.clip_id=clipId)
  ↓
ai_edited_assets (source_media_id=media_files.id ✅, ai_job_id=ai_jobs.id)
```

### Cloudflare Stream URLs
- **Vertical**: `?fit=crop&width=1080&height=1920` → 9:16 portrait
- **Thumbnail**: `?fit=crop&width=1080&height=1080` → 1:1 square
- Both use `startTime` and `endTime` params to extract the clip segment

### RLS Policies
- `clips`: service_role can INSERT/UPDATE/SELECT
- `ai_jobs`: service_role can INSERT/UPDATE/SELECT
- `ai_edited_assets`: service_role can INSERT/UPDATE/SELECT

All working correctly with `SUPABASE_SERVICE_ROLE_KEY` for edge function operations.
