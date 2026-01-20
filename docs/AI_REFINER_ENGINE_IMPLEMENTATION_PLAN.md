# AI Refiner Engine - Seeksy Implementation Plan

## Executive Summary

This document outlines a phased approach to transform Seeksy's existing AI Production Studio and AI Clips system into an enterprise-grade "AI Refiner Engine" comparable to competitors like OpusClip, Descript, and the described "Refiner AI" model.

---

## Current State Assessment

### ✅ What's Already Working

| Component | Status | Notes |
|-----------|--------|-------|
| **Shotstack Integration** | ✅ Functional | 11 templates, vertical/horizontal/square formats |
| **Text Overlays** | ⚠️ Partial | Title/subtitle/hook/CTA text overlays work via Shotstack templates |
| **AI Clip Detection** | ✅ Working | Lovable AI (Gemini) finds viral moments from transcripts |
| **Cloudflare Stream** | ✅ Working | Video hosting, clipping API |
| **Transcription** | ⚠️ Basic | ElevenLabs STT exists but lacks word-level timestamps |
| **Clip Jobs Pipeline** | ✅ Working | clip_jobs, clips tables, status tracking |
| **Clip Preview UI** | ✅ Working | Real-time caption overlay from transcript words |
| **Certification/NFT** | ✅ Working | Polygon mainnet minting for clips |

### ❌ Current Gaps

| Component | Status | Required Action |
|-----------|--------|-----------------|
| **Word-Level Timestamps** | ❌ Missing | ElevenLabs STT doesn't return word timing |
| **Animated Captions** | ❌ Missing | Need word-by-word highlighting in rendered output |
| **Filler Word Removal** | ❌ Missing | Detection exists, actual editing missing |
| **Silence Trimming** | ❌ Missing | Requires FFmpeg or cloud video processing |
| **Noise Cleanup/EQ** | ❌ Missing | Requires audio processing pipeline |
| **Multi-Speaker Detection** | ❌ Missing | Need diarization integration |
| **Creator Style Learning** | ❌ Missing | No historical analysis system |
| **Content Pipeline Dashboard** | ❌ Missing | Raw → Refined → Ready workflow |
| **Auto-Posting** | ⚠️ Partial | OAuth exists for YT/IG, posting logic incomplete |
| **White-Label System** | ❌ Missing | No tenant/branding isolation |

---

## PHASE 1: Harden Core Clips Engine (Week 1-2)

### Priority: Verify Text Automation Works 100%

#### 1.1 Word-Level Transcription
```
Current: ElevenLabs returns full transcript text
Required: Word-level timestamps for caption sync
Solution: 
- Switch to Whisper API (word timestamps) OR
- Use AssemblyAI (better word-level data) OR
- Parse ElevenLabs alignment output if available
```

**Action Items:**
- [ ] Create `transcribe-with-timestamps` edge function using OpenAI Whisper
- [ ] Store `words[]` array in `media_files.edit_transcript`
- [ ] Update `ClipVideoPreview.tsx` to use word-level sync

#### 1.2 Shotstack Caption Templates
```
Current: Static title/subtitle overlays
Required: Dynamic word-by-word captions burned into video
Solution:
- Create Shotstack template with HTML asset for captions
- Generate SRT/VTT from transcript words
- Use Shotstack's subtitle asset type
```

**Action Items:**
- [ ] Add `VERTICAL_TEMPLATE_CAPTIONS` with subtitle track
- [ ] Create `generate-caption-srt` utility function
- [ ] Update `submit-shotstack-render` to include captions file URL

#### 1.3 Clip Quality Checks
```
Add validation before/after rendering:
- Transcript coverage (words found for clip segment)
- Caption alignment verification
- Audio level normalization check
- Output file validity (duration, codec, resolution)
```

**Action Items:**
- [ ] Create `clips` table columns: `quality_score`, `quality_flags`, `review_status`
- [ ] Add post-render validation in `shotstack-webhook`
- [ ] Create "Needs Review" status for flagged clips

---

## PHASE 2: Auto-Editing Pipeline (Week 2-4)

