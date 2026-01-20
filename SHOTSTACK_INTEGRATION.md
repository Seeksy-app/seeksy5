# Shotstack Integration for Video Clipping

## Overview

Seeksy uses **Shotstack Edit API** for professional-grade video transcoding and clip generation. Shotstack provides FFmpeg-based processing with async job handling and webhook callbacks.

## Architecture

### 1. Clip Creation Flow

```
User Request → Create Clip Record → Submit to Shotstack → Poll Status → Final Video Ready
```

### 2. Components

#### Edge Functions

- **`submit-shotstack-render`** - Submits render jobs to Shotstack Edit API
- **`shotstack-webhook`** - Receives status updates from Shotstack

#### Frontend Hooks

- **`useShotstackClips`** - React hook for submitting renders and polling status

#### Database Fields (clips table)

- `shotstack_job_id` - Shotstack render job ID for tracking
- `shotstack_status` - Current status: queued, fetching, rendering, done, failed
- `source_cloudflare_url` - Cloudflare Stream MP4 download URL used as source
- `vertical_url` - Final rendered video URL (when status === "done")
- `status` - Overall clip status: pending, processing, ready, failed

---

## Usage

### Submit a Render Job

```typescript
import { useShotstackClips } from "@/hooks/useShotstackClips";

const { submitShotstackRender, pollClipStatus } = useShotstackClips();

// 1. Submit render job
const result = await submitShotstackRender({
  clipId: "uuid-of-clip-record",
  cloudflareDownloadUrl: "https://customer-xxx.cloudflarestream.com/.../default.mp4",
  start: 0, // Optional: offset within source video (defaults to 0)
  length: 10, // Duration in seconds
  orientation: "vertical", // 'vertical' (9:16) or 'horizontal' (16:9)
});

// 2. Poll for completion (optional)
const completedClip = await pollClipStatus(
  result.clipId,
  (status) => console.log("Status:", status), // Callback on status change
  60, // Max attempts (default 60)
  5000 // Interval in ms (default 5000)
);

console.log("Final video URL:", completedClip.vertical_url);
```

---

## Shotstack API Details

### Render Request Payload

```json
{
  "timeline": {
    "tracks": [
      {
        "clips": [
          {
            "asset": {
              "type": "video",
              "src": "https://customer-xxx.cloudflarestream.com/xxx/downloads/default.mp4"
            },
            "start": 0,
            "length": 10,
            "scale": 1,
            "fit": "crop"
          }
        ]
      }
    ]
  },
  "output": {
    "format": "mp4",
    "size": {
      "width": 1080,
      "height": 1920
    }
  },
  "callback": "https://xxx.supabase.co/functions/v1/shotstack-webhook",
  "disk": "local"
}
```

### Render Response

```json
{
  "success": true,
  "message": "Created",
  "response": {
    "message": "Render Successfully Queued",
    "id": "6ae6d970-4a95-47e5-af38-3c95e01835d8"
  }
}
```

### Webhook Payload (Status Updates)

Shotstack POSTs to `/functions/v1/shotstack-webhook`:

```json
{
  "id": "6ae6d970-4a95-47e5-af38-3c95e01835d8",
  "owner": "xxx",
  "action": "render-status",
  "type": "status",
  "status": "done",
  "url": "https://cdn.shotstack.io/xxx/xxx.mp4",
  "completed": "2025-01-15T12:34:56.789Z",
  "data": {
    "duration": 10.5,
    "size": 5242880
  }
}
```

**Status Values:**
- `queued` - Job accepted, waiting to start
- `fetching` - Downloading source video
- `rendering` - Processing video
- `done` - Complete, final URL available
- `failed` - Error occurred

---

## Database Schema

### Clips Table Updates

```sql
ALTER TABLE clips
ADD COLUMN shotstack_job_id TEXT,
ADD COLUMN shotstack_status TEXT,
ADD COLUMN source_cloudflare_url TEXT;

CREATE INDEX idx_clips_shotstack_job_id ON clips(shotstack_job_id);
```

