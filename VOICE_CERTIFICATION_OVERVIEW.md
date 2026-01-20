# Voice Certification & Content Credentials Overview

This document describes Seeksy's blockchain-based verification system for voice profiles, transcripts, blog posts, and recordings.

## Overview

Seeksy provides cryptographic verification for creator content using Polygon blockchain, enabling:
- Proof of authorship
- Timestamped creation records
- Deepfake protection
- Licensing tracking
- Public verification URLs

## System Architecture

```
Creator Content → Fingerprinting/Hashing → Blockchain Minting → Public Verification
```

All certification types follow the same architectural pattern but handle different content types.

---

## 1. Voice Certification

### Purpose
Verify creator voice authenticity and prevent deepfake misuse.

### Database Schema

**Table: `creator_voice_profiles`**
- Voice recording samples
- ElevenLabs voice ID
- Certification status
- Profile metadata

**Table: `voice_fingerprints`**
- Cryptographic voice fingerprints
- Linked to voice profiles
- Used for detection and matching

**Table: `voice_blockchain_certificates`**
- Blockchain transaction details
- NFT token ID
- Voice fingerprint hash
- Certification status

### Certification Flow (7 Steps)

1. **Record Voice Samples**
   - 30+ seconds of clear speech
   - Multiple takes for quality
   - Script provided or custom

2. **Voice Analysis**
   - ElevenLabs processes samples
   - Generates voice fingerprint
   - Creates voice profile

3. **Fingerprint Generation**
   - Cryptographic hash of voice characteristics
   - Stored in `voice_fingerprints` table
   - Used for future detection

4. **Review & Confirm**
   - Creator reviews voice profile
   - Confirms consent for voice usage
   - Accepts terms

5. **Blockchain Minting**
   - Mint Voice NFT on Polygon
   - Transaction via Biconomy (gasless)
   - Stores voice fingerprint hash on-chain

6. **Certification Complete**
   - Transaction confirmed
   - Certificate generated
   - Public verification URL created

7. **Success & Monitoring**
   - Confetti celebration 🎉
   - Voice monitoring auto-activated
   - Creator can view certificate

### Public Verification

**Route:** `/v/:username/voice-credential`

**Displays:**
- Creator name and photo
- Voice certification badge
- Blockchain details (tx hash, Polygonscan link)
- Downloadable certificate (PNG)
- Social sharing options

### Voice Monitoring

**Automatic Activation:**
After certification, system auto-creates monitoring sources for:
- YouTube
- Spotify
- Apple Podcasts
- TikTok
- Instagram
- Twitter/X

**Detection:**
- Compares audio fingerprints across platforms
- Stores results in `voice_detections` table
- Notifies creator of voice usage
- Links to licensing proposals

---

## 2. Content Certification (Transcripts & Blogs)

### Purpose
Verify authorship and creation date of written content (transcripts, blog posts).

### Database Schema

**Table: `content_credentials`**

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Unique credential ID |
| `user_id` | uuid | Content owner |
| `content_type` | text | `transcript` or `blog_post` |
| `transcript_id` | uuid (nullable) | Link to transcript |
| `blog_post_id` | uuid (nullable) | Link to blog post |
| `content_hash` | text | SHA-256 hash |
| `title` | text | Content title |
| `summary` | text | Brief description |
| `chain` | text | `polygon` |
| `tx_hash` | text | Blockchain transaction hash |
| `status` | text | `pending`, `minting`, `minted`, `failed` |
| `metadata` | jsonb | Token ID, minting details |

**Constraints:**
- Unique `(transcript_id)` when not null
- Unique `(blog_post_id)` when not null
- Only one credential per content piece

### Certification Flow

**For Transcripts:**

1. User views transcript in Transcript Library
2. Clicks **"Certify Transcript"** button
3. System:
   - Fetches transcript text from `transcripts.raw_text`
   - Generates SHA-256 hash
   - Creates `content_credentials` row (`status = "pending"`)
   - Calls `mint-content-credential` edge function
4. Edge function:
   - Mints blockchain record on Polygon
   - Stores tx_hash, token_id, metadata_uri
   - Updates status to `"minted"`
5. User sees:
   - Success message
   - "Certified ✓" badge
   - Public verification link

**For Blog Posts:**

1. User creates/edits blog in Blog Editor
2. Enables **"Certify on publish"** toggle
3. When user publishes:
   - Blog post saved with `status = "published"`
   - Auto-triggers `mint-content-credential`
   - Same blockchain minting flow as transcripts
4. Alternative: Manual certification via **"Certify"** button in Blog Library

### Public Verification

**Route:** `/c/:credentialId`

**Displays:**
- Creator name and handle
- Content type (Transcript / Blog)
- Content title and summary
- Creation timestamp
- Blockchain details:
  - Chain (Polygon)
  - Transaction hash
  - Polygonscan link
  - Token ID
- Downloadable certificate
- Social sharing buttons

**Verification Message:**
> "This page verifies that this content's cryptographic hash was recorded on the Polygon blockchain via Seeksy. The on-chain record proves authorship and creation date."

---

## 3. Recording Certification (Future)

### Planned Features

**Episode Recordings:**
- Certify entire podcast episodes
- Include ad-read markers on-chain
- Multi-track certification

**Video Recordings:**
- Video fingerprinting
- Frame-level hashing
- Authenticity verification

