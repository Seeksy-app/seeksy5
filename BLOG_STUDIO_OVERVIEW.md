# Blog Studio Overview

## Introduction

The Blog Studio is Seeksy's integrated blogging system that transforms audio/video transcripts into publishable blog content. It connects directly to the Transcript Library and provides a streamlined workflow for content repurposing.

---

## Core Components

### 1. Blog Library
**Route**: `/blog-library` or `/blog`

Central hub for managing all blog content.

**Features**:
- **List View**: Table/card layout showing all blog posts
- **Filters**: All / Draft / Published / Archived
- **Post Information**:
  - Title
  - Source type (Transcript / Manual / Import)
  - Status badge
  - Published date
  - Linked transcript indicator
  - Linked podcast episode indicator
  - Linked video recording indicator

**Actions Available**:
- **Edit** - Open blog editor
- **View** - Public preview (if published)
- **Publish / Unpublish** - Toggle publication status
- **Delete** - Remove blog post
- **Certify** - Create on-chain content credential
- **New Blog Post** - Create from scratch

---

### 2. Blog Editor
**Route**: `/blog/:id/edit` or `/blog/new`

Full-featured blog editor with transcript integration.

**Main Editor Fields**:
- **Title** - Blog post headline
- **Slug** - URL-friendly identifier (auto-normalized)
- **Excerpt** - Short description (meta description)
- **Content** - Full blog text (rich text or markdown)
- **Tags** - Categorization and SEO
- **Status** - Draft / Published toggle
- **Cover Image** - Optional featured image

**Slug Normalization**:
- Auto-converts to lowercase
- Replaces spaces with hyphens
- Removes special characters
- Prevents double hyphens
- Editable by user

**Side Panel (Transcript Source)**:
If blog is linked to a transcript:
- Shows full transcript text (scrollable)
- **"Insert Transcript"** button - Copy selected text to editor
- **"Copy Section"** - Quick reference tool
- Metadata display (source type, duration, language)

**Quick Actions Sidebar**:
- Save Draft
- Publish Now
- Preview
- View Source (if transcript/episode exists)

---

### 3. Blog Certification
**Route**: `/blog/:id/certify`

Optional on-chain content certification.

**Purpose**:
- Prove authorship
- Timestamp creation date
- Create immutable record
- Generate public verification URL

**Certification Process**:
1. User clicks "Certify Blog on-Chain"
2. System generates SHA-256 hash of content
3. Calls `mint-content-credential` edge function
4. Mints credential on Polygon blockchain
5. Stores transaction hash and status
6. Creates public verification page

**Content Credential Card**:
- **Status Badge**: Minted / Pending / Failed
- **Content Type**: Blog Post
- **Title**: Blog post title
- **Summary**: Excerpt or first 200 chars
- **Created At**: Certification timestamp
- **Chain**: Polygon
- **Transaction Hash**: Polygonscan link
- **Public URL**: `/c/:credentialId`
- **Actions**:
  - View Public Credential Page
  - Download Certificate (PNG)
  - Share on Social

---

## Database Schema

### `blog_posts` Table

```sql
CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Source tracking
  source_type TEXT NOT NULL, -- 'transcript' | 'manual' | 'import'
  transcript_id UUID REFERENCES transcripts(id),
  
  -- Content
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  
  -- Publication
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft' | 'published' | 'archived'
  published_at TIMESTAMPTZ,
  
  -- Metadata
  cover_image_url TEXT,
  tags TEXT[] OR JSONB,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique slug per owner
CREATE UNIQUE INDEX blog_posts_user_slug_idx 
  ON blog_posts(user_id, slug);

-- RLS Policies
-- Creators see only their own posts
CREATE POLICY blog_posts_select_own 
  ON blog_posts FOR SELECT 
  USING (auth.uid() = user_id);

-- Admins can see everything
CREATE POLICY blog_posts_select_admin 
  ON blog_posts FOR SELECT 
  USING (is_admin());
```

### `content_credentials` Table

