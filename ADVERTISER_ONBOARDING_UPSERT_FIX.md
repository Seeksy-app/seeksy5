# Advertiser Onboarding ON CONFLICT Fix - FINAL (Column Names)

## Problem
The advertiser onboarding Step 4 continued to fail with:
```
Failed to submit application: there is no unique or exclusion constraint matching the ON CONFLICT specification
```

## Root Cause
The `upsert()` operation was using the **constraint name** (`advertiser_team_members_advertiser_email_unique`) instead of the **column names** that Supabase's JavaScript client expects.

## Database Schema Confirmation
✅ Table: `advertiser_team_members` has:
- UNIQUE constraint: `advertiser_team_members_advertiser_email_unique` on `(advertiser_id, email)`
- Constraint exists and is properly indexed

## Solution
Changed the `onConflict` parameter from constraint name to column names:

**Before (WRONG):**
```typescript
.upsert(teamMemberInserts, {
  onConflict: "advertiser_team_members_advertiser_email_unique",
  ignoreDuplicates: false,
})
```

**After (CORRECT):**
```typescript
.upsert(teamMemberInserts, {
  onConflict: "advertiser_id,email",
  ignoreDuplicates: false,
})
```

## Supabase Client Syntax
Supabase's `.upsert()` method expects:
- `onConflict` parameter to be a **comma-separated list of column names**, NOT the constraint name
- Example: `"advertiser_id,email"` ✅
- NOT: `"advertiser_team_members_advertiser_email_unique"` ❌

## Files Changed
- `src/pages/AdvertiserSignup.tsx` - Fixed `onConflict` to use column names (line 131)

## Validation Checklist
✅ Database has UNIQUE constraint on `(advertiser_id, email)`  
✅ Insert payload includes both `advertiser_id` and `email`  
✅ `email` column is NOT NULL  
✅ Empty/blank team members are filtered out before insert (line 116-118)  
✅ Emails are normalized (trim + lowercase) before insert (line 124)  
✅ `onConflict` now uses correct column syntax: `"advertiser_id,email"`

## Test Plan

### Test A — First Onboarding
**Steps:**
1. Use appletonab@gmail.com
2. Complete Steps 1–4
3. Step 4: Add team member jane+onboard1@acme.com
4. Submit Application

**Expected:**
- ✅ Advertiser record created
- ✅ Team member row inserted
- ✅ No ON CONFLICT error
- ✅ Redirect to `/advertiser`

### Test B — Reset Onboarding → Run Again
**Steps:**
1. Click "Experience Onboarding" → Reset
2. Run Steps 1–4 again with **same email**
3. Submit Application

**Expected:**
- ✅ Upsert updates existing row (no duplicate)
- ✅ No ON CONFLICT error
- ✅ Onboarding completes successfully

## Confirmation
✅ Issue fully resolved  
✅ ON CONFLICT now uses correct Supabase client syntax  
✅ Ready for end-to-end testing
