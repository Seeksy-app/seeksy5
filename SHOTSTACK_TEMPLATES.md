# Shotstack Template System

Seeksy uses Shotstack for professional video clip rendering with 11 pre-built templates optimized for different platforms and use cases.

## Template Library

### Vertical Templates (9:16 - Reels, TikTok, Shorts)

1. **vertical_template_1** - Hero Title + Subtitle
   - Big title bar at top
   - Subtitle at bottom
   - Clean, minimal design

2. **vertical_template_2** - Hook + CTA
   - Attention-grabbing hook at top
   - Subtle subtitle in middle
   - CTA pill at bottom (last 2 seconds)

3. **vertical_template_3** - Title Card → Clip → CTA End Card
   - 1-second branded title card intro
   - Main video content
   - 1.5-second CTA end card

4. **vertical_template_4** - Subtitle Heavy (Reels Style)
   - Always-on large subtitles
   - Creator handle at top
   - Optimized for sound-off viewing

5. **vertical_template_5** - Split Speaker + Logo
   - Full video with logo badge
   - CTA appears last 3 seconds

### Horizontal Templates (16:9 - YouTube, Webinars)

1. **horizontal_template_1** - Webinar / Talk
   - Standard presentation format
   - Title bar (3 seconds)
   - Lower-third subtitle

2. **horizontal_template_2** - Speaker Name + Tagline
   - Lower-third with name
   - Logo in top-right corner
   - Professional conference style

3. **horizontal_template_3** - End Card CTA
   - Main clip content
   - Branded end card (last 2 seconds)

### Square Templates (1:1 - Feed Posts)

1. **square_template_1** - Feed Card + Captions
   - Title overlay (2.5 seconds)
   - Continuous subtitles at bottom
   - Universal social feed format

2. **square_template_2** - Quote / Pull Line
   - Big centered quote
   - Shows for 3 seconds
   - High-impact opener

3. **square_template_3** - Split Frame + CTA
   - Logo in corner
   - CTA bar at bottom (last 3 seconds)
   - Clean product/brand showcase

## Dynamic Placeholders

All templates support these dynamic values:

- `{{VIDEO_URL}}` - Source video URL
- `{{CLIP_LENGTH_SECONDS}}` - Duration in seconds
- `{{TITLE_TEXT}}` - Main title
- `{{SUBTITLE_TEXT}}` - Subtitle/description
- `{{HOOK_TEXT}}` - Short attention-grabbing line
- `{{USERNAME_OR_TAGLINE}}` - Creator name or tagline
- `{{CTA_TEXT}}` - Call-to-action text
- `{{BRAND_COLOR_PRIMARY}}` - Brand color (hex/rgba)
- `{{LOGO_URL}}` - Logo image URL (PNG with alpha)

## Using Templates

### In Edge Function

```typescript
// Submit render with specific template
const response = await supabase.functions.invoke('submit-shotstack-render', {
  body: {
    clipId: 'uuid',
    cloudflareDownloadUrl: 'https://...',
    length: 15,
    templateName: 'vertical_template_2', // Specify template
    collectionId: 'optional-collection-uuid'
  }
});
```

### Template Selection Logic

If no `templateName` is provided, the system falls back to:
- `orientation: 'horizontal'` → `horizontal_template_1`
- `orientation: 'vertical'` (default) → `vertical_template_1`

## Clip Collections

Organize clips into collections (folders/playlists):

```typescript
// Create a collection
const { data: collection } = await supabase
  .from('clip_collections')
  .insert({
    name: 'Podcast: Creator Stories',
    description: 'Viral moments from season 1'
  })
  .select()
  .single();

// Create clip in collection
const response = await supabase.functions.invoke('submit-shotstack-render', {
  body: {
    clipId: 'uuid',
    cloudflareDownloadUrl: 'https://...',
    length: 15,
    templateName: 'vertical_template_4',
    collectionId: collection.id // Link to collection
  }
});
```

## Database Schema

### clip_collections
- `id` (UUID) - Primary key
- `user_id` (UUID) - Creator who owns collection
- `name` (TEXT) - Collection name
- `description` (TEXT) - Optional description
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### clips (updated)
- `collection_id` (UUID) - Optional link to collection
- `template_name` (TEXT) - Template used for rendering

## Best Practices

1. **Template Selection**
   - Vertical templates for social media (Reels, TikTok, Shorts)
   - Horizontal for YouTube, webinars, conferences
   - Square for Instagram feed, LinkedIn, Twitter/X

2. **Text Content**
   - Keep titles under 60 characters
   - Subtitles under 120 characters
   - CTAs should be 2-5 words max

3. **Brand Consistency**
   - Use consistent `BRAND_COLOR_PRIMARY` across all clips
   - Upload logo once and reuse `LOGO_URL`
   - Set creator handle in user profile for automatic `USERNAME_OR_TAGLINE`

4. **Collections**
   - Group by podcast series, campaign, or client
   - Use descriptive names for easy discovery
   - Archive old collections instead of deleting

## Future Enhancements

Planned additions:
- Auto-captions from transcript
- Face detection and smart cropping
- B-roll insertion
- Dynamic color grading
- Music soundtrack selection
- Multi-language subtitle support
