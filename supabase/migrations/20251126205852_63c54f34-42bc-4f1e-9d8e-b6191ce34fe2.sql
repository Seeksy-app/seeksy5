-- Fix Critical Security Issue #1: Profiles table public exposure
-- Drop ALL existing policies on profiles first
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;

-- Create secure policies for profiles
CREATE POLICY "Users view own profile only"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users update own profile only"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users insert own profile only"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Fix Critical Security Issue #2: Investor shares access codes exposure
DROP POLICY IF EXISTS "Creator can view their investor shares" ON investor_shares;
DROP POLICY IF EXISTS "Authenticated users can view active investor shares by code" ON investor_shares;
DROP POLICY IF EXISTS "Anyone can view investor shares" ON investor_shares;
DROP POLICY IF EXISTS "Public can view investor shares" ON investor_shares;
DROP POLICY IF EXISTS "Creator manages own investor shares" ON investor_shares;

-- Only the owner can manage their investor shares
CREATE POLICY "Owner manages own investor shares"
ON investor_shares FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Fix Warning #3: Sales team members protection
DROP POLICY IF EXISTS "Admins and self can view sales team members" ON sales_team_members;
DROP POLICY IF EXISTS "Anyone can view sales team members" ON sales_team_members;
DROP POLICY IF EXISTS "Admins and self view sales team" ON sales_team_members;

CREATE POLICY "Admins and self view sales team members"
ON sales_team_members FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'super_admin')
);