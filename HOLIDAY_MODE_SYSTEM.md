# Holiday Mode System

## Overview
Holiday Mode is an optional, toggleable seasonal feature system that transforms the Seeksy platform with festive Santa Spark branding, welcome modals, and optional snowfall effects. The system is now **admin-controlled via a database-backed settings UI** rather than static configuration files.

## Admin Control

### Database-Backed Settings
Holiday Mode is managed through the `app_settings` table:
- **Table**: `app_settings` (single global row with `key='global'`)
- **Columns**: `holiday_mode` (boolean), `holiday_snow` (boolean)
- **RLS**: Admin/super_admin only access
- **UI**: `/admin/settings` page with toggle switches

### Admin Settings Page (`/admin/settings`)
Admins can control Holiday Mode through a dedicated settings page:
- **Holiday Mode Toggle**: Enable/disable the entire festive experience
- **Snowfall Toggle**: Enable/disable snowfall (only works when Holiday Mode is ON)
- **Real-time Updates**: Changes persist immediately to database and affect all users on next page load
- **Toast Notifications**: Confirms when settings are saved

### Access Control
- Only users with `admin` or `super_admin` role can access `/admin/settings`
- Non-admin users cannot view or modify Holiday Mode settings
- Settings changes are tracked with `updated_by` field

## Quick Toggle
To enable/disable Holiday Mode globally:
1. Log in as an admin user
2. Navigate to `/admin/settings` (or Admin sidebar → Management → App Settings)
3. Toggle "Holiday Mode" switch
4. Optional: Toggle "Snowfall" for snow effects
5. Changes take effect on next page load for all users

**No code changes required** — admins control the feature entirely through the UI.

## Technical Architecture

### Configuration (`src/config/holidayMode.ts`)
- Defines `HolidaySettings` type and `DEFAULT_HOLIDAY_SETTINGS` fallback
- Provides `isHolidaySeason()` helper for date-based seasonal logic

### Hook (`src/hooks/useHolidaySettings.ts`)
- `useHolidaySettings()`: React hook that fetches settings from database
- `fetchHolidaySettings()`: Async function for server-side fetching
- Auto-refetches on window focus, 5-minute stale time
- Falls back to `DEFAULT_HOLIDAY_SETTINGS` on error

### Components (`src/components/holiday/`)
All holiday components are isolated in this directory and conditionally rendered:

#### `HolidayWelcomeModal.tsx`
- Appears once per user session when Holiday Mode is enabled
- Uses `localStorage` flag `holiday_welcome_seen` to prevent repeat displays
- Features Santa Spark with one-time wave animation (not looping)
- **Theme-aware background**: Uses `bg-background border-border` for proper light/dark mode styling
- Transparent background, soft drop shadow

#### `SantaAssistantButton.tsx`
- Fixed bottom-right floating button
- **Only appears AFTER welcome modal is dismissed** (prevents double Santa issue)
- Checks `localStorage.getItem("holiday_welcome_seen")` before rendering
- Transparent with hover scale effect
- Opens `SantaAssistantPopup` on click

#### `SantaAssistantPopup.tsx`
- Quick action modal with navigation to:
  - Create Meeting
  - Add Podcast  
  - Create Event
- Santa Spark avatar with drop shadow

#### `Snowfall.tsx`
- Subtle canvas-based snowfall effect
- Only renders when both `holiday_mode=true` AND `holiday_snow=true`
- Performance-optimized with minimal overhead

## Integration

### App.tsx Wiring
The `HolidayFeatures` component in `App.tsx` handles conditional rendering:
```tsx
const HolidayFeatures = () => {
  const { data: settings } = useHolidaySettings();
  const holidayMode = settings?.holidayMode ?? false;
  const holidaySnow = settings?.holidaySnow ?? false;

  if (!holidayMode) return null;

  return (
    <>
      <HolidayWelcomeModal />
      <SantaAssistantButton />
      {holidaySnow && <Snowfall />}
    </>
  );
};
```

All holiday elements are automatically removed when `holiday_mode=false`.

## Design Principles

1. **Clean, Minimal Integration**: No visual clutter when disabled
2. **Zero Performance Impact**: No holiday assets load when mode is OFF
3. **Modular Architecture**: All holiday code isolated in `/components/holiday/`
4. **Admin-Friendly**: One-click toggle, no code deployment required
5. **Graceful Degradation**: Falls back to defaults if database fetch fails

