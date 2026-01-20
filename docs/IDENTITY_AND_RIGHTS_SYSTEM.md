# Identity & Rights Management System

## Overview

The Identity & Rights system enables creators to certify and control their face and voice identity assets with blockchain-backed authentication, granular permissions, and advertiser access management.

## Architecture

### Identity Asset Types

1. **FACE_IDENTITY**: Creator's facial likeness for verification and AI generation
2. **VOICE_IDENTITY**: Creator's voice signature for authentication and cloning

### Core Components

```
identity_assets (table)
├── Certification fields (cert_status, cert_tx_hash, etc.)
├── Permissions (jsonb: clip_use, ai_generation, advertiser_access, anonymous_training)
├── Consent tracking (consent_version, revoked_at)
└── Standard metadata

identity_access_requests (table)
├── Advertiser → Creator access requests
├── Status tracking (pending, approved, denied)
└── Reason and timestamps

identity_access_logs (table)
├── All identity events (certified, revoked, permission_changed, access_granted, etc.)
├── Actor tracking
└── Event details (jsonb)
```

## Automatic Certification

Identity assets auto-certify on upload using the same blockchain pipeline as clips:

1. **Upload**: Creator uploads face or voice identity asset
2. **Store**: Asset saved to `identity_assets` with `cert_status = 'not_requested'`
3. **Auto-Trigger**: System automatically calls `mint-identity-certificate` edge function
4. **Blockchain Mint**: Real ERC-721 certificate minted on Polygon Amoy
5. **Update**: Asset updated with `cert_status = 'minted'`, tx_hash, explorer URL
6. **Log**: Event logged to `identity_access_logs` with action = 'certified'

### Edge Function: `mint-identity-certificate`

Reuses the same contract and pattern as clip certification:
- Contract: `0xB5627bDbA3ab392782E7E542a972013E3e7F37C3` (Polygon Amoy)
- Supports service role (automatic) and user (manual retry) calls
- Updates `cert_status` through states: not_requested → minting → minted (or failed)
- Logs all certification events

## Permissions System

### Four Permission Types

1. **Clip Use** (`clip_use`): Allow identity in clip generation and distribution
2. **AI Generation** (`ai_generation`): Allow AI systems to generate content using identity
3. **Advertiser Access** (`advertiser_access`): Allow advertisers to request usage in campaigns
4. **Anonymous Model Training** (`anonymous_training`): Allow anonymized identity data in AI training

### Permission Management

- **Global Control**: Toggle affects all creator's identity assets
- **Default State**: `clip_use = true`, all others `false`
- **Change Logging**: Every permission change logged to `identity_access_logs`
- **Real-time Updates**: Changes propagate immediately across platform

## Advertiser Access Request Flow

### Request Process

1. **Advertiser**: Submits access request via identity asset ID + reason
2. **Creator**: Views request in "Access Requests" tab of Identity Dashboard
3. **Creator**: Approves or denies request
4. **System**: Logs decision to `identity_access_logs`
5. **Advertiser**: Receives notification of decision

### Access Request Statuses

- **pending**: Awaiting creator decision
- **approved**: Creator granted access
- **denied**: Creator rejected request

## Identity Dashboard UI

### Main Tabs

1. **Overview**
   - Stats cards (total identities, certified count, pending requests)
   - Global permissions panel
   - Recent identity assets grid

2. **Face**
   - All face_identity assets
   - Filterable and sortable

3. **Voice**
   - All voice_identity assets
   - Filterable and sortable

4. **Access Requests**
   - Table of all advertiser requests
   - Approve/Deny actions for pending
   - Status history for completed

### Identity Asset Card

Each card displays:
- Thumbnail or icon (face/voice)
- Certification badge (minted, minting, pending, failed)
- Title and creation date
- Actions menu:
  - Open File
  - View Certificate (if minted)
  - Revoke Identity

## Admin Console Integration

### New Identity Tracking Sections

Admin Certification Console (`/admin/certification`) extended with:

1. **Identity Certified Tab**
   - All certified face/voice assets
   - Certification timestamps
   - Blockchain tx hashes
   - Creator attribution

2. **Identity Revoked Tab**
   - Historical view of revoked identities
   - Revocation timestamps and reasons
   - Maintained for audit trail

3. **Access Granted Logs Tab**
   - All advertiser access approvals
   - Grant timestamps
   - Advertiser and creator details
   - Linked identity assets

## Revocation System

### Revoke Identity Flow

1. Creator clicks "Revoke Identity" on asset card
2. Confirmation dialog explains impact
3. On confirm:
   - `revoked_at` timestamp set
   - Event logged to `identity_access_logs`
   - Asset hidden from active views
   - Blockchain certificate remains (immutable)
4. Admin console shows revoked assets for audit

