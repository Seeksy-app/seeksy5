-- Fix RLS for social_links: check profile is_public before exposing (uses profile_id column)
DROP POLICY IF EXISTS "Anyone can view social links" ON public.social_links;
DROP POLICY IF EXISTS "Social links are viewable by everyone" ON public.social_links;
DROP POLICY IF EXISTS "Public can view social links" ON public.social_links;

CREATE POLICY "Public can view social links for public profiles only"
ON public.social_links
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = social_links.profile_id
    AND profiles.is_public = true
  )
);

CREATE POLICY "Authenticated users can view social links"
ON public.social_links
FOR SELECT
TO authenticated
USING (
  profile_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = social_links.profile_id
    AND profiles.is_public = true
  )
);

-- Fix advertiser_pricing_tiers: restrict to authenticated users only
DROP POLICY IF EXISTS "Anyone can view advertiser pricing tiers" ON public.advertiser_pricing_tiers;
DROP POLICY IF EXISTS "Advertiser pricing tiers are viewable by everyone" ON public.advertiser_pricing_tiers;
DROP POLICY IF EXISTS "Public can view pricing tiers" ON public.advertiser_pricing_tiers;

CREATE POLICY "Authenticated users can view active pricing tiers"
ON public.advertiser_pricing_tiers
FOR SELECT
TO authenticated
USING (is_active = true);