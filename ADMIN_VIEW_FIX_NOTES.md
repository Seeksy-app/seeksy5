# Admin/User View Toggle Issue - Technical Notes

## Problem
When admins toggle between "Admin View" and "Personal View", meetings and studio recordings created in one context are visible in the other context.

## Root Cause
The database tables (`meetings`, `media_files`, `studio_templates`) don't track whether records were created while the admin was in "Admin View" or "Personal View" mode. All records are associated with the same `user_id` (the admin's ID) regardless of context.

## Current Limitations
The current fix adds `localStorage` checks for `adminViewMode` in queries, but this is insufficient because:
1. Records don't have a `created_in_admin_mode` flag
2. Old records can't be retroactively categorized
3. The system can't distinguish admin-created vs personal-created items

## Complete Fix Required

### 1. Database Migration
Add `created_in_admin_mode` boolean field to:
- `meetings` table
- `media_files` table  
- `studio_templates` table

```sql
ALTER TABLE meetings ADD COLUMN created_in_admin_mode BOOLEAN DEFAULT false;
ALTER TABLE media_files ADD COLUMN created_in_admin_mode BOOLEAN DEFAULT false;
ALTER TABLE studio_templates ADD COLUMN created_in_admin_mode BOOLEAN DEFAULT false;
```

### 2. Update Creation Logic
When creating meetings/studios/recordings, set the flag based on current admin mode:

```typescript
const adminViewMode = localStorage.getItem('adminViewMode') === 'true';
const insertData = {
  ...data,
  created_in_admin_mode: adminViewMode
};
```

### 3. Update Query Logic
Filter results based on both user_id AND created_in_admin_mode:

```typescript
if (isAdmin && !adminViewMode) {
  // Personal View: only show personal items
  query = query.eq("created_in_admin_mode", false);
} else if (isAdmin && adminViewMode) {
  // Admin View: only show admin items
  query = query.eq("created_in_admin_mode", true);
}
```

## Temporary Workaround
Until the migration is complete, admins will see all their items in both views. Users should manually keep track of which context they're in when creating meetings/recordings.
