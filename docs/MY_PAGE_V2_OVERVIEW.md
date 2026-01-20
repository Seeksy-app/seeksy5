# My Page V2 - Complete Overview

## Introduction

My Page V2 is Seeksy's comprehensive profile builder that allows creators to build beautiful, customizable landing pages with drag-and-drop sections, real-time preview, and seamless integration with all Seeksy modules.

## Core Features

### 1. Profile Management
- **Display Name**: Creator's full name shown on public page
- **Username**: URL-safe handle (lowercase, kebab-case, no special chars)
  - Format: `seeksy.io/{username}`
  - Auto-normalization: spaces → hyphens, uppercase → lowercase
  - Validation: Only `a-z`, `0-9`, single hyphens allowed
- **Bio**: Multi-line creator description
- **Profile Image**: Upload with three style options (circular, square, portrait)
- **Social Links Manager**: Centralized editor for Instagram, YouTube, TikTok, Facebook, LinkedIn, X, Website
  - Per-platform enable/disable toggles
  - URL input with validation
  - Syncs with Social Links section

### 2. Theme Customization
- **Background Types**: Solid color, gradient, or image
- **Card Styles**: Round, square, shadow, or glass morphism
- **Typography**: Font selection and text sizing
- **Color Palette**: Theme color, background, title, bio, link colors
- **Link Styles**: Default, gradient, shadow, outline, filled
- **Mode**: Light/dark mode support

### 3. Section System

My Page V2 supports 12 section types that creators can enable, configure, and reorder:

#### Featured Video
- **Config**: Video selector from media library, title override, description, CTA text/URL
- **Display**: Large video card with play button overlay and CTA

#### Stream Channel
- **Config**: Show past streams toggle
- **Display**: Live indicator when broadcasting, join button, past streams link

#### Social Links
- **Config**: Platform dropdown (Facebook, Instagram, X, TikTok, YouTube, LinkedIn, Website, Custom), URL, optional label
- **Display**: Grid of platform buttons with icons

#### Meetings
- **Config**: Meeting type selector (Seeksy Meetings integration) or external URL, title, description
- **Display**: Calendar card with "Schedule Time" CTA

#### Books
- **Config**: Add multiple books with title, subtitle, cover image, description, CTA label/URL
- **Display**: Book cards with cover art, metadata, and purchase buttons

#### Promo Codes
- **Config**: Add multiple promos with title, code, description, CTA label/URL, optional expiration date
- **Display**: Promo cards with code display, automatically hides expired codes

#### Store
- **Config**: 
  - Mode 1: Shopify integration (domain, storefront token)
  - Mode 2: Manual products (name, price, image, description, CTA)
- **Display**: Product grid with images, prices, and buy buttons

#### Tips / Support Me
- **Config**: Tips title, description, tip amounts array (e.g., [1, 3, 5, 10]), payment methods (PayPal, Venmo, CashApp, Tip Jar)
- **Display**: Tip amount buttons + direct payment method links

#### Custom Links
- **Config**: Unlimited links with label, URL, optional thumbnail, optional group name
- **Display**: Vertical list of custom buttons, grouped by category if specified

#### Podcast
- **Config**: Podcast selector from user's podcasts, show latest episodes toggle, episode count
- **Display**: Podcast cover + title, latest episodes list, "Listen Now" button

#### Blog
- **Config**: Display mode (latest/featured), post count (1-5)
- **Display**: Recent posts with title, excerpt, "Read More" links

#### Newsletter
- **Config**: Newsletter title, description
- **Display**: Email input with subscribe button, privacy notice

### 4. Share System
- Page URL with copy button
- Share via text message
- QR code generator
- NFC Creator Card waitlist

### 5. Preview System
- **Devices**: Mobile (375px), Tablet (768px), Desktop (100%)
- **Modes**: Edit (click to navigate sections) vs Preview (normal user behavior)
- **Real-time Updates**: All changes instantly reflected in phone mockup
- **Scrollable**: Full page preview with independent scroll

## Data Architecture

### Database Tables

#### `my_page_sections`
Stores all section configurations per user:
```sql
- id (uuid, PK)
- user_id (uuid, FK to profiles)
- section_type (enum)
- display_order (integer)
- is_enabled (boolean)
- config (jsonb) -- Section-specific configuration
- created_at, updated_at (timestamps)
```

#### `profiles`
Extended with My Page v2 fields:
```sql
- my_page_v2_theme (jsonb) -- Full theme configuration
- username (unique, indexed)
- page_background_color, theme_color (legacy compatibility)
```

### Section Config Schema

Each section type stores its configuration in the `config` JSONB column:

