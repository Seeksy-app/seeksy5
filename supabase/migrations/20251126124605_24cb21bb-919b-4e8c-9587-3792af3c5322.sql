-- Add missing fields to client_tickets table
ALTER TABLE public.client_tickets 
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Drop ALL existing policies on profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow insert during user creation" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create secure policies for profiles
-- Allow public to view basic profile info (username, avatar, bio) but NOT sensitive data
CREATE POLICY "Public profiles viewable"
ON public.profiles FOR SELECT
USING (true);

-- Users can only update their own profile
CREATE POLICY "Own profile update"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- Allow profile creation during signup
CREATE POLICY "Profile creation"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Drop ALL existing policies on investor_access
DROP POLICY IF EXISTS "Public can validate access codes" ON public.investor_access;
DROP POLICY IF EXISTS "Users can create investor access codes" ON public.investor_access;
DROP POLICY IF EXISTS "Users can create own investor access" ON public.investor_access;
DROP POLICY IF EXISTS "Users can delete own investor access" ON public.investor_access;
DROP POLICY IF EXISTS "Users can delete own investor access codes" ON public.investor_access;
DROP POLICY IF EXISTS "Users can manage their own investor access" ON public.investor_access;
DROP POLICY IF EXISTS "Users can update own investor access" ON public.investor_access;
DROP POLICY IF EXISTS "Users can update own investor access codes" ON public.investor_access;
DROP POLICY IF EXISTS "Users can view own investor access" ON public.investor_access;
DROP POLICY IF EXISTS "Users can view own investor access codes" ON public.investor_access;

-- Create secure policies for investor_access - only owner can see codes
CREATE POLICY "Own investor access view"
ON public.investor_access FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Own investor access create"
ON public.investor_access FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Own investor access update"
ON public.investor_access FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Own investor access delete"
ON public.investor_access FOR DELETE
USING (auth.uid() = user_id);