-- Drop existing type if needed and recreate with all values
DROP TYPE IF EXISTS account_type CASCADE;

CREATE TYPE account_type AS ENUM (
  'creator',
  'advertiser',
  'agency',
  'podcaster',
  'event_planner',
  'brand',
  'studio_team',
  'admin'
);

-- Add account type fields to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS account_type account_type,
ADD COLUMN IF NOT EXISTS account_types_enabled text[] DEFAULT ARRAY[]::text[],
ADD COLUMN IF NOT EXISTS active_account_type account_type,
ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_data jsonb DEFAULT '{}'::jsonb;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_account_type ON profiles(account_type);
CREATE INDEX IF NOT EXISTS idx_profiles_active_account_type ON profiles(active_account_type);

-- Auto-assign account_type based on user_roles for existing users
UPDATE profiles p
SET 
  account_type = CASE
    WHEN EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = p.id AND ur.role IN ('admin', 'super_admin')) THEN 'admin'::account_type
    WHEN EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = p.id AND ur.role = 'creator') THEN 'creator'::account_type
    WHEN EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = p.id AND ur.role = 'advertiser') THEN 'advertiser'::account_type
    WHEN EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = p.id AND ur.role = 'agency') THEN 'agency'::account_type
    ELSE NULL
  END,
  active_account_type = CASE
    WHEN EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = p.id AND ur.role IN ('admin', 'super_admin')) THEN 'admin'::account_type
    WHEN EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = p.id AND ur.role = 'creator') THEN 'creator'::account_type
    WHEN EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = p.id AND ur.role = 'advertiser') THEN 'advertiser'::account_type
    WHEN EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = p.id AND ur.role = 'agency') THEN 'agency'::account_type
    ELSE NULL
  END,
  account_types_enabled = ARRAY[
    CASE
      WHEN EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = p.id AND ur.role IN ('admin', 'super_admin')) THEN 'admin'
      WHEN EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = p.id AND ur.role = 'creator') THEN 'creator'
      WHEN EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = p.id AND ur.role = 'advertiser') THEN 'advertiser'
      WHEN EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = p.id AND ur.role = 'agency') THEN 'agency'
      ELSE NULL
    END
  ]::text[],
  onboarding_completed = EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = p.id),
  onboarding_data = '{}'::jsonb
WHERE EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = p.id);