```typescript
interface SectionConfig {
  // Featured Video
  videoId?: string;
  videoTitle?: string;
  videoDescription?: string;
  ctaText?: string;
  ctaUrl?: string;

  // Stream Channel
  showPastStreams?: boolean;

  // Social Links
  links?: Array<{
    platform: string;
    url: string;
    label?: string;
  }>;

  // Meetings
  meetingTypeId?: string;
  externalUrl?: string;
  title?: string;
  description?: string;

  // Books
  books?: Array<{
    id: string;
    title: string;
    subtitle?: string;
    coverImage: string;
    description: string;
    ctaLabel: string;
    ctaUrl: string;
  }>;

  // Promo Codes
  promoCodes?: Array<{
    id: string;
    title: string;
    code: string;
    description: string;
    ctaLabel: string;
    ctaUrl: string;
    expirationDate?: string;
  }>;

  // Store
  storeMode?: 'shopify' | 'manual';
  shopifyDomain?: string;
  shopifyToken?: string;
  products?: Array<{
    id: string;
    name: string;
    price: number;
    image: string;
    description: string;
    ctaLabel: string;
    ctaUrl: string;
  }>;

  // Tips
  tipsEnabled?: boolean;
  tipsMessage?: string;
  tipAmounts?: number[];
  paymentMethods?: Array<{
    type: 'cashapp' | 'venmo' | 'paypal' | 'tipjar';
    username: string;
    url: string;
  }>;

  // Custom Links
  customLinks?: Array<{
    id: string;
    label: string;
    url: string;
    thumbnail?: string;
    groupName?: string;
  }>;

  // Podcast
  podcastId?: string;
  showLatestEpisodes?: boolean;
  episodeCount?: number;

  // Blog
  blogDisplayMode?: 'latest' | 'featured';
  blogPostCount?: number;

  // Newsletter
  newsletterTitle?: string;
  newsletterDescription?: string;
}
```

## Routes

- **Builder**: `/profile/edit` - My Page v2 builder interface
- **Public Page**: `/{username}` - Public-facing My Page
- **Legacy**: `/profile/edit/legacy` - Old profile editor (deprecated)

## Integration Points

### Seeksy Modules
- **Media Library**: Featured Video section pulls from user's uploaded videos
- **Meetings**: Meetings section integrates with Seeksy Meetings app
- **Podcasts**: Podcast section displays user's podcast with episodes
- **Blog**: Blog section pulls from user's published blog posts
- **Newsletter**: Newsletter section connects to subscriber management
- **Voice Certification**: Auto-displays Voice Certified badge when user is certified

### External Integrations
- **Shopify**: Store section supports Shopify product sync
- **Social Platforms**: Social Links connect to Instagram, YouTube, etc.
- **Payment Processors**: Tips section supports PayPal, Venmo, CashApp

## User Workflows

### Creator Setup Flow
1. Navigate to `/profile/edit`
2. **Profile Tab**: Set display name, username, bio, image, social links
3. **Theme Tab**: Choose colors, background, card style, typography
4. **Sections Tab**: Enable sections, drag to reorder, click gear to configure
5. **Share Tab**: Get page URL, QR code, share via text/social
6. Click "Publish" to save all changes

### Public Visitor Flow
1. Visit `seeksy.io/{username}`
2. See profile header with image, name, bio, Voice Certified badge (if applicable)
3. Scroll through enabled sections in configured order
4. Click CTAs to visit external pages, book meetings, purchase products, etc.

## Technical Implementation

### Components
- `MyPageBuilderV2.tsx` - Main builder interface
- `BuilderSidebar.tsx` - Left panel with tabs (Profile, Theme, Sections, Share)
- `PreviewPane.tsx` - Right panel with device preview and mode toggle
- `ProfileSection.tsx` - Profile editor with social links manager
- `ThemeSection.tsx` - Theme customization controls
- `SectionsPanel.tsx` - Section list wrapper
- `ShareSection.tsx` - Sharing tools (URL, QR, NFC)
- `SectionsManager.tsx` - Drag-and-drop section list with enable/config controls
- `SectionConfigDrawer.tsx` - Per-section configuration UI
- `PublicSectionRenderer.tsx` - Public page section rendering
- `MyPagePreview.tsx` - Live preview component

### State Management
- Theme state managed in `MyPageBuilderV2.tsx` using `useState`
- Sections loaded via React Query from `my_page_sections` table
- Real-time preview updates via prop drilling
- Save operation persists full theme + sections to database

### Styling
- Tailwind CSS with design system tokens
- Glassmorphism effects via `backdrop-blur`
- Responsive breakpoints (mobile-first)
- Dark mode support via CSS variables
- Animations with Tailwind `transition-all`

## Known Limitations & TODOs

### Current Limitations
1. **Live Streaming Status**: `is_live` check not yet implemented (placeholder returns false)
2. **Shopify Products**: Product sync from Shopify API not yet implemented (manual mode works)
3. **Newsletter Subscriptions**: Email capture form not yet connected to subscriber backend
4. **Tips Payment**: Tip buttons UI only (actual payment processing requires Stripe integration)
5. **Blog Posts**: Limited to user's own blog posts (no featured/curated posts)

### Planned Features
- Analytics per section (clicks, views, engagement)
- A/B testing for section ordering
- Custom CSS injection for advanced users
- Section templates (pre-configured section bundles)
- Import/export theme configurations
- Scheduling (enable/disable sections on schedule)

## Best Practices

### For Creators
1. Use clear, professional profile photos
2. Keep bio concise (2-3 sentences max)
3. Enable 3-5 core sections (avoid overwhelming visitors)
4. Use high-quality cover images for books/products
5. Test on mobile device (most traffic is mobile)
6. Update promo codes and links regularly

### For Developers
1. Always validate username format before saving
2. Check section `is_enabled` flag before rendering
3. Handle missing data gracefully (show empty states)
4. Lazy-load section data (videos, podcasts, meetings)
5. Optimize images (use CDN URLs when possible)
6. Test with long content (bio, descriptions) to avoid layout breaks

## Support & Resources

- **Help Center**: `/help` - User documentation
- **Admin Support**: Contact admin team for custom section requests
- **Voice Certification**: `/voice-certification` - Get verified badge
- **Analytics**: Track page views and section engagement (coming soon)

---

*Last Updated: 2025-11-28*
*Version: 2.0*