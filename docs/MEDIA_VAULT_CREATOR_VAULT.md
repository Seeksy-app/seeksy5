# Media Vault - Creator Vault System

## Overview

Media Vault transforms Seeksy's Media Library into a comprehensive "creator vault" that organizes all media types (videos, clips, audio, images) with folder organization, automatic blockchain certification integration, and soft-delete safety.

## Architecture

### Unified Media Model

All media types are surfaced through a unified interface while maintaining separate storage tables:

```typescript
interface MediaItem {
  id: string;
  type: "video" | "clip" | "audio" | "image" | "document";
  title: string;
  url: string;
  thumbnailUrl?: string;
  duration?: number; // seconds
  size: number; // bytes
  created_at: string;
  folder_id?: string;
  // Certification (clips only)
  cert_status?: string;
  cert_tx_hash?: string;
  cert_explorer_url?: string;
  cert_chain?: string;
}
```

### Database Schema

#### media_folders
Organizes all media types for creators:
```sql
CREATE TABLE public.media_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Extended Columns
- **media_files.folder_id**: References media_folders for organization
- **media_files.deleted_at**: Soft delete timestamp
- **clips.deleted_at**: Soft delete timestamp
- **clips.cert_updated_at**: Last certification status change

#### Helper Functions
- `move_media_to_folder(media_type, media_id, target_folder_id)`: Move media to folder
- `soft_delete_media(media_type, media_id)`: Soft delete media item
- `restore_media(media_type, media_id)`: Restore soft-deleted media

## User Experience

### Folder Sidebar
Left-hand navigation showing:
- **All Media**: All items across all folders
- **Unsorted**: Items without folder assignment
- **User Folders**: Custom folders with item counts
- **New Folder** button for creating folders

### Type Filters
Tabs at top of main content area:
- All (total count)
- Videos
- Clips (shows ClipsGallery component)
- Audio
- Images

### Media Cards

Each card displays:

**Thumbnail Area:**
- Visual preview (video frame, audio icon, image, etc.)
- Aspect ratio badge (top-left): "Landscape (16:9)", "Vertical (9:16)" when applicable
- Duration badge (bottom-right): "5:12" format, black/70 opacity background

**Content Area:**
- Title (line-clamp-2)
- Metadata row: "5:12 • 126 MB"
- Certification badge (for clips):
  - ✓ Certified (green, #053877)
  - ⏳ Certifying (blue, with spinner)
  - ❌ Failed (red, with retry option)
- Date created

**Actions Menu (⋯):**
- Open (in new tab)
- Download
- Move to Folder
- Rename
- View Certificate (clips with cert_status = 'minted' only)
- Retry Certification (clips with cert_status = 'failed' only)
- Delete (soft delete)

### Search
Real-time search filtering by title across all media types.

## Certification Integration

### Read-Only Display

Media Vault **reads** certification status from existing fields:
- `cert_status`: 'not_requested' | 'pending' | 'minting' | 'minted' | 'failed'
- `cert_tx_hash`: Transaction hash
- `cert_explorer_url`: Polygonscan link
- `cert_chain`: Chain identifier ('polygon')

### Automatic Certification Flow

1. Clip created via Create Clips or other workflow
2. Shotstack renders vertical + thumbnail
3. When both complete → `cert_status: 'pending'`
4. `mint-clip-certificate` edge function mints on Polygon Amoy
5. Clip updated with tx_hash and `cert_status: 'minted'`

**Media Vault does NOT trigger certification** - it only displays the status.

### Manual Retry

For clips with `cert_status === 'failed'`:
- "Retry Certification" option in card menu
- Calls `mint-clip-certificate` edge function
- Updates certification status when complete

## Soft Delete

### Behavior
- Deleted items are NOT permanently removed from database
- `deleted_at` timestamp is set instead
- Queries automatically filter out soft-deleted items via `.is("deleted_at", null)`
- Blockchain certificates remain intact and visible in Admin Console

### User Flow
1. User clicks Delete in card menu
2. Confirmation dialog: "This removes the file from your media library. Existing clips or certificates will not be removed from the blockchain."
3. On confirm, `deleted_at` set to NOW()
4. Item immediately removed from Media Vault UI

### Admin View
Admin Console (`/admin/certification`) shows **all** certification records including deleted media, marked with "Deleted" badge for historical tracking.

## Folder Management

### Create Folder
1. Click "New Folder" in sidebar
2. Enter folder name
3. Folder appears in sidebar with item count (0)

### Rename Folder
1. Click ⋯ menu on folder in sidebar
2. Select "Rename"
3. Enter new name
4. Folder name updates immediately

### Delete Folder
1. Click ⋯ menu on folder in sidebar
2. Select "Delete"
3. All items in folder move to "Unsorted"
4. Folder removed from sidebar

### Move Media to Folder
1. Click ⋯ menu on media card
2. Select "Move to Folder"
3. Choose destination folder or "Unsorted"
4. Item immediately moves to new folder

## API Endpoints

### Create Folder
```typescript
await supabase.from("media_folders").insert({
  user_id: userId,
  name: "My Folder",
});
```

### Move Media
```typescript
// Move media_file
await supabase
  .from("media_files")
  .update({ folder_id: targetFolderId })
  .eq("id", mediaId);

