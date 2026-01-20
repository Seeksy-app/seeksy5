-- =====================================================
-- SEEKSY ADVERTISING SYSTEM SCHEMA MIGRATION
-- Drop dependencies, migrate schema, recreate policies
-- =====================================================

-- Step 1: Drop all old RLS policies that reference user_id
DROP POLICY IF EXISTS "Advertisers can create their own audio ads" ON public.audio_ads;
DROP POLICY IF EXISTS "Advertisers can create their own campaigns" ON public.ad_campaigns;
DROP POLICY IF EXISTS "Advertisers can create their own creatives" ON public.ad_creatives;
DROP POLICY IF EXISTS "Advertisers can create their own digital ads" ON public.digital_ads;
DROP POLICY IF EXISTS "Advertisers can delete their own audio ads" ON public.audio_ads;
DROP POLICY IF EXISTS "Advertisers can delete their own campaigns" ON public.ad_campaigns;
DROP POLICY IF EXISTS "Advertisers can delete their own digital ads" ON public.digital_ads;
DROP POLICY IF EXISTS "Advertisers can update their own audio ads" ON public.audio_ads;
DROP POLICY IF EXISTS "Advertisers can update their own campaigns" ON public.ad_campaigns;
DROP POLICY IF EXISTS "Advertisers can update their own digital ads" ON public.digital_ads;
DROP POLICY IF EXISTS "Advertisers can update their own profile" ON public.advertisers;
DROP POLICY IF EXISTS "Advertisers can view own call inquiries" ON public.ad_call_inquiries;
DROP POLICY IF EXISTS "Advertisers can view their own audio ads" ON public.audio_ads;
DROP POLICY IF EXISTS "Advertisers can view their own campaigns" ON public.ad_campaigns;
DROP POLICY IF EXISTS "Advertisers can view their own conversational ad charges" ON public.conversational_ad_charges;
DROP POLICY IF EXISTS "Advertisers can view their own conversational ad usage" ON public.conversational_ad_usage;
DROP POLICY IF EXISTS "Advertisers can view their own digital ads" ON public.digital_ads;
DROP POLICY IF EXISTS "Advertisers can view their own profile" ON public.advertisers;
DROP POLICY IF EXISTS "Advertisers can view their own transactions" ON public.advertiser_transactions;
DROP POLICY IF EXISTS "Users can create their own advertiser application" ON public.advertisers;
DROP POLICY IF EXISTS "Advertisers can view their usage" ON public.voice_ad_usage;
DROP POLICY IF EXISTS "Advertisers can view their own call inquiries" ON public.ad_call_inquiries;
DROP POLICY IF EXISTS "Advertisers can view their campaign impressions" ON public.ad_impressions;

-- Step 2: Update advertisers table schema
ALTER TABLE public.advertisers
  ADD COLUMN IF NOT EXISTS owner_profile_id UUID REFERENCES auth.users(id);

-- Migrate user_id to owner_profile_id
UPDATE public.advertisers SET owner_profile_id = user_id WHERE owner_profile_id IS NULL AND user_id IS NOT NULL;

-- Now drop columns
ALTER TABLE public.advertisers
  DROP COLUMN IF EXISTS approved_at,
  DROP COLUMN IF EXISTS approved_by,
  DROP COLUMN IF EXISTS auto_topup_amount,
  DROP COLUMN IF EXISTS auto_topup_threshold,
  DROP COLUMN IF EXISTS auto_topup_enabled,
  DROP COLUMN IF EXISTS account_balance,
  DROP COLUMN IF EXISTS rejection_reason,
  DROP COLUMN IF EXISTS stripe_customer_id,
  DROP COLUMN IF EXISTS target_categories,
  DROP COLUMN IF EXISTS campaign_goals,
  DROP COLUMN IF EXISTS pricing_tier_id,
  DROP COLUMN IF EXISTS user_id;

ALTER TABLE public.advertisers
  ADD COLUMN IF NOT EXISTS primary_goal TEXT;

