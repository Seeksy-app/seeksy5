-- Fix critical security issues: Restrict access to profiles and investor_access tables

-- ==========================================
-- PROFILES TABLE RLS POLICIES
-- ==========================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Users can only view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Admins and super_admins can view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- ==========================================
-- INVESTOR_ACCESS TABLE RLS POLICIES
-- ==========================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own investor access" ON public.investor_access;
DROP POLICY IF EXISTS "Users can create own investor access" ON public.investor_access;
DROP POLICY IF EXISTS "Users can update own investor access" ON public.investor_access;
DROP POLICY IF EXISTS "Users can delete own investor access" ON public.investor_access;

-- Users can only view investor access records they created
CREATE POLICY "Users can view own investor access"
ON public.investor_access
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can create investor access records
CREATE POLICY "Users can create own investor access"
ON public.investor_access
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can update their own investor access records
CREATE POLICY "Users can update own investor access"
ON public.investor_access
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Users can delete their own investor access records
CREATE POLICY "Users can delete own investor access"
ON public.investor_access
FOR DELETE
TO authenticated
USING (user_id = auth.uid());