# Seeksy Podcast Dashboard Overview

## Purpose

The Podcast Dashboard is the central hub for creators to manage their podcasts, episodes, analytics, monetization, and distribution across all major platforms.

## Key Features

### 1. Overview Tab
- Podcast metadata and branding
- Quick actions (Create Episode, Studio, Share)
- Stats cards (episodes, listens, duration, countries, subscriptions)
- Recent episodes list
- Monetization snapshot
- Distribution status across platforms

### 2. Episodes Tab
- Sortable episode list with status, listens, duration
- Quick actions: edit, view, launch studio, submit to awards
- Create new episode button

### 3. Players Tab
- Seeksy Player embed preview
- Light/dark mode toggle
- Directory links (Apple, Spotify, Amazon, RSS)

### 4. Website Tab
- Auto-generated podcast website preview
- SEO settings (title, description, keywords, OG image)
- Custom domain setup with DNS instructions
- Theme selection

### 5. Monetization Tab
- Revenue breakdown by episode and ad type
- Active/completed ad campaigns
- Ad slots management (pre/mid/post-roll)
- Proposals management
- Voice ad tools integration

### 6. Stats Tab
- Listening analytics and retention curves
- Demographics (age, location)
- Platform analytics (Spotify, Apple, YouTube, Seeksy)
- Episode performance table

## RLS & Security

### Overview
Row Level Security (RLS) policies control data access for podcasts and episodes to ensure creators can only access their own content while admins maintain full oversight.

### Podcasts Table Policies

**Creator Policies:**
- `Users can create their own podcasts` (INSERT): Allows authenticated users to create podcasts where `auth.uid() = user_id`
- `Users can view their own podcasts` (SELECT): Creators can only see podcasts they own
- `Users can update their own podcasts` (UPDATE): Creators can edit their own podcast metadata
- `Users can delete their own podcasts` (DELETE): Creators can remove their own podcasts

**Public Policies:**
- `Published podcasts are viewable by everyone` (SELECT): Any user can see podcasts marked as `is_published = true`

**Admin Policies:**
- `Admins can view all podcasts` (SELECT): Admins and super_admins can see all podcasts regardless of owner
- `Admins can manage all podcasts` (ALL): Admins have full CRUD access to all podcasts for moderation and support

### Episodes Table Policies

**Creator Policies:**
- `Users can create episodes for their podcasts` (INSERT): Creators can add episodes to podcasts they own
- `Users can view their own episodes` (SELECT): Creators can only see episodes from their podcasts
- `Users can update their own episodes` (UPDATE): Creators can edit episodes they own
- `Users can delete their own episodes` (DELETE): Creators can remove episodes from their podcasts

**Public Policies:**
- `Published episodes are viewable by everyone` (SELECT): Public can see episodes that are published AND belong to published podcasts

**Admin Policies:**
- `Admins can view all episodes` (SELECT): Admins can see all episodes across all podcasts
- `Admins can manage all episodes` (ALL): Admins have full CRUD access for support and moderation

### Data Isolation

**What this prevents:**
- Creators cannot see other creators' unpublished podcasts or episodes
- Creators cannot modify or delete content they don't own
- Public users only see published content
- No data leakage between creator accounts

**How admins access everything:**
The `has_role()` security definer function checks the `user_roles` table to determine if a user has the `admin` or `super_admin` role, granting them bypass access to all RLS restrictions.

### Testing RLS

To verify RLS is working correctly:

1. **Creator Test**: Log in as `creator@seeksy.dev`
   - Create a new podcast
   - Add episodes
   - Verify you can only see your own content
   - Verify you cannot access other creators' podcasts

2. **Admin Test**: Log in as admin account
   - Verify you can see all podcasts from all creators
   - Verify you can edit any podcast/episode for moderation

3. **Public Test**: Log out
   - Verify only published podcasts/episodes are visible
   - Verify unpublished content is hidden

## Integration Points

### Podcast Studio
- Record audio episodes
- Export directly to podcast episodes
- Auto-transcription integration
- Ad marker support

### Content Certification
- Voice certification for episodes
- Blockchain credential minting
- Public verification pages

### Awards Platform
- Submit episodes to award programs
- Direct integration from episode pages

### My Page
- Display podcast feed on creator profile
- Show latest episodes
- Subscriber count integration

## Routes

- `/podcasts` - Podcast library (all creator's podcasts)
- `/podcasts/:podcastId` - Individual podcast dashboard
- `/podcasts/:podcastId/episodes/new` - Create new episode
- `/podcasts/:podcastId/episodes/:episodeId` - Episode detail/edit
- `/podcasts/:podcastId/studio` - Podcast Studio (audio recording)
- `/podcasts/:podcastId/stats` - Detailed analytics

## Data Flow

```
Studio Recording → Export Episode → Podcast Episodes Table
                                    ↓
                              Auto-transcription
                                    ↓
                              Transcript Library
                                    ↓
                               Blog Creation
                                    ↓
                            Content Certification
```

## Future Enhancements

- Multi-host support
- Guest collaboration
- Advanced analytics (listener demographics, retention analysis)
- Automated social media posting
- Dynamic ad insertion with real-time bidding
- Podcast network management
