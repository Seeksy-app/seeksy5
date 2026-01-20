# AI Post-Production Pipeline

This document describes Seeksy's AI-powered post-production workflow, including automated transcription, content generation, and enhancement tools.

## Overview

The AI Post-Production Pipeline transforms raw Studio recordings into polished, multi-format content using AI services:

```
Raw Recording → Transcription → AI Processing → Content Generation → Distribution
```

## Pipeline Stages

### Stage 1: Audio Capture

**Input:** Studio recordings (Podcast Studio, Media Studio, Live Studio)

**Process:**
- Multi-track audio recording
- Real-time waveform visualization
- Automatic audio leveling
- Noise reduction options

**Output:** Raw audio files stored in Supabase Storage (`studio-recordings`, `episode-files` buckets)

---

### Stage 2: Transcription

**Primary Service:** ElevenLabs Speech-to-Text API

**Edge Function:** `transcribe-audio`

**Process:**

1. **Fetch audio file** from Supabase Storage
2. **Call ElevenLabs API** (`https://api.elevenlabs.io/v1/speech-to-text`)
   - Model: `eleven_multilingual_v2`
   - Supports 29 languages
   - Returns word-level timestamps
   - Confidence scoring
3. **Fallback provider** (if ElevenLabs fails)
   - Alternative transcription service
   - Ensures resilience
4. **Store result** in `transcripts` table
   - Links to source recording
   - Includes metadata (duration, model, language)

**Output:** Structured transcript with timestamps

**Auto-Trigger:**
- Controlled by user preference: `auto_transcribe_enabled` (default: `true`)
- Runs automatically on Studio recording completion
- Status displayed in Studio Success screen

---

### Stage 3: AI Content Enhancement

**Services Used:**

1. **ElevenLabs TTS** (Text-to-Speech)
   - Voice cloning for personalized audio
   - Multi-language support
   - Used for: intros, outros, ad reads

2. **Lovable AI Gateway** (Gemini / GPT)
   - Blog summarization from transcripts
   - Script generation for voice recordings
   - Content suggestions and improvements
   - CFO AI financial insights

**AI Processing Tasks:**
- Auto-generate blog excerpts from transcripts
- Suggest titles and tags
- Identify key moments and highlights
- Generate social media captions
- Create chapter markers

---

### Stage 4: Content Generation

**From Transcripts:**

1. **Blog Posts**
   - Auto-fill title, slug, content from transcript
   - AI-suggested improvements (future)
   - Rich text editing
   - SEO optimization (future)

2. **Social Clips** (future)
   - Vertical video with text overlays
   - AI-identified highlights
   - Auto-captioning

3. **Show Notes** (future)
   - Structured summaries
   - Timestamp links
   - Resource extraction

---

### Stage 5: Content Certification

**Service:** Polygon Blockchain (via Biconomy)

**Edge Function:** `mint-content-credential`

**Process:**

1. **Hash content** (SHA-256)
2. **Create NFT record** on Polygon
   - Includes: owner, content_type, title, hash, timestamp
3. **Store transaction** in `content_credentials` table
4. **Generate public verification URL** (`/c/:id`)

**Certified Content Types:**
- Transcripts
- Blog posts
- Voice fingerprints (existing)
- Episode recordings (future)

**Benefits:**
- Proves authorship
- Timestamp verification
- Deepfake protection
- Licensing tracking

---

## AI Services Configuration

### ElevenLabs

**API Key:** `ELEVENLABS_API_KEY` (Supabase secret)

**Endpoints Used:**
- Speech-to-Text: `https://api.elevenlabs.io/v1/speech-to-text`
- Text-to-Speech: `https://api.elevenlabs.io/v1/text-to-speech/{voice_id}`
- Voice cloning: (configured in Voice Cloning module)

**Models:**
- `eleven_multilingual_v2` (transcription)
- Various voice models (TTS)

### Lovable AI Gateway

**API Key:** `LOVABLE_API_KEY` (auto-configured)

**Endpoint:** `https://ai.gateway.lovable.dev/v1/chat/completions`

**Models:**
- `google/gemini-2.5-flash` (default)
- `google/gemini-2.5-pro` (high-quality)
- `openai/gpt-5` (alternative)

**Use Cases:**
- Blog summarization
- Script generation
- Financial modeling insights
- Persona interactions (Spark AI)

---

## Parameter Tuning

### Transcription Quality

**Location:** `transcribe-audio` edge function

**Parameters:**
- `model_id`: ElevenLabs model selection
- `language`: Target language code
- `word_timestamps`: Enable/disable word-level timing
- Fallback provider configuration

### Content Processing

**Location:** AI processing edge functions

**Parameters:**
- AI model selection (Gemini vs GPT)
- Token limits
- Temperature settings
- System prompts

---

## User Experience Flow

### Podcast Studio → Transcript → Blog

1. **Record** in Podcast Studio
2. **Complete** recording
3. **Auto-transcription** starts (if enabled)
4. **Status display:**
   - "Transcription in progress..." (with spinner)
   - "Transcript ready!" (with link)
   - "Transcription failed" (with retry)
5. **View** transcript in Transcript Library
6. **Create** blog post from transcript
7. **Edit** in Blog Editor
8. **Publish** with optional certification
9. **Share** public verification link

### Media Studio → Transcript

