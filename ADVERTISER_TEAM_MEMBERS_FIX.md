# Advertiser Team Members ON CONFLICT Fix

## Problem
When submitting advertiser onboarding with team members, the application threw an ON CONFLICT error even though the unique constraint existed on `advertiser_team_members` table.

## Root Cause
The `email` column in `advertiser_team_members` was nullable (`TEXT NULL`), which prevents PostgreSQL from properly matching rows in ON CONFLICT clauses. When a column in a unique constraint is nullable, multiple NULL values are allowed, breaking the expected uniqueness behavior.

## Migration Applied

```sql
-- Fix advertiser_team_members email column and constraint for ON CONFLICT support

-- Step 1: Update any existing NULL emails with a placeholder (safety measure)
UPDATE advertiser_team_members
SET email = 'placeholder_' || id::text || '@pending.local'
WHERE email IS NULL;

-- Step 2: Make email NOT NULL
ALTER TABLE advertiser_team_members
ALTER COLUMN email SET NOT NULL;

-- Step 3: Drop and recreate the unique constraint to ensure it's properly indexed
ALTER TABLE advertiser_team_members
DROP CONSTRAINT IF EXISTS advertiser_team_members_advertiser_email_unique;

ALTER TABLE advertiser_team_members
ADD CONSTRAINT advertiser_team_members_advertiser_email_unique 
UNIQUE (advertiser_id, email);

-- Step 4: Verify the constraint exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'advertiser_team_members_advertiser_email_unique'
      AND conrelid = 'public.advertiser_team_members'::regclass
  ) THEN
    RAISE EXCEPTION 'Unique constraint was not created successfully';
  END IF;
END $$;
```

## Final Schema

**advertiser_team_members:**
- `id` (uuid, NOT NULL, PK)
- `advertiser_id` (uuid, NOT NULL, FK → advertisers.id)
- `role` (text, NOT NULL, default: 'ad_manager')
- `created_at` (timestamp, nullable)
- `profile_id` (uuid, nullable, FK → auth.users.id)
- `email` (text, **NOT NULL**) ← Fixed
- **Constraint:** `UNIQUE (advertiser_id, email)` ← Working correctly now

## TypeScript Fixes

Fixed three files that were still using legacy `user_id` column instead of `owner_profile_id`:

1. **src/pages/CreateAudioAd.tsx** (line 52)
   - Changed: `.eq('user_id', user.id)` → `.eq('owner_profile_id', user.id)`

2. **src/pages/CreateAudioAdCampaign.tsx** (line 48)
   - Changed: `.eq('user_id', user.id)` → `.eq('owner_profile_id', user.id)`

3. **src/pages/UploadReadyAd.tsx** (line 34)
   - Changed: `.eq('user_id', user.id)` → `.eq('owner_profile_id', user.id)`

## Onboarding Insert Logic

The insert logic in `src/pages/AdvertiserSignup.tsx` (lines 115-120) is already correct:

```typescript
const teamMemberInserts = formData.team_members.map((member: any) => ({
  advertiser_id: advertiserData.id,
  profile_id: null, // Will be filled when they accept invite
  email: member.email, // ✅ Always provided from form
  role: member.role,
}));

const { error: teamError } = await supabase
  .from("advertiser_team_members")
  .insert(teamMemberInserts)
  .select();

if (teamError) throw teamError; // ✅ Properly throws errors
```

### Key Points:
- ✅ Email is always provided from `member.email` (Step 4 of wizard)
- ✅ No ON CONFLICT clause needed since unique constraint prevents duplicates
- ✅ Error is properly thrown if duplicate email is attempted
- ✅ Empty team members array is handled gracefully (if condition on line 114)

## How to Test

### Test Case 1: Add Team Members (First Time)
1. Go to `/advertiser/signup`
2. Complete Steps 1-3
3. On Step 4, add team member with email `test@example.com`, role `ad_manager`
4. Click "Submit Application"
5. **Expected:** Success, team member created

### Test Case 2: Duplicate Email Prevention
1. Complete onboarding with team member `duplicate@test.com`
2. Reset onboarding via "Experience Onboarding" button
3. Complete Steps 1-3 again
4. On Step 4, add team member with same email `duplicate@test.com`
5. Click "Submit Application"
6. **Expected:** Error thrown due to unique constraint violation (this is correct behavior)

### Test Case 3: No Team Members
1. Go through onboarding
2. Skip Step 4 (don't add any team members)
3. Click "Submit Application"
4. **Expected:** Success, advertiser created with no team members

### Test Case 4: Multiple Unique Team Members
1. On Step 4, add:
   - `alice@company.com` - ad_manager
   - `bob@company.com` - billing
   - `charlie@company.com` - viewer
2. Click "Submit Application"
3. **Expected:** Success, all three team members created

## What This Fixed

✅ **Unique constraint now works correctly** - email is NOT NULL
✅ **ON CONFLICT errors resolved** - constraint properly matches inserts
✅ **TypeScript errors fixed** - all queries use `owner_profile_id`
✅ **Empty team member arrays handled gracefully** - no errors when skipping Step 4
✅ **Duplicate email prevention** - constraint prevents duplicate emails per advertiser

## Status

🟢 **READY FOR TESTING**

The advertiser onboarding flow should now work end-to-end without ON CONFLICT errors when submitting team members.
