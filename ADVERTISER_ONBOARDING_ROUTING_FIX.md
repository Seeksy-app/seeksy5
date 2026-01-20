# Advertiser Onboarding Routing Fix

## Overview
Fixed the advertiser onboarding flow to provide a clean, intuitive experience for new advertisers without error toasts or confusing restart modals.

## Problems Fixed

### Before (Buggy Behavior):
1. Fresh login as incomplete advertiser → redirected to `/advertiser` dashboard
2. Immediately showed red error toast: "Advertiser account not found"
3. Showed "Restart Advertiser Onboarding?" modal unexpectedly
4. Confusing UX that felt like an error state

### After (Clean Behavior):
1. Fresh login as incomplete advertiser → automatically redirected to `/advertiser/signup`
2. No error toasts during normal onboarding flow
3. Clean wizard experience with no scary errors
4. "Restart Advertiser Onboarding?" modal only appears when explicitly clicking "Experience Onboarding" in sidebar

## Files Changed

### 1. **New File: `src/hooks/useAdvertiserGuard.tsx`**
- Created a reusable advertiser onboarding guard hook
- Checks both `profiles.advertiser_onboarding_completed` AND existence of `advertisers` record
- Automatically redirects to `/advertiser/signup` if either condition is false
- Returns `{ isOnboarded, advertiserId, isLoading }` for use in protected routes

**Key Logic:**
```typescript
// If onboarding not complete OR no advertiser record, redirect to signup
if (!profile?.advertiser_onboarding_completed || !advertiser) {
  navigate('/advertiser/signup', { replace: true });
  return;
}
```

### 2. **Updated: `src/pages/advertiser/AdvertiserDashboard.tsx`**
- **Removed:** Manual advertiser fetching with error toast
- **Added:** `useAdvertiserGuard()` hook at component top
- **Result:** Dashboard automatically redirects incomplete signups to onboarding wizard
- **Benefit:** No more scary "Advertiser account not found" error for new users

**Changes:**
- Replaced ~65 lines of manual auth/fetch/error-handling code
- Now uses guard hook: `const { isOnboarded, advertiserId, isLoading } = useAdvertiserGuard();`
- Campaigns only load once `advertiserId` is available

### 3. **Updated: `src/pages/AdvertiserSignup.tsx`**
- **Added:** Redirect logic for already-onboarded users
- **Behavior:** If user completed onboarding, auto-redirect to `/advertiser` dashboard
- **Benefit:** Prevents users from seeing signup wizard when already registered

**Added Logic:**
```typescript
useEffect(() => {
  if (profile?.advertiser_onboarding_completed && existingAdvertiser) {
    navigate('/advertiser', { replace: true });
  }
}, [profile, existingAdvertiser, navigate]);
```

### 4. **Updated: `src/contexts/RoleContext.tsx`**
- **Fixed:** `switchRole()` function now checks onboarding status before advertiser redirect
- **Behavior:** When switching to advertiser role, checks if onboarding is complete
  - If incomplete → redirects to `/advertiser/signup`
  - If complete → redirects to `/advertiser`
- **Also Fixed:** Changed `user_id` to `owner_profile_id` in advertiser insert (line 89)

**Key Changes:**
```typescript
// Before redirect, check onboarding status
const { data: profile } = await supabase
  .from('profiles')
  .select('advertiser_onboarding_completed')
  .eq('id', currentUser.id)
  .single();

const { data: advertiser } = await supabase
  .from('advertisers')
  .select('id')
  .eq('owner_profile_id', currentUser.id)
  .maybeSingle();

// Redirect to signup if incomplete, dashboard if complete
if (!profile?.advertiser_onboarding_completed || !advertiser) {
  window.location.href = '/advertiser/signup';
} else {
  window.location.href = '/advertiser';
}
```

### 5. **Unchanged: `src/components/advertiser/AdvertiserSidebarNav.tsx`**
- "Experience Onboarding" button behavior remains the same
- Still shows "Restart Advertiser Onboarding?" confirmation modal
- Still resets `advertiser_onboarding_completed` to `false` and redirects to signup
- **This is the ONLY place** that shows the restart confirmation modal

## Routing Rules (After Fix)

### Rule 1: Post-Login Redirect (Advertiser Role)
```
IF profiles.advertiser_onboarding_completed = false
OR advertisers record does NOT exist for owner_profile_id
→ Redirect to /advertiser/signup (onboarding wizard)

IF profiles.advertiser_onboarding_completed = true
AND advertisers record EXISTS
→ Redirect to /advertiser (dashboard)
```

