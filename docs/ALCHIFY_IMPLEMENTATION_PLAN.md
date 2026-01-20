# Alchify Implementation Plan

## Target: alchifydemo.com (Separate Lovable Project)

This plan outlines the step-by-step implementation for the Alchify white-label in its own Lovable project.

---

## Phase 1: Foundation & Auth (Day 1)

### 1.1 Project Setup
- [ ] Create new Lovable project at alchifydemo.com
- [ ] Enable Lovable Cloud (Supabase backend)
- [ ] Configure custom domain

### 1.2 Tenant Configuration
- [ ] Create `src/types/tenant.ts` (type definitions)
- [ ] Create `src/config/alchify.config.ts` (full config object)
- [ ] Create `src/contexts/TenantContext.tsx` (global provider)
- [ ] Implement `src/lib/tenant-theme.ts` (CSS variable injection)

### 1.3 Theming
- [ ] Update `index.css` with Alchify color variables (gold/dark theme)
- [ ] Update `tailwind.config.ts` with font configuration
- [ ] Add Alchify logo assets to `public/assets/alchify/`

### 1.4 Auth Shell
- [ ] Create `/auth` page with Alchify branding
- [ ] Email + Google sign-in (auto-confirm enabled)
- [ ] Basic profile creation on signup
- [ ] Auth guard for protected routes

### 1.5 Navigation Shell
- [ ] Create `TenantSidebar.tsx` driven by config
- [ ] Create `TenantHeader.tsx` with logo + user menu
- [ ] Implement layout wrapper

**Deliverable**: User can sign up, log in, see branded dashboard shell.

---

## Phase 2: Core Editing Pipeline (Days 2-3)

### 2.1 Upload Flow
- [ ] Create `/upload` page with drag-drop zone
- [ ] File type validation (video: mp4, mov, webm; audio: mp3, wav, m4a)
- [ ] Upload to Supabase storage bucket
- [ ] Create project record in `projects` table

### 2.2 Projects List
- [ ] Create `/projects` page
- [ ] Project cards with status badges
- [ ] Quick actions (Open, Delete, Export)
- [ ] Empty state with upload CTA

### 2.3 Transcription Engine
- [ ] Create `transcribe-audio` edge function
- [ ] Integrate with transcription provider (OpenAI Whisper via Lovable AI)
- [ ] Return segments with confidence scores
- [ ] Store in `transcripts` table

### 2.4 Refiner Studio - Transcript Editor
- [ ] Create `/refiner/:projectId` page
- [ ] Split layout: video preview + transcript editor
- [ ] Segment-by-segment display with timestamps
- [ ] Confidence highlighting (low confidence = yellow)
- [ ] Editable text fields

### 2.5 Filler Word Detection
- [ ] Detect common fillers: "um", "uh", "like", "you know", "so", "basically"
- [ ] Highlight fillers in transcript
- [ ] "Remove All Fillers" one-click action
- [ ] Count badge in toolbar

### 2.6 Dual View (Raw vs Refined)
- [ ] Toggle between original and cleaned transcript
- [ ] Visual diff highlighting (strikethrough removed words)
- [ ] Sync scroll position between views

**Deliverable**: User uploads content, gets transcript, can clean up fillers, see before/after.

---

## Phase 3: Authenticity Layer (Day 4)

### 3.1 AI Action Logging
- [ ] Create `ai_action_log` table
- [ ] Log all AI operations: transcribe, remove_fillers, sync_captions, etc.
- [ ] Include user_id, project_id, action_type, details, timestamp
- [ ] Display action history in project settings

### 3.2 No-Deepfake Constraints
- [ ] UI explicitly states "Real creators only"
- [ ] No voice cloning or face generation features
- [ ] Clear messaging in AI agent responses

### 3.3 Watermarking
- [ ] Add invisible metadata to exports: creator_id, project_id, timestamp, version
- [ ] "Processed by Alchify" tag
- [ ] Store metadata in `exports` table

### 3.4 AI Disclosure Toggle
- [ ] Export settings: "Include AI-assisted label" checkbox
- [ ] Default: true
- [ ] Store in export metadata

**Deliverable**: All AI actions logged, exports include provenance metadata.

---

## Phase 4: Captions & Export (Days 5-6)

### 4.1 Caption Sync Editor
- [ ] Timeline component showing caption segments
- [ ] Drag to adjust segment timing
- [ ] Click to edit text
- [ ] Playhead sync with video preview

### 4.2 Caption Styling
- [ ] Font selection (subset of safe fonts)
- [ ] Case style: UPPERCASE, lowercase, Title Case
- [ ] Position: top, center, bottom
- [ ] Save as caption template

### 4.3 Export Formats
- [ ] Platform presets:
  - TikTok (9:16, 60s max, burned captions)
  - YouTube Shorts (9:16, 60s max)
  - Instagram Reels (9:16, 90s max)
  - Podcast Audio (mp3, normalized)
  - Blog Post (formatted transcript text)
- [ ] Download SRT/WebVTT subtitle files