### 2.1 Filler Word Detection & Removal

```typescript
// AI Post-Production enhancement
interface FillerWordEdit {
  word: string;        // "um", "uh", "like"
  start_ms: number;
  end_ms: number;
  confidence: number;
  action: 'remove' | 'flag';
}
```

**Approach:**
1. Detect filler words from transcript (AI analysis)
2. Generate edit decision list (EDL)
3. Apply cuts via Shotstack/FFmpeg

**Action Items:**
- [ ] Enhance `ai-post-production` to return filler word timestamps
- [ ] Create `apply-filler-removal` function that generates edited timeline
- [ ] Store original + refined versions in `media_versions`

### 2.2 Silence Trimming

```
Detection: Analyze waveform for segments < -40dB for > 1 second
Action: Compress silence to 0.3s or remove entirely
Tool: Shotstack audio normalization OR external FFmpeg worker
```

### 2.3 Script-Based Editing

```typescript
interface ScriptEdit {
  scriptSections: {
    title: string;
    keywords: string[];
    targetDuration?: number;
  }[];
  matchingMode: 'strict' | 'fuzzy';
}
```

**Workflow:**
1. User provides outline/script
2. AI matches transcript to script sections
3. Auto-generate clips aligned to script beats

---

## PHASE 3: Content Pipeline Dashboard (Week 4-5)

### Database Schema

```sql
-- Content pipeline stages
CREATE TYPE content_stage AS ENUM (
  'raw',           -- Uploaded, no processing
  'transcribed',   -- Transcript generated
  'analyzed',      -- AI analysis complete
  'refined',       -- Edits applied
  'clips_ready',   -- Clips generated
  'scheduled',     -- Scheduled for posting
  'published'      -- Posted to platforms
);

-- Pipeline tracking
ALTER TABLE media_files ADD COLUMN pipeline_stage content_stage DEFAULT 'raw';
ALTER TABLE media_files ADD COLUMN pipeline_metadata JSONB;

-- Ideas bank
CREATE TABLE content_ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  source_type TEXT, -- 'manual', 'ai_suggested', 'trending'
  related_media_id UUID REFERENCES media_files,
  status TEXT DEFAULT 'idea',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Repurposing suggestions
CREATE TABLE repurpose_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_media_id UUID REFERENCES media_files NOT NULL,
  suggestion_type TEXT, -- 'newsletter', 'blog', 'clip', 'social'
  ai_reasoning TEXT,
  confidence_score DECIMAL,
  is_dismissed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Dashboard Components

```
/studio/pipeline - Content Pipeline Dashboard
├── PipelineKanban.tsx      (Raw → Transcribed → Refined → Ready)
├── IdeaBank.tsx            (Capture & organize content ideas)
├── RepurposeSuggestions.tsx (AI-driven content revival)
└── PublishQueue.tsx        (Scheduled posts across platforms)
```

---

## PHASE 4: Cross-Platform Publishing (Week 5-6)

### 4.1 YouTube Shorts Integration

```typescript
// youtube-publish-short edge function
interface YouTubeShortRequest {
  clipId: string;
  title: string;
  description: string;
  tags: string[];
  privacyStatus: 'private' | 'unlisted' | 'public';
}

