# Content Certification Flow - Complete Documentation

## 📋 Overview

The Content Certification Flow verifies the authenticity of audio, video, or content bundles by detecting voices, scanning for tampering and AI-generated content, and minting a blockchain certificate.

---

## 1. Route & Component Structure

### Routes Created

```
/content-certification              → UploadContent (Step 1)
/content-certification/fingerprint  → AIFingerprintMatch (Step 2)
/content-certification/authenticity → AuthenticityScan (Step 3)
/content-certification/approve-mint → ApproveAndMintContent (Step 4)
/content-certification/minting-progress → MintingProgressContent (Step 5)
/content-certification/success      → CertifiedContentSuccess (Step 6)
```

### Component Files

```
src/
├── pages/content-certification/
│   ├── UploadContent.tsx                  # Step 1: File Upload
│   ├── AIFingerprintMatch.tsx            # Step 2: Voice Detection & Selection
│   ├── AuthenticityScan.tsx              # Step 3: Authenticity Analysis
│   ├── ApproveAndMintContent.tsx         # Step 4: Review & Approval
│   ├── MintingProgressContent.tsx        # Step 5: Blockchain Minting
│   └── CertifiedContentSuccess.tsx       # Step 6: Success Confirmation
│
└── services/
    └── contentCertificationAPI.ts         # API Placeholders
```

### Shared Components Used

All components reuse the same UI library as Voice Certification Flow:
- `Button` from `@/components/ui/button`
- `Card` from `@/components/ui/card`
- `Progress` from `@/components/ui/progress`
- Icons from `lucide-react` (Upload, ArrowLeft, CheckCircle2, AlertTriangle, Shield, ExternalLink)
- `canvas-confetti` for success animation
- `useToast` from `@/hooks/use-toast`
- `useNavigate` and `useLocation` from `react-router-dom`

---

## 2. API Integration Points

All API placeholders are defined in `src/services/contentCertificationAPI.ts`.

### 🔌 Integration Point 1: Voice Detection

**Function**: `detectVoicesInContent()`

**Input Parameters**:
```typescript
{
  contentFile: File | Blob,
  userId: string,
  contentType: "audio" | "video" | "bundle"
}
```

**Expected Output**:
```typescript
{
  voicesDetected: Array<{
    voiceId: string,
    voiceName: string,
    confidence: number,
    timeSegments: Array<{ start: number; end: number }>
  }>,
  primaryVoice: {
    voiceId: string,
    voiceName: string,
    confidence: number
  },
  detectionTimestamp: string
}
```

**Where Response Flows**:
- AIFingerprintMatch.tsx displays detected voices
- User selects primary voice for certification
- Data passed via `location.state.voiceData`

**Current Implementation**: 
- Simulated with 3-second delay
- Returns 2 mock voices (Christy Louis + Guest Speaker)
- Shows voice cards with confidence scores and certified badges

---

### 🔌 Integration Point 2: Authenticity Scanning

**Function**: `scanContentAuthenticity()`

**Input Parameters**:
```typescript
{
  contentFile: File | Blob,
  voiceFingerprints: string[]
}
```

**Expected Output**:
```typescript
{
  overallScore: number,              // 0-100 authenticity score
  tamperDetected: boolean,
  warnings: Array<{
    type: "splice" | "ai_generated" | "timestamp_mismatch" | "metadata_altered",
    severity: "low" | "medium" | "high",
    timestamp?: string,
    description: string,
    confidence: number
  }>,
  metadata: {
    originalCreationDate?: string,
    lastModifiedDate?: string,
    deviceInfo?: string,
    locationInfo?: string
  },
  aiDetectionResults: {
    aiGeneratedProbability: number,
    suspectedAISegments: Array<{ start: number; end: number; confidence: number }>
  },
  timestamp: string
}
```

**Where Response Flows**:
- AuthenticityScan.tsx displays scan results with:
  - Overall authenticity score (color-coded)
  - Warning cards for detected issues
  - Metadata details
  - AI-generated probability
- Data passed via `location.state.authenticityData`

**Current Implementation**:
- Simulated with 4-second delay
- 50% chance of generating issues
- Mock splice detection at 00:02:34
- Mock AI-generated segment at 00:01:15
- Device and location metadata

---

### 🔌 Integration Point 3: Content Certificate Minting

**Function**: `mintContentCertificate()`

**Input Parameters**:
```typescript
{
  contentHash: string,
  voiceFingerprints: string[],
  authenticityScore: number,
  userId: string,
  contentMetadata: any
}
```

**Expected Output**:
```typescript
{
  certificateId: string,
  tokenId: string,
  transactionHash: string,
  blockchain: string,
  metadataUri: string,
  mintedAt: string
}
```

**Where Response Flows**:
- MintingProgressContent.tsx shows 4-step minting animation
- CertifiedContentSuccess.tsx displays final certificate with NFT details
- Data passed via `location.state`

