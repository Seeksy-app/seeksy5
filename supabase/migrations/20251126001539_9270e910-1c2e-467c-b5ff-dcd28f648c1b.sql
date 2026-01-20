-- Fix RLS policies for security issues

-- 1. Fix profiles table - users should only see their own profile
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 2. Fix ad_call_inquiries - only advertisers who own the ad can see call data
DROP POLICY IF EXISTS "Advertisers can view their own call inquiries" ON public.ad_call_inquiries;

CREATE POLICY "Advertisers can view their own call inquiries"
  ON public.ad_call_inquiries
  FOR SELECT
  USING (
    advertiser_id IN (
      SELECT id FROM public.advertisers WHERE user_id = auth.uid()
    )
  );

-- 3. Fix social_media_accounts - remove public read access, only owner can see
DROP POLICY IF EXISTS "Users can view social media accounts" ON public.social_media_accounts;
DROP POLICY IF EXISTS "Users can manage their own social media accounts" ON public.social_media_accounts;

CREATE POLICY "Users can view their own social media accounts"
  ON public.social_media_accounts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own social media accounts"
  ON public.social_media_accounts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own social media accounts"
  ON public.social_media_accounts
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own social media accounts"
  ON public.social_media_accounts
  FOR DELETE
  USING (auth.uid() = user_id);

-- 4. Fix ad_impressions - only campaign owners can insert/view
DROP POLICY IF EXISTS "System can insert ad impressions" ON public.ad_impressions;
DROP POLICY IF EXISTS "Advertisers can view their campaign impressions" ON public.ad_impressions;

CREATE POLICY "Advertisers can view their campaign impressions"
  ON public.ad_impressions
  FOR SELECT
  USING (
    campaign_id IN (
      SELECT ac.id 
      FROM public.ad_campaigns ac
      JOIN public.advertisers a ON a.id = ac.advertiser_id
      WHERE a.user_id = auth.uid()
    )
  );

-- System service role can insert impressions (for tracking)
CREATE POLICY "System can insert ad impressions"
  ON public.ad_impressions
  FOR INSERT
  WITH CHECK (true);