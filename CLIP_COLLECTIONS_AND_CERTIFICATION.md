# Clip Collections & Blockchain Certification

Complete implementation guide for organizing clips into collections and blockchain certification system.

## 1. Clip Collections (Folders)

### Database Schema

**clip_collections** table:
- `id` (UUID) - Primary key
- `user_id` (UUID) - Owner
- `name` (TEXT) - Collection name (required)
- `description` (TEXT) - Optional description
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**clips** table additions:
- `collection_id` (UUID, nullable) - References `clip_collections.id`

### Edge Function API

**Endpoint**: `manage-clip-collections`

All operations require authentication and return JSON responses.

#### Create Collection

```typescript
await supabase.functions.invoke('manage-clip-collections', {
  body: {
    operation: 'create_collection',
    name: 'Social Media Clips',
    description: 'Vertical clips for TikTok and Reels' // optional
  }
});

// Response:
{
  success: true,
  collection: {
    id: 'uuid',
    user_id: 'uuid',
    name: 'Social Media Clips',
    description: 'Vertical clips for TikTok and Reels',
    created_at: '2025-11-29T...',
    updated_at: '2025-11-29T...'
  },
  message: 'Collection created successfully'
}
```

#### Update Collection

```typescript
await supabase.functions.invoke('manage-clip-collections', {
  body: {
    operation: 'update_collection',
    collectionId: 'uuid',
    name: 'Updated Name',      // optional
    description: 'New description' // optional
  }
});
```

#### Delete Collection

Deletes the collection and moves all clips to "Unsorted" (sets `collection_id = null`).

```typescript
await supabase.functions.invoke('manage-clip-collections', {
  body: {
    operation: 'delete_collection',
    collectionId: 'uuid'
  }
});

// Response:
{
  success: true,
  message: 'Collection deleted successfully (clips moved to unsorted)'
}
```

#### Move Clip to Collection

```typescript
// Move to collection
await supabase.functions.invoke('manage-clip-collections', {
  body: {
    operation: 'move_clip',
    clipId: 'uuid',
    collectionId: 'uuid'
  }
});

// Move to unsorted (remove from collection)
await supabase.functions.invoke('manage-clip-collections', {
  body: {
    operation: 'move_clip',
    clipId: 'uuid',
    collectionId: null
  }
});
```

#### List Collections

Returns all user collections with clip counts.

```typescript
const { data } = await supabase.functions.invoke('manage-clip-collections', {
  body: {
    operation: 'list_collections'
  }
});

// Response:
{
  success: true,
  collections: [
    {
      id: 'uuid',
      name: 'Social Media',
      description: 'Vertical clips',
      created_at: '2025-11-29T...',
      updated_at: '2025-11-29T...',
      clip_count: 12
    }
  ],
  unsorted_count: 5
}
```

### UI Integration Points

**Left Sidebar Navigation** (in Clips section):
- "All Clips" (show all)
- "Unsorted" (where `collection_id IS NULL`)
- User collections (alphabetically sorted)
- "+ New Collection" button

**Clip Card Context Menu**:
- "Move to Collection..." → Opens modal with:
  - List of existing collections (radio select)
  - "+ Create New Collection" option
  - "Move to Unsorted" option

**Collection Management**:
- Right-click on collection → Rename, Delete
- Drag-and-drop clips between collections (future enhancement)

---

## 2. Blockchain Certification

### Database Schema

**clips** table additions:
- `cert_status` (TEXT) - Enum: `not_requested`, `pending`, `minting`, `minted`, `failed`
- `cert_chain` (TEXT) - Blockchain network: `polygon`, `base`, `ethereum`
- `cert_tx_hash` (TEXT) - Transaction hash
- `cert_token_id` (TEXT) - NFT token ID
- `cert_explorer_url` (TEXT) - Block explorer URL
- `cert_created_at` (TIMESTAMP) - When certificate was minted

**Default**: All new clips have `cert_status = 'not_requested'`

### Certification Flow

#### Automatic Trigger (Phase 1)