### Rule 2: Advertiser Dashboard Access
```
useAdvertiserGuard() runs on mount:
→ Checks onboarding status
→ Auto-redirects to /advertiser/signup if incomplete
→ No error toast shown (silent redirect)
```

### Rule 3: Signup Page Access
```
IF already onboarded (completed + advertiser exists)
→ Auto-redirect to /advertiser dashboard
→ Prevents showing wizard to registered advertisers
```

### Rule 4: "Experience Onboarding" Button
```
ONLY when clicked explicitly:
→ Shows "Restart Advertiser Onboarding?" confirmation modal
→ If confirmed:
  - Sets advertiser_onboarding_completed = false
  - Redirects to /advertiser/signup
  - Shows success toast
```

## Error Toast Behavior

### When Error IS Shown:
- **Never during normal onboarding flow**
- Only if true data inconsistency occurs (e.g., `advertiser_onboarding_completed = true` but no `advertisers` record exists)
- This would indicate a database integrity issue requiring admin attention

### When Error IS NOT Shown:
- ✅ New user accessing `/advertiser` for first time
- ✅ User who hasn't completed onboarding
- ✅ User explicitly resetting onboarding via "Experience Onboarding" button
- ✅ Role switching before onboarding is complete

## Data Consistency

### Schema Alignment:
All queries now use `owner_profile_id` instead of legacy `user_id`:
- ✅ `src/pages/advertiser/AdvertiserDashboard.tsx` (via guard hook)
- ✅ `src/pages/AdvertiserSignup.tsx` (line 64, 81)
- ✅ `src/contexts/RoleContext.tsx` (line 83, 89)
- ✅ `src/hooks/useAdvertiserGuard.tsx` (line 36)

### Onboarding Completion Conditions:
A user is considered "onboarded" ONLY when:
1. `profiles.advertiser_onboarding_completed = true` AND
2. `advertisers` record exists with matching `owner_profile_id`

## Testing Checklist

### Test Case 1: Fresh Advertiser Login
1. Create new account or reset existing account's `advertiser_onboarding_completed` to `false`
2. Log in
3. Switch to advertiser role
4. **Expected:** Redirected to `/advertiser/signup` with no error toast
5. **Expected:** See onboarding wizard Step 1

### Test Case 2: Incomplete Onboarding, Direct Dashboard Access
1. As incomplete advertiser, navigate directly to `/advertiser`
2. **Expected:** Immediately redirected to `/advertiser/signup`
3. **Expected:** No error toast shown

### Test Case 3: Complete Onboarding
1. Complete all 4 steps of onboarding wizard
2. Submit application
3. **Expected:** See confirmation screen
4. **Expected:** Redirected to `/advertiser` dashboard after confirmation
5. **Expected:** Dashboard loads normally with no errors

### Test Case 4: Already Onboarded, Access Signup
1. As completed advertiser, navigate to `/advertiser/signup`
2. **Expected:** Immediately redirected to `/advertiser` dashboard
3. **Expected:** Cannot access wizard when already registered

### Test Case 5: Experience Onboarding Button
1. As onboarded advertiser, click "Experience Onboarding" in sidebar
2. **Expected:** "Restart Advertiser Onboarding?" modal appears
3. Click "Reset Onboarding"
4. **Expected:** Success toast shown
5. **Expected:** Redirected to `/advertiser/signup` wizard

### Test Case 6: Role Switching (Incomplete)
1. As user with both creator and advertiser roles enabled
2. Advertiser onboarding is NOT complete
3. Switch from creator to advertiser role
4. **Expected:** Redirected to `/advertiser/signup` (not dashboard)

### Test Case 7: Role Switching (Complete)
1. As user with both roles enabled
2. Advertiser onboarding IS complete
3. Switch from creator to advertiser role
4. **Expected:** Redirected to `/advertiser` dashboard

## Summary

### What Changed:
1. ✅ Created `useAdvertiserGuard()` hook for consistent onboarding checks
2. ✅ Removed error toast from normal onboarding flow
3. ✅ Added automatic redirects to signup for incomplete advertisers
4. ✅ Added automatic redirects to dashboard for complete advertisers accessing signup
5. ✅ Fixed role switching to check onboarding status before redirect
6. ✅ Fixed all `user_id` → `owner_profile_id` alignment issues

### User Experience:
- **New advertiser:** Clean onboarding wizard with no errors
- **Incomplete advertiser:** Automatically guided to complete signup
- **Complete advertiser:** Normal dashboard access with no friction
- **Restart onboarding:** Explicit confirmation modal only when requested

### Technical Benefits:
- Centralized onboarding logic in reusable hook
- Consistent routing behavior across all advertiser pages
- Proper data validation (checks both profile flag AND database record)
- Clear separation between normal flow and error states
