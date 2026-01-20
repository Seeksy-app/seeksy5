-- Fix advertiser_team_members email column and constraint for ON CONFLICT support
-- Step 1: Update any existing NULL emails with a placeholder (unlikely to exist, but safety first)
UPDATE advertiser_team_members
SET email = 'placeholder_' || id::text || '@pending.local'
WHERE email IS NULL;

-- Step 2: Make email NOT NULL
ALTER TABLE advertiser_team_members
ALTER COLUMN email SET NOT NULL;

-- Step 3: Drop and recreate the unique constraint to ensure it's properly indexed
-- This ensures ON CONFLICT (advertiser_id, email) works correctly
ALTER TABLE advertiser_team_members
DROP CONSTRAINT IF EXISTS advertiser_team_members_advertiser_email_unique;

ALTER TABLE advertiser_team_members
ADD CONSTRAINT advertiser_team_members_advertiser_email_unique 
UNIQUE (advertiser_id, email);

-- Verify the constraint exists
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