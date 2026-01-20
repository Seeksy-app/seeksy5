# Automatic Blockchain Certification

## Overview

Seeksy automatically certifies all clips on the Polygon Amoy blockchain as part of the clip creation pipeline. This provides immutable, verifiable proof of content authenticity without requiring manual creator action.

## Architecture

### Smart Contract
- **Network**: Polygon Amoy testnet (Chain ID: 80002)
- **Contract Address**: `0xB5627bDbA3ab392782E7E542a972013E3e7F37C3`
- **Function**: `certifyClip(address creator, string memory clipId)`
- **Event**: `ClipCertified(address indexed creator, string clipId, uint256 timestamp)`

### Environment Variables
- `POLYGON_RPC_URL`: Polygon Amoy RPC endpoint
- `SEEKSY_MINTER_PRIVATE_KEY`: Platform wallet private key (deployer)

### Database Schema
Clips table includes certification fields:
- `cert_status`: 'not_requested' | 'pending' | 'minting' | 'minted' | 'failed'
- `cert_chain`: Chain identifier (e.g., 'polygon')
- `cert_tx_hash`: Transaction hash on blockchain
- `cert_token_id`: Certificate token ID
- `cert_explorer_url`: Polygonscan URL for verification
- `cert_created_at`: Timestamp when certificate was minted
- `cert_updated_at`: Last status update timestamp
- `enable_certification`: Boolean flag to enable/disable per clip

## Automatic Certification Flow

### 1. Clip Creation
When a clip is created (via Create Clips, Post Production, or any other method):
```typescript
{
  status: 'processing',
  enable_certification: true, // Can be set to false to skip certification
  cert_status: 'not_requested' // Always starts here
}
```

### 2. Shotstack Rendering
- Vertical (9:16) and thumbnail renders are submitted to Shotstack
- Webhook receives status updates as renders progress
- When BOTH renders complete, clip status becomes 'ready'

### 3. Certification Trigger
**File**: `supabase/functions/shotstack-webhook/index.ts`

When both renders complete:
```typescript
if (updateData.status === "ready" && 
    clip.cert_status === 'not_requested' && 
    clip.enable_certification === true) {
  updateData.cert_status = 'pending';
  
  // Call mint-clip-certificate in background
  supabase.functions.invoke('mint-clip-certificate', {
    body: { clipId: clip.id }
  });
}
```

### 4. Blockchain Minting
**File**: `supabase/functions/mint-clip-certificate/index.ts`

The minting function:
1. Sets cert_status to 'minting'
2. Initializes ethers.js provider and signer
3. Calls `contract.certifyClip(creatorAddress, clipId)`
4. Waits for transaction confirmation
5. Extracts ClipCertified event data
6. Updates clip with certificate details:
   - cert_status = 'minted'
   - cert_tx_hash = actual transaction hash
   - cert_token_id = timestamp from event
   - cert_explorer_url = Polygonscan link

### 5. Error Handling
If minting fails:
- cert_status set to 'failed'
- Error logged for admin review
- Clip remains usable (certification failure doesn't block content)
- Manual retry available in Admin Console and Creator UI

## UI Integration

### Creator View (ClipsGallery)
- **Badge Display**: Certification status shown on clip cards
  - "Certified" (green) - Successfully minted
  - "Certifying" (blue) - In progress
  - "Pending" (yellow) - Queued for minting
  - "Failed" (red) - Error occurred
- **Retry Button**: Failed certifications show "Retry Cert" button
- **Certificate Link**: Opens public certificate page at `/certificate/:clipId`

### Admin Console (`/admin/certification`)
- **Summary Cards**: Total certified, last 24h, failed attempts, active chains
- **Activity Table**: All certification events with filters
- **Detail Drawer**: Full certificate info, blockchain links
- **Manual Retry**: Admin can retry failed certifications

### Public Certificate Page (`/certificate/:clipId`)
- Displays clip info, creator, blockchain proof
- Links to Polygonscan transaction
- Future: Voice/face identity verification status

## Security

### Idempotency
- Function checks if clip already certified before minting
- Returns existing certificate if already minted
- Prevents duplicate transactions and wasted gas

### Access Control
Two modes supported:
1. **Service Role** (automatic): Called by shotstack-webhook with service key
2. **User Auth** (manual): Called by creator/admin with user JWT

### Platform Wallet
Currently uses platform wallet (deployer address) as creator address for all certificates. Future enhancement: user wallet addresses from profiles table.

## Testing

### Create a Test Clip
```typescript
// In Create Clips UI
const { data } = await supabase.functions.invoke("create-demo-clip", {
  body: { 
    enableCertification: true // Enable automatic certification
  }
});
```

### Verify Certification
1. Wait for Shotstack renders to complete (~30-60s)
2. Check clip cert_status in database or ClipsGallery
3. Verify transaction on Amoy Polygonscan
4. View certificate at `/certificate/:clipId`

### Monitor in Admin Console
1. Navigate to `/admin/certification`
2. View all certification activity
3. Filter by status (minted, pending, failed)
4. Inspect individual certificates in detail drawer

## Future Enhancements

1. **User Wallets**: Store and use creator wallet addresses instead of platform wallet
2. **Multi-Chain**: Support Polygon mainnet, Base, Ethereum
3. **Identity Signals**: Attach voice fingerprint, face verification, AI usage flags
4. **IPFS Metadata**: Store certificate metadata on IPFS
5. **Gasless for Creators**: Biconomy integration for user-initiated certification
6. **Bulk Certification**: Admin tool to certify historical clips

## Troubleshooting

### Certification Stuck in "Pending"
- Check edge function logs for errors
- Verify RPC URL is accessible
- Check deployer wallet has sufficient MATIC for gas

### "Already Minted" Error
- Clip already has valid certificate
- Check cert_tx_hash in database
- Verify on Polygonscan

### Failed Certifications
- View error in Admin Console detail drawer
- Common causes:
  - RPC rate limits
  - Insufficient gas
  - Network congestion
- Use Retry button to attempt again

## API Reference

### Mint Certificate
```typescript
// Edge function call
const { data, error } = await supabase.functions.invoke(
  'mint-clip-certificate',
  {
    body: { 
      clipId: string,
      chain?: 'polygon' | 'base' | 'ethereum' // Optional, defaults to 'polygon'
    }
  }
);

// Response
{
  success: true,
  clip: { /* updated clip record */ },
  certificate: {
    chain: 'polygon',
    tx_hash: '0x...',
    token_id: '1234567890',
    explorer_url: 'https://amoy.polygonscan.com/tx/0x...',
    contract_address: '0xB5627bDbA3ab392782E7E542a972013E3e7F37C3',
    creator_address: '0x...'
  },
  message: 'Clip certificate minted on Polygon blockchain'
}
```

## Resources

- [Polygon Amoy Faucet](https://faucet.polygon.technology/)
- [Amoy Explorer](https://amoy.polygonscan.com/)
- [SeeksyClipCertificate Contract](https://amoy.polygonscan.com/address/0xB5627bDbA3ab392782E7E542a972013E3e7F37C3)
- [Ethers.js Documentation](https://docs.ethers.org/)
