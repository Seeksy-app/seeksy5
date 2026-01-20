-- Fix RLS policies for episodes table to prevent unpublished episode exposure
-- Drop ALL existing SELECT policies on episodes
DROP POLICY IF EXISTS "Anyone can view published episodes" ON public.episodes;
DROP POLICY IF EXISTS "Public episodes are viewable by everyone" ON public.episodes;
DROP POLICY IF EXISTS "Creators can view their own episodes" ON public.episodes;
DROP POLICY IF EXISTS "Admins can view all episodes" ON public.episodes;
DROP POLICY IF EXISTS "Public can only view published episodes" ON public.episodes;

-- Create strict policy: only published episodes visible to unauthenticated users
CREATE POLICY "Public can only view published episodes"
ON public.episodes
FOR SELECT
TO public
USING (is_published = true);

-- Creators can view all their own episodes (published and unpublished)
CREATE POLICY "Creators can view their own episodes"
ON public.episodes
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    podcast_id IN (
      SELECT id FROM public.podcasts WHERE user_id = auth.uid()
    )
  )
);

-- Admins can view all episodes
CREATE POLICY "Admins can view all episodes"
ON public.episodes
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Fix RLS policies for advertiser_pricing_tiers
-- Drop all existing policies
DROP POLICY IF EXISTS "Admins can manage pricing tiers" ON public.advertiser_pricing_tiers;
DROP POLICY IF EXISTS "Public can view active pricing tiers" ON public.advertiser_pricing_tiers;
DROP POLICY IF EXISTS "Only super_admin can insert pricing tiers" ON public.advertiser_pricing_tiers;
DROP POLICY IF EXISTS "Only super_admin can update pricing tiers" ON public.advertiser_pricing_tiers;
DROP POLICY IF EXISTS "Only super_admin can delete pricing tiers" ON public.advertiser_pricing_tiers;

-- Public can view active pricing tiers (for advertiser signup)
CREATE POLICY "Public can view active pricing tiers"
ON public.advertiser_pricing_tiers
FOR SELECT
TO public
USING (is_active = true);

-- Only super_admin can insert/update/delete pricing tiers
CREATE POLICY "Only super_admin can insert pricing tiers"
ON public.advertiser_pricing_tiers
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Only super_admin can update pricing tiers"
ON public.advertiser_pricing_tiers
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Only super_admin can delete pricing tiers"
ON public.advertiser_pricing_tiers
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));