// Move clip
await supabase
  .from("clips")
  .update({ collection_id: targetFolderId })
  .eq("id", clipId);
```

### Soft Delete
```typescript
// Delete media_file
await supabase
  .from("media_files")
  .update({ deleted_at: new Date().toISOString() })
  .eq("id", mediaId);

// Delete clip
await supabase
  .from("clips")
  .update({ deleted_at: new Date().toISOString() })
  .eq("id", clipId);
```

### Retry Certification
```typescript
const { data, error } = await supabase.functions.invoke(
  "mint-clip-certificate",
  {
    body: { clipId: "clip-uuid" },
  }
);
```

## Component Structure

```
src/pages/MediaVault.tsx
├── FolderSidebar (left panel)
│   ├── All Media
│   ├── Unsorted
│   └── User Folders (with counts)
├── Main Content
│   ├── Header
│   │   ├── Upload Button
│   │   ├── Type Filter Tabs
│   │   └── Search Bar
│   └── Media Grid
│       ├── ClipsGallery (when viewMode = "clips")
│       └── MediaVaultCard[] (for other types)
└── Dialogs
    ├── Delete Confirmation
    ├── Rename Dialog
    └── Move to Folder Dialog
```

## File Locations

- **Main Page**: `src/pages/MediaVault.tsx`
- **Folder Sidebar**: `src/components/media/FolderSidebar.tsx`
- **Media Card**: `src/components/media/MediaVaultCard.tsx`
- **Clips Gallery**: `src/components/media/ClipsGallery.tsx` (existing, updated)
- **Cert Badge**: `src/components/clips/CertificationBadge.tsx` (existing, updated)
- **Route**: `/media-library` (replaces legacy)
- **Legacy Route**: `/media-library-legacy` (old implementation preserved)

## Migration Path

1. Users access `/media-library` and see new Media Vault UI
2. Existing media and clips automatically appear
3. All items start in "Unsorted"
4. Creators create folders and organize as needed
5. Blockchain certification continues automatically for new clips

## Future Enhancements

1. **Bulk Operations**: Multi-select media items for bulk move/delete
2. **Image Support**: Full image upload and management
3. **Document Support**: PDF, DOCX, etc. for creator resources
4. **Advanced Search**: Filter by date range, file size, duration
5. **Folder Colors**: Visual color coding for folder identification
6. **Folder Descriptions**: Add context and notes to folders
7. **Smart Folders**: Auto-organize by rules (date, type, certification status)
8. **Export Collections**: Download entire folders as ZIP
9. **Share Folders**: Collaborate with team members
10. **Version History**: Track media replacements and edits

## Troubleshooting

### Items Not Appearing
- Check `deleted_at` is null
- Verify user_id matches authenticated user
- Check RLS policies on tables

### Certification Not Showing
- Clips must have `cert_status` field populated
- Verify `mint-clip-certificate` edge function ran
- Check Admin Console for certification logs

### Folder Operations Failing
- Verify RLS policies on media_folders table
- Check user owns the folder being modified
- Ensure folder_id references are valid

## Performance

- Queries use indexes on `user_id`, `folder_id`, `deleted_at`, `cert_status`
- Folder counts calculated client-side from fetched data
- Clips auto-refresh while processing (2s interval)
- Lazy loading for large media collections (future)

## Security

- RLS policies enforce user_id isolation
- Admins can view all folders and certifications
- Soft deletes preserve audit trail
- Blockchain certificates immutable even after media deletion
- Service role access required for automatic certification