When Shotstack webhook marks a clip as done:

1. Clip status changes to `ready`
2. Final video URL saved to `vertical_url`
3. **If `cert_status = 'not_requested'`**, automatically set to `'pending'`

This marks the clip as eligible for blockchain certification.

#### Manual Minting

**Endpoint**: `mint-clip-certificate`

```typescript
await supabase.functions.invoke('mint-clip-certificate', {
  body: {
    clipId: 'uuid',
    chain: 'polygon' // optional: 'polygon' | 'base' | 'ethereum'
  }
});

// Response (Phase 1 - Mock):
{
  success: true,
  clip: { /* updated clip with cert fields */ },
  certificate: {
    chain: 'polygon',
    tx_hash: '0x123...',
    token_id: '456789',
    explorer_url: 'https://polygonscan.com/tx/0x123...'
  },
  message: 'Clip certificate minted successfully'
}
```

#### Process

1. **Validation**:
   - Clip must be `status = 'ready'`
   - Clip must have `output_url`
   - Clip must not already be certified (`cert_status !== 'minted'`)

2. **Minting**:
   - Set `cert_status = 'minting'`
   - **Phase 1**: Simulate blockchain minting (1 second delay, mock data)
   - **Phase 2**: Real blockchain integration (see below)

3. **Success**:
   - Set `cert_status = 'minted'`
   - Save `cert_chain`, `cert_tx_hash`, `cert_token_id`, `cert_explorer_url`
   - Set `cert_created_at = now()`

4. **Failure**:
   - Set `cert_status = 'failed'`
   - Log error for debugging

### Phase 2: Real Blockchain Integration

The `mint-clip-certificate` function has clear integration points for real web3:

```typescript
// ============================================================
// PHASE 2: REAL WEB3 INTEGRATION
// ============================================================
// 
// Replace mock section with:
// 
// 1. Load user/workspace wallet config
const { data: wallet } = await supabase
  .from('user_wallets')
  .select('address, private_key_encrypted')
  .eq('user_id', user.id)
  .single();

// 2. Initialize web3 provider for selected chain
const provider = new ethers.JsonRpcProvider(rpcUrls[chain]);
const signer = new ethers.Wallet(decryptedPrivateKey, provider);

// 3. Prepare contract call with clip metadata
const contract = new ethers.Contract(contractAddress, abi, signer);
const metadata = {
  clipId: clip.id,
  title: clip.title,
  outputUrl: clip.output_url,
  creator: user.id,
  createdAt: clip.created_at
};

// 4. Submit transaction
const tx = await contract.mintClipCertificate(
  user.id, 
  JSON.stringify(metadata)
);

// 5. Wait for confirmation
const receipt = await tx.wait();

// 6. Extract token ID and tx hash
const tokenId = receipt.events[0].args.tokenId.toString();
const txHash = receipt.transactionHash;
```

### UI Integration Points

**Clip Card Badge**:
- `cert_status = 'minted'` → ✓ "Certified on-chain" badge (green)
- `cert_status = 'pending'` → ⏳ "Certification pending" badge (yellow)
- `cert_status = 'minting'` → ⏳ "Minting..." badge (animated)
- `cert_status = 'failed'` → ✗ "Certification failed" badge (red, with retry)
- `cert_status = 'not_requested'` → No badge, show "Certify" button

**Clip Detail View**:
When certified, show:
- Chain name (e.g., "Polygon")
- Transaction hash (truncated: `0x1234...5678`)
- "View on Explorer" link → Opens `cert_explorer_url`
- Token ID
- Certification date

**Bulk Actions** (future):
- Select multiple clips → "Certify Selected" button
- Batch minting with progress indicator

---

## Frontend Hooks

### useClipCollections

