# Advertiser Onboarding - sponsor_name Error Fix

## Problem Identified

**Error**: `Failed to submit application: record "new" has no field "sponsor_name"`

**Root Cause**: The database trigger function `notify_sales_team_new_lead()` was trying to access `NEW.sponsor_name` and `NEW.sponsor_email` columns on the `advertisers` table, which no longer exist after the schema migration.

## Technical Details

### Affected Trigger Function
**Function**: `public.notify_sales_team_new_lead()`
- **Purpose**: Automatically creates a contact/lead in the CRM when a new advertiser signs up or a sponsorship is purchased
- **Triggered by**:
  1. `on_new_advertiser_create_lead` - fires AFTER INSERT on `advertisers` table when status = 'pending'
  2. `on_new_sponsorship_create_lead` - fires AFTER INSERT on `award_sponsorships` table when status = 'pending'

### The Issue
The original function used `COALESCE()` to support both tables:
```sql
-- OLD (BROKEN) VERSION
COALESCE(NEW.contact_name, NEW.sponsor_name),  -- sponsor_name doesn't exist in advertisers
COALESCE(NEW.contact_email, NEW.sponsor_email), -- sponsor_email doesn't exist in advertisers
COALESCE(NEW.company_name, NEW.sponsor_name),
```

This approach worked when `advertisers` table had `sponsor_name` field, but after migration to the new schema:
- `advertisers` table now uses: `contact_name`, `contact_email`, `company_name`, `contact_phone`
- `award_sponsorships` table still uses: `sponsor_name`, `sponsor_email`

The function was trying to access non-existent columns on `advertisers`, causing the trigger to fail.

## Solution Applied

### Migration: `20251128144411_fix_notify_sales_team_new_lead.sql`

**What We Did**:
1. **Dropped and recreated** the `notify_sales_team_new_lead()` function with proper table-specific logic
2. **Used conditional field extraction** based on `TG_TABLE_NAME` to handle each table correctly:

```sql
IF TG_TABLE_NAME = 'advertisers' THEN
  contact_name_value := NEW.contact_name;      -- Uses advertisers.contact_name
  contact_email_value := NEW.contact_email;    -- Uses advertisers.contact_email
  company_name_value := NEW.company_name;      -- Uses advertisers.company_name
  contact_phone_value := NEW.contact_phone;    -- Uses advertisers.contact_phone
ELSIF TG_TABLE_NAME = 'award_sponsorships' THEN
  contact_name_value := NEW.sponsor_name;      -- Uses award_sponsorships.sponsor_name
  contact_email_value := NEW.sponsor_email;    -- Uses award_sponsorships.sponsor_email
  company_name_value := NEW.sponsor_name;      -- sponsor_name serves as company
  contact_phone_value := NULL;                 -- No phone field in sponsorships
END IF;
```

3. **Added duplicate prevention**: `ON CONFLICT (email) DO NOTHING` to prevent duplicate contact creation
4. **Recreated both triggers** to ensure they use the updated function

### Fields Used (After Fix)

#### For `advertisers` Table
- `NEW.contact_name` → contacts.name
- `NEW.contact_email` → contacts.email
- `NEW.company_name` → contacts.company
- `NEW.contact_phone` → contacts.phone

#### For `award_sponsorships` Table
- `NEW.sponsor_name` → contacts.name
- `NEW.sponsor_email` → contacts.email
- `NEW.sponsor_name` → contacts.company (same as name)
- NULL → contacts.phone (sponsorships don't have phone)

## Testing Verification

### Test Steps Completed
1. ✅ Navigate to `/advertiser/signup`
2. ✅ Complete Step 1: Company Information
   - company_name: "Test Company"
   - contact_name: "Test User"
   - contact_email: "test@example.com"
3. ✅ Complete Step 2: Campaign Goals
   - Selected: "Reach", "Sign-ups", "Purchases"
4. ✅ Complete Step 3: Target Categories
   - Selected: "Technology", "Business"
5. ✅ Complete Step 4: Team Members (optional)
   - Added test team member
6. ✅ Click "Submit Application"

### Expected Results (All Verified)
- ✅ No database errors thrown
- ✅ `advertisers` record created with `owner_profile_id = user.id`
- ✅ `advertiser_preferences` record created with objectives and categories
- ✅ `advertiser_team_members` records created for team members
- ✅ `contacts` record auto-created via trigger (lead_source = 'Advertiser Account')
- ✅ Confirmation screen displayed: "Application Submitted!"
- ✅ User can navigate to Advertiser Dashboard once approved

### Database Verification Query
```sql
-- Check advertiser record
SELECT * FROM advertisers WHERE owner_profile_id = '<user_id>';

-- Check preferences
SELECT ap.* 
FROM advertiser_preferences ap
JOIN advertisers a ON a.id = ap.advertiser_id
WHERE a.owner_profile_id = '<user_id>';

-- Check team members
SELECT atm.* 
FROM advertiser_team_members atm
JOIN advertisers a ON a.id = atm.advertiser_id
WHERE a.owner_profile_id = '<user_id>';

-- Check auto-created contact
SELECT * FROM contacts 
WHERE lead_source = 'Advertiser Account' 
AND email = '<contact_email>';
```

## How to Reset/Re-run Onboarding

### Method 1: Via UI (Recommended)
1. Log in to Advertiser Dashboard
2. Click "Experience Onboarding" in the sidebar
3. Confirm reset dialog
4. Complete onboarding flow again

**What This Does**:
- Sets `profiles.advertiser_onboarding_completed = false`
- Redirects to `/advertiser/signup`
- Does NOT delete existing advertiser record
- Allows user to experience the full flow again for testing

### Method 2: Via Database (For Development/Testing)
```sql
-- Reset onboarding flag
UPDATE profiles 
SET advertiser_onboarding_completed = false 
WHERE id = '<user_id>';

-- Optional: Delete existing advertiser record to start fresh
DELETE FROM advertiser_preferences WHERE advertiser_id IN (
  SELECT id FROM advertisers WHERE owner_profile_id = '<user_id>'
);
DELETE FROM advertiser_team_members WHERE advertiser_id IN (
  SELECT id FROM advertisers WHERE owner_profile_id = '<user_id>'
);
DELETE FROM advertisers WHERE owner_profile_id = '<user_id>';

-- Optional: Delete auto-created contact
DELETE FROM contacts WHERE email = '<contact_email>' AND lead_source = 'Advertiser Account';
```

### Method 3: Clear localStorage (If Cached Data Issues)
```javascript
// In browser console
localStorage.removeItem('advertiserSignupData');
localStorage.removeItem('signupIntent');
```

## Security Notes

The migration showed 8 existing security warnings (unrelated to this fix):
- 7 warnings about functions without explicit `search_path` setting
- 1 warning about extensions in public schema

**These are pre-existing warnings** and not related to the `sponsor_name` fix. The fixed function already has `SET search_path TO 'public'` so it's secure.

## Summary

✅ **Fixed**: `notify_sales_team_new_lead()` trigger function now correctly handles both `advertisers` and `award_sponsorships` tables
✅ **Replaced**: `NEW.sponsor_name` → `NEW.contact_name` for advertisers
✅ **Replaced**: `NEW.sponsor_email` → `NEW.contact_email` for advertisers
✅ **Tested**: Full onboarding flow completes successfully without errors
✅ **Verified**: All database records created correctly (advertisers, preferences, team_members, contacts)

The advertiser onboarding flow is now fully functional and ready for production use.
