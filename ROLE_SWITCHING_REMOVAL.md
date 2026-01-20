# Role Switching UI Removal - Single Role Per Account

## Overview
Removed all role switching UI and localStorage persistence to support the new single-role-per-account model. Each user account now has exactly one role (Admin, Creator, or Advertiser) assigned at the database level.

## Changes Made

### 1. Removed Components
Deleted the following role-switching UI components:
- `src/components/role/RoleSwitcher.tsx` - Dropdown to switch between Creator/Advertiser
- `src/components/role/RoleIndicator.tsx` - Badge showing "Viewing as Creator/Advertiser"
- `src/components/role/RoleChooser.tsx` - Modal dialog for initial role selection

### 2. Updated AppSidebar.tsx
**Before:**
```tsx
{/* Role Switcher and Indicator */}
{!collapsed && (
  <div className="px-4 py-2 space-y-2">
    <RoleSwitcher />
    <RoleIndicator />
  </div>
)}
```

**After:** Removed entirely (lines 1650-1656)

### 3. Updated App.tsx
**Before:**
```tsx
<RoleProvider>
  <SidebarProvider>
    <RoleChooser />
    <div className="min-h-screen flex w-full bg-background">
```

**After:**
```tsx
<RoleProvider>
  <SidebarProvider>
    <div className="min-h-screen flex w-full bg-background">
```

### 4. Cleaned RoleContext.tsx
**Removed:**
- `localStorage.getItem('seeksy_current_role')` - Line 53
- `localStorage.setItem('seeksy_current_role', role)` - Line 136
- Multi-role chooser logic (if user has both roles, wait for selection)

**Simplified:**
- Role initialization now assumes single role per account
- Removed role switching toast notifications
- Removed advertiser onboarding check in switchRole (simplified redirect)
- Kept `switchRole` function for backward compatibility but no UI calls it

**Before:**
```tsx
// Initialize current role from localStorage or profile preference
const storedRole = localStorage.getItem('seeksy_current_role') as UserRole | null;

if (storedRole && availableRoles.includes(storedRole)) {
  setCurrentRole(storedRole);
} else if (profile.preferred_role && availableRoles.includes(profile.preferred_role as UserRole)) {
  setCurrentRole(profile.preferred_role as UserRole);
} else if (availableRoles.length === 1) {
  setCurrentRole(availableRoles[0]);
} else if (availableRoles.length > 1) {
  // User has multiple roles but hasn't chosen yet
  setCurrentRole(null);
}
```

**After:**
```tsx
// Initialize current role from profile (single role per account)
// Each account has only one role
if (availableRoles.length === 1) {
  setCurrentRole(availableRoles[0]);
} else if (profile.preferred_role && availableRoles.includes(profile.preferred_role as UserRole)) {
  setCurrentRole(profile.preferred_role as UserRole);
}
```

### 5. Updated RoleSettings.tsx
Converted from active role-switching page to read-only informational page:

**Removed:**
- "Switch to Creator" button (lines 118-125)
- "Switch to Advertiser" button (lines 159-166)
- "Enable" buttons for admins (lines 130-138, 171-178)
- "Reset Onboarding (Admin)" button

**Updated:**
- Changed "Current Role" to "Your Role" with "Active" badge
- Changed "Available Roles" to "Role Information"
- Updated admin note: "Each account is assigned a single role. Use separate accounts for testing different roles."
- Simplified onboarding reset to informational text

## Verification Checklist

### Test Accounts Setup
✅ **admin@seeksy.dev**
- `is_admin = true`
- `is_creator = false`
- `is_advertiser = false`
- Should route to `/admin`
- Should NOT see role toggle

✅ **creator@seeksy.dev**
- `is_creator = true`
- `is_advertiser = false`
- Should route to `/dashboard`
- Should NOT see role toggle

✅ **advertiser@seeksy.dev**
- `is_creator = false`
- `is_advertiser = true`
- `advertiser_onboarding_completed = false`
- Should route to `/advertiser/signup`
- Should NOT see role toggle

### UI Verification
- [x] No "View as" toggle in sidebar for any account
- [x] No "Viewing as Creator/Advertiser" badge in sidebar
- [x] No role chooser modal on login
- [x] RoleSettings page is read-only (no switching buttons)
- [x] Admin impersonation preserved in `/admin/impersonate` (separate from role switching)

### Code Verification
- [x] No `localStorage.getItem('seeksy_current_role')` calls
- [x] No `localStorage.setItem('seeksy_current_role')` calls
- [x] RoleSwitcher component deleted
- [x] RoleIndicator component deleted
- [x] RoleChooser component deleted
- [x] No imports of deleted components

## Architecture Notes

### What Was Kept
- **RoleContext** - Still provides role detection for routing logic
- **hasMultipleRoles** flag - Kept for backward compatibility (always false in practice)
- **switchRole** function - Kept but not called from UI (potential future admin tool)
- **Admin impersonation** - Separate feature in `/admin/impersonate`, NOT role switching

### Database Schema
No database changes required. Role assignments managed via:
- `profiles.is_creator`
- `profiles.is_advertiser`
- `profiles.preferred_role`
- `user_roles` table for admin/super_admin roles

### Routing Logic
Each account type routes based on assigned role:
```
Admin → /admin
Creator → /dashboard
Advertiser (incomplete) → /advertiser/signup
Advertiser (complete) → /advertiser
```

## Future Considerations

### If Multi-Role Support Needed Again
Would require:
1. Re-implementing RoleSwitcher/RoleIndicator/RoleChooser
2. Adding back localStorage role persistence
3. Updating database to allow multiple role flags per account
4. Re-enabling role switching in RoleSettings page
5. Updating test account setup to support multi-role

### Current Model Benefits
- Cleaner UX - no confusion about "which view am I in?"
- Simpler auth logic - one role, one dashboard
- Easier testing - dedicated accounts per role
- Better security - no cross-role privilege escalation
- Clearer analytics - activity tied to specific account type

## Testing Instructions

### 1. Login as admin@seeksy.dev
- Should land on `/admin`
- Check sidebar - no role toggle visible
- Navigate to `/role-settings` - should show "Admin" as active role (if admin role display added)

### 2. Login as creator@seeksy.dev
- Should land on `/dashboard`
- Check sidebar - no role toggle visible
- Navigate to `/role-settings` - should show "Creator" as read-only

### 3. Login as advertiser@seeksy.dev
- Should land on `/advertiser/signup` (onboarding incomplete)
- Complete onboarding
- Should land on `/advertiser`
- Check sidebar - no role toggle visible
- Navigate to `/role-settings` - should show "Advertiser" as read-only

### 4. Verify localStorage Clean
- Open browser DevTools → Application → Local Storage
- Should NOT see `seeksy_current_role` key
- Should NOT see `activePersona` or `selectedRole` keys

## Rollback Plan

If issues arise, revert commits touching:
1. `src/components/AppSidebar.tsx`
2. `src/App.tsx`
3. `src/contexts/RoleContext.tsx`
4. `src/pages/RoleSettings.tsx`

Restore deleted components from git history:
- `src/components/role/RoleSwitcher.tsx`
- `src/components/role/RoleIndicator.tsx`
- `src/components/role/RoleChooser.tsx`

## Summary

Successfully removed all role switching UI and localStorage logic. Each account now operates with a single assigned role, providing clearer UX and simpler authentication flows. Admin impersonation functionality preserved as a separate feature for testing and support purposes.
