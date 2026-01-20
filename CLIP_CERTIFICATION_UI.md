# Seeksy Blockchain Certification - UI Implementation

## Overview

The Seeksy Blockchain Certification system provides visual indicators and detailed certificate views for AI-generated clips that have been certified on-chain. This document covers the UI implementation of the certification badge system.

---

## Components

### 1. CertificationBadge Component

**Location:** `src/components/clips/CertificationBadge.tsx`

A reusable badge component that displays the current certification status of a clip with appropriate colors, icons, and labels.

#### Badge States

| Status | Label | Background | Text Color | Icon |
|--------|-------|------------|------------|------|
| `minted` | ✓ Certified On-Chain | #053877 (Seeksy navy) | White | Shield |
| `pending` | ⌛ Certification Pending | #d1a300 (Gold) | Black | Clock |
| `minting` | ⏳ Certifying… | #5BA1FF (Light blue) | Black | Spinner (animated) |
| `failed` | ⚠️ Certification Failed | #C62828 (Red) | White | Alert Triangle |
| `not_requested` | (No badge shown) | - | - | - |

#### Props

```typescript
interface CertificationBadgeProps {
  status: "minted" | "pending" | "minting" | "failed" | "not_requested";
  mini?: boolean;  // Mini version for clip cards (26px height)
  className?: string;
}
```

#### Usage

```tsx
// Mini badge for clip cards
<CertificationBadge status={clip.cert_status} mini />

// Full-size badge for detail views
<CertificationBadge status={clip.cert_status} />
```

---

### 2. CertificationSection Component

**Location:** `src/components/clips/CertificationSection.tsx`

A detailed certification information panel that displays full blockchain certificate details.

#### Props

```typescript
interface CertificationSectionProps {
  clipId: string;
  certStatus: string;
  certChain?: string | null;
  certTxHash?: string | null;
  certExplorerUrl?: string | null;
  certCreatedAt?: string | null;
}
```

#### Features

- **Status Badge**: Shows current certification state
- **Chain Information**: Displays blockchain network (Polygon, Base, etc.)
- **Transaction Hash**: Shows shortened hash with copy and explorer link buttons
- **Certification Date**: Formatted date when certificate was minted
- **View Certificate Button**: Opens certificate page when minted
- **Contextual Messages**: Different UI for pending, minting, and failed states

---

### 3. Certificate Page

**Location:** `src/pages/Certificate.tsx`

**Route:** `/certificate/:clipId`

A full-page certificate view that displays comprehensive certification information.

#### Sections

1. **Header**
   - Seeksy shield logo
   - Title: "Seeksy Blockchain Certificate"
   - Subtitle: "Certificate of Authenticity"
   - Status badge

2. **Clip Information**
   - Clip title
   - Creator name
   - Created date
   - Certified date

3. **Blockchain Details** (when minted)
   - Chain name (badge)
   - Full transaction hash (with copy button)
   - Token ID
   - Explorer link button

4. **Footer**
   - "Issued by Seeksy"
   - "Verified media identity for creators"

---

## Integration Points

### ClipsGallery Component

**Location:** `src/components/media/ClipsGallery.tsx`

#### Clip Card Badge

Mini certification badges appear in the **top-right corner** of clip cards:

```tsx
<div className="absolute top-2 right-2">
  <CertificationBadge status={clip.cert_status} mini />
</div>
```

- When a virality badge is also present, it moves to top-left to avoid overlap
- Badge only shows when `cert_status !== 'not_requested'`

#### Clip Preview Dialog

When users click to preview a clip, the certification section appears below video and caption information:

```tsx
{clip.cert_status && clip.cert_status !== 'not_requested' && (
  <CertificationSection
    clipId={clip.id}
    certStatus={clip.cert_status}
    certChain={clip.cert_chain}
    certTxHash={clip.cert_tx_hash}
    certExplorerUrl={clip.cert_explorer_url}
    certCreatedAt={clip.cert_created_at}
  />
)}
```

---

## Database Fields

The clips table includes the following certification fields:

```sql
cert_status TEXT (not_requested | pending | minting | minted | failed)
cert_chain TEXT (polygon | base | ethereum | null)
cert_tx_hash TEXT (0x... | null)
cert_token_id TEXT (token ID | null)
cert_explorer_url TEXT (blockchain explorer URL | null)
cert_created_at TIMESTAMP (certification timestamp | null)
```

All certification fields are queried and displayed in the UI components.

---

## User Experience Flow

### Automatic Certification

1. **Clip Processing**
   - Shotstack renders clip
   - Webhook receives "done" status
   - System automatically sets `cert_status = 'pending'`

