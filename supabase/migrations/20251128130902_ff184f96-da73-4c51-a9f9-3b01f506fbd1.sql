-- Add dual role support and role switching infrastructure

-- Add fields to profiles table for role preferences
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_creator BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_advertiser BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_role TEXT CHECK (preferred_role IN ('creator', 'advertiser'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS creator_onboarding_completed BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS advertiser_onboarding_completed BOOLEAN DEFAULT false;

-- Create a function to check if user has multiple roles
CREATE OR REPLACE FUNCTION public.has_multiple_roles(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = _user_id
      AND is_creator = true
      AND is_advertiser = true
  )
$$;

-- Create a function to get user's active roles
CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id uuid)
RETURNS TABLE(role text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT unnest(ARRAY['creator']) AS role
  FROM profiles
  WHERE id = _user_id AND is_creator = true
  UNION
  SELECT unnest(ARRAY['advertiser']) AS role
  FROM profiles
  WHERE id = _user_id AND is_advertiser = true
$$;

-- Add RLS policy for profiles to allow users to update their own role preferences
CREATE POLICY "Users can update their own role preferences"
ON profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);