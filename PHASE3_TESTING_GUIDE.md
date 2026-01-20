# Phase 3 Clip Generation - Testing Guide

**Purpose**: Validate that the OpusClip-competitive clip pipeline produces TWO distinct, export-ready video formats.

---

## 🎯 Testing Goals

1. Verify vertical (9:16) clips are generated correctly
2. Verify thumbnail (1:1) clips are generated correctly
3. Confirm both clips are visibly different from source
4. Validate processing speed (< 45s per clip)
5. Test error handling and user feedback

---

## 📋 Pre-Flight Checklist

Before testing, verify:

- [ ] Logged in as Creator or Admin user
- [ ] Cloudflare credentials configured in Admin → Secrets
- [ ] At least one video uploaded to Media Library
- [ ] Browser console open for debugging
- [ ] Network tab open to monitor edge function calls

---

## Test Suite

### Test 1: Demo Clip Generation ⭐ START HERE

**Purpose**: Validate the complete pipeline with pre-configured test data.

**Steps**:
1. Navigate to **Media Library** → **Create Clips** tab
2. Click **"Create Demo Clip"** button
3. Observe loading state: "Creating demo clip..."
4. Wait 30-60 seconds
5. Clip appears in gallery

**Expected Results**:
- ✅ Clip card appears with processing spinner
- ✅ Status updates: "Generating clips..." → "Ready"
- ✅ Two format badges appear: "9:16" and "Thumbnail"
- ✅ Two download buttons appear:
  - "Download Vertical"
  - "Download Thumbnail"

**Download & Verify**:
1. Click "Download Vertical"
2. Open downloaded file
3. **Verify**:
   - Aspect ratio is portrait/tall (9:16)
   - Duration is 15-30s (not full video)
   - Video quality is good
4. Click "Download Thumbnail"
5. Open downloaded file
6. **Verify**:
   - Aspect ratio is square (1:1)
   - Same duration as vertical
   - Cropping is different from vertical

**Success Criteria**:
- [ ] Both files download successfully
- [ ] Vertical is clearly portrait format
- [ ] Thumbnail is clearly square format
- [ ] Processing completed in < 60s
- [ ] No error messages

**If Test Fails**:
- Check browser console for errors
- Check Supabase → Functions → process-clip-phase3 logs
- Verify Cloudflare credentials
- Check clips table status field

---

### Test 2: Real User Video

**Purpose**: Validate with actual user-uploaded content.

**Setup**:
1. Upload a 30-60s video to Media Library
   - Use a talking-head video (for face tracking validation)
   - Ensure clear audio/speech
2. Navigate to Create Clips
3. Select your uploaded video

**Steps**:
1. Click **"Find Clips"** (AI analysis)
2. Wait for AI to detect viral moments
3. Review suggested moments (should show 2-5 clips)
4. Click **"Generate"** on the first moment
5. Observe processing (30-60s)
6. Download both formats

**Expected Results**:
- ✅ AI detects 2-5 moments from your video
- ✅ Each moment has a suggested title and caption
- ✅ Virality scores displayed (0-100%)
- ✅ Both formats generate successfully
- ✅ Clips are trimmed to the detected moment

**Quality Check**:
1. **Vertical Clip**:
   - Portrait orientation (9:16)
   - Speaker/subject is centered
   - Duration matches detected moment
   - No black bars on sides
2. **Thumbnail Clip**:
   - Perfect square (1:1)
   - Subject is well-framed
   - Good for social media thumbnail
   - High visual quality

**Success Criteria**:
- [ ] Clips are shorter than source (trimmed correctly)
- [ ] Vertical clip looks good on phone (portrait)
- [ ] Thumbnail clip looks good as preview image
- [ ] Processing time < 45s per clip
- [ ] No visual artifacts or corruption

---

### Test 3: Multiple Clips (Batch)

**Purpose**: Validate pipeline handles multiple clips without issues.

**Steps**:
1. From Test 2, generate 3 more clips
2. Generate all 3 simultaneously (click Generate on each)
3. Monitor processing status
4. Verify all complete successfully

**Expected Results**:
- ✅ All clips show "processing" initially
- ✅ Clips complete independently (not blocking each other)
- ✅ All clips reach "ready" status
- ✅ No database conflicts or errors

**Success Criteria**:
- [ ] Multiple clips process simultaneously
- [ ] No failures or timeouts
- [ ] All clips generate both formats
- [ ] Gallery updates correctly

---

### Test 4: Error Handling

**Purpose**: Verify the system handles failures gracefully.

**Test 4a: Invalid Video URL**
1. Manually trigger clip generation with bad URL (developer console):
```javascript
supabase.functions.invoke('generate-clip', {
  body: {
    mediaId: 'valid-media-id',
    fileUrl: 'https://invalid-url.com/video.mp4',
    startTime: 0,
    endTime: 10,
  }
})
```

**Expected**:
- ✅ Error message appears in UI
- ✅ Clip status = 'failed'
- ✅ Error message is user-friendly
- ✅ Can delete failed clip

