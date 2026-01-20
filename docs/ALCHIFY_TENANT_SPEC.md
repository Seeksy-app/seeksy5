# Alchify Tenant Specification

## Overview

- **Tenant ID**: `alchify`
- **Name**: Alchify
- **Tagline**: "The Crucible for Creators"
- **Domain**: alchifydemo.com
- **Core Product**: Refiner AI – upload raw content → get polished, platform-ready assets

---

## 1. Alchify Configuration Object

```typescript
export const alchifyConfig: TenantConfig = {
  id: 'alchify',
  name: 'Alchify',
  tagline: 'The Crucible for Creators',
  domain: 'alchifydemo.com',
  
  branding: {
    logo: '/assets/alchify/logo.svg',
    logoMark: '/assets/alchify/mark.svg',
    favicon: '/assets/alchify/favicon.ico',
    colors: {
      // Gold/amber primary with dark background (crucible/alchemy theme)
      primary: 'hsl(45, 90%, 55%)',           // Warm gold
      primaryForeground: 'hsl(0, 0%, 5%)',
      secondary: 'hsl(220, 20%, 18%)',        // Dark slate
      accent: 'hsl(35, 85%, 50%)',            // Copper/bronze
      background: 'hsl(220, 25%, 6%)',        // Near black
      foreground: 'hsl(45, 10%, 95%)',        // Warm white
      muted: 'hsl(220, 15%, 12%)',
      mutedForeground: 'hsl(220, 10%, 55%)',
      border: 'hsl(220, 15%, 18%)',
      card: 'hsl(220, 20%, 10%)',
      cardForeground: 'hsl(45, 10%, 95%)',
    },
    fonts: {
      heading: 'Inter',
      body: 'Inter',
    },
    borderRadius: '0.625rem',
  },
  
  modules: {
    // Core Alchify features
    studio: true,
    refiner: true,
    transcription: true,
    clipGenerator: true,
    dashboard: true,
    analytics: true,
    integrations: true,
    
    // Disabled (not part of Alchify MVP)
    podcasts: false,
    meetings: false,
    events: false,
    crm: false,
    newsletter: false,
    monetization: false,
  },
  
  navigation: {
    layout: 'sidebar',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', path: '/' },
      { id: 'upload', label: 'Upload', icon: 'Upload', path: '/upload' },
      { id: 'projects', label: 'Projects', icon: 'FolderOpen', path: '/projects' },
      { id: 'refiner', label: 'Refiner Studio', icon: 'Wand2', path: '/refiner' },
      { id: 'exports', label: 'Exports', icon: 'Download', path: '/exports' },
      { divider: true },
      { id: 'integrations', label: 'Integrations', icon: 'Plug', path: '/integrations' },
      { id: 'analytics', label: 'Analytics', icon: 'BarChart3', path: '/analytics' },
      { id: 'settings', label: 'Settings', icon: 'Settings', path: '/settings' },
    ],
  },
  
  aiAgent: {
    name: 'Refiner AI',
    persona: 'alchify-refiner',
    avatar: '/assets/alchify/refiner-ai.svg',
    greeting: "Hey! I'm Refiner AI — ready to transform your raw content into polished, platform-ready assets. What are we working on today?",
    systemPrompt: ALCHIFY_AI_SYSTEM_PROMPT,  // See section 2
    capabilities: [
      'transcription',
      'filler-removal',
      'caption-sync',
      'format-conversion',
      'noise-reduction',
      'export-guidance',
    ],
    ui: 'slide-out',
  },
  
  features: {
    deepfakeProtection: true,
    blockchainCertification: false,  // Phase 2+
    factChecking: false,             // Phase 2+
    translations: false,             // Phase 2+
    aiDisclosure: true,
    watermarking: true,
  },
  
  auth: {
    providers: ['email', 'google'],
    requireEmailVerification: false,
    allowSignup: true,
  },
};
```

---

## 2. Refiner AI System Prompt

```typescript
const ALCHIFY_AI_SYSTEM_PROMPT = `You are Refiner AI, the Alchify content transformation assistant.