1. **Record** video with audio
2. **Complete** recording
3. **Auto-transcription** triggers (same flow)
4. **Use** transcript for:
   - Captions in video editor
   - Blog creation
   - Social post descriptions

---

## Error Handling

### Transcription Errors

**Scenario 1: ElevenLabs API Failure**
- Fallback provider activates automatically
- User sees "Transcription in progress..." (no interruption)
- Result stored with `ai_model = "fallback-provider"`

**Scenario 2: Audio File Unavailable**
- Error status: `"error"`
- User message: "Transcription failed - audio file not accessible"
- Retry button available

**Scenario 3: Network Timeout**
- Automatic retry (3 attempts)
- If all fail, display error with manual retry option

### Certification Errors

**Scenario 1: Blockchain Transaction Failure**
- Credential `status = "failed"`
- Error details in `metadata`
- User can retry via UI

**Scenario 2: Network Issues**
- Transaction pending with timeout
- User notified to check back later
- Transaction hash tracked for verification

---

## Performance Considerations

### Transcription

- **Audio file size limits:** Up to 100MB per file
- **Processing time:** 1-3 minutes for 60-minute audio
- **Concurrent jobs:** Limited by ElevenLabs rate limits
- **Fallback provider:** Ensures service continuity

### Content Generation

- **API rate limits:** Lovable AI Gateway handles throttling
- **Response time:** 2-10 seconds for blog summarization
- **Token limits:** Configurable per use case

### Blockchain Minting

- **Transaction time:** 5-30 seconds (Polygon)
- **Gas costs:** Sponsored by Biconomy (if configured)
- **Confirmation:** 1-2 block confirmations required

---

## Future Enhancements

### Near Term
- AI blog summarization and improvement suggestions
- Multi-language transcript support
- Transcript editing UI with word-level correction
- Social media clip generation with transcripts

### Medium Term
- Video captioning from transcripts
- Chapter detection and auto-markers
- Speaker diarization (multi-speaker identification)
- Sentiment analysis

### Long Term
- Real-time transcription during live streams
- AI-powered content recommendations
- Cross-platform content syndication
- Advanced analytics and insights

---

## Monitoring and Debugging

### Edge Function Logs

**Access:** Lovable Cloud → Functions → Logs

**Key Events:**
- Transcription start/complete
- ElevenLabs API calls
- Fallback provider activation
- Certification minting events

### Database Queries

**Check transcription status:**
```sql
SELECT id, source_type, ai_model, created_at, metadata
FROM transcripts
WHERE user_id = 'user-uuid'
ORDER BY created_at DESC;
```

**Check certification status:**
```sql
SELECT id, content_type, status, tx_hash, created_at
FROM content_credentials
WHERE user_id = 'user-uuid'
ORDER BY created_at DESC;
```

### Common Issues

**Issue 1: Transcription not triggering**
- Check `user_preferences.auto_transcribe_enabled`
- Verify audio URL is accessible
- Check ElevenLabs API key in secrets

**Issue 2: Certification fails**
- Check Polygon RPC configuration
- Verify Biconomy setup (if using gasless)
- Check user wallet balance (if not gasless)

**Issue 3: Slow processing**
- Check ElevenLabs rate limits
- Review audio file size
- Consider implementing job queue for large batches

---

## API Reference

### `transcribe-audio`

**Endpoint:** `/functions/v1/transcribe-audio`

**Method:** POST

**Headers:**
```
Authorization: Bearer {supabase-anon-key}
Content-Type: application/json
```

**Request:**
```json
{
  "asset_id": "uuid",
  "audio_url": "https://...",
  "language": "en",
  "source_type": "podcast_episode"
}
```

**Response (Success):**
```json
{
  "transcript_id": "uuid",
  "text": "Full transcript text...",
  "model": "elevenlabs-stt-v2",
  "word_timestamps": [...],
  "confidence": 0.95
}
```

**Response (Error):**
```json
{
  "error": "Error message",
  "fallback_used": true
}
```

### `mint-content-credential`

**Endpoint:** `/functions/v1/mint-content-credential`

**Method:** POST

**Request:**
```json
{
  "content_type": "blog_post",
  "blog_post_id": "uuid"
}
```

**Response (Success):**
```json
{
  "credential_id": "uuid",
  "tx_hash": "0x...",
  "token_id": "12345",
  "status": "minted"
}
```

---

## Cost Estimation

### ElevenLabs Transcription
- Pricing: Per minute of audio
- Free tier: Limited minutes
- Paid tier: Volume discounts available

### Lovable AI Gateway
- Pricing: Per request / token usage
- Free tier: Limited requests
- Paid tier: Usage-based

### Polygon Blockchain
- Gas costs: ~$0.01-0.05 per transaction
- Gasless option: Biconomy sponsorship (if configured)

---

## Security Considerations

### API Keys
- All keys stored in Supabase secrets
- Never exposed to client-side code
- Edge functions handle all external API calls

### Content Hashing
- SHA-256 for content verification
- Deterministic hashing (same content → same hash)
- Stored on-chain for tamper-proof verification

### Access Control
- RLS policies enforce user ownership
- Admins have read-only access to all content
- Public verification URLs are read-only

---

This pipeline enables Seeksy to provide a comprehensive, AI-powered content creation workflow from recording to publication with blockchain-backed authenticity verification.