**Current Implementation**:
- Simulated with 5-second delay (distributed across 4 steps)
- Mock certificate ID, token ID, transaction hash
- Polygon blockchain

---

### 🔌 Integration Point 4: Certificate Retrieval (Future)

**Function**: `getContentCertificate()`

**Input Parameters**:
```typescript
{
  userId: string
}
```

**Expected Output**:
```typescript
{
  exists: boolean,
  certificateId: string | null,
  createdAt: string | null
}
```

**Use Case**: Check if user already has content certificates

---

## 3. How Authenticity/Tamper Data Flows Into UI

### Data Flow Architecture

```
UploadContent
    ↓ (passes contentFile + contentType)
AIFingerprintMatch
    ↓ (passes contentFile + voiceData)
AuthenticityScan
    ↓ (passes contentFile + voiceData + authenticityData)
ApproveAndMintContent
    ↓ (passes all previous state)
MintingProgressContent
    ↓ (passes all + certificateId + tokenId)
CertifiedContentSuccess
    ✓ (displays final certificate)
```

### Authenticity Data Structure in State

When navigating between screens, the following state is passed:

```typescript
location.state = {
  // From UploadContent
  contentFile: File | Blob,
  contentType: "audio" | "video" | "bundle",
  
  // From AIFingerprintMatch
  voiceData: {
    selectedVoice: {
      voiceId: string,
      voiceName: string,
      confidence: number,
      isCertified: boolean,
      segments: number
    },
    allVoices: Array<VoiceDetection>
  },
  
  // From AuthenticityScan
  authenticityData: {
    overallScore: number,
    tamperDetected: boolean,
    warnings: Array<Warning>,
    metadata: {
      originalCreationDate: string,
      lastModifiedDate: string,
      deviceInfo: string,
      locationInfo: string
    },
    aiProbability: number
  },
  
  // From MintingProgressContent
  certificateId: string,
  tokenId: string,
  blockchain: string
}
```

### UI Rendering Based on Authenticity Data

**AuthenticityScan.tsx**:
- **Score Display**: Color-coded based on score (green ≥80%, yellow ≥60%, red <60%)
- **Warning Cards**: Dynamically rendered based on `warnings` array
  - Icon changes based on severity (AlertTriangle for high/medium, CheckCircle for low)
  - Color-coded severity labels
  - Timestamp display for temporal warnings
- **Metadata Grid**: 2x2 grid showing creation date, device, location
- **AI Probability**: Color-coded based on threshold (<20% green, <50% yellow, ≥50% red)

**ApproveAndMintContent.tsx**:
- Displays summary of both voice match and authenticity results
- Shows tamper detection status (Minor Issues / Clean)
- AI-generated percentage with color coding
- Note explaining what the certificate proves

**CertifiedContentSuccess.tsx**:
- Final certificate card showing:
  - Primary voice name
  - Authenticity score (color-coded)
  - Certificate ID (monospace font)
  - Token ID and blockchain
  - "View on Blockchain" stub button

---

## 4. Questions & Assumptions Made

### Questions

1. **Voice Profile Source** ✅ RESOLVED
   - Assumption: Voice detection returns mock certified voices
   - The list shows both certified and non-certified voices
   - User must select which voice to use for certification