-- Step 3: Update advertiser_team_members
ALTER TABLE public.advertiser_team_members
  ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES auth.users(id);

UPDATE public.advertiser_team_members SET profile_id = user_id WHERE profile_id IS NULL AND user_id IS NOT NULL;

ALTER TABLE public.advertiser_team_members
  DROP COLUMN IF EXISTS invited_at,
  DROP COLUMN IF EXISTS invited_by,
  DROP COLUMN IF EXISTS accepted_at,
  DROP COLUMN IF EXISTS updated_at,
  DROP COLUMN IF EXISTS user_id;

ALTER TABLE public.advertiser_team_members
  ALTER COLUMN role TYPE TEXT;

-- Step 4: Create new tables

-- advertiser_preferences
CREATE TABLE IF NOT EXISTS public.advertiser_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id UUID NOT NULL REFERENCES public.advertisers(id) ON DELETE CASCADE,
  objectives JSONB DEFAULT '[]'::jsonb,
  target_categories TEXT[],
  target_regions TEXT[],
  target_creator_tiers TEXT[],
  default_ad_formats TEXT[],
  created_at TIMESTAMPTZ DEFAULT now()
);

-- creators
CREATE TABLE IF NOT EXISTS public.creators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  bio TEXT,
  default_cpm_floor NUMERIC DEFAULT 0,
  categories TEXT[],
  audience_size_estimate INTEGER DEFAULT 0,
  country TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- shows
CREATE TABLE IF NOT EXISTS public.shows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  categories TEXT[],
  average_listens INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- inventory_slots
CREATE TABLE IF NOT EXISTS public.inventory_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id UUID NOT NULL REFERENCES public.shows(id) ON DELETE CASCADE,
  slot_type TEXT NOT NULL CHECK (slot_type IN ('pre_roll', 'mid_roll', 'post_roll', 'live_stream', 'newsletter', 'short_form')),
  estimated_impressions INTEGER DEFAULT 0,
  base_cpm NUMERIC DEFAULT 0,
  available_from DATE,
  available_to DATE,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'booked')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Update ad_campaigns
ALTER TABLE public.ad_campaigns
  ADD COLUMN IF NOT EXISTS objective TEXT,
  ADD COLUMN IF NOT EXISTS daily_cap NUMERIC,
  ADD COLUMN IF NOT EXISTS pricing_model TEXT DEFAULT 'cpm';

ALTER TABLE public.ad_campaigns
  RENAME COLUMN budget TO total_budget;

ALTER TABLE public.ad_campaigns
  ALTER COLUMN status TYPE TEXT;

-- campaign_targets
CREATE TABLE IF NOT EXISTS public.campaign_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.ad_campaigns(id) ON DELETE CASCADE,
  categories TEXT[],
  regions TEXT[],
  creator_tiers TEXT[],
  min_audience_size INTEGER,
  max_cpm NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Update ad_creatives
ALTER TABLE public.ad_creatives
  ADD COLUMN IF NOT EXISTS advertiser_id UUID REFERENCES public.advertisers(id),
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS format TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS cta_url TEXT,
  ADD COLUMN IF NOT EXISTS cta_text TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT;

UPDATE public.ad_creatives SET format = creative_type WHERE format IS NULL;

ALTER TABLE public.ad_creatives
  DROP COLUMN IF EXISTS creative_type,
  DROP COLUMN IF EXISTS audio_url,
  DROP COLUMN IF EXISTS vast_tag_url;

-- ad_assets
CREATE TABLE IF NOT EXISTS public.ad_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creative_id UUID NOT NULL REFERENCES public.ad_creatives(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('audio', 'video', 'image', 'script')),
  storage_path TEXT,
  duration_seconds INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- conversational_ad_configs
