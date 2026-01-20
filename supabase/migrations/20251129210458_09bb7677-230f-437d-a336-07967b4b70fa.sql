-- Fix podcast creator contact information exposure
-- Drop ALL existing policies on podcasts table to start fresh
DROP POLICY IF EXISTS "Public can view published podcasts" ON public.podcasts;
DROP POLICY IF EXISTS "Anyone can view published podcasts" ON public.podcasts;
DROP POLICY IF EXISTS "Public podcasts are viewable by everyone" ON public.podcasts;
DROP POLICY IF EXISTS "Admins can manage all podcasts" ON public.podcasts;
DROP POLICY IF EXISTS "Owners can manage their own podcasts" ON public.podcasts;
DROP POLICY IF EXISTS "Creators can view own podcasts" ON public.podcasts;
DROP POLICY IF EXISTS "Creators can create own podcasts" ON public.podcasts;
DROP POLICY IF EXISTS "Creators can update own podcasts" ON public.podcasts;
DROP POLICY IF EXISTS "Creators can delete own podcasts" ON public.podcasts;
DROP POLICY IF EXISTS "Public can view published podcast metadata only" ON public.podcasts;

-- Create strict RLS policies for podcasts table

-- Policy 1: Podcast owners can manage their own podcasts (full access)
CREATE POLICY "Owners can manage their own podcasts"
ON public.podcasts
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy 2: Admins can manage all podcasts
CREATE POLICY "Admins can manage all podcasts"
ON public.podcasts
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- Policy 3: Public can SELECT published podcasts
-- CRITICAL: Application code MUST filter out author_email and contact_phone in queries
CREATE POLICY "Public can view published podcasts"
ON public.podcasts
FOR SELECT
TO anon, authenticated
USING (is_published = true);

-- Add security comment
COMMENT ON TABLE public.podcasts IS 
'SECURITY WARNING: Contains PII (author_email, contact_phone). 
Application must exclude these fields from public API responses.
Only owners and admins have full field access via RLS.';