2. **Content Type Detection** ✅ IMPLEMENTED
   - Detects content type from MIME type during upload
   - Supports: audio/*, video/*, and bundle formats (.zip, .tar)
   - Passes contentType through the flow for future filtering

3. **Warning Severity Levels** ✅ IMPLEMENTED
   - Three severity levels: low, medium, high
   - Each has distinct icon and color coding
   - Affects overall authenticity score calculation

4. **AI Detection Thresholds** ✅ DEFINED
   - <20% AI: Low risk (green)
   - 20-49% AI: Medium risk (yellow)
   - ≥50% AI: High risk (red)

5. **Blockchain Network** ✅ CONFIRMED
   - Using Polygon for gasless transactions
   - Same as Voice Certification Flow
   - Biconomy handles gas sponsorship

### Assumptions Made

1. **Multiple Voice Detection**: Content can contain multiple speakers, but user selects primary voice for certification

2. **Partial Authenticity**: Content can pass certification even with minor warnings (score ≥60%)

3. **Metadata Availability**: Assumes content files have metadata (creation date, device, location)

4. **Certificate Uniqueness**: Each content piece gets a unique certificate ID and NFT token

5. **Navigation Pattern**: Back button always enabled except during processing/minting

6. **Error Handling**: Happy path only - no error screens implemented yet

7. **Database Storage**: Certificate data stored after successful minting (not during analysis)

---

## 5. Design System Consistency

All components follow the same design system as Voice Certification Flow:

**Colors**:
- Background: `bg-brand-navy` (HSL: 208 93% 24%)
- Primary: `bg-primary` (HSL: 207 100% 50%)
- Cards: `bg-card` with backdrop blur
- Borders: `border-border` with primary accents

**Typography**:
- Headlines: `text-4xl` to `text-5xl`, `font-bold`
- Body: `text-lg`, `text-muted-foreground`
- Uppercase titles: `uppercase tracking-wide`

**Spacing**:
- Consistent padding: `p-4` to `p-8`
- Card spacing: `space-y-4` to `space-y-8`
- Button sizing: `size-lg` with generous padding

**Animations**:
- Progress bars: Smooth transitions via Radix UI
- Confetti: 3-second animation on success
- Spinners: `animate-spin` during active steps
- Scale-in: Success icon entrance

---

## 6. Testing Checklist

### Flow Testing

- [x] File upload accepts audio, video, and bundle formats
- [x] Content type auto-detection works correctly
- [x] Voice detection progress animates smoothly
- [x] Multiple voices display in selection cards
- [x] Selected voice highlights correctly
- [x] Authenticity scan progress shows all 5 tasks
- [x] Warning cards display with correct severity colors
- [x] Metadata grid shows all 4 fields
- [x] AI probability color codes correctly
- [x] Approval screen shows all summary data
- [x] Minting progress shows 4 sequential steps
- [x] Success screen triggers confetti
- [x] Certificate card displays all NFT details
- [x] Back buttons work at each step
- [x] Continue buttons disabled during processing
- [x] State persists across navigation

### Responsive Design

- [x] Mobile layout (p-4, smaller text)
- [x] Tablet layout (max-w-xl to max-w-2xl)
- [x] Desktop layout (centered, generous spacing)

---

## 7. Comparison with Voice Certification Flow

### Similarities (Reused Patterns)

1. **Upload Screen**: Same file upload UI with drag-and-drop
2. **Progress Animation**: Circular progress with percentage display
3. **Minting Steps**: 4-step sequential progress (Preparing → Signing → Minting → Finalizing)
4. **Success Screen**: Confetti animation + certificate card + "View" CTA
5. **Navigation**: Back buttons on all screens, Continue disabled during processing
6. **Design System**: Same colors, typography, spacing, component library

### Differences (New Features)

1. **Multiple Voice Detection**: Shows list of detected voices with selection
2. **Authenticity Warnings**: Color-coded warning cards with severity levels
3. **Tamper Detection**: Specific warnings for splices, AI content, metadata issues
4. **Metadata Display**: Device, location, timestamps grid
5. **AI Probability**: Separate metric for AI-generated content detection
6. **Certificate Type**: Content certificate vs. Voice certificate (different metadata)

---

## 8. Next Steps for Integration

### Backend Integration Priority

1. **Voice Detection API** (High Priority)
   - Integrate actual voice fingerprinting service
   - Support multi-speaker detection
   - Return time segments for each voice

2. **Authenticity Scanning API** (High Priority)
   - Integrate tamper detection algorithms
   - AI-generated content detection
   - Metadata extraction and verification

3. **Certificate Minting** (Medium Priority)
   - Blockchain integration (Polygon + Biconomy)
   - IPFS metadata storage
   - Database certificate records

4. **Certificate Retrieval** (Low Priority)
   - Query existing certificates
   - Display certificate history
   - Verify certificate authenticity

### UI Enhancements

- Add error screens for failed detection/minting
- Add retry logic for API failures
- Add certificate download (PDF/JSON)
- Add social sharing buttons
- Add certificate revocation flow
- Add certificate verification by ID

---

## 9. File Dependencies

### New Files Created

```
src/pages/content-certification/
├── UploadContent.tsx                 (310 lines)
├── AIFingerprintMatch.tsx           (180 lines)
├── AuthenticityScan.tsx             (220 lines)
├── ApproveAndMintContent.tsx        (140 lines)
├── MintingProgressContent.tsx       (150 lines)
└── CertifiedContentSuccess.tsx      (150 lines)

src/services/
└── contentCertificationAPI.ts       (220 lines)
```

### Files Modified

```
src/App.tsx
├── Added 6 new imports (lines 204-209)
└── Added 6 new routes (lines 304-309)
```

### Total Lines Added

~1,370 lines of new code

---

## 10. API Placeholder Summary

| Function | Purpose | Delay | Mock Output |
|----------|---------|-------|-------------|
| `detectVoicesInContent()` | Detect speakers in content | 3s | 2 voices (97%, 89%) |
| `scanContentAuthenticity()` | Check for tampering/AI | 4s | Score + warnings + metadata |
| `mintContentCertificate()` | Mint blockchain certificate | 5s | Certificate ID + token ID |
| `getContentCertificate()` | Retrieve existing certificate | 1s | exists: false |

---

## ✅ Implementation Complete

The Content Certification Flow is fully implemented and ready for backend API integration. All screens match the design specifications, reuse Voice Certification components, and follow the established patterns.