### Revocation Effects

- **UI**: Asset no longer appears in creator's active dashboard
- **Permissions**: All permissions automatically disabled
- **Access Requests**: Pending requests auto-denied
- **Blockchain**: On-chain certificate persists (cannot be revoked on-chain)
- **Audit**: Revocation logged with timestamp and actor

## Database Schema

### identity_assets

```sql
CREATE TABLE identity_assets (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT CHECK (type IN ('face_identity', 'voice_identity')),
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  
  -- Certification
  cert_status TEXT DEFAULT 'not_requested',
  cert_chain TEXT,
  cert_tx_hash TEXT,
  cert_token_id TEXT,
  cert_explorer_url TEXT,
  cert_created_at TIMESTAMPTZ,
  cert_updated_at TIMESTAMPTZ,
  
  -- Identity-specific
  consent_version TEXT DEFAULT 'v1.0',
  permissions JSONB DEFAULT '{"clip_use": true, "ai_generation": false, "advertiser_access": false, "anonymous_training": false}',
  revoked_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### identity_access_requests

```sql
CREATE TABLE identity_access_requests (
  id UUID PRIMARY KEY,
  identity_asset_id UUID NOT NULL,
  advertiser_id UUID NOT NULL,
  request_reason TEXT,
  status TEXT CHECK (status IN ('pending', 'approved', 'denied')),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  denied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### identity_access_logs

```sql
CREATE TABLE identity_access_logs (
  id UUID PRIMARY KEY,
  identity_asset_id UUID NOT NULL,
  action TEXT CHECK (action IN ('certified', 'revoked', 'permission_changed', 'access_granted', 'access_denied', 'access_requested')),
  actor_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## RLS Policies

All tables enforce strict RLS:
- **Creators**: Full access to own identity assets and related requests/logs
- **Advertisers**: Can view own requests, submit new requests
- **Admins**: Full visibility across all identities, requests, and logs
- **System**: Service role can perform auto-certification and logging

## Integration Points

### With Media Vault

- Identity assets appear in Media Vault with type filters
- Certification status displayed via same badge system as clips
- Folder organization supported

### With Clips Pipeline

- `clip_use` permission gates whether identity can be used in clips
- Certified identities displayed with verification badge in clip metadata

### With Advertiser Module

- Advertisers discover creators with `advertiser_access = true`
- Access request flow integrated into advertiser campaign builder
- Approved access tracked for billing and attribution

### With AI Services

- `ai_generation` permission gates AI voice cloning and face synthesis
- `anonymous_training` permission controls data usage in model training
- All AI usage logged to `identity_access_logs`

## Future Enhancements

1. **Multi-chain Support**: Extend beyond Polygon to Base, Ethereum mainnet
2. **Licensing Terms**: Per-identity licensing terms and pricing
3. **Usage Analytics**: Track how and where identity is used across platforms
4. **Batch Certification**: Certify multiple identities in single transaction
5. **NFT Marketplace**: Allow creators to sell licensed use of certified identities
6. **Biometric Verification**: Enhanced identity verification using biometric checks
7. **Consent Versioning**: Track consent version changes and require re-acceptance
8. **Access Expiry**: Time-limited advertiser access with auto-expiration

## Security Considerations

- All certification happens server-side via edge functions
- Private keys never exposed to client
- RLS policies enforce strict data isolation
- Blockchain provides tamper-proof audit trail
- Revocation creates permanent audit record without destroying data
- Permissions changes logged with actor attribution

## Testing Workflow

1. **Upload Identity**: Creator uploads face or voice asset
2. **Auto-Cert**: System auto-certifies on Polygon Amoy
3. **View Dashboard**: Verify certification badge appears
4. **Adjust Permissions**: Toggle permissions and verify updates
5. **Request Access**: Advertiser submits access request
6. **Review Request**: Creator approves/denies in dashboard
7. **Check Logs**: Admin views certification and access logs
8. **Revoke**: Creator revokes identity and verifies hiding
9. **Audit Trail**: Admin verifies revoked asset in admin console

## Component Locations

- **IdentityDashboard**: `src/components/identity/IdentityDashboard.tsx`
- **IdentityAssetCard**: `src/components/identity/IdentityAssetCard.tsx`
- **IdentityPermissionsPanel**: `src/components/identity/IdentityPermissionsPanel.tsx`
- **AdvertiserAccessRequests**: `src/components/identity/AdvertiserAccessRequests.tsx`
- **Edge Function**: `supabase/functions/mint-identity-certificate/index.ts`
- **Admin Integration**: `src/pages/admin/CertificationConsole.tsx`

## Routes

- `/identity` - Identity & Rights Dashboard (creator)
- `/admin/certification` - Admin Certification Console (includes identity tracking)