CREATE TABLE IF NOT EXISTS public.conversational_ad_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creative_id UUID NOT NULL REFERENCES public.ad_creatives(id) ON DELETE CASCADE,
  phone_number TEXT,
  number_type TEXT CHECK (number_type IN ('shared_demo', 'custom')),
  elevenlabs_agent_id TEXT,
  pricing_tier TEXT CHECK (pricing_tier IN ('starter', 'professional', 'enterprise')),
  faq JSONB DEFAULT '[]'::jsonb,
  training_urls TEXT[],
  agent_instructions TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- campaign_inventory_links
CREATE TABLE IF NOT EXISTS public.campaign_inventory_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.ad_campaigns(id) ON DELETE CASCADE,
  inventory_slot_id UUID NOT NULL REFERENCES public.inventory_slots(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  allocation_impressions INTEGER DEFAULT 0,
  agreed_cpm NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'proposed' CHECK (status IN ('proposed', 'accepted', 'rejected', 'running', 'completed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ad_serving_events
CREATE TABLE IF NOT EXISTS public.ad_serving_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.ad_campaigns(id) ON DELETE CASCADE,
  creative_id UUID REFERENCES public.ad_creatives(id) ON DELETE CASCADE,
  creator_id UUID REFERENCES public.creators(id) ON DELETE CASCADE,
  show_id UUID REFERENCES public.shows(id) ON DELETE CASCADE,
  inventory_slot_id UUID REFERENCES public.inventory_slots(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('impression', 'click', 'conversion', 'conversation_minute')),
  quantity INTEGER DEFAULT 1,
  occurred_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- wallets
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_type TEXT NOT NULL CHECK (owner_type IN ('advertiser', 'creator')),
  owner_id UUID NOT NULL,
  balance NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- pricing_tiers
CREATE TABLE IF NOT EXISTS public.pricing_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (name IN ('Starter', 'Professional', 'Enterprise')),
  min_deposit NUMERIC NOT NULL,
  cpm_range_min NUMERIC NOT NULL,
  cpm_range_max NUMERIC NOT NULL,
  conversational_discount_pct NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- sponsorship_opportunities
CREATE TABLE IF NOT EXISTS public.sponsorship_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('event', 'award_program', 'series')),
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  base_price NUMERIC NOT NULL,
  available BOOLEAN DEFAULT true,
  categories TEXT[],
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- sponsorship_applications
CREATE TABLE IF NOT EXISTS public.sponsorship_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsorship_id UUID NOT NULL REFERENCES public.sponsorship_opportunities(id) ON DELETE CASCADE,
  advertiser_id UUID NOT NULL REFERENCES public.advertisers(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  proposed_budget NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Step 5: Enable RLS on all new tables
ALTER TABLE public.advertiser_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversational_ad_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_inventory_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_serving_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsorship_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsorship_applications ENABLE ROW LEVEL SECURITY;

-- Step 6: Create new RLS policies with owner_profile_id

-- Advertisers policies
CREATE POLICY "Advertisers can view own profile" ON public.advertisers FOR SELECT USING (owner_profile_id = auth.uid());
CREATE POLICY "Advertisers can update own profile" ON public.advertisers FOR UPDATE USING (owner_profile_id = auth.uid());
CREATE POLICY "Users can create advertiser profile" ON public.advertisers FOR INSERT WITH CHECK (owner_profile_id = auth.uid());

-- Audio ads policies (updated to use owner_profile_id)
CREATE POLICY "Advertisers can view own audio ads" ON public.audio_ads FOR SELECT USING (
  advertiser_id IN (SELECT id FROM advertisers WHERE owner_profile_id = auth.uid())
);
CREATE POLICY "Advertisers can create own audio ads" ON public.audio_ads FOR INSERT WITH CHECK (
  advertiser_id IN (SELECT id FROM advertisers WHERE owner_profile_id = auth.uid())
);
CREATE POLICY "Advertisers can update own audio ads" ON public.audio_ads FOR UPDATE USING (
  advertiser_id IN (SELECT id FROM advertisers WHERE owner_profile_id = auth.uid())
);
CREATE POLICY "Advertisers can delete own audio ads" ON public.audio_ads FOR DELETE USING (
  advertiser_id IN (SELECT id FROM advertisers WHERE owner_profile_id = auth.uid())
);

-- Campaigns policies
CREATE POLICY "Advertisers can view own campaigns" ON public.ad_campaigns FOR SELECT USING (
  advertiser_id IN (SELECT id FROM advertisers WHERE owner_profile_id = auth.uid())
);
CREATE POLICY "Advertisers can create own campaigns" ON public.ad_campaigns FOR INSERT WITH CHECK (
  advertiser_id IN (SELECT id FROM advertisers WHERE owner_profile_id = auth.uid())
);
CREATE POLICY "Advertisers can update own campaigns" ON public.ad_campaigns FOR UPDATE USING (
  advertiser_id IN (SELECT id FROM advertisers WHERE owner_profile_id = auth.uid())
);
CREATE POLICY "Advertisers can delete own campaigns" ON public.ad_campaigns FOR DELETE USING (
  advertiser_id IN (SELECT id FROM advertisers WHERE owner_profile_id = auth.uid())
);

-- Ad creatives policies
CREATE POLICY "Advertisers can view own creatives" ON public.ad_creatives FOR SELECT USING (
  advertiser_id IN (SELECT id FROM advertisers WHERE owner_profile_id = auth.uid())
);
CREATE POLICY "Advertisers can create own creatives" ON public.ad_creatives FOR INSERT WITH CHECK (
  advertiser_id IN (SELECT id FROM advertisers WHERE owner_profile_id = auth.uid())
);
CREATE POLICY "Advertisers can update own creatives" ON public.ad_creatives FOR UPDATE USING (
  advertiser_id IN (SELECT id FROM advertisers WHERE owner_profile_id = auth.uid())
);

-- Advertiser team members
CREATE POLICY "Team members can view own team" ON public.advertiser_team_members FOR SELECT USING (
  profile_id = auth.uid() OR advertiser_id IN (SELECT id FROM advertisers WHERE owner_profile_id = auth.uid())
);
CREATE POLICY "Owners can manage team" ON public.advertiser_team_members FOR ALL USING (
  advertiser_id IN (SELECT id FROM advertisers WHERE owner_profile_id = auth.uid())
);

-- Advertiser preferences
CREATE POLICY "Advertisers can manage preferences" ON public.advertiser_preferences FOR ALL USING (
  advertiser_id IN (SELECT id FROM advertisers WHERE owner_profile_id = auth.uid())
);

-- Creators
CREATE POLICY "Creators can view own profile" ON public.creators FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "Creators can update own profile" ON public.creators FOR UPDATE USING (profile_id = auth.uid());
CREATE POLICY "Users can create creator profile" ON public.creators FOR INSERT WITH CHECK (profile_id = auth.uid());
CREATE POLICY "Public can view creators" ON public.creators FOR SELECT USING (true);

-- Shows
CREATE POLICY "Creators can manage own shows" ON public.shows FOR ALL USING (
  creator_id IN (SELECT id FROM creators WHERE profile_id = auth.uid())
);
CREATE POLICY "Public can view active shows" ON public.shows FOR SELECT USING (is_active = true);

-- Inventory slots
CREATE POLICY "Creators can manage own inventory" ON public.inventory_slots FOR ALL USING (
  show_id IN (SELECT id FROM shows WHERE creator_id IN (SELECT id FROM creators WHERE profile_id = auth.uid()))
);
CREATE POLICY "Advertisers can view available inventory" ON public.inventory_slots FOR SELECT USING (status = 'available');

-- Campaign targets
CREATE POLICY "Advertisers can manage campaign targets" ON public.campaign_targets FOR ALL USING (
  campaign_id IN (SELECT id FROM ad_campaigns WHERE advertiser_id IN (SELECT id FROM advertisers WHERE owner_profile_id = auth.uid()))
);

-- Ad assets
CREATE POLICY "Advertisers can manage creative assets" ON public.ad_assets FOR ALL USING (
  creative_id IN (SELECT id FROM ad_creatives WHERE advertiser_id IN (SELECT id FROM advertisers WHERE owner_profile_id = auth.uid()))
);

-- Conversational ad configs
CREATE POLICY "Advertisers can manage conversational configs" ON public.conversational_ad_configs FOR ALL USING (
  creative_id IN (SELECT id FROM ad_creatives WHERE advertiser_id IN (SELECT id FROM advertisers WHERE owner_profile_id = auth.uid()))
);

-- Campaign inventory links
CREATE POLICY "Advertisers can view campaign links" ON public.campaign_inventory_links FOR SELECT USING (
  campaign_id IN (SELECT id FROM ad_campaigns WHERE advertiser_id IN (SELECT id FROM advertisers WHERE owner_profile_id = auth.uid()))
);
CREATE POLICY "Creators can view inventory links" ON public.campaign_inventory_links FOR SELECT USING (
  creator_id IN (SELECT id FROM creators WHERE profile_id = auth.uid())
);
CREATE POLICY "Creators can accept/reject links" ON public.campaign_inventory_links FOR UPDATE USING (
  creator_id IN (SELECT id FROM creators WHERE profile_id = auth.uid())
);

-- Ad serving events
CREATE POLICY "System can insert ad events" ON public.ad_serving_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Advertisers can view campaign events" ON public.ad_serving_events FOR SELECT USING (
  campaign_id IN (SELECT id FROM ad_campaigns WHERE advertiser_id IN (SELECT id FROM advertisers WHERE owner_profile_id = auth.uid()))
);
CREATE POLICY "Creators can view show events" ON public.ad_serving_events FOR SELECT USING (
  creator_id IN (SELECT id FROM creators WHERE profile_id = auth.uid())
);

-- Wallets
CREATE POLICY "Users can view own wallet" ON public.wallets FOR SELECT USING (
  (owner_type = 'advertiser' AND owner_id IN (SELECT id FROM advertisers WHERE owner_profile_id = auth.uid())) OR
  (owner_type = 'creator' AND owner_id IN (SELECT id FROM creators WHERE profile_id = auth.uid()))
);

-- Pricing tiers
CREATE POLICY "Public can view pricing tiers" ON public.pricing_tiers FOR SELECT USING (true);

-- Sponsorship opportunities
CREATE POLICY "Creators can manage opportunities" ON public.sponsorship_opportunities FOR ALL USING (
  creator_id IN (SELECT id FROM creators WHERE profile_id = auth.uid())
);
CREATE POLICY "Public can view available opportunities" ON public.sponsorship_opportunities FOR SELECT USING (available = true);

-- Sponsorship applications
CREATE POLICY "Advertisers can manage applications" ON public.sponsorship_applications FOR ALL USING (
  advertiser_id IN (SELECT id FROM advertisers WHERE owner_profile_id = auth.uid())
);
CREATE POLICY "Creators can view applications" ON public.sponsorship_applications FOR SELECT USING (
  sponsorship_id IN (SELECT id FROM sponsorship_opportunities WHERE creator_id IN (SELECT id FROM creators WHERE profile_id = auth.uid()))
);

-- Step 7: Create performance indexes
CREATE INDEX IF NOT EXISTS idx_advertisers_owner ON public.advertisers(owner_profile_id);
CREATE INDEX IF NOT EXISTS idx_creators_profile ON public.creators(profile_id);
CREATE INDEX IF NOT EXISTS idx_shows_creator ON public.shows(creator_id);
CREATE INDEX IF NOT EXISTS idx_inventory_show ON public.inventory_slots(show_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_advertiser ON public.ad_campaigns(advertiser_id);
CREATE INDEX IF NOT EXISTS idx_creatives_advertiser ON public.ad_creatives(advertiser_id);
CREATE INDEX IF NOT EXISTS idx_events_campaign ON public.ad_serving_events(campaign_id);
CREATE INDEX IF NOT EXISTS idx_events_creator ON public.ad_serving_events(creator_id);
CREATE INDEX IF NOT EXISTS idx_wallets_owner ON public.wallets(owner_type, owner_id);