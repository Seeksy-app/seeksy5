# Admin Profile Settings Refactor

## Summary

Refactored the Admin Profile Settings feature to remove the toggle from the sidebar while preserving all functionality. The "Use Separate Admin Profile" setting is now only accessible through Account Settings.

## Changes Made

### 1. Settings Page (`src/pages/Settings.tsx`)
- **Added**: Admin Profile section that appears only for admin users
- **Location**: Positioned above Legal & Compliance section
- **Functionality**: Provides a button to navigate to `/admin/profile-settings`
- **Visibility**: Only visible when `isAdmin === true`

### 2. Sidebar (`src/components/AppSidebar.tsx`)
- **Removed**: Outdated comment referencing "Admin View"
- **No UI changes**: Confirmed no Admin View toggle exists in sidebar

## What Was Preserved

### Admin Profile Functionality
The existing AdminProfileSettings page (`src/pages/admin/AdminProfileSettings.tsx`) remains fully functional with:
- ✅ "Use Separate Admin Profile" toggle
- ✅ Admin name, email, phone, and avatar fields
- ✅ Avatar upload functionality
- ✅ Save functionality with validation

### Database Schema
All profile fields remain in the `profiles` table:
- `admin_full_name`
- `admin_email`
- `admin_phone`
- `admin_avatar_url`
- `use_separate_admin_profile`

## User Experience

### For Admin Users (`admin@seeksy.dev`)
1. Navigate to Settings from sidebar
2. Scroll to "Admin Profile" section (between Credits/Modules and Legal)
3. Click "Manage Admin Profile" button
4. Configure admin identity settings
5. Toggle "Use Separate Admin Profile" ON/OFF

### For Non-Admin Users
- No Admin Profile section visible in Settings
- No access to `/admin/profile-settings` route

## Routes

- **Settings**: `/settings`
- **Admin Profile Settings**: `/admin/profile-settings` (admin-only)

## Testing Checklist

- [x] Admin users see "Admin Profile" section in Settings
- [x] "Manage Admin Profile" button routes to `/admin/profile-settings`
- [x] AdminProfileSettings page loads correctly
- [x] Toggle "Use Separate Admin Profile" works
- [x] Admin fields (name, email, phone, avatar) save correctly
- [x] Non-admin users do NOT see Admin Profile section
- [x] No Admin View toggle in sidebar for any user
- [x] No role switching UI anywhere in the application

## Architecture Notes

This feature is **profile-level**, not role-level:
- It does not change the user's role or permissions
- It only controls which identity information is displayed in admin contexts
- It is completely separate from role switching (which has been removed)
- It allows admins to present a professional admin identity distinct from their personal profile

## Future Considerations

If admins need to display different profile information in different contexts:
- The `use_separate_admin_profile` flag can be checked in any component
- When `true`, display admin fields (`admin_full_name`, `admin_avatar_url`, etc.)
- When `false`, display regular account fields (`account_full_name`, `account_avatar_url`, etc.)
