# Seeksy Podcast Dashboard - Complete Overview

## Introduction

The Seeksy Podcast Dashboard is a comprehensive podcast management interface providing creators with unified access to content creation, distribution, monetization, and analytics for their podcasts.

## Navigation

### Routes
- **Podcast List**: `/podcasts` - Overview of all user's podcasts
- **Podcast Dashboard**: `/podcasts/:podcastId` - Full dashboard for a specific podcast
- **Alternate Route**: `/podcast-distribution` - Multi-podcast selector view

### Tabs
The dashboard includes 8 tabs with persistent selection (localStorage):

1. **Overview** - Podcast summary, quick actions, stats, recent episodes
2. **Episodes** - Episode management and publishing
3. **Studio** - Recording, upload, AI enhancement tools
4. **Players** - Embed codes and directory links
5. **Website** - Public website preview, SEO, custom domain
6. **Monetization** - Revenue tracking, ad campaigns, voice tools
7. **Stats** - Detailed analytics, charts, demographics
8. **Directories** - Distribution status (Apple, Spotify, Amazon, RSS)

## Tab Details

### 1. Overview Tab

**Purpose**: Quick snapshot of podcast health and fast access to common actions.

**Features**:
- **Hero Band**: Podcast artwork, title, host name, quick actions
  - Create Episode (→ Episode editor)
  - Open Studio (→ Studio tab)
  - Share (copy RSS feed URL)
  - RSS Feed (external link)
- **Stats Cards** (4-column grid):
  - Total Episodes
  - Total Listens (from impressions)
  - Estimated Revenue
  - Ad Impressions
- **Recent Episodes**: 5 most recent with title, date, publish status
- **Distribution Status**: Apple, Spotify, Amazon, RSS with status badges (Listed/Pending/Not Submitted)

**Data Sources**:
- `podcasts` table
- `episodes` table
- `podcast_directories` table
- `/api/financials/revenue/by-podcast` API
- `getPodcastRevenue()` helper

---

### 2. Episodes Tab

**Purpose**: Manage all podcast episodes (create, edit, publish, delete).

**Features**:
- **Episode List**: Sortable table with title, date, duration, status, listens
- **Actions per Episode**:
  - Edit (→ episode editor)
  - View (public player page)
  - Go to Studio (→ Studio tab with episode context)
  - Submit to Awards (→ Awards submission flow)
- **Create Episode**: Button to create new episode from Studio or upload

**Data Sources**:
- `episodes` table
- `ad_slots` table (for ad read tracking)

---

### 3. Studio Tab (NEW)

**Purpose**: Record, upload, and prepare episodes with AI assistance.

**Features**:
- **Hero Section**: Podcast cover, title, tagline ("Record, edit, and publish...")
  - "Open Full Studio" button (→ `/podcast-studio` with podcast context)
  - "View Tutorials" button
- **Script Editor**: 
  - Text area with word count
  - "Generate with AI" button (future: auto-generate scripts)
  - Save script functionality
- **Audio Upload**:
  - Drag-and-drop or click to upload (MP3, WAV, M4A, 500MB max)
  - File preview (name, size)
  - Episode title and description fields (shown after upload)
- **AI Enhancement Tools** (Right Panel):
  - Remove filler words
  - Generate show notes
  - Enhance audio quality
- **Publishing Checklist** (Right Panel):
  - Audio uploaded ✓
  - Title added ✓
  - Description written ✓
  - Cover art selected ✓
- **Action Footer**:
  - "Send to AI Editor" button (future: post-production pipeline)
  - "Publish Episode" button (→ episode creation form)

**Workflow**:
1. Upload audio file
2. Add title + description
3. (Optional) Write/generate script
4. Apply AI enhancements
5. Publish or send to editor

**Data Sources**:
- `podcasts` table
- Episode creation flow integrates with Episodes tab

