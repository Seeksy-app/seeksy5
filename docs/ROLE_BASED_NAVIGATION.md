# Role-Based Navigation System

## Overview

Seeksy now uses a centralized, role-based navigation system that filters menu items based on user roles stored in the database.

## User Roles

The system supports the following roles:
- `creator` - Content creators
- `subscriber` - Regular users/viewers
- `advertiser` - Advertisers
- `influencer` - Influencers
- `agency` - Influencer agencies
- `admin` - Platform administrators
- `super_admin` - Super administrators

## Architecture

### 1. Navigation Config (`src/config/navigation.ts`)

The **source of truth** for all navigation. To add/remove items or change role access:

```typescript
// Edit src/config/navigation.ts
{
  "group": "Media",
  "items": [
    {
      "id": "master_studio",
      "label": "Master Studio",
      "icon": "studio",
      "path": "/media/studio",
      "roles": ["creator", "influencer", "agency", "admin"]
    }
  ]
}
```

### 2. Database (user_roles table)

Users are assigned roles via the `user_roles` table:

```sql
-- Example: Make a user a creator
INSERT INTO user_roles (user_id, role) 
VALUES ('user-uuid', 'creator');

-- Users can have multiple roles
INSERT INTO user_roles (user_id, role) 
VALUES ('user-uuid', 'influencer');
```

### 3. Hooks

**useUserRoles** - Fetch current user's roles:

```typescript
import { useUserRoles } from '@/hooks/useUserRoles';

function MyComponent() {
  const { roles, isCreator, isAdmin, hasRole } = useUserRoles();
  
  if (isCreator) {
    // Show creator-specific UI
  }
  
  if (hasRole('influencer')) {
    // Show influencer features
  }
}
```

### 4. Components

**RoleBasedSidebar** - Simplified sidebar using config:

```typescript
import { RoleBasedSidebar } from '@/components/navigation/RoleBasedSidebar';

// Use in your layout
<SidebarProvider>
  <RoleBasedSidebar user={user} />
  <main>{children}</main>
</SidebarProvider>
```

**ConfigBasedNavigation** - Just the nav items:

```typescript
import { ConfigBasedNavigation } from '@/components/navigation/ConfigBasedNavigation';

// Renders filtered navigation groups
<ConfigBasedNavigation />
```

## Usage Examples

### Check Role in Component

```typescript
import { useUserRoles } from '@/hooks/useUserRoles';

function Dashboard() {
  const { isCreator, isAdvertiser, hasAnyRole } = useUserRoles();
  
  return (
    <div>
      {isCreator && <CreatorDashboard />}
      {isAdvertiser && <AdvertiserDashboard />}
      {hasAnyRole(['influencer', 'agency']) && <InfluencerTools />}
    </div>
  );
}
```

### Add Role Programmatically

```typescript
import { addRoleToUser } from '@/lib/utils/roleHelpers';

// Admin function to grant roles
await addRoleToUser('user-uuid', 'creator');
```

### Filter Navigation

```typescript
import { filterNavigationByRoles } from '@/config/navigation';

const filteredNav = filterNavigationByRoles(
  NAVIGATION_CONFIG.navigation,
  ['creator', 'influencer']
);
```

## Migration from Old System

The old `RoleContext` used `is_creator` and `is_advertiser` flags on profiles. 

**New system uses `user_roles` table** for better scalability.

To migrate existing users, run:

```sql
-- Migrate creators
INSERT INTO user_roles (user_id, role)
SELECT id, 'creator'
FROM profiles
WHERE is_creator = true
ON CONFLICT DO NOTHING;

-- Migrate advertisers
INSERT INTO user_roles (user_id, role)
SELECT id, 'advertiser'
FROM profiles
WHERE is_advertiser = true
ON CONFLICT DO NOTHING;
```

## Adding New Roles

1. **Update enum** in database:
```sql
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'new_role';
```

2. **Update TypeScript type** in `src/config/navigation.ts`:
```typescript
export type UserRole = 'creator' | 'subscriber' | ... | 'new_role';
```

3. **Add to navigation config** with role restrictions:
```typescript
{
  "id": "new_feature",
  "label": "New Feature",
  "roles": ["new_role", "admin"]
}
```

## Security Notes

- Roles are **server-side enforced** via RLS policies
- Navigation filtering is **client-side** for UX only
- Always check roles in backend/edge functions
- Use `user_has_any_role()` function in RLS policies

## Future: Influencer & Agency Modules

When building these modules:

1. **Update navigation config** (`src/config/navigation.ts`)
2. **No code changes needed** - system auto-filters
3. **Add role checks** in components using `useUserRoles()`

This keeps the architecture clean and centralized.