## Assets

### Santa Spark Images (`/public/spark/holiday/`)
- `spark-santa-waving.png`: Transparent PNG with Santa hat, used in modals/buttons
- All assets use soft drop shadows, no white boxes or backgrounds
- One-time wave animation on load (CSS: `animate-[wave_1.2s_ease-in-out]`)

### Animation Keyframes (`src/index.css`)
```css
@keyframes wave {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(15deg); }
  50% { transform: rotate(-10deg); }
  75% { transform: rotate(10deg); }
}
```

## Pages Using Holiday Mode

When Holiday Mode is enabled, the following experiences are affected:
- **Dashboard/Logged-in Pages**: Santa Spark replaces standard Spark in sidebar/widgets
- **First Login**: `HolidayWelcomeModal` displays once per session with themed background
- **Bottom-Right**: `SantaAssistantButton` appears globally after welcome modal is dismissed
- **Optional Snowfall**: Dashboard pages if `holiday_snow=true`
- **Homepage** (`/`): No holiday features (marketing page remains consistent year-round)

## Recent Fixes (v2.2.0)

### Fixed: White Box / Double Layer Issue
**Issue**: Santa Spark had nested div containers creating double-layer visual artifact with white background box  
**Fix**: 
- Removed nested `<div>` wrapper, now using single `<img>` tag directly
- Changed to pure white background (`bg-white dark:bg-white`) for welcome modal
- Replaced Tailwind `drop-shadow` classes with inline CSS `filter: drop-shadow()` for more control
- Added `background: transparent` inline style to ensure PNG transparency is preserved  
**Result**: Clean, single-layer Santa Spark with soft shadow, no visual artifacts

### Fixed: One-Time Wave Animation on Launcher
**Issue**: Bottom-right Santa launcher had no animation on first appearance  
**Fix**: 
- Added `hasWaved` state to `SantaAssistantButton`
- Wave animation plays once on mount (1.2s), then stops
- Animation uses existing `animate-[wave_1.2s_ease-in-out]` Tailwind class  
**Result**: Friendly greeting wave when Santa first appears, then idle

### Improved: Consistent Shadow Treatment
**Issue**: Inconsistent drop-shadow application across components  
**Fix**: Standardized soft CSS shadow across all Santa Spark instances
- Welcome modal: `filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.08))`
- Launcher button: `filter: drop-shadow(0 4px 16px rgba(0, 0, 0, 0.12))`
- Popup modal: `filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.08))`  
**Result**: Professional, subtle depth without overwhelming the character

### Confirmed: Toggle Independence
**Status**: Holiday Mode and Snowfall toggles work independently as designed  
**Test Results**:
- ✅ Both OFF → No Santa, no snow
- ✅ Holiday ON, Snow OFF → Santa visuals show, no snow
- ✅ Holiday ON, Snow ON → Santa visuals + snowfall
- ✅ Snowfall toggle disabled when Holiday Mode is OFF (correct dependency)  
**Location**: Admin → Management → App Settings

## Usage

### For Admins
```
1. Go to /admin/settings
2. Toggle "Holiday Mode" ON
3. (Optional) Toggle "Snowfall" ON
4. Holiday features activate for all users
```

### For Developers
```tsx
// Use the hook in any component
import { useHolidaySettings } from "@/hooks/useHolidaySettings";

const MyComponent = () => {
  const { data: settings, isLoading } = useHolidaySettings();
  
  if (settings?.holidayMode) {
    // Render holiday variant
  }
};
```

## Removal / Cleanup

When Holiday Mode is disabled (`holiday_mode=false`):
- No holiday components render
- No holiday assets are loaded
- No localStorage checks occur
- Zero visual or performance footprint

## Future Enhancements

- Admin dashboard widget showing current Holiday Mode status
- Scheduled auto-enable/disable based on `HOLIDAY_START_DATE` and `HOLIDAY_END_DATE`
- Additional seasonal themes (Valentine's, Halloween, etc.) using same architecture
- Per-user holiday preference overrides

---

**Version**: 2.2.0 (Clean Santa Spark + One-Time Wave Animation)  
**Last Updated**: November 29, 2024  
**Maintained By**: Seeksy Engineering Team