---

## Environment Variables

### Required Secrets

```
SHOTSTACK_API_KEY=your_production_api_key
SHOTSTACK_WEBHOOK_SECRET=your_webhook_secret (optional, for HMAC verification)
```

Add secrets via Supabase dashboard or CLI.

---

## Webhook Security (Optional)

Shotstack sends HMAC signatures in webhook headers:

- `x-shotstack-signature` - HMAC-SHA256 signature
- `x-shotstack-timestamp` - Unix timestamp

To verify (future implementation):

```typescript
const SHOTSTACK_WEBHOOK_SECRET = Deno.env.get("SHOTSTACK_WEBHOOK_SECRET");
const signature = req.headers.get("x-shotstack-signature");
const timestamp = req.headers.get("x-shotstack-timestamp");

// Verify signature matches HMAC of payload + timestamp
```

---

## Supported Output Formats

### Vertical (9:16) - Social Media
- **Resolution:** 1080x1920
- **Use Case:** Instagram Reels, TikTok, YouTube Shorts
- **Fit:** Crop to prevent pillarboxing

### Horizontal (16:9) - YouTube
- **Resolution:** 1920x1080
- **Use Case:** YouTube, LinkedIn, Facebook
- **Fit:** Crop

---

## Error Handling

### Common Errors

1. **"Shotstack API key not configured"**
   - Add `SHOTSTACK_API_KEY` secret to Supabase

2. **"Clip not found or access denied"**
   - Verify `clipId` belongs to authenticated user

3. **"Shotstack render failed"**
   - Check source URL is accessible
   - Verify MP4 format compatibility
   - Check Shotstack API status

### Failed Renders

When Shotstack returns `status: "failed"`:

```typescript
// Webhook updates clip record
{
  status: "failed",
  shotstack_status: "failed",
  error_message: "Error message from Shotstack"
}
```

---

## Future Enhancements

### Multi-Clip Timelines
Support multiple video segments in one render:

```json
{
  "timeline": {
    "tracks": [
      {
        "clips": [
          { "asset": { "src": "video1.mp4" }, "start": 0, "length": 5 },
          { "asset": { "src": "video2.mp4" }, "start": 5, "length": 5 }
        ]
      }
    ]
  }
}
```

### Overlays
Add watermarks, text, logos:

```json
{
  "timeline": {
    "tracks": [
      { "clips": [{ "asset": { "type": "video", "src": "..." } }] },
      { "clips": [{ "asset": { "type": "image", "src": "logo.png" } }] }
    ]
  }
}
```

### Custom Presets
Pre-configured output profiles for different platforms.

---

## Testing

### Manual Test

```bash
# 1. Create a clip record in clips table with:
#    - user_id, source_media_id, start_seconds, end_seconds, status='pending'

# 2. Call submit-shotstack-render
curl -X POST https://xxx.supabase.co/functions/v1/submit-shotstack-render \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "clipId": "uuid-of-clip",
    "cloudflareDownloadUrl": "https://customer-xxx.cloudflarestream.com/.../default.mp4",
    "length": 10,
    "orientation": "vertical"
  }'

# 3. Wait for webhook callback (Shotstack calls shotstack-webhook automatically)

# 4. Check clip status
SELECT * FROM clips WHERE id = 'uuid-of-clip';
```

---

## Links

- [Shotstack Edit API Docs](https://shotstack.io/docs/api/edit/)
- [Shotstack Dashboard](https://dashboard.shotstack.io/)
- [Webhook Reference](https://shotstack.io/docs/api/webhooks/)

---

## Summary

✅ **Shotstack handles all FFmpeg processing**  
✅ **Async job model with webhook callbacks**  
✅ **Works perfectly with Cloudflare Stream MP4 downloads**  
✅ **Production-ready with proper error handling**  
✅ **Supports vertical (9:16) and horizontal (16:9) outputs**  
✅ **Database-tracked status for all renders**
