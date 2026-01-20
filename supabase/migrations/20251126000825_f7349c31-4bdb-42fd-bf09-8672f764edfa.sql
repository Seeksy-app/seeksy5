-- Fix profiles table RLS policies
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Only allow users to view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Fix investor_access table RLS policies
DROP POLICY IF EXISTS "Anyone can view investor access" ON public.investor_access;

-- Only allow users to view access codes they created
CREATE POLICY "Users can view own investor access codes"
ON public.investor_access
FOR SELECT
USING (auth.uid() = user_id);

-- Allow users to insert their own access codes
CREATE POLICY "Users can create investor access codes"
ON public.investor_access
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own access codes
CREATE POLICY "Users can update own investor access codes"
ON public.investor_access
FOR UPDATE
USING (auth.uid() = user_id);

-- Allow users to delete their own access codes
CREATE POLICY "Users can delete own investor access codes"
ON public.investor_access
FOR DELETE
USING (auth.uid() = user_id);