### 4.4 Export Flow
- [ ] Format selection modal
- [ ] Caption options (burn-in vs. separate file)
- [ ] Watermark toggle
- [ ] AI disclosure toggle
- [ ] Processing indicator
- [ ] Download link + export history

### 4.5 Audio Cleanup
- [ ] One-click noise reduction (via edge function)
- [ ] Volume normalization
- [ ] Preview before/after audio

**Deliverable**: User can export polished content in multiple formats with captions.

---

## Phase 5: Dashboard & Analytics (Day 7)

### 5.1 Dashboard Layout
- [ ] Hero upload CTA card
- [ ] Recent projects grid (last 6)
- [ ] "Revive Content" placeholder cards
- [ ] Quick stats row

### 5.2 Analytics Page
- [ ] Time Saved calculation
- [ ] Projects created count
- [ ] Exports generated count
- [ ] Average accuracy score
- [ ] Filler words removed total
- [ ] Simple charts (bar or line)

### 5.3 Branding Memory (Stub)
- [ ] Settings page with "Upload sample content" section
- [ ] Store metadata only (file list, not actual style extraction)
- [ ] Display as "Connected content" list

**Deliverable**: Dashboard shows useful metrics, analytics page tracks progress.

---

## Phase 6: Refiner AI Agent (Day 8)

### 6.1 Slide-Out Panel
- [ ] Create `RefinerAIPanel.tsx` (slide-out from right)
- [ ] Floating button in corner
- [ ] Open/close animation
- [ ] Persists across page navigation

### 6.2 AI Chat Interface
- [ ] Message input with send button
- [ ] Chat history display
- [ ] Typing indicator
- [ ] Quick action buttons

### 6.3 Edge Function
- [ ] Create `alchify-refiner-ai` edge function
- [ ] Use Alchify system prompt
- [ ] Context-aware (current project, transcript status)
- [ ] Suggest next actions

### 6.4 Contextual Suggestions
- [ ] On project open: "I found X filler words. Want me to highlight them?"
- [ ] After transcript: "Ready to sync captions?"
- [ ] Before export: "Which platform are you targeting?"

**Deliverable**: Refiner AI assistant accessible throughout the app.

---

## Phase 7: Integrations (Day 9)

### 7.1 Integration Page
- [ ] Create `/integrations` page
- [ ] Cards for YouTube, TikTok, Instagram, Substack
- [ ] "Connect" button for each
- [ ] Status indicator (connected/not connected)

### 7.2 OAuth Stubs
- [ ] YouTube OAuth flow (client-side redirect, store token)
- [ ] TikTok OAuth flow
- [ ] Instagram OAuth flow
- [ ] Display connected profile info

### 7.3 Substack Export
- [ ] Format transcript as clean HTML
- [ ] "Copy to clipboard" for manual paste
- [ ] Future: direct API publish

**Deliverable**: Users can connect accounts, see integration status.

---

## Phase 8: Polish & Alpha Prep (Day 10)

### 8.1 Error Handling
- [ ] Toast notifications for all actions
- [ ] Error boundaries
- [ ] Loading states throughout

### 8.2 Empty States
- [ ] No projects yet → Upload CTA
- [ ] No exports yet → Create first export CTA
- [ ] No integrations → Connect accounts CTA

### 8.3 Mobile Responsiveness
- [ ] Test all pages on mobile
- [ ] Collapsible sidebar
- [ ] Responsive video preview

### 8.4 Performance
- [ ] Lazy load heavy components
- [ ] Optimize transcript rendering for long content
- [ ] Prefetch common routes

### 8.5 Alpha Testing Prep
- [ ] Create test accounts
- [ ] Seed sample projects
- [ ] Document known limitations
- [ ] Prepare feedback form

**Deliverable**: Alpha-ready product for 50-100 creators.

---

## Code Reuse from Seeksy

| Component | Reuse Level | Notes |
|-----------|-------------|-------|
| **Auth flow** | High | Same pattern, different branding |
| **File upload** | High | Existing upload components |
| **Transcription** | High | Existing Whisper integration |
| **Video player** | Medium | May need custom controls |
| **AI agent UI** | High | Existing slide-out pattern |
| **Dashboard layout** | Medium | Different card content |
| **Database patterns** | High | Same RLS patterns + tenant_id |
| **Edge function patterns** | High | Same CORS, auth patterns |

---

## Timeline Summary

| Phase | Days | Focus |
|-------|------|-------|
| 1 | 1 | Foundation & Auth |
| 2 | 2-3 | Core Pipeline |
| 3 | 4 | Authenticity |
| 4 | 5-6 | Captions & Export |
| 5 | 7 | Dashboard & Analytics |
| 6 | 8 | AI Agent |
| 7 | 9 | Integrations |
| 8 | 10 | Polish |

**Total: ~10 working days to Alpha-ready MVP**

---

## Next Steps

1. Open alchifydemo.com Lovable project
2. Enable Lovable Cloud
3. Start with Phase 1: Foundation & Auth
4. Reference this doc + architecture doc for patterns

Ready to begin when you open the Alchify project!