2. **Minting Phase**
   - Edge function `mint-clip-certificate` executes
   - Status changes to `minting`
   - Badge shows animated spinner: "⏳ Certifying…"

3. **Success**
   - Certificate minted on blockchain
   - Status changes to `minted`
   - Badge shows: "✓ Certified On-Chain"
   - Full certificate details available

4. **Failure Handling**
   - If minting fails, status = `failed`
   - Red warning badge appears
   - User sees error message in certification section

### User Interactions

- **Clip Card**: Quick visual indicator with mini badge
- **Clip Preview**: Detailed certification info with copy/link buttons
- **Certificate Page**: Full certificate view for sharing and verification
- **Copy Transaction Hash**: One-click copy with toast notification
- **View on Explorer**: Direct link to blockchain explorer (Polygonscan, etc.)

---

## Future Enhancements

### Phase 2: Real Web3 Integration

When integrating actual blockchain functionality, update:

1. **mint-clip-certificate edge function**
   - Replace mock data with real Web3 provider
   - Connect to Polygon/Base RPC
   - Sign transactions with platform wallet
   - Handle real gas estimation and confirmation

2. **Metadata Storage**
   - Upload certificate metadata to IPFS/Arweave
   - Store metadata URI in `cert_metadata_uri` field

3. **User Wallet Options**
   - Allow creators to use their own wallets
   - Support wallet connection (MetaMask, WalletConnect)
   - Enable creators to pay gas fees (optional)

4. **Multi-Chain Support**
   - Dynamic chain selection during minting
   - Chain-specific configuration and explorers
   - Cross-chain certificate verification

### Additional UI Features

- **Certificate Download**: Export certificate as PDF/image
- **Social Sharing**: Share certificate directly to social media
- **Embed Widget**: Embeddable certification badge for external sites
- **Certificate History**: View all certifications for a creator
- **Verification API**: Public API endpoint for third-party verification

---

## Design System

### Colors

All colors use HSL values and semantic tokens from the design system:

- **Navy Blue**: `#053877` - Primary brand color for certified state
- **Gold**: `#d1a300` - Pending/warning state
- **Light Blue**: `#5BA1FF` - Processing state
- **Red**: `#C62828` - Failed/error state

### Icons (Lucide React)

- `Shield` - Certification/security
- `Clock` - Pending status
- `Loader2` - Processing (with spin animation)
- `AlertTriangle` - Failed status
- `ExternalLink` - External links
- `Copy` - Copy actions

### Typography

- **Badge Text**: 12px (mini) / 14px (standard)
- **Section Titles**: Font weight 600
- **Certificate Page Title**: 3xl font size
- **Code Blocks**: Monospace font for hashes

---

## Testing

### Test Scenarios

1. **New Clip Processing**
   - Create demo clip
   - Verify badge shows "Certification Pending"
   - Wait for minting simulation
   - Confirm badge updates to "Certified On-Chain"

2. **Badge Visibility**
   - Check mini badge on clip cards
   - Verify positioning doesn't overlap other badges
   - Test in both light and dark themes

3. **Certification Section**
   - Preview clip to see detailed certification info
   - Copy transaction hash
   - Click "View on Explorer" button
   - Verify all fields display correctly

4. **Certificate Page**
   - Navigate to `/certificate/:clipId`
   - Verify all clip and blockchain details render
   - Test back button navigation
   - Check responsive layout on mobile

5. **Failed State**
   - Simulate minting failure
   - Verify red warning badge appears
   - Check error message displays in section

---

## API Integration

### Edge Functions

#### mint-clip-certificate

**Endpoint:** `supabase.functions.invoke('mint-clip-certificate', { body: { clipId } })`

**Request:**
```typescript
{
  clipId: string;
  chain?: 'polygon' | 'base' | 'ethereum';
}
```

**Response:**
```typescript
{
  success: boolean;
  clip: Clip;
  certificate: {
    chain: string;
    tx_hash: string;
    token_id: string;
    explorer_url: string;
  };
  message: string;
}
```

---

## Summary

The Seeksy Blockchain Certification UI provides a complete visual system for displaying clip certification status:

- ✅ **Reusable badge component** with multiple states
- ✅ **Detailed certification section** for clip previews
- ✅ **Full certificate page** for verification and sharing
- ✅ **Automatic certification** after clip rendering
- ✅ **Real-time status updates** with polling
- ✅ **Copy and share functionality** for transaction details
- ✅ **Responsive design** across all device sizes

The system is designed to be easily upgraded to real blockchain integration while maintaining the same user experience and visual design.