```sql
CREATE TABLE content_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Content reference (one must be set)
  content_type TEXT NOT NULL, -- 'transcript' | 'blog_post'
  transcript_id UUID REFERENCES transcripts(id),
  blog_post_id UUID REFERENCES blog_posts(id),
  
  -- Content hash & metadata
  content_hash TEXT NOT NULL, -- SHA-256
  title TEXT NOT NULL,
  summary TEXT,
  
  -- Blockchain data
  chain TEXT NOT NULL DEFAULT 'polygon',
  tx_hash TEXT,
  token_id TEXT,
  metadata_uri TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'minting' | 'minted' | 'failed'
  metadata JSONB,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique credential per content
CREATE UNIQUE INDEX content_credentials_transcript_idx 
  ON content_credentials(transcript_id) 
  WHERE transcript_id IS NOT NULL;

CREATE UNIQUE INDEX content_credentials_blog_idx 
  ON content_credentials(blog_post_id) 
  WHERE blog_post_id IS NOT NULL;
```

---

## Workflows

### Workflow 1: Create Blog from Transcript

```
1. User records in Podcast Studio or Media Studio
   ↓
2. Transcript auto-generated (ElevenLabs STT)
   ↓
3. User navigates to Transcript Library (/transcripts)
   ↓
4. Opens transcript detail (/transcripts/:id)
   ↓
5. Clicks "Send to Blog Studio" button
   ↓
6. System creates blog_posts row:
   - source_type = 'transcript'
   - transcript_id = [transcript.id]
   - title = [auto-suggested from transcript metadata]
   - content = [full transcript text]
   - status = 'draft'
   ↓
7. Redirects to Blog Editor (/blog/:id/edit)
   ↓
8. User refines content using side panel transcript reference
   ↓
9. User clicks "Publish"
   ↓
10. Blog post live at public URL
   ↓
11. (Optional) User clicks "Certify on-Chain"
   ↓
12. Content credential created with public verification URL
```

### Workflow 2: Create Blog Manually

```
1. User navigates to Blog Library (/blog-library)
   ↓
2. Clicks "New Blog Post" button
   ↓
3. System creates empty blog_posts row:
   - source_type = 'manual'
   - transcript_id = NULL
   - status = 'draft'
   ↓
4. Redirects to Blog Editor (/blog/new)
   ↓
5. User writes content from scratch
   ↓
6. User publishes
```

### Workflow 3: Create Blog from Podcast Studio

```
1. User records podcast episode
   ↓
2. Episode published with transcript
   ↓
3. User clicks "Create Blog from Transcript" in Podcast Studio
   ↓
4. If transcript exists: Jump directly to Blog Editor with linked transcript
   ↓
5. If no transcript: Show prompt to generate transcript first
   ↓
6. User continues with standard blog creation flow
```

---

## Integration Points

### With Transcript Library
- "Send to Blog Studio" button in transcript detail
- Auto-fills blog content from transcript
- Links transcript_id to blog post
- Side panel shows source transcript in editor

### With Podcast Studio
- "Create Blog from Transcript" action in episode view
- Direct routing to blog editor
- Transcript pre-attached if available

### With Media Studio
- Same pattern as Podcast Studio
- Video transcript → Blog conversion
- Metadata carried over (title, duration, etc.)

### With Content Certification
- Optional on-chain certification
- SHA-256 content hash
- Polygon blockchain minting
- Public verification page

### With My Page
- Published blogs can be displayed on creator's My Page
- SEO optimization for public discovery
- Social sharing integration

---

## Edge Functions

### `mint-content-credential`

**Purpose**: Create on-chain content credential for blog posts or transcripts.

**Input**:
```json
{
  "content_type": "blog_post",
  "blog_post_id": "uuid",
  "transcript_id": null
}
```

**Process**:
1. Fetch content text from `blog_posts.content` or `transcripts.raw_text`
2. Normalize and hash content (SHA-256)
3. Create/update `content_credentials` row with `status = 'pending'`
4. Call Polygon minting pipeline (reuses voice minting logic)
5. Mint "Content Credential" NFT with metadata:
   - user_id
   - content_type
   - title
   - hash
   - timestamp
