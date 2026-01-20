# Voice Detection & Cross-Platform Monitoring Architecture

## Overview

Seeksy's Voice Detection system monitors certified creator voices across internal and external platforms, automatically detecting voice usage and enabling licensing workflows.

## Database Schema

### 1. `voice_fingerprints`
Stores voice fingerprint embeddings for certified voices.
- Links to `creator_voice_profiles` and users
- Contains `fingerprint_id` (external service reference) and optional `fingerprint_data` (internal embeddings)
- Status: active/disabled

### 2. `voice_monitoring_sources`
Defines external sources to monitor per user.
- Platform: youtube, spotify, apple_podcasts, tiktok, instagram, seeksy_studio, seeksy_meetings, advertiser_upload, other
- Tracks external account IDs, channel IDs, and last scan timestamps

### 3. `voice_detections`
Logs each detection event.
- Platform, source type (podcast_episode, video, ad, etc.)
- Source metadata (ID, title, URL)
- Detection metrics (confidence, timestamps)
- Usage category (appearance, ad_read, narration, background)
- Status workflow (unreviewed → reviewed/licensed/flagged/ignored)
- Links to future revenue events

## Services

### Voice Detection Service (`src/lib/voice/voiceDetectionService.ts`)
- **normalizeAudio()**: Converts audio to standard format (16kHz mono PCM)
- **detectVoiceInAudio()**: Matches audio against voice fingerprint (PLACEHOLDER for AI integration)
- **scanSourceForVoice()**: High-level scan workflow
- **Integration points**: ElevenLabs Voice API, OpenAI Whisper, custom models

### Voice Detections API (`src/lib/api/voiceDetectionsAPI.ts`)
- **getVoiceDetectionsForUser()**: Fetch detections with filters
- **updateVoiceDetectionStatus()**: Update status and notes
- **getDetectionStatsByPlatform()**: Platform breakdown
- Handles licensing workflow triggers

## Background Jobs

### Edge Function: `scan-voice-detection`
Triggered by:
- Internal content events (Studio recordings, Meeting recordings, Advertiser uploads)
- Scheduled jobs for external platform monitoring
- Manual scan requests

Workflow:
1. Receive content metadata
2. Load active voice fingerprints
3. Run detection for each fingerprint
4. Log detections to database
5. Return summary

## UI Components

### VoiceCredentials Dashboard (Social Monitor Tab)
- **VoiceDetectionsList**: Display detections with platform icons, titles, confidence
- **VoiceDetectionsFilters**: Filter by platform, status, date range
- **Detection details modal**: View/edit status, notes, timestamps
- Empty state for zero detections

### Status Workflow
- Unreviewed → Reviewed → Licensed/Flagged/Ignored
- Licensed status creates placeholder for revenue event linking

## Integration Points

### PLACEHOLDER: Real Voice Matching
Current implementation uses mock detection logic. Production requires:
- Voice embedding service (ElevenLabs, AWS Transcribe, Azure Speaker Recognition)
- Audio feature extraction
- Similarity matching (cosine similarity, distance metrics)
- Confidence thresholding

### Future: Licensing → Revenue Flow
When detection status = "licensed":
- Create entry in `revenue_events`
- Link via `linked_revenue_event_id`
- Feed into Monetization Engine for CFO Dashboard

## Deployment Notes

- RLS policies protect user data
- Indexes optimize dashboard queries
- Edge function uses service role for system inserts
- Real-time updates via Supabase subscriptions (future enhancement)