```typescript
import { supabase } from '@/integrations/supabase/client';

export const useClipCollections = () => {
  const createCollection = async (name: string, description?: string) => {
    const { data } = await supabase.functions.invoke('manage-clip-collections', {
      body: { operation: 'create_collection', name, description }
    });
    return data;
  };

  const updateCollection = async (
    collectionId: string, 
    updates: { name?: string; description?: string }
  ) => {
    const { data } = await supabase.functions.invoke('manage-clip-collections', {
      body: { operation: 'update_collection', collectionId, ...updates }
    });
    return data;
  };

  const deleteCollection = async (collectionId: string) => {
    const { data } = await supabase.functions.invoke('manage-clip-collections', {
      body: { operation: 'delete_collection', collectionId }
    });
    return data;
  };

  const moveClip = async (clipId: string, collectionId: string | null) => {
    const { data } = await supabase.functions.invoke('manage-clip-collections', {
      body: { operation: 'move_clip', clipId, collectionId }
    });
    return data;
  };

  const listCollections = async () => {
    const { data } = await supabase.functions.invoke('manage-clip-collections', {
      body: { operation: 'list_collections' }
    });
    return data;
  };

  return {
    createCollection,
    updateCollection,
    deleteCollection,
    moveClip,
    listCollections
  };
};
```

### useClipCertification

```typescript
import { supabase } from '@/integrations/supabase/client';

export const useClipCertification = () => {
  const mintCertificate = async (
    clipId: string, 
    chain: 'polygon' | 'base' | 'ethereum' = 'polygon'
  ) => {
    const { data } = await supabase.functions.invoke('mint-clip-certificate', {
      body: { clipId, chain }
    });
    return data;
  };

  const getCertificationStatus = async (clipId: string) => {
    const { data } = await supabase
      .from('clips')
      .select('cert_status, cert_chain, cert_tx_hash, cert_token_id, cert_explorer_url, cert_created_at')
      .eq('id', clipId)
      .single();
    return data;
  };

  return {
    mintCertificate,
    getCertificationStatus
  };
};
```

---

## Testing

### Collections

```bash
# Create collection
curl -X POST https://your-project.supabase.co/functions/v1/manage-clip-collections \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"operation":"create_collection","name":"Test Collection"}'

# List collections
curl -X POST https://your-project.supabase.co/functions/v1/manage-clip-collections \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"operation":"list_collections"}'

# Move clip
curl -X POST https://your-project.supabase.co/functions/v1/manage-clip-collections \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"operation":"move_clip","clipId":"uuid","collectionId":"uuid"}'
```

### Certification

```bash
# Mint certificate for a clip
curl -X POST https://your-project.supabase.co/functions/v1/mint-clip-certificate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"clipId":"uuid","chain":"polygon"}'
```

---

## Database Queries

### Get all collections with clip counts

```sql
SELECT 
  c.id,
  c.name,
  c.description,
  COUNT(cl.id) as clip_count
FROM clip_collections c
LEFT JOIN clips cl ON cl.collection_id = c.id
WHERE c.user_id = 'user-uuid'
GROUP BY c.id
ORDER BY c.name;
```

### Get unsorted clips

```sql
SELECT * FROM clips 
WHERE user_id = 'user-uuid' 
  AND collection_id IS NULL
ORDER BY created_at DESC;
```

### Get certified clips

```sql
SELECT * FROM clips 
WHERE user_id = 'user-uuid' 
  AND cert_status = 'minted'
ORDER BY cert_created_at DESC;
```

### Get clips pending certification

```sql
SELECT * FROM clips 
WHERE user_id = 'user-uuid' 
  AND cert_status = 'pending'
ORDER BY created_at DESC;
```

---

## Next Steps

**Collections UI**:
1. Build left sidebar navigation with collections list
2. Add "New Collection" dialog
3. Add "Move to Collection" context menu on clips
4. Implement collection rename/delete actions

**Certification UI**:
1. Add certification badge to clip cards
2. Build clip detail modal with certificate info
3. Add "Certify" button for pending clips
4. Add "View on Explorer" link for minted clips
5. Show certification status indicators

**Phase 2 Blockchain**:
1. Set up smart contract on Polygon/Base
2. Implement wallet management for users
3. Replace mock minting with real web3 calls
4. Add transaction confirmation polling
5. Handle gas estimation and payment