6. On success: Update `tx_hash`, `status = 'minted'`
7. On failure: Update `status = 'failed'`, log error

**Output**:
```json
{
  "success": true,
  "credential": {
    "id": "uuid",
    "content_hash": "sha256...",
    "tx_hash": "0x...",
    "token_id": "content-...",
    "metadata_uri": "ipfs://...",
    "status": "minted"
  }
}
```

---

## Public Pages

### Public Blog Post
**Route**: `/blog/:slug` or `/:username/blog/:slug`

Public-facing blog post display with:
- Full content rendering
- Author information
- Published date
- Tags
- Social sharing buttons
- Related posts (if implemented)
- Content credential badge (if certified)

### Public Content Credential
**Route**: `/c/:credentialId`

Public verification page showing:
- Creator name and handle
- Content type (Blog Post)
- Title and summary
- Created timestamp
- Blockchain details:
  - Chain (Polygon)
  - Transaction hash
  - Polygonscan link
- Explanation text:
  - "This page verifies that this content's cryptographic hash was recorded on the Polygon blockchain via Seeksy."
- Actions:
  - Download certificate (PNG)
  - Share on social media

---

## SEO Considerations

### Meta Tags
All published blog posts include:
- `<title>` - Blog post title + site name
- `<meta name="description">` - Excerpt or first 200 chars
- Open Graph tags for social sharing
- Canonical URL to prevent duplicates

### Sitemap Integration
- Published blogs included in sitemap.xml
- Automatic submission to search engines
- Last modified timestamps

### Schema Markup
```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "Blog post title",
  "author": {
    "@type": "Person",
    "name": "Creator name"
  },
  "datePublished": "ISO timestamp",
  "dateModified": "ISO timestamp"
}
```

---

## Future Enhancements

### Planned Features
- Rich text editor with formatting toolbar
- Markdown support
- Image upload and management
- Embedded media (audio players, video embeds)
- Collaborative editing
- Version history
- Scheduled publishing
- Newsletter integration (auto-send on publish)
- RSS feed generation
- Categories and series
- Comments system
- Analytics dashboard (views, shares, engagement)

### AI Enhancements
- Auto-summarization from transcript
- SEO optimization suggestions
- Title generation
- Tag recommendations
- Content improvement suggestions

---

## Best Practices

### For Creators
1. **Review transcript before converting**: Transcripts may have errors
2. **Edit for readability**: Add paragraphs, headings, formatting
3. **Add value beyond transcript**: Include images, links, context
4. **Use descriptive slugs**: Help with SEO and sharing
5. **Write compelling excerpts**: This is your meta description
6. **Certify important content**: Use blockchain for high-value posts

### For Developers
1. **Validate slugs**: Ensure uniqueness per user
2. **Sanitize content**: Prevent XSS and injection attacks
3. **Handle large transcripts**: Consider pagination or chunking
4. **Optimize queries**: Index by user_id and slug
5. **Cache public pages**: Reduce database load
6. **Monitor edge functions**: Track certification success rates

---

## Troubleshooting

### Common Issues

**Issue**: Slug already exists
- **Solution**: Auto-append timestamp or increment counter

**Issue**: Transcript not loading in side panel
- **Solution**: Check foreign key relationship, verify transcript exists

**Issue**: Certification fails
- **Solution**: Check Polygon network status, retry with exponential backoff

**Issue**: Published blog not appearing publicly
- **Solution**: Verify `status = 'published'` and `published_at` is set

**Issue**: Slow blog list loading
- **Solution**: Implement pagination, add database indexes

---

## Summary

The Blog Studio provides a seamless content repurposing pipeline that transforms audio/video transcripts into publishable blog posts. With optional blockchain certification, creators can prove authorship and timestamp their content immutably. The tight integration with Transcript Library and Studio Suite creates a cohesive content creation workflow from recording to publication.