**Test 4b: Missing Credentials**
1. Temporarily remove Cloudflare credentials (optional)
2. Try generating clip
3. Verify error handling

**Expected**:
- ✅ Clear error: "Cloudflare credentials not configured"
- ✅ Clip status = 'failed'

---

### Test 5: Performance Benchmark

**Purpose**: Measure actual processing times.

**Setup**:
1. Prepare 3 videos of varying lengths:
   - 30s video
   - 60s video
   - 120s video

**Steps**:
1. For each video:
   - Generate 1 clip
   - Record timestamps:
     - T1: Click "Generate"
     - T2: Status becomes "ready"
   - Calculate: Total Time = T2 - T1

**Target Performance**:
- 30s source → 15s clip → < 30s processing
- 60s source → 25s clip → < 45s processing
- 120s source → 30s clip → < 60s processing

**Record Results**:
```
Test 5 Results:
- 30s video: ___s processing time
- 60s video: ___s processing time
- 120s video: ___s processing time

Average: ___s
```

---

## 📸 Visual Verification Checklist

When reviewing generated clips, confirm:

### Vertical Clip (9:16) - Instagram/TikTok Ready
- [ ] Clearly portrait orientation (tall, narrow)
- [ ] Subject/speaker is centered in frame
- [ ] No black bars on top/bottom
- [ ] Looks good on mobile phone screen
- [ ] File size is reasonable (< 50MB for 30s)

### Thumbnail Clip (1:1) - Social Media Thumbnail
- [ ] Perfect square format
- [ ] Subject is well-framed in center
- [ ] Looks good as a preview/poster image
- [ ] No distortion or stretching
- [ ] File size is reasonable (< 40MB for 30s)

---

## 🐛 Common Issues & Fixes

### Issue: "Both clips look identical to source"
**Cause**: Cloudflare transformations not applying  
**Fix**: Check Cloudflare Stream API response in logs  
**Verify**: URL includes `?fit=crop&width=1080&height=1920`

### Issue: "Captions not visible in video"
**Status**: ⚠️ **EXPECTED** - Caption burning not yet implemented  
**Current**: Captions generated in background (check logs)  
**Next Sprint**: FFmpeg overlay integration

### Issue: "Processing takes > 90s"
**Cause**: Cloudflare upload bottleneck  
**Fix**: Pre-upload videos to Stream on initial media upload  
**Alternative**: Implement background job queue

### Issue: "Clips are full length (not trimmed)"
**Cause**: Start/end time parameters not applied  
**Fix**: Verify Cloudflare Stream clipping API call  
**Check**: logs should show startTime and endTime parameters

### Issue: "Download fails or corrupts"
**Cause**: URL might be temporary or expired  
**Fix**: Store clips in Supabase Storage for permanent access  
**Alternative**: Generate presigned URLs with longer expiration

---

## 📊 Success Metrics for Board Demo

**Must Have** (Phase 3 MVP):
- ✅ Two distinct formats per clip
- ✅ Correct aspect ratios (9:16 and 1:1)
- ✅ Trimmed to detected moments
- ✅ Processing completes in < 60s
- ✅ Download and playback work

**Nice to Have** (Phase 3.1):
- ⚠️ Captions burned into video
- ⚠️ Face tracking and centering
- ⚠️ Dynamic zooms
- ⚠️ Title overlays on thumbnail

**Future** (Phase 4):
- ❌ B-roll insertion
- ❌ Emoji reactions
- ❌ Color grading presets
- ❌ Batch processing

---

## 🎬 Expected Output Examples

### Demo Clip - Before & After

**Source Video**:
```
Format: 16:9 landscape (1920x1080)
Duration: 60s
Content: Person talking to camera
```

**After Phase 3 Processing**:

**Vertical Clip**:
```
Format: 9:16 portrait (1080x1920)
Duration: 15s (trimmed to viral moment)
Content: Speaker centered, vertical frame
Quality: HD, good compression
File: demo_vertical.mp4
```

**Thumbnail Clip**:
```
Format: 1:1 square (1080x1080)
Duration: 15s (same moment)
Content: Square crop, centered subject
Quality: HD, optimized for thumbnail
File: demo_thumbnail.mp4
```

---

## 📝 Test Results Log

**Date**: _____________

**Test 1 - Demo Clip**:
- [ ] Pass / [ ] Fail
- Notes: _______________________________

**Test 2 - Real Video**:
- [ ] Pass / [ ] Fail
- Processing Time: _____s
- Notes: _______________________________

**Test 3 - Multiple Clips**:
- [ ] Pass / [ ] Fail
- Clips Generated: _____
- Notes: _______________________________

**Test 4 - Error Handling**:
- [ ] Pass / [ ] Fail
- Notes: _______________________________

**Test 5 - Performance**:
- [ ] Pass / [ ] Fail
- Average Time: _____s
- Notes: _______________________________

**Overall Status**: [ ] Ready for Demo / [ ] Needs Work

---

**Next Action**: Run Test 1 (Demo Clip) and record results above.