IDENTITY
- Name: Refiner AI
- Platform: Alchify ("The Crucible for Creators")
- Role: Help creators transform raw long-form content into polished, repurposed assets

CORE PRINCIPLES ("Alchify's Way")
1. NO deepfakes or synthetic faces/voices — we only refine real creators
2. Authenticity, attribution, and IP protection by default
3. Accessible outputs (captions, alt text, translations)
4. Transparency: never a black box; creators can see raw vs refined
5. Every edit is reversible and user-controlled

CAPABILITIES
- Transcription guidance (explain accuracy, confidence scores)
- Filler word detection and removal recommendations
- Caption sync and formatting
- Platform-specific format conversion (TikTok, Reels, Shorts, podcast)
- Noise reduction and audio cleanup guidance
- Export optimization tips

RESPONSE STYLE
- Concise and helpful (2-3 sentences typical)
- Technical when needed, friendly always
- Always explain what AI is doing and why
- Suggest next steps proactively

BOUNDARIES
- Never generate synthetic voices or faces
- Never claim to "create" content — you REFINE existing content
- Never make unverifiable claims about content
- Always disclose when AI assistance was used

When unsure, ask clarifying questions. Always prioritize creator control.`;
```

---

## 3. Module Feature Matrix

| Module | Enabled | MVP Scope |
|--------|---------|-----------|
| **Dashboard** | ✅ | Upload CTA, recent projects, revive content cards |
| **Upload** | ✅ | Drag-drop upload, file type validation, progress |
| **Projects** | ✅ | List view, status badges, quick actions |
| **Refiner Studio** | ✅ | Transcript editor, dual view, timeline, cleanup tools |
| **Transcription** | ✅ | Speech-to-text, confidence scoring, speaker labels |
| **Clip Generator** | ✅ | Auto-suggest clips, format presets, export |
| **Captions** | ✅ | Sync editor, burn-in toggle, SRT/WebVTT export |
| **Audio Cleanup** | ✅ | Noise reduction, normalization, ducking |
| **Exports** | ✅ | Format presets, download history, watermarking |
| **Integrations** | ✅ | YouTube, TikTok, Instagram, Substack stubs |
| **Analytics** | ✅ | Time saved, accuracy stats, usage metrics |
| **Settings** | ✅ | Profile, preferences, branding memory |

---

## 4. Database Tables (Alchify-Specific)

All tables include `tenant_id = 'alchify'` for isolation.

### Core Tables

```sql
-- Projects
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'alchify',
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'uploaded',  -- uploaded, transcribing, editing, ready, exported
  source_file_url TEXT,
  source_file_type TEXT,  -- video, audio
  source_duration_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Transcripts
CREATE TABLE transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'alchify',
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  content TEXT,
  segments JSONB,  -- [{start, end, text, confidence, speaker}]
  avg_confidence DECIMAL(4,3),
  word_count INTEGER,
  filler_words_detected INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Exports
CREATE TABLE exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'alchify',
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  format TEXT,  -- tiktok, reels, shorts, podcast, blog
  file_url TEXT,
  file_size_bytes BIGINT,
  includes_captions BOOLEAN DEFAULT false,
  includes_watermark BOOLEAN DEFAULT true,
  ai_disclosure BOOLEAN DEFAULT true,
  metadata JSONB,  -- creator_id, project_id, timestamp, version
  created_at TIMESTAMPTZ DEFAULT now()
);

-- AI Action Log (Authenticity Layer)
CREATE TABLE ai_action_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'alchify',
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  action_type TEXT,  -- transcribe, remove_fillers, sync_captions, etc.
  action_details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Integrations (stub for OAuth tokens)
CREATE TABLE user_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'alchify',
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT,  -- youtube, tiktok, instagram, substack
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  profile_data JSONB,
  connected_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 5. Refiner Studio UI Components

### 5.1 Project Editor Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ ← Back to Projects          Project Title             [Export] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────┐  ┌──────────────────────────────────┐ │
│  │                     │  │  Transcript Editor               │ │
│  │   Video Preview     │  │  ────────────────────────────    │ │
│  │   [Raw] [Refined]   │  │  00:00 - 00:05  "So, um, today  │ │
│  │                     │  │  we're going to talk about..."   │ │
│  │   ◄ ▶ ▶▶           │  │                                  │ │
│  │   0:00 / 5:32       │  │  00:05 - 00:12  "The main idea  │ │
│  │                     │  │  is that content creation..."    │ │
│  └─────────────────────┘  │                                  │ │
│                           │  [Filler words: 12] [Remove All] │ │
│  ┌─────────────────────┐  └──────────────────────────────────┘ │
│  │ Tools               │                                       │
│  │ • Filler Removal    │  ┌──────────────────────────────────┐ │
│  │ • Caption Sync      │  │  Captions Timeline               │ │
│  │ • Noise Reduction   │  │  ─────────────────────────────── │ │
│  │ • Format Convert    │  │  [======●==========]  2:15       │ │
│  └─────────────────────┘  └──────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ 💬 Refiner AI                                    [Expand] │ │
│  │ "I found 12 filler words. Want me to highlight them?"     │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Dashboard Cards

```tsx
// Dashboard layout
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  {/* Upload CTA */}
  <UploadCard />
  
  {/* Recent Projects */}
  <RecentProjectsCard projects={recentProjects} />
  
  {/* Revive Content (placeholder for analytics-driven suggestions) */}
  <ReviveContentCard />
