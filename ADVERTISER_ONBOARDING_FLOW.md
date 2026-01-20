# Advertiser Onboarding Flow

## Overview
This document explains the advertiser onboarding routing logic and status checks to prevent redirect loops.

## Database Tables & Fields

### Primary Status Indicators
- **`profiles.advertiser_onboarding_completed`**: Boolean flag indicating if the 4-step wizard has been completed
- **`advertisers.status`**: Enum showing account approval status (`pending`, `approved`, `rejected`, `suspended`)
- **`advertisers.owner_profile_id`**: Links advertiser account to user profile

### Supporting Tables
- **`advertiser_preferences`**: Stores campaign goals and targeting preferences
- **`advertiser_team_members`**: Stores invited team members with roles

## Routing Rules

### `/advertiser/signup` (Onboarding Wizard)

**When to show:**
- User is logged in
- `advertiser_onboarding_completed = false` OR no advertiser record exists

**When to redirect away:**
- If `advertiser_onboarding_completed = true` AND advertiser record exists → redirect to `/advertiser`
- **Exception:** Do NOT redirect while showing confirmation screen (`showConfirmation = true`)

**On form submission:**
1. Create advertiser record with `status = 'pending'`
2. Create advertiser preferences
3. Add team members (if any)
4. Update `profiles.advertiser_onboarding_completed = true`
5. Show confirmation screen
6. User clicks "Go to Advertiser Dashboard" → navigate to `/advertiser`

### `/advertiser` (Advertiser Dashboard)

**When to show:**
- User is logged in
- `advertiser_onboarding_completed = true`
- Advertiser record exists

**When to redirect away:**
- If `advertiser_onboarding_completed = false` OR no advertiser record → redirect to `/advertiser/signup`

**Guard behavior (useAdvertiserGuard):**
- Checks both `advertiser_onboarding_completed` flag AND existence of advertiser record
- Only redirects after data is fully loaded (prevents race conditions)
- Uses `isMounted` flag to prevent state updates on unmounted components

## Preventing Redirect Loops

### Key Safeguards

1. **Confirmation Screen Protection**
   - The signup page's redirect logic checks `!showConfirmation` before auto-redirecting
   - This allows users to see the success message before being routed away

2. **Mutual Exclusivity**
   - Dashboard redirects TO signup if incomplete
   - Signup redirects TO dashboard if complete
   - Both check the SAME conditions (`advertiser_onboarding_completed` + advertiser record exists)

3. **Mount Tracking**
   - Guard hook uses `isMounted` flag to prevent state updates after component unmounts
   - Prevents stale redirects during navigation transitions

4. **Query Invalidation**
   - After successful signup, queries are invalidated to refresh data
   - Redirect logic waits for fresh data before making routing decisions

## Status-Based Behavior

### Pending Status (`status = 'pending'`)
- User sees "Application Under Review" message
- Can access advertiser portal but with limited functionality

### Approved Status (`status = 'approved'`)
- Full access to advertiser dashboard and campaigns
- Can create ads and manage budgets

### Rejected Status (`status = 'rejected'`)
- User sees rejection message
- Cannot proceed without contacting support

### Suspended Status (`status = 'suspended'`)
- Account temporarily disabled
- User must contact support to resolve

## Testing the Flow

### Fresh Signup Test
1. Log in as `advertiser@seeksy.dev`
2. Should land on `/advertiser/signup`
3. Complete all 4 steps
4. Click "Submit Application"
5. See confirmation screen
6. Click "Go to Advertiser Dashboard"
7. Should land on `/advertiser` and stay there
8. Refresh page → should stay on `/advertiser`

### Onboarding Reset Test
1. From `/advertiser`, click "Experience Onboarding" in sidebar
2. Confirm reset in modal
3. Should redirect to `/advertiser/signup`
4. Should stay on `/advertiser/signup` until completing flow again

## Common Issues

### Redirect Loop
**Symptom:** Page flickers between `/advertiser` and `/advertiser/signup`

**Cause:** Competing redirect logic or stale query data

**Solution:**
- Ensure `showConfirmation` prevents auto-redirect
- Verify guard hook uses `isMounted` flag
- Check that both pages use identical status checks

### Stuck on Signup
**Symptom:** Can't access dashboard even after completing onboarding

**Cause:** `advertiser_onboarding_completed` not set to `true` OR advertiser record missing

**Solution:**
- Check database: `SELECT * FROM profiles WHERE id = 'USER_ID'`
- Check database: `SELECT * FROM advertisers WHERE owner_profile_id = 'USER_ID'`
- Manually set flags if needed

### Navigation Shows Creator Items
**Symptom:** Advertiser sees creator menu items

**Cause:** `AppSidebar.tsx` incorrectly checking for creator data instead of role

**Solution:**
- Sidebar should check `isAdvertiser` (from guard hook) to determine nav items
- Should NOT check `hasCreatorProfile` or other creator-specific conditions
