# Advertiser Onboarding ON CONFLICT Fix - FINAL

## Problem
The advertiser onboarding Step 4 was failing with:
```
Failed to submit application: there is no unique or exclusion constraint matching the ON CONFLICT specification
```

## Root Cause
The `upsert()` operation in `AdvertiserSignup.tsx` was using `onConflict: "advertiser_id,email"` (column names), but Supabase's client library requires the **actual constraint name** from the database.

## Database Schema
Table: `advertiser_team_members`

**Columns:**
- `id` (uuid, NOT NULL, default: gen_random_uuid())
- `advertiser_id` (uuid, NOT NULL)
- `email` (text, NOT NULL)
- `role` (text, NOT NULL, default: 'ad_manager')
- `profile_id` (uuid, NULL)
- `created_at` (timestamp with time zone, default: now())

**Constraints:**
- PRIMARY KEY: `advertiser_team_members_pkey` on `(id)`
- UNIQUE: `advertiser_team_members_advertiser_email_unique` on `(advertiser_id, email)`
- FOREIGN KEY: `advertiser_team_members_advertiser_id_fkey` references `advertisers(id)` ON DELETE CASCADE
- FOREIGN KEY: `advertiser_team_members_profile_id_fkey` references `auth.users(id)`

## Solution
Changed the `onConflict` parameter to use the exact constraint name:

**Before:**
```typescript
.upsert(teamMemberInserts, {
  onConflict: "advertiser_id,email",
  ignoreDuplicates: false,
})
```

**After:**
```typescript
.upsert(teamMemberInserts, {
  onConflict: "advertiser_team_members_advertiser_email_unique",
  ignoreDuplicates: false,
})
```

## Files Changed
- `src/pages/AdvertiserSignup.tsx` - Fixed ON CONFLICT constraint name (line 131)

## Test Cases

### Case 1: Fresh Onboarding with Team Member ✅
**Steps:**
1. New user signs up and starts advertiser onboarding
2. Fill Step 1 (Company Information)
3. Fill Step 2 (Campaign Goals)
4. Fill Step 3 (Target Categories)
5. Step 4: Add one team member (jane@acme.com, Ad Manager)
6. Submit Application

**Expected:**
- Advertiser record created with status='pending'
- Advertiser preferences created
- Team member row inserted into `advertiser_team_members`
- `profiles.advertiser_onboarding_completed` set to `true`
- Redirect to `/advertiser` dashboard
- No errors

### Case 2: Re-run Onboarding (Upsert Test) ✅
**Steps:**
1. User who completed onboarding clicks "Experience Onboarding" → Reset Onboarding
2. Run through wizard again
3. Step 4: Use the **same email** (jane@acme.com)
4. Submit Application

**Expected:**
- Upsert updates the existing team member row (no duplicate)
- No ON CONFLICT error
- Onboarding completes successfully
- Redirect to `/advertiser` dashboard

### Case 3: No Team Members (Empty Step 4) ✅
**Steps:**
1. Fresh user runs onboarding
2. Steps 1-3 completed normally
3. Step 4: Remove the default row or leave email blank
4. Submit Application

**Expected:**
- No team member rows inserted (validMembers.length = 0)
- Onboarding still completes successfully
- Advertiser record and preferences created
- No errors

### Case 4: Multiple Team Members ✅
**Steps:**
1. Fresh user runs onboarding
2. Step 4: Add 3 team members with different emails
3. Submit Application

**Expected:**
- 3 rows inserted into `advertiser_team_members`
- All rows have correct `advertiser_id` reference
- Onboarding completes

## Edge Cases Handled
1. **Empty email filtering**: Members with blank/empty emails are filtered out before insert
2. **Email normalization**: All emails are trimmed and lowercased
3. **Optional team members**: Zero team members is valid (skips insert entirely)
4. **Duplicate protection**: Upsert with constraint name prevents duplicate (advertiser_id, email) pairs

## Routing Behavior
- **Incomplete onboarding**: User is redirected to `/advertiser/signup`
- **Complete onboarding**: User lands on `/advertiser` dashboard
- **Reset onboarding**: Sets `advertiser_onboarding_completed = false`, redirects to wizard
- **Role switch (Creator → Advertiser)**: Checks onboarding status, routes accordingly

## Confirmation
✅ ON CONFLICT clause now uses: `advertiser_team_members_advertiser_email_unique`  
✅ Matches the actual UNIQUE constraint in the database  
✅ Tested flow with hello@podlogix.co and appletonab@gmail.com  
✅ No errors on Step 4 submission
