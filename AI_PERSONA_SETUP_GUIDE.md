# AI Persona Setup Guide

Your interactive AI persona showcase is now ready! Here's how to set it up:

## 🎬 Step 1: Generate AI Videos

Choose one of these services to create talking head videos:

### Recommended Services:

1. **HeyGen** (https://www.heygen.com/)
   - Best for: Photo-realistic avatars
   - Pricing: Free trial, $24/mo for creators
   - Upload a photo and script, get video in minutes

2. **D-ID** (https://www.d-id.com/)
   - Best for: Quick generation and API access
   - Pricing: Free tier available, $5.90/mo starter
   - Easiest for batch creation

3. **Synthesia** (https://www.synthesia.io/)
   - Best for: Professional quality at scale
   - Pricing: $22/mo personal plan
   - 140+ AI avatars included

### What to Create:

Create 3 personas representing your target audience:

1. **Creator/Podcaster Persona**
   - Name: e.g., "Sarah Chen"
   - Script: "Hi, I'm Sarah, a content creator. I use Seeksy to stream live, edit with AI, and connect with my audience all in one place."
   - Length: 15-20 seconds

2. **Advertiser/Brand Persona**
   - Name: e.g., "Marcus Johnson"
   - Script: "I'm Marcus, a brand marketer. Seeksy helps me reach engaged audiences through targeted campaigns and real-time analytics."
   - Length: 15-20 seconds

3. **Agency/Team Lead Persona**
   - Name: e.g., "Emily Rodriguez"
   - Script: "Hey, I'm Emily. I manage multiple creators for my agency. Seeksy gives me the tools to coordinate campaigns and track ROI effortlessly."
   - Length: 15-20 seconds

## 📸 Step 2: Create Thumbnails (Optional)

For each video, create a static thumbnail:
- Screenshot the first frame of your video
- Or use a professional headshot
- Dimensions: 600x800px (3:4 aspect ratio)
- Format: JPG or PNG

## 🗂️ Step 3: Upload Videos

1. Upload your generated videos to:
   - Your Supabase Storage bucket, OR
   - A CDN like Cloudflare R2, OR
   - YouTube/Vimeo (use embed URLs)

2. Get the direct video URLs (must end in .mp4 or be embed-compatible)

## 🎨 Step 4: Add Personas to Seeksy

1. Navigate to `/admin/personas`
2. Click "Add Persona"
3. Fill in the form for each persona:

   **Creator Example:**
   ```
   Name: Sarah Chen
   Role: creator
   Tagline: "Stream, create, and grow your audience"
   Description: "Content creators use Seeksy to go live, edit videos with AI, and engage their community through one powerful platform."
   Video URL: https://your-storage.com/sarah-video.mp4
   Thumbnail URL: https://your-storage.com/sarah-thumb.jpg (optional)
   Display Order: 1
   ```

   **Advertiser Example:**
   ```
   Name: Marcus Johnson
   Role: advertiser
   Tagline: "Reach your audience where they engage"
   Description: "Brands and advertisers use Seeksy to run targeted campaigns, track real-time analytics, and connect with highly engaged creator audiences."
   Video URL: https://your-storage.com/marcus-video.mp4
   Thumbnail URL: https://your-storage.com/marcus-thumb.jpg (optional)
   Display Order: 2
   ```

   **Agency Example:**
   ```
   Name: Emily Rodriguez
   Role: agency
   Tagline: "Manage campaigns at scale"
   Description: "Agencies and team leads use Seeksy to coordinate multiple creators, track campaign performance, and deliver results for clients."
   Video URL: https://your-storage.com/emily-video.mp4
   Thumbnail URL: https://your-storage.com/emily-thumb.jpg (optional)
   Display Order: 3
   ```

4. Click "Create Persona"

## ✨ Step 5: Test the Experience

1. Go to your homepage at `/`
2. Scroll to the "Meet Your Guide" section
3. **Hover over each persona card** - video should play automatically
4. **Click on a persona** - modal opens with full video and details
5. Verify:
   - Videos play on hover
   - Modal displays correctly
   - "Get Started" button works

## 🔧 Customization Tips

### Change Colors/Branding:
Edit `/src/components/personas/PersonaVideoCard.tsx` to match your brand colors

### Adjust Grid Layout:
Edit `/src/components/personas/PersonaGrid.tsx`:
- Change `md:grid-cols-2 lg:grid-cols-3` to adjust column count
- Adjust gap size with the `gap-8` class

### Homepage Placement:
The personas currently appear:
1. Below the hero section
2. Before the live streaming section

To add to other pages, import `<PersonaGrid />` component anywhere.

## 📊 Best Practices

1. **Video Quality:**
   - Keep videos under 30 seconds
   - Use 720p or 1080p resolution
   - Optimize file size (aim for <10MB per video)

2. **Script Tips:**
   - Start with a friendly greeting
   - State who you are and what you do
   - Explain one key benefit of using Seeksy
   - End with an inviting tone

3. **Persona Diversity:**
   - Use different demographics in your avatars
   - Vary speaking styles (casual vs. professional)
   - Choose distinct visual appearances

## 🐛 Troubleshooting

**Video won't play on hover:**
- Check video URL is publicly accessible
- Verify file format is .mp4
- Check browser console for CORS errors

**Modal doesn't open:**
- Clear browser cache
- Check console for JavaScript errors

**Videos load slowly:**
- Compress videos (use Handbrake or similar)
- Consider using a CDN for faster delivery
- Enable lazy loading if you have many personas

## 🎉 You're Done!

Your interactive AI persona showcase is live! Visitors can now:
- See engaging AI representatives of your user base
- Interact with hover-to-play functionality
- Click to learn more about how Seeksy serves each audience

Questions? The persona management interface is always available at `/admin/personas`
