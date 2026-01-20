# Seeksy Clips Generation - Phase 3 Architecture

## Overview

Phase 3 implements OpusClip-competitive clip generation with **two export-ready formats** for every viral moment:

1. **Vertical (9:16)** - Instagram Reels, TikTok, YouTube Shorts
2. **Thumbnail (1:1 or 16:9)** - YouTube, LinkedIn, Facebook, Twitter

This document outlines the complete architecture, data flow, and implementation details.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        User Uploads Video                            │
└─────────────────┬───────────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│              Media Library (media_files table)                       │
│              - Stores original video                                 │
│              - Metadata, duration, file_url                          │
└─────────────────┬───────────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   AI Clip Detection                                  │
│                   (analyze-clips function)                           │
│              - Detects viral moments                                 │
│              - Generates hooks and captions                          │
│              - Returns start/end timestamps                          │
└─────────────────┬───────────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                 User Clicks "Generate Clip"                          │
│                  (generate-clip function)                            │
│              - Creates clips record (status: processing)             │
│              - Passes to Phase 3 processor                           │
└─────────────────┬───────────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│              process-clip-phase3 Edge Function                       │
│              ===================================                      │
│                                                                      │
│  Step 1: Generate AI Captions                                       │
│  ├─ Call Lovable AI (Gemini 2.5 Flash)                             │
│  ├─ Parse transcript into 3-5 word segments                         │
│  └─ Return timestamped captions with highlight keywords             │
│                                                                      │
│  Step 2: Upload to Cloudflare Stream                                │
│  ├─ POST source video to Stream API                                 │
│  ├─ Receive Stream video UID                                        │
│  └─ Ready for transformations                                       │
│                                                                      │
│  Step 3: Process Vertical Clip (9:16)                               │
│  ├─ Create ai_jobs record (status: processing)                      │
│  ├─ Apply Cloudflare transformations:                               │
│  │   • Clip to start/end time                                       │
│  │   • Crop to 1080x1920                                           │
│  │   • Face detection & tracking (if available)                     │
│  │   • Dynamic zoom (future: via overlays)                          │
│  ├─ Burn in captions (future: FFmpeg or overlay service)            │
│  ├─ Create ai_edited_assets record                                  │
│  └─ Update ai_jobs (status: completed)                              │
│                                                                      │
│  Step 4: Process Thumbnail Clip (1:1)                               │
│  ├─ Create ai_jobs record (status: processing)                      │
│  ├─ Apply Cloudflare transformations:                               │
│  │   • Clip to start/end time                                       │
│  │   • Crop to 1080x1080 square                                    │
│  │   • Color grading (saturation + contrast)                        │
│  ├─ Add title overlay (future: FFmpeg or overlay service)           │
│  ├─ Create ai_edited_assets record                                  │
│  └─ Update ai_jobs (status: completed)                              │
│                                                                      │
│  Step 5: Update Clip Record                                         │
│  ├─ clips.vertical_url = processed vertical URL                     │
│  ├─ clips.thumbnail_url = processed thumbnail URL                   │
│  └─ clips.status = 'ready'                                          │
│                                                                      │
└─────────────────┬───────────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Clips Gallery UI                                │
│                      ================                                │
│                                                                      │
│  For Each Clip:                                                     │
│  ├─ Show preview (thumbnail or vertical)                            │
│  ├─ Display status badges:                                          │
│  │   • Processing (spinner + "Generating clips...")                 │
│  │   • Ready (9:16 badge + Thumbnail badge)                         │
│  │   • Failed (red badge + error message)                           │
│  ├─ Download buttons:                                               │
│  │   • Download Vertical (9:16 format)                              │
│  │   • Download Thumbnail (1:1 format)                              │
│  └─ Delete button                                                   │
│                                                                      │
│  Auto-refresh every 2s while any clips are processing               │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### `clips` Table
```sql
CREATE TABLE clips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  source_media_id UUID NOT NULL REFERENCES media_files(id),
  
  -- Time range
  start_seconds NUMERIC NOT NULL,
  end_seconds NUMERIC NOT NULL,
  duration_seconds NUMERIC GENERATED ALWAYS AS (end_seconds - start_seconds) STORED,
  
  -- Metadata
  title TEXT,
  suggested_caption TEXT,
  virality_score NUMERIC,
  
  -- Processing status
  status TEXT NOT NULL DEFAULT 'processing', -- 'processing', 'ready', 'failed'
  error_message TEXT,
  
  -- Output URLs
  vertical_url TEXT,      -- 9:16 vertical clip
  thumbnail_url TEXT,     -- 1:1 or 16:9 thumbnail
  storage_path TEXT,      -- Legacy field, points to primary clip
  
  created_at TIMESTAMPTZ DEFAULT now(),
  ai_job_id UUID REFERENCES ai_jobs(id)
);
```

