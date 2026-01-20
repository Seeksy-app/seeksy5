-- =============================================
-- 1) PROFILES TABLE - Add is_public and tighten RLS
-- =============================================

-- Add is_public column if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false;

-- Drop ALL existing policies on profiles (including the one that exists)
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles viewable by all" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- Owner: full read/write of their own profile
CREATE POLICY "Owner can view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Owner can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Owner can insert own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Public: read-only access to public profiles
CREATE POLICY "Public profiles are viewable"
ON public.profiles FOR SELECT
TO authenticated
USING (is_public = true);

-- Admins: full access for support
CREATE POLICY "Admin can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admin can update all profiles"
ON public.profiles FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- =============================================
-- 2) CONTACTS TABLE - Explicit owner + admin policies
-- =============================================

DROP POLICY IF EXISTS "admin_contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can manage their own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can view their own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can insert their own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can update their own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can delete their own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Owners can view own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Owners can insert own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Owners can update own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Owners can delete own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Admins can view all contacts" ON public.contacts;
DROP POLICY IF EXISTS "Admins can manage all contacts" ON public.contacts;

-- Owner: full CRUD on own contacts
CREATE POLICY "Owner can view own contacts"
ON public.contacts FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Owner can insert own contacts"
ON public.contacts FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Owner can update own contacts"
ON public.contacts FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Owner can delete own contacts"
ON public.contacts FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Admins: global access for operations/support
CREATE POLICY "Admin can view all contacts"
ON public.contacts FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admin can manage all contacts"
ON public.contacts FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- =============================================
-- 3) ADVERTISERS TABLE - Explicit owner + admin policies
-- =============================================

DROP POLICY IF EXISTS "Admins can view all advertisers" ON public.advertisers;
DROP POLICY IF EXISTS "Admins can manage all advertisers" ON public.advertisers;
DROP POLICY IF EXISTS "Advertisers can view own profile" ON public.advertisers;
DROP POLICY IF EXISTS "Advertisers can update own profile" ON public.advertisers;
DROP POLICY IF EXISTS "Advertisers can insert own profile" ON public.advertisers;
DROP POLICY IF EXISTS "Advertisers can insert their profile" ON public.advertisers;

-- Owner: full access to own advertiser profile
CREATE POLICY "Advertiser can view own profile"
ON public.advertisers FOR SELECT
TO authenticated
USING (owner_profile_id = auth.uid());

CREATE POLICY "Advertiser can update own profile"
ON public.advertisers FOR UPDATE
TO authenticated
USING (owner_profile_id = auth.uid())
WITH CHECK (owner_profile_id = auth.uid());

CREATE POLICY "Advertiser can insert own profile"
ON public.advertisers FOR INSERT
TO authenticated
WITH CHECK (owner_profile_id = auth.uid());

-- Admins: global access for operations
CREATE POLICY "Admin can view all advertisers"
ON public.advertisers FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admin can manage all advertisers"
ON public.advertisers FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- =============================================
-- 4) EMAIL_ACCOUNTS TABLE - Lock down to owner only
-- =============================================

DROP POLICY IF EXISTS "Users can manage their own email accounts" ON public.email_accounts;
DROP POLICY IF EXISTS "Users can view own email accounts" ON public.email_accounts;
DROP POLICY IF EXISTS "Users can insert own email accounts" ON public.email_accounts;
DROP POLICY IF EXISTS "Users can update own email accounts" ON public.email_accounts;
DROP POLICY IF EXISTS "Users can delete own email accounts" ON public.email_accounts;

-- Owner-only access (service_role bypasses RLS automatically)
CREATE POLICY "Owner can view own email accounts"
ON public.email_accounts FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Owner can insert own email accounts"
ON public.email_accounts FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Owner can update own email accounts"
ON public.email_accounts FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Owner can delete own email accounts"
ON public.email_accounts FOR DELETE
TO authenticated
USING (user_id = auth.uid());