</div>

{/* Quick Stats */}
<div className="grid grid-cols-4 gap-4 mt-6">
  <StatCard label="Time Saved" value="4.2 hrs" />
  <StatCard label="Projects" value="12" />
  <StatCard label="Exports" value="34" />
  <StatCard label="Avg Accuracy" value="96.2%" />
</div>
```

---

## 6. Integration Stubs (MVP)

| Platform | MVP Scope | Future |
|----------|-----------|--------|
| **YouTube** | OAuth connect + profile display | Direct upload |
| **TikTok** | OAuth connect + profile display | Direct upload |
| **Instagram** | OAuth connect + profile display | Direct upload |
| **Substack** | Manual export (formatted HTML) | API publish |

---

## 7. Analytics Metrics (MVP)

| Metric | Calculation |
|--------|-------------|
| **Time Saved** | Estimated based on content duration × 0.75 (manual edit baseline) |
| **Accuracy Score** | Average transcript confidence across all projects |
| **Projects Created** | Count of user's projects |
| **Exports Generated** | Count of completed exports |
| **Filler Words Removed** | Sum of filler_words_detected across projects |

---

## 8. Open Questions / Gaps

1. **Transcription Provider**: Spec mentions Deepgram — do we abstract this or commit to one provider?
   - Recommendation: Abstract with `TranscriptionService` interface

2. **Video Processing**: Auto-cropping and aspect conversion requires server-side video processing
   - Recommendation: Use Shotstack or similar; design hooks now, implement in Phase 2

3. **Branding Memory**: Spec mentions "upload sample past content"
   - Recommendation: MVP = metadata storage only; actual style matching is Phase 2+

4. **Blockchain Hooks**: Spec wants architecture hooks
   - Recommendation: Define `CertificationService` interface with `certify(projectId)` method

5. **Multi-language Captions**: Not in MVP but mentioned
   - Recommendation: Design for it (locale field in exports), implement later

---

## 9. Alchify MVP Roadmap Phases

| Phase | Focus | Deliverables |
|-------|-------|--------------|
| **1** | Foundation | Tenant config, auth, dashboard shell, upload flow |
| **2** | Core Pipeline | Transcription, transcript editor, filler detection, dual view |
| **3** | Authenticity | AI action logging, watermarking, no-deepfake UI constraints |
| **4** | Export & Polish | Format presets, caption burn-in, SRT export, analytics lite |
| **5** | Alpha Ready | Integration stubs, 50-100 creator capacity, bug fixes |
| **6** | Backlog | Translations, fact-checking, blockchain certs, style matching |