**Design**: Style B - Clean, modern, Apple-like UI with:
- Bold hero with gradient background
- Two-column layout (workflow left, context right)
- Glassmorphism cards
- Subtle shadows and rounded corners (12-20px)
- Primary color accents

---

### 4. Players Tab

**Purpose**: Embed podcast player on external websites and view directory links.

**Features**:
- **Seeksy Player Embed**: Preview with light/dark toggle, sizing options, copy embed code
- **Directory Links**: Auto-populated links to Apple, Spotify, Amazon, RSS
- **Distribution Instructions**: How to submit podcast to directories

**Data Sources**:
- `podcasts` table (for RSS feed URL)
- `podcast_directories` table (for submission status)

---

### 5. Website Tab

**Purpose**: Manage podcast website, SEO, and custom domain.

**Features**:
- **Website Preview**: Embed or iframe of podcast's public page
- **Edit Website**: Link to My Page builder
- **SEO Settings**:
  - SEO Title (60 char max)
  - SEO Description (160 char max)
  - Keywords (comma-separated)
  - Open Graph image upload
- **Custom Domain**:
  - Domain input (e.g., `podcast.yourdomain.com`)
  - DNS configuration instructions (CNAME or A record)

**Data Sources**:
- `podcasts` table
- SEO settings stored in localStorage (temporary) or `podcast_settings` table

---

### 6. Monetization Tab

**Purpose**: Track revenue, manage ad campaigns, and configure monetization settings.

**Features**:
- **Revenue Summary** (3-column grid):
  - Total Revenue (all-time)
  - Total Impressions
  - Ad Reads
- **Revenue by Episode Chart**: Bar chart showing per-episode earnings
- **Ad Campaigns**: List of active/completed campaigns with:
  - Campaign name
  - Impressions count
  - Amount spent
  - Status badge (active/paused/completed)
- **Ad Slot Configuration**:
  - Pre-roll, mid-roll, end-roll toggles
  - VAST tag integration status
- **Voice Ad Tools**:
  - Voice Ad Script Generator (link)
  - View Certified Voice Profile (link)

**Data Sources**:
- `/api/financials/revenue/by-podcast` API
- `ad_campaigns` table
- `ad_slots` table
- `getPodcastRevenue()` helper (aggregates episode-level revenue)

**Design**: Enhanced with:
- Rounded chart corners
- Soft gridlines
- Hover states on campaign cards
- Gradient accent card for Voice Tools

---

### 7. Stats Tab

**Purpose**: Detailed analytics and listener insights.

**Features**:
- **Key Metrics** (4-column grid):
  - Total Listens
  - Average Completion %
  - Subscribers
  - Countries Reached
- **Listens Over Time**: Line chart (last 30 days)
- **Platform Distribution**: Pie chart (Spotify 45%, Apple 30%, YouTube 15%, Seeksy 10%)
- **Top Countries**: List with flags and listen counts
- **Episode Performance Table**: Per-episode stats (listens, completion, new subs, revenue)

**Data Sources**:
- `podcast_stats` table (when implemented)
- `episodes` table
- Mock data for demonstration (real analytics coming from impression tracking)

**Known Issues (FIXED)**:
- ✅ Date duplication bug resolved (now generates 30 unique days)

---

### 8. Directories Tab

**Purpose**: Submit podcast to major directories (Apple, Spotify, Amazon).

**Features**:
- Platform submission forms
- Status tracking per directory
- RSS feed validation
- Submission guidelines

**Data Sources**:
- `podcast_directories` table

---

## Visual Design System

### Style Guidelines (Applied Across All Tabs)
- **Cards**: Consistent shadow (`shadow-sm`), rounded corners (`rounded-xl`), hover effects
- **Typography**: Clear hierarchy (titles 2xl, descriptions sm, metadata xs)
- **Icons**: 4px-5px sizes, positioned left of labels
- **Colors**: Primary brand color for accents, muted for secondary info
- **Spacing**: Consistent gap-4/gap-6 between elements
- **Charts**: Rounded bars, soft gridlines, branded tooltips

