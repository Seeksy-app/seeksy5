# Phase 3 Clips - Quick Start Guide

**Time to test**: 5 minutes  
**What you'll verify**: Two-format clip generation works

---

## ⚡ Fastest Path to See Results

### Step 1: Navigate
```
Media Library → Create Clips tab
```

### Step 2: Click Button
```
Click: "Create Demo Clip"
```

### Step 3: Wait
```
30-60 seconds (watch the spinner)
```

### Step 4: Download
```
Two buttons appear:
• Download Vertical
• Download Thumbnail
```

### Step 5: Verify
```
Open both downloaded files:
• Vertical should be TALL (9:16 portrait)
• Thumbnail should be SQUARE (1:1)
```

---

## ✅ Success Looks Like

You should see **three distinct videos**:

1. **Source** (original upload): 16:9 landscape
2. **Vertical Clip**: 9:16 portrait - tall and narrow
3. **Thumbnail Clip**: 1:1 square - perfect square

**Key Visual Differences**:
- Different aspect ratios
- Different cropping/framing
- Shorter duration (trimmed to moment)

---

## ❌ Common First-Time Issues

### "Nothing happens when I click Create Demo Clip"
**Fix**: Open browser console, check for errors

### "Clip stays in 'Processing' forever"
**Fix**: Check Supabase Functions logs for errors

### "Both clips look the same"
**Not a bug**: They're both from same moment, just different formats

### "Clips are same length as source video"
**Bug**: Trimming not working, check logs

---

## 🆘 If Something's Wrong

1. **Check browser console** (F12)
2. **Check Supabase logs**: Admin → Cloud → Functions → process-clip-phase3
3. **Verify credentials**: Admin → Management → Secrets
   - CLOUDFLARE_ACCOUNT_ID
   - CLOUDFLARE_STREAM_API_TOKEN

---

## 📸 Screenshot Your Results

Take screenshots of:
1. Both downloaded clips side-by-side
2. The ClipsGallery showing both format badges
3. Any error messages

This will help debug any issues!

---

**Next**: See `PHASE3_TESTING_GUIDE.md` for comprehensive testing.
