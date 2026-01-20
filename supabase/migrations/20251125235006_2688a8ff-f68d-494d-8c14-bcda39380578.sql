-- Fix critical security issues

-- 1. Add RLS policies for profiles table to prevent public data exposure
-- Drop existing overly permissive policies if any
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Users can only view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Only allow inserts during user creation (handled by trigger)
CREATE POLICY "Allow insert during user creation"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- 2. Protect advertiser_pricing_tiers from unauthorized modifications
-- Drop overly permissive policies if any
DROP POLICY IF EXISTS "Anyone can view pricing tiers" ON public.advertiser_pricing_tiers;

-- Anyone can view pricing tiers (public pricing display)
CREATE POLICY "Public can view active pricing tiers"
ON public.advertiser_pricing_tiers
FOR SELECT
TO authenticated, anon
USING (is_active = true);

-- Only admins can insert, update, or delete pricing tiers
CREATE POLICY "Only admins can modify pricing tiers"
ON public.advertiser_pricing_tiers
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));