### Tab Visual Enhancements
- **Tab Icons**: Each tab has icon (Home, FileText, Radio, Monitor, Globe, DollarSign, BarChart3, List)
- **Active State**: 2px bottom border, primary text color, smooth transition
- **Hover**: Subtle background change
- **Responsive**: Tabs scroll horizontally on mobile

### Empty States
All tabs show friendly empty states:
- Icon (12x12, 50% opacity)
- Title message
- Optional subtitle with guidance
- CTA button when applicable

---

## Integration Architecture

### Financial APIs
```typescript
// Revenue calculation per podcast
GET /api/financials/revenue/by-podcast?podcastId={id}

Response:
{
  podcast_id: string;
  total_revenue: number;
  total_impressions: number;
  total_ad_reads: number;
  episodes: Array<{
    episode_id: string;
    revenue_amount: number;
    impression_count: number;
  }>;
}
```

### Monetization Engine
The Monetization Engine coordinates:
- Episode-level ad read events
- Impression tracking (internal + external platforms)
- CPM-based revenue calculations
- Voice certification uplift multipliers
- Campaign spend tracking

Formula:
```
episodeRevenue = (impressions / 1000) * CPM * adReadMultiplier * voiceCertMultiplier
```

Default values (configurable in `revenueModelConfig.ts`):
- `defaultCpm`: $25
- `adReadMultiplier`: 1.0
- `voiceCertUplift`: 1.2 (20% bonus for certified voices)

### Content Certification Integration
- Episodes can be certified via `/content-certification` flow
- Certification adds blockchain proof of authenticity
- Certified episodes display badge and may earn CPM uplift

---

## Developer Guide

### Adding a New Tab
1. Create tab component in `src/components/podcast/`
2. Import in `PodcastDetail.tsx` and `PodcastDistribution.tsx`
3. Add TabsTrigger with icon and label
4. Add TabsContent with component
5. Update localStorage key if persistence needed

### Extending Monetization
1. Add revenue source to Monetization Engine
2. Create financial API endpoint
3. Update `getPodcastRevenue()` to include new source
4. Add UI card/chart in MonetizationTab
5. Update CFO Dashboard aggregation

### Custom Analytics
1. Create impression tracking event
2. Store in `ad_impressions` or `podcast_stats`
3. Query in StatsTab
4. Render in chart/table

---

## Performance Considerations

### Query Optimization
- All tabs use React Query with caching
- Episodes limited to 5 on Overview, unlimited on Episodes tab
- Campaigns limited to 10 on Monetization tab
- Charts limit data points (last 30 days, top 10 episodes)

### Loading Strategy
- Skeleton states shown during data fetch
- Independent tab loading (no global spinner)
- Lazy-load chart libraries (Recharts)

---

## Future Enhancements

### Planned Features
1. **Real-time Analytics**: Live listener counts during broadcasts
2. **Advanced Scheduling**: Schedule episode publishes
3. **Collaboration**: Multi-host podcast management
4. **Integrations**: Zapier, IFTTT webhooks
5. **AI Show Notes**: Auto-generate show notes from transcript
6. **Chapter Markers**: Visual chapter editor in Studio
7. **Audiograms**: Auto-generate social clips from episodes
8. **Cross-promotion**: Suggest other Seeksy podcasts to listeners

### Analytics Roadmap
- Listener retention curves per episode
- Traffic source attribution (where listeners find you)
- Conversion tracking (listen → subscribe → support)
- Predictive analytics (estimated growth, revenue forecast)

---

## Support & Documentation

- **Creator Help**: `/help` - General Seeksy help
- **Podcast-specific**: `/help/podcasts` - Podcast creation guides
- **Monetization**: `/help/monetization` - Revenue optimization tips
- **Technical Specs**: RSS 2.0, Apple Podcasts spec, Spotify metadata

---

*Last Updated: 2025-11-28*
*Version: 2.0 (Studio Tab Added)*