// Process:
// 1. Validate clip is < 60 seconds
// 2. Verify 9:16 aspect ratio
// 3. Upload via YouTube Data API v3
// 4. Return video ID
```

**Action Items:**
- [ ] Create `youtube-publish-short` edge function
- [ ] Add `published_platforms` JSONB to clips table
- [ ] Create PublishToYouTubeModal component

### 4.2 Instagram Reels Integration

```typescript
// instagram-publish-reel edge function
// Meta Graph API flow:
// 1. POST /me/media (type=REELS, video_url, ...)
// 2. Poll /container_id (wait for FINISHED status)
// 3. POST /me/media_publish (creation_id)
```

**Constraints:**
- Video must be 3-90 seconds
- 9:16 aspect ratio
- MP4, H.264, AAC audio

### 4.3 TikTok Integration

```
TikTok API requirements:
- Video sharing via Direct Post API
- Caption, hashtags, privacy controls
- OAuth flow already exists in project
```

---

## PHASE 5: Creator Style Learning (Week 6-7)

### 5.1 Style Profile Schema

```sql
CREATE TABLE creator_style_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users UNIQUE NOT NULL,
  
  -- Pacing preferences
  avg_clip_duration DECIMAL,
  preferred_hook_style TEXT, -- 'question', 'statement', 'visual'
  intro_style TEXT,          -- 'quick', 'gradual', 'cold_open'
  
  -- Visual preferences
  caption_style TEXT,        -- 'minimal', 'animated', 'bold'
  color_palette TEXT[],
  logo_position TEXT,
  
  -- Content patterns
  common_topics TEXT[],
  signature_phrases TEXT[],
  cta_patterns TEXT[],
  
  -- Generated from analysis
  last_analyzed_at TIMESTAMPTZ,
  content_count_analyzed INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 5.2 Style Analysis Function

```typescript
// analyze-creator-style edge function
// Runs on every 10th piece of content to update style profile
// Uses AI to identify patterns across creator's library
```

---

## PHASE 6: White-Label Infrastructure (Week 7-8)

### 6.1 Tenant Configuration

```sql
CREATE TABLE white_label_tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,      -- 'alchify', 'seeksy'
  name TEXT NOT NULL,
  
  -- Branding
  logo_url TEXT,
  favicon_url TEXT,
  primary_color TEXT,
  secondary_color TEXT,
  font_family TEXT,
  
  -- Domain
  custom_domain TEXT,
  
  -- Feature toggles
  features JSONB DEFAULT '{}',
  -- { ai_studio: true, clips: true, posting: true, ... }
  
  -- AI persona
  ai_assistant_name TEXT,         -- 'Spark', 'Refiner'
  ai_system_prompt TEXT,
  
  -- Config
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE tenant_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES white_label_tenants NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  role TEXT DEFAULT 'member',
  UNIQUE(tenant_id, user_id)
);
```

### 6.2 Theming System

```typescript
// src/lib/tenant.ts
interface TenantConfig {
  slug: string;
  branding: {
    logoUrl: string;
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
  };
  features: {
    aiStudio: boolean;
    clips: boolean;
    posting: boolean;
    pipeline: boolean;
  };
  aiAssistant: {
    name: string;
    systemPrompt: string;
  };
}

// Runtime tenant detection from subdomain or custom domain
function getTenantFromHost(hostname: string): TenantConfig
```

---

## PHASE 7: Ethical AI Guardrails (Week 8)

### 7.1 Content Integrity Checks

```typescript
interface ContentGuardrails {
  // Before publishing
  prePublishChecks: {
    deepfakeDetection: boolean;
    voiceCloneVerification: boolean;
    factCheckPassing: boolean;
    platformCompliance: boolean;
  };
  
  // Metadata
  ownership: {
    creatorId: string;
    certifiedOnChain: boolean;
    watermarkApplied: boolean;
  };
  
  // Transparency
  aiDisclosure: {
    editedByAi: boolean;
    captionsGenerated: boolean;
    clipDetectionAi: boolean;
  };
}
```

### 7.2 Guardrail Enforcement

- [ ] Add AI disclosure badges to all AI-processed content
- [ ] Implement format validation before posting (duration, aspect ratio)
- [ ] Add watermark toggle per tenant
- [ ] Create audit log for all AI operations

---

## PHASE 8: Testing & Reliability Suite (Week 8-9)

### 8.1 Automated Test Harness

```typescript
// e2e-clip-test edge function
interface ClipTestResult {
  testId: string;
  mediaId: string;
  tests: {
    transcriptionValid: boolean;
    clipDetectionRan: boolean;
    captionsGenerated: boolean;
    renderCompleted: boolean;
    outputPlayable: boolean;
    durationCorrect: boolean;
  };
  errors: string[];
  duration_ms: number;
}
```

### 8.2 Quality Dashboard

```
/admin/clip-quality - Quality Monitoring
├── TestResults.tsx         (Recent test runs)
├── FailureAnalysis.tsx     (Common failure patterns)
├── PerformanceMetrics.tsx  (Render times, success rates)
└── ManualReview.tsx        (Flagged clips needing review)
```

---

## Implementation Priority Matrix

| Phase | Effort | Impact | Priority |
|-------|--------|--------|----------|
| 1. Harden Core (Captions) | Medium | Critical | 🔴 P0 |
| 2. Auto-Editing | High | High | 🟠 P1 |
| 3. Pipeline Dashboard | Medium | High | 🟠 P1 |
| 4. Cross-Platform Publishing | High | High | 🟠 P1 |
| 5. Style Learning | Medium | Medium | 🟡 P2 |
| 6. White-Label | High | High | 🟡 P2 |
| 7. Guardrails | Low | Medium | 🟢 P3 |
| 8. Test Suite | Medium | High | 🟠 P1 |

---

## Immediate Next Steps (When User Returns)

1. **Verify Shotstack API Key is configured** - Check secrets
2. **Test a clip render with captions** - Run create-demo-clip manually
3. **Upgrade transcription** - Add word-level timestamps via Whisper
4. **Create caption template** - Add Shotstack template with SRT support
5. **Build pipeline dashboard UI** - Start with simple kanban view

---

## Dependencies & API Keys Required

| Service | Current Status | Notes |
|---------|---------------|-------|
| Shotstack | ✅ Configured | SHOTSTACK_API_KEY exists |
| ElevenLabs | ✅ Configured | For TTS, not ideal for transcription |
| OpenAI Whisper | ❌ Needed | For word-level timestamps |
| YouTube Data API | ⚠️ OAuth exists | Need upload scope |
| Instagram Graph API | ⚠️ OAuth exists | Need content_publish scope |
| TikTok API | ⚠️ OAuth exists | Need video.publish scope |

---

## Estimated Timeline

| Phase | Duration | Cumulative |
|-------|----------|------------|
| Phase 1 | 2 weeks | Week 2 |
| Phase 2 | 2 weeks | Week 4 |
| Phase 3 | 1 week | Week 5 |
| Phase 4 | 1 week | Week 6 |
| Phase 5 | 1 week | Week 7 |
| Phase 6 | 1 week | Week 8 |
| Phase 7 | 0.5 week | Week 8.5 |
| Phase 8 | 1 week | Week 9.5 |

**Total: ~10 weeks for full implementation**

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    SEEKSY AI REFINER ENGINE                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   INGEST     │    │   PROCESS    │    │   PUBLISH    │  │
│  │              │    │              │    │              │  │
│  │ • Upload     │───▶│ • Transcribe │───▶│ • YouTube    │  │
│  │ • YouTube    │    │ • AI Analyze │    │ • Instagram  │  │
│  │ • Zoom       │    │ • Filler Cut │    │ • TikTok     │  │
│  │ • Riverside  │    │ • Silence    │    │ • LinkedIn   │  │
│  └──────────────┘    │ • Clips Gen  │    └──────────────┘  │
│                      │ • Captions   │                       │
│                      │ • Render     │                       │
│                      └──────────────┘                       │
│                             │                               │
│                             ▼                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                   PIPELINE DASHBOARD                  │  │
│  │  Raw → Transcribed → Refined → Clips Ready → Posted  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │ STYLE LEARN  │    │  GUARDRAILS  │    │ WHITE-LABEL  │  │
│  │              │    │              │    │              │  │
│  │ • Pacing     │    │ • Deepfake   │    │ • Branding   │  │
│  │ • Colors     │    │ • Compliance │    │ • Domains    │  │
│  │ • Hooks      │    │ • Ownership  │    │ • Features   │  │
│  │ • CTAs       │    │ • Disclosure │    │ • AI Persona │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘

BACKEND SERVICES:
• Shotstack (Video Rendering)
• Cloudflare Stream (Video Hosting)
• ElevenLabs/Whisper (Transcription)
• Lovable AI (Analysis)
• Polygon (Certification)
```

---

*Document created: December 7, 2025*
*Status: Ready for review*
