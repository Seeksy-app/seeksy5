# Face Identity System

## Overview

The Face Identity System allows creators to verify their face identity using 3–5 photos or a short selfie video, generating a blockchain-verified certificate on Polygon Amoy. This extends the existing Identity & Rights Management System to include face verification alongside voice verification.

## Architecture

### Data Model

**identity_assets table** (extended)
- `face_hash` (TEXT): Cryptographic hash of face embedding (keccak256)
- `face_metadata_uri` (TEXT): IPFS URI for certificate metadata
- `cert_status`: 'not_set' | 'pending' | 'minting' | 'minted' | 'failed' | 'revoked'
- `cert_tx_hash`: Polygon transaction hash
- `cert_explorer_url`: Polygonscan URL
- `type`: 'face_identity' or 'voice_identity'

**identity_access_logs table**
Face-specific action types:
- `face_started`: Face verification initiated
- `face_verified`: Face verification completed successfully
- `face_failed`: Face verification failed
- `face_revoked`: Face identity revoked by creator

### Edge Function: verify-face

**Endpoint**: `/functions/v1/verify-face`

**Input**:
```json
{
  "images": ["data:image/jpeg;base64,...", "..."]
}
```

**Process**:
1. Authenticate user
2. Create or update face_identity asset with status 'pending'
3. Extract best frame from uploaded images
4. Generate face embedding using OpenAI Vision API
5. Compute stable faceHash = keccak256(embedding + userId)
6. Create metadata URI (simulated IPFS for MVP)
7. Update asset with face_hash and face_metadata_uri
8. Call mint-identity-certificate to mint on Polygon
9. Update asset to 'minted' status on success
10. Log face_verified event to identity_access_logs

**Output**:
```json
{
  "status": "verified",
  "faceHash": "0x...",
  "txHash": "0x...",
  "explorerUrl": "https://amoy.polygonscan.com/tx/...",
  "metadataUri": "ipfs://Qm...",
  "assetId": "uuid"
}
```

### Smart Contract Integration

Reuses existing **IdentityCertificate** contract on Polygon Amoy:
- Contract Address: `0xB5627bDbA3ab392782E7E542a972013E3e7F37C3`
- Function: `certifyClip(address creator, string clipId)` 
  - For face identity, clipId = identity_asset.id
- Event: `ClipCertified(address indexed creator, string clipId, uint256 timestamp)`

## UI Components

### Identity & Rights Page (/identity)

**Identity Overview Card**:
- Shows both Voice and Face status pills
- Overall status: Verified if either is verified
- Control message: "Control how your real voice and likeness can be used on Seeksy"

**Face Identity Section** (FaceIdentitySection.tsx):
- Status badge: Not set | Pending | Verified | Failed
- Upload area: 3–5 photos or selfie video
- Image preview grid (max 5 images)
- Start/Retry Verification button
- Progress indicator during verification
- Certificate links when verified:
  - View Certificate (/certificate/:id)
  - View on Polygon (Polygonscan)

**Navigation**:
- "Identity & Rights" link in main sidebar
- Banner on My Voice Identity page linking to /identity hub

## User Flow

1. Creator navigates to /identity
2. Clicks "Start Face Verification"
3. Uploads 3–5 photos or records selfie video
4. Reviews image previews
5. Clicks "Start Face Verification"
6. System shows "Analyzing your face and creating an on-chain certificate…"
7. On success:
   - Status changes to "Verified"
   - Certificate links appear
   - Success toast shown
   - Activity log updated
8. On failure:
   - Status changes to "Failed"
   - Retry button available
   - Error details logged

## Security & Privacy

- Face embeddings are generated using OpenAI Vision API
- faceHash is computed client-side before blockchain mint
- No raw face images are stored on-chain
- Only the cryptographic hash is minted as NFT
- Face data used only for identity verification
- Full transparency in identity_access_logs

## Permissions Integration

Face identity respects the same permissions as voice identity:
- `clip_use`: Allow clips with your face in Seeksy features
- `ai_generation`: Allow AI-generated content with your face (with approval)
- `advertiser_access`: Allow advertisers to request use of your face
- `anonymous_training`: Allow anonymous face data for model training

## Future Enhancements

1. Multiple face verification methods (photos, video, live camera)
2. Real IPFS storage for metadata
3. Face detection monitoring across external platforms
4. Facial expression embedding for advanced verification
5. Integration with Advertiser Module for face usage licensing
6. Face + Voice combined verification workflows

## API Endpoints

- `POST /functions/v1/verify-face` - Start face verification
- `POST /functions/v1/mint-identity-certificate` - Mint face certificate on-chain
- `GET /identity` - Identity & Rights management UI
- `GET /certificate/:id` - View certificate page

## Database Queries

**Get user's face identity**:
```sql
SELECT * FROM identity_assets 
WHERE user_id = :userId AND type = 'face_identity' 
ORDER BY created_at DESC LIMIT 1;
```

**Get face access logs**:
```sql
SELECT * FROM identity_access_logs 
WHERE identity_asset_id = :assetId 
AND action IN ('face_started', 'face_verified', 'face_failed', 'face_revoked')
ORDER BY created_at DESC;
```

## Testing

1. Navigate to /identity
2. Click "Start Face Verification" under Face Identity
3. Upload 3 photos
4. Verify image previews display correctly
5. Click "Start Face Verification"
6. Wait for verification to complete (~10-30 seconds)
7. Verify status updates to "Verified"
8. Check certificate links work (internal + Polygonscan)
9. Verify activity log shows face_verified event

## Technical Dependencies

- OpenAI API (GPT-4 Vision) for face analysis
- Polygon Amoy testnet for blockchain minting
- ethers.js for blockchain interaction
- Supabase for database and authentication
- React Query for data fetching
- Shadcn UI for components