### `ai_jobs` Table
```sql
CREATE TABLE ai_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  
  job_type TEXT NOT NULL, -- 'clips_generation'
  engine TEXT NOT NULL,   -- 'cloudflare_stream'
  
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  
  params JSONB,           -- Stores clip_id, start_time, duration, output_format, etc.
  
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  processing_time_seconds NUMERIC,
  
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### `ai_edited_assets` Table
```sql
CREATE TABLE ai_edited_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ai_job_id UUID NOT NULL REFERENCES ai_jobs(id),
  source_media_id UUID NOT NULL REFERENCES media_files(id),
  
  output_type TEXT NOT NULL, -- 'vertical', 'thumbnail'
  storage_path TEXT NOT NULL, -- Final video URL
  
  duration_seconds NUMERIC,
  thumbnail_url TEXT,
  
  metadata JSONB, -- Stores format, resolution, has_captions, etc.
  
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Video Processing Details

### Vertical Clip (9:16) - OpusClip Style

**Target Platforms**: Instagram Reels, TikTok, YouTube Shorts

**Transformations**:
1. **Crop to 1080x1920** (9:16 aspect ratio)
2. **Face Detection & Tracking** (center speaker in frame)
3. **AI Captions**:
   - White text with subtle shadow
   - 3-5 words per line
   - Highlight key words in yellow (#F5C518)
   - Bottom-third positioning
4. **Dynamic Zooms**:
   - Light movement every 3-5 seconds
   - No jitter, smooth transitions
5. **Optional B-roll Overlay**:
   - 1-2 second stock clips
   - 0.3s crossfade
   - Triggered by AI-detected keywords
6. **Optional Emoji Reactions**:
   - Appear based on sentiment analysis
   - Subtle, non-distracting

**Cloudflare Stream API Call**:
```bash
GET https://customer-{ACCOUNT_ID}.cloudflarestream.com/{VIDEO_UID}/downloads/default.mp4?
  startTime=10
  &endTime=25
  &fit=crop
  &width=1080
  &height=1920
```

### Thumbnail Clip (1:1 or 16:9) - Platform Thumbnail

**Target Platforms**: YouTube, LinkedIn, Facebook, Twitter

**Transformations**:
1. **Crop to 1080x1080** (1:1 square) or 1920x1080 (16:9)
2. **Bold Title Overlay**:
   - AI-generated hook text
   - Top or bottom third
   - High contrast background
3. **Emoji Based on Tone**:
   - 🔥 (exciting/viral)
   - ✨ (inspiring)
   - 😂 (funny)
4. **Color Grading**:
   - Increase saturation (+15%)
   - Increase contrast (+10%)
   - Sharpen edges
5. **Studio-Quality Look**

**Cloudflare Stream API Call**:
```bash
GET https://customer-{ACCOUNT_ID}.cloudflarestream.com/{VIDEO_UID}/downloads/default.mp4?
  startTime=10
  &endTime=25
  &fit=crop
  &width=1080
  &height=1080
```

---

## AI Caption Generation

Uses Lovable AI (Google Gemini 2.5 Flash) for intelligent caption segmentation.

**Prompt Template**:
```
You are a caption generator for short-form social media clips. Generate captions with:
- 3-5 words per line maximum
- Natural speech breaks
- Highlight key words that should be emphasized in yellow
- Return as JSON array: [{ text: "caption text", startTime: 0, endTime: 2, highlight: ["key", "words"] }]

Generate captions for this {duration}s clip transcript:

{transcript}

Return ONLY valid JSON array.
```

**Response Format**:
```json
[
  {
    "text": "You won't believe",
    "startTime": 0,
    "endTime": 1.5,
    "highlight": ["won't", "believe"]
  },
  {
    "text": "what happened next",
    "startTime": 1.5,
    "endTime": 3.0,
    "highlight": ["happened"]
  }
]
```

---

## Storage Architecture

### Storage Paths

**Source Media**:
- Bucket: `episode-files`
- Path: `media/{user_id}/{filename}.mp4`

**Processed Clips (via Cloudflare Stream)**:
- URL Pattern: `https://customer-{ACCOUNT_ID}.cloudflarestream.com/{VIDEO_UID}/downloads/default.mp4?params`
- No local storage needed (served directly from Cloudflare)

**Alternative: Supabase Storage** (if offline downloads needed):
- Bucket: `episode-files`
- Path: `ai-clips/{user_id}/{clip_id}_vertical.mp4`
- Path: `ai-clips/{user_id}/{clip_id}_thumbnail.mp4`

---

## Performance Targets

| Metric | Target | Status |
|--------|--------|--------|
| **Processing Time** | < 45s per clip | ⚠️ In Progress |
| **Vertical Quality** | 1080x1920, 30fps | ✅ Configured |
| **Thumbnail Quality** | 1080x1080, 30fps | ✅ Configured |
| **Caption Accuracy** | > 90% | ⚠️ AI-dependent |
| **UI Responsiveness** | 2s polling | ✅ Implemented |

---

## Environment Variables Required

```env
# Cloudflare Stream
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_STREAM_API_TOKEN=your_stream_api_token

# Lovable AI (for captions)
LOVABLE_API_KEY=auto_generated_by_lovable

# Supabase
SUPABASE_URL=your_project_url
SUPABASE_ANON_KEY=your_anon_key
```

---

## Known Limitations & Future Enhancements

### Current MVP Limitations

1. **Caption Burning**:
   - Currently returned as data but not burned into video
   - **Solution**: Integrate FFmpeg overlay or dedicated caption service

2. **Face Tracking**:
   - Cloudflare Stream basic cropping only
   - **Solution**: Integrate face detection API (e.g., Cloudflare AI or AWS Rekognition)

3. **Dynamic Zooms**:
   - Not yet implemented
   - **Solution**: Add keyframe animation via FFmpeg

4. **B-roll Insertion**:
   - Logic exists but not integrated into video
   - **Solution**: FFmpeg overlay with crossfade transitions

5. **Title Overlays for Thumbnails**:
   - Not yet burned into video
   - **Solution**: FFmpeg text filter with custom font and styling

### Future Enhancements (Post-MVP)

1. **Real-time Face Detection**:
   - Use Cloudflare AI Workers or AWS Rekognition
   - Auto-center speaker in frame with smooth panning

2. **Advanced Caption Styling**:
   - Customizable fonts, colors, animations
   - Per-word highlighting with yellow emphasis
   - Word-level timing synchronization

3. **Emoji Reaction System**:
   - Sentiment analysis on captions
   - Auto-insert contextual emojis (🔥 ✨ 😂 💡)

4. **B-roll Library Integration**:
   - Query B-roll database by keyword
   - Auto-select relevant clips
   - Insert with crossfade transitions

5. **Color Grading Presets**:
   - Cinematic, Vibrant, Moody, Natural
   - One-click application

6. **Multiple Thumbnail Formats**:
   - 1:1 square (Instagram, LinkedIn)
   - 16:9 landscape (YouTube, Twitter)
   - 4:5 portrait (Facebook)

7. **Batch Processing**:
   - Process multiple clips simultaneously
   - Queue system with priority management

---

## Testing Checklist

### Test 1: Demo Clip
- [ ] Click "Create Demo Clip"
- [ ] Verify two outputs generated:
  - [ ] `demo_vertical.mp4` (9:16)
  - [ ] `demo_thumbnail.mp4` (1:1)
- [ ] Verify both URLs are accessible
- [ ] Verify status updates to "ready"

### Test 2: Real User Video (30-60s)
- [ ] Upload video to Media Library
- [ ] Click "Find Clips"
- [ ] Verify viral moments detected
- [ ] Click "Generate Clips" on a moment
- [ ] Verify both outputs:
  - [ ] Correct length (matches detected segment)
  - [ ] Vertical is 1080x1920
  - [ ] Thumbnail is 1080x1080
  - [ ] Video quality is preserved
- [ ] Download both clips
- [ ] Verify files play correctly

### Test 3: Performance
- [ ] Process a 60s clip
- [ ] Measure total time (target: < 45s)
- [ ] Verify no timeout errors
- [ ] Verify UI updates in real-time

### Test 4: Error Handling
- [ ] Try processing invalid video URL
- [ ] Verify error message displays in UI
- [ ] Verify clip status = 'failed'
- [ ] Verify error_message is populated

---

## API Reference

### process-clip-phase3 Function

**Endpoint**: `POST /functions/v1/process-clip-phase3`

**Request Body**:
```json
{
  "clipId": "uuid-of-clip-record",
  "sourceVideoUrl": "https://...",
  "startTime": 10.5,
  "duration": 15.0,
  "title": "Viral Moment",
  "transcript": "Full transcript text...",
  "hook": "You won't believe this!"
}
```

**Response (Success)**:
```json
{
  "success": true,
  "clipId": "uuid",
  "vertical": {
    "url": "https://cloudflare.../vertical.mp4",
    "jobId": "uuid"
  },
  "thumbnail": {
    "url": "https://cloudflare.../thumbnail.mp4",
    "jobId": "uuid"
  },
  "message": "OpusClip-quality clips generated successfully"
}
```

**Response (Error)**:
```json
{
  "error": "Error message",
  "details": "Detailed error info"
}
```

---

## Comparison: Seeksy vs OpusClip

| Feature | Seeksy Phase 3 | OpusClip |
|---------|----------------|----------|
| **Vertical Clips** | ✅ 9:16 format | ✅ 9:16 format |
| **AI Captions** | ⚠️ Generated (not burned) | ✅ Burned in |
| **Face Tracking** | ⚠️ Basic crop | ✅ Advanced tracking |
| **Dynamic Zooms** | ❌ Planned | ✅ Implemented |
| **B-roll Insertion** | ❌ Planned | ✅ Implemented |
| **Thumbnail Format** | ✅ 1:1 square | ✅ Multiple formats |
| **Color Grading** | ⚠️ Basic | ✅ Advanced |
| **Processing Speed** | ⚠️ < 45s | ✅ < 30s |
| **Batch Processing** | ❌ Single clip | ✅ Multi-clip |

**Legend**:
- ✅ Fully implemented
- ⚠️ Partially implemented / In progress
- ❌ Not yet implemented

---

## Version History

- **v1.0 (Phase 1)**: Basic pipeline validation
- **v2.0 (Phase 2)**: Database integration + job tracking
- **v3.0 (Phase 3)**: Real video processing + AI captions (Current)
- **v3.1 (Planned)**: Caption burning + face tracking
- **v4.0 (Future)**: Full OpusClip parity

---

**Last Updated**: November 29, 2024  
**Maintained By**: Seeksy Engineering Team