**Live Streams:**
- Real-time certification
- Continuous fingerprinting
- Archive verification

---

## Blockchain Implementation

### Network: Polygon

**Why Polygon:**
- Low gas fees (~$0.01 per transaction)
- Fast confirmation (2-3 seconds)
- EVM-compatible (Ethereum ecosystem)
- Wide wallet support

### Smart Contract (Voice NFT)

**Contract Address:** (configured in edge function)

**Functions:**
- `mintVoiceNFT(owner, fingerprint, metadata_uri)` → tokenId
- `verifyOwnership(tokenId, owner)` → bool
- `getMetadata(tokenId)` → metadata URI

### Gasless Transactions (Biconomy)

**Configuration:**
- API Key: `BICONOMY_API_KEY`
- Sponsored gas for voice certification
- User pays no gas fees
- Platform sponsors transaction costs

**Benefits:**
- No wallet setup required
- Zero friction for creators
- Professional UX

---

## Verification Data Model

### Voice Credential

```json
{
  "type": "voice",
  "owner": "profile_id",
  "voice_fingerprint": "sha256_hash",
  "token_id": "12345",
  "tx_hash": "0x...",
  "certified_at": "2025-11-28T00:00:00Z",
  "public_url": "/v/username/voice-credential"
}
```

### Content Credential (Transcript)

```json
{
  "type": "transcript",
  "content_type": "transcript",
  "owner": "profile_id",
  "content_hash": "sha256_hash",
  "title": "Episode Title",
  "source_type": "podcast_episode",
  "token_id": "67890",
  "tx_hash": "0x...",
  "certified_at": "2025-11-28T00:00:00Z",
  "public_url": "/c/credential-id"
}
```

### Content Credential (Blog)

```json
{
  "type": "blog_post",
  "content_type": "blog_post",
  "owner": "profile_id",
  "content_hash": "sha256_hash",
  "title": "Blog Post Title",
  "slug": "blog-post-slug",
  "token_id": "24680",
  "tx_hash": "0x...",
  "certified_at": "2025-11-28T00:00:00Z",
  "public_url": "/c/credential-id"
}
```

---

## User Interfaces

### Creator Sidebar Navigation

**Content Section:**
- Master Studio
- Podcast Studio
- Media Studio
- **Transcript Library** (`/transcripts`)
- **Blog Library** (`/blog`)
- Voice Cloning
- Voice Credentials

### Certification Badges

**In Content Lists:**
- Green badge with shield icon: "Certified ✓"
- Displayed on:
  - Transcript Library rows
  - Blog Library rows
  - Episode pages
  - Voice profile cards

**In Detail Views:**
- Certification card with:
  - Status (Minted / Pending / Failed)
  - Transaction hash
  - Polygonscan link
  - Public verification link
  - Download certificate button

---

## Integration Points

### Studio → Voice Certification
- Voice Cloning wizard (7 steps)
- Automatic fingerprint generation
- Auto-activation of monitoring

### Studio → Content Certification
- Podcast Studio → Transcript → Certification
- Media Studio → Transcript → Certification
- Blog creation → Auto-certification option

### Voice Detection → Licensing
- Voice detections across platforms
- Licensing proposals from advertisers
- Revenue tracking when status = "licensed"

### Content Credential → My Page
- Display certification badges on creator profiles
- Link to public verification pages
- Show "Verified Creator" status

---

## Security & Privacy

### Data Protection
- Voice fingerprints stored encrypted
- Content hashes (not full content) on-chain
- Private data in Supabase with RLS
- Public verification shows minimal info

### Access Control
- RLS policies enforce ownership
- Only creator can mint credentials
- Public verification URLs are read-only
- Admins have monitoring access only

### Blockchain Security
- Immutable on-chain records
- Tamper-proof verification
- Transparent transaction history
- Decentralized storage

---

## Cost Analysis

### Voice Certification
- ElevenLabs voice cloning: ~$0.30 per voice
- Blockchain minting: ~$0.01-0.05 (or gasless)
- Storage: Included in Supabase plan

### Content Certification
- Blockchain minting: ~$0.01-0.05 per item (or gasless)
- Storage: Included in Supabase plan
- No per-item transcription cost (separate service)

### Monitoring
- Voice detection: Compute-based (minimal)
- Platform API calls: Free or usage-based
- Database queries: Included in Supabase plan

---

## Monetization Integration

### Voice Licensing
- Advertisers pay to use certified voices
- Creators earn royalties
- Licensing tracked via content credentials
- Revenue calculated in Monetization Engine

### Content Premium
- Certified content commands higher CPM
- Advertisers prefer verified creators
- Trust signal for brand partnerships

### Creator Tiers
- Certification unlocks premium features
- Higher revenue share for certified creators
- Priority in marketplace

---

## Future Vision

### Cross-Platform Verification
- Export credentials to other platforms
- Universal verification standard
- Interoperability with other verification systems

### AI Content Watermarking
- Embed invisible watermarks in audio/video
- Track content distribution
- Detect unauthorized usage

### Legal Integration
- Copyright registration via blockchain
- DMCA takedown automation
- Licensing contract enforcement

---

This certification system positions Seeksy as a leader in content authenticity and creator protection, addressing the growing challenge of deepfakes and content misattribution in the digital content ecosystem.
