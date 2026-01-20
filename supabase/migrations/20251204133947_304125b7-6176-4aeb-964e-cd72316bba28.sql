-- Monetization Center Database Schema

-- Creator market profiles for matching
CREATE TABLE IF NOT EXISTS creator_market_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  categories TEXT[] DEFAULT '{}',
  avg_cpm DECIMAL(10,2) DEFAULT 15.00,
  audience_demographics JSONB DEFAULT '{}',
  engagement_score DECIMAL(5,2) DEFAULT 0,
  veteran_market_focus BOOLEAN DEFAULT false,
  total_earnings DECIMAL(12,2) DEFAULT 0,
  completed_campaigns INTEGER DEFAULT 0,
  performance_rating DECIMAL(3,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(creator_id)
);

-- Creator opportunities (offers from advertisers)
CREATE TABLE IF NOT EXISTS creator_opportunities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES ad_campaigns(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  offer_amount DECIMAL(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'submitted', 'needs_fix', 'approved', 'paid', 'cancelled')),
  due_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  deliverable_type TEXT DEFAULT 'audio_read' CHECK (deliverable_type IN ('audio_read', 'video_post', 'social_share', 'event_read', 'host_read', 'custom')),
  requirements JSONB DEFAULT '{}',
  accepted_at TIMESTAMP WITH TIME ZONE,
  submitted_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Creator deliverables (content submitted by creators)
CREATE TABLE IF NOT EXISTS creator_deliverables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  opportunity_id UUID NOT NULL REFERENCES creator_opportunities(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'audio_read' CHECK (type IN ('audio_read', 'video_post', 'social_share', 'event_read', 'host_read', 'custom')),
  storage_url TEXT,
  preview_url TEXT,
  duration_seconds INTEGER,
  file_size_bytes BIGINT,
  metadata JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'approved', 'rejected', 'needs_revision')),
  feedback TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Proof of play (evidence of ad delivery)
CREATE TABLE IF NOT EXISTS proof_of_play (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deliverable_id UUID NOT NULL REFERENCES creator_deliverables(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('audio_log', 'screenshot', 'analytics_file', 'video_log', 'impression_data')),
  storage_url TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID REFERENCES profiles(id),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Campaign metrics
CREATE TABLE IF NOT EXISTS campaign_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES ad_campaigns(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  ctr DECIMAL(5,4) DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  cpa DECIMAL(10,2) DEFAULT 0,
  cpm DECIMAL(10,2) DEFAULT 0,
  spend DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, date)
);

-- Creator payments
CREATE TABLE IF NOT EXISTS creator_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES creator_opportunities(id) ON DELETE SET NULL,
  amount DECIMAL(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'processing', 'paid', 'failed', 'cancelled')),
  payout_method TEXT DEFAULT 'stripe_connect' CHECK (payout_method IN ('stripe_connect', 'bank_transfer', 'paypal', 'check', 'manual')),
  scheduled_date TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  transaction_id TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Monetization notifications
CREATE TABLE IF NOT EXISTS monetization_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('opportunity', 'deliverable_approved', 'payment', 'campaign_update', 'fraud_alert', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Advertiser wallet/funding
CREATE TABLE IF NOT EXISTS advertiser_wallet (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  advertiser_id UUID NOT NULL REFERENCES advertisers(id) ON DELETE CASCADE,
  balance DECIMAL(12,2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  last_funded_at TIMESTAMP WITH TIME ZONE,
  auto_fund_enabled BOOLEAN DEFAULT false,
  auto_fund_threshold DECIMAL(12,2) DEFAULT 100,
  auto_fund_amount DECIMAL(12,2) DEFAULT 500,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(advertiser_id)
);

-- Advertiser funding transactions
CREATE TABLE IF NOT EXISTS advertiser_funding_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  advertiser_id UUID NOT NULL REFERENCES advertisers(id) ON DELETE CASCADE,
  wallet_id UUID REFERENCES advertiser_wallet(id) ON DELETE SET NULL,
  amount DECIMAL(12,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit', 'refund', 'adjustment')),
  source TEXT DEFAULT 'card' CHECK (source IN ('card', 'ach', 'admin', 'manual', 'stripe', 'system')),
  description TEXT,
  stripe_payment_intent_id TEXT,
  balance_after DECIMAL(12,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- AI matching recommendations
CREATE TABLE IF NOT EXISTS campaign_creator_matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES ad_campaigns(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  match_score DECIMAL(5,2) DEFAULT 0,
  match_reasons JSONB DEFAULT '{}',
  is_ai_recommended BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'suggested' CHECK (status IN ('suggested', 'invited', 'accepted', 'declined', 'removed')),
  invited_at TIMESTAMP WITH TIME ZONE,
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, creator_id)
);

-- Enable RLS
ALTER TABLE creator_market_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE proof_of_play ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE monetization_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE advertiser_wallet ENABLE ROW LEVEL SECURITY;
ALTER TABLE advertiser_funding_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_creator_matches ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Creator market profiles
CREATE POLICY "Users can view own market profile" ON creator_market_profiles FOR SELECT USING (creator_id = auth.uid());
CREATE POLICY "Users can update own market profile" ON creator_market_profiles FOR UPDATE USING (creator_id = auth.uid());
CREATE POLICY "Users can insert own market profile" ON creator_market_profiles FOR INSERT WITH CHECK (creator_id = auth.uid());
CREATE POLICY "Admins can view all market profiles" ON creator_market_profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
);
CREATE POLICY "Advertisers can view market profiles" ON creator_market_profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'advertiser')
);

-- Creator opportunities
CREATE POLICY "Creators can view own opportunities" ON creator_opportunities FOR SELECT USING (creator_id = auth.uid());
CREATE POLICY "Creators can update own opportunities" ON creator_opportunities FOR UPDATE USING (creator_id = auth.uid());
CREATE POLICY "Admins can manage all opportunities" ON creator_opportunities FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
);
CREATE POLICY "Advertisers can view their campaign opportunities" ON creator_opportunities FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM ad_campaigns ac 
    JOIN advertisers a ON ac.advertiser_id = a.id 
    WHERE ac.id = creator_opportunities.campaign_id 
    AND a.owner_profile_id = auth.uid()
  )
);

-- Creator deliverables
CREATE POLICY "Users can view deliverables for their opportunities" ON creator_deliverables FOR SELECT USING (
  EXISTS (SELECT 1 FROM creator_opportunities WHERE id = opportunity_id AND creator_id = auth.uid())
);
CREATE POLICY "Users can manage deliverables for their opportunities" ON creator_deliverables FOR ALL USING (
  EXISTS (SELECT 1 FROM creator_opportunities WHERE id = opportunity_id AND creator_id = auth.uid())
);
CREATE POLICY "Admins can manage all deliverables" ON creator_deliverables FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- Proof of play
CREATE POLICY "Users can view proof for their deliverables" ON proof_of_play FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM creator_deliverables cd 
    JOIN creator_opportunities co ON cd.opportunity_id = co.id 
    WHERE cd.id = deliverable_id AND co.creator_id = auth.uid()
  )
);
CREATE POLICY "Admins can manage all proof" ON proof_of_play FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- Campaign metrics
CREATE POLICY "Admins can manage campaign metrics" ON campaign_metrics FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
);
CREATE POLICY "Advertisers can view their campaign metrics" ON campaign_metrics FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM ad_campaigns ac 
    JOIN advertisers a ON ac.advertiser_id = a.id 
    WHERE ac.id = campaign_id AND a.owner_profile_id = auth.uid()
  )
);

-- Creator payments
CREATE POLICY "Creators can view own payments" ON creator_payments FOR SELECT USING (creator_id = auth.uid());
CREATE POLICY "Admins can manage all payments" ON creator_payments FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- Notifications
CREATE POLICY "Users can view own notifications" ON monetization_notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON monetization_notifications FOR UPDATE USING (user_id = auth.uid());

-- Advertiser wallet
CREATE POLICY "Advertisers can view own wallet" ON advertiser_wallet FOR SELECT USING (
  EXISTS (SELECT 1 FROM advertisers WHERE id = advertiser_id AND owner_profile_id = auth.uid())
);
CREATE POLICY "Admins can manage all wallets" ON advertiser_wallet FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- Funding transactions
CREATE POLICY "Advertisers can view own transactions" ON advertiser_funding_transactions FOR SELECT USING (
  EXISTS (SELECT 1 FROM advertisers WHERE id = advertiser_id AND owner_profile_id = auth.uid())
);
CREATE POLICY "Admins can manage all transactions" ON advertiser_funding_transactions FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- Campaign creator matches
CREATE POLICY "Creators can view their matches" ON campaign_creator_matches FOR SELECT USING (creator_id = auth.uid());
CREATE POLICY "Admins can manage all matches" ON campaign_creator_matches FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_creator_opportunities_creator ON creator_opportunities(creator_id);
CREATE INDEX IF NOT EXISTS idx_creator_opportunities_campaign ON creator_opportunities(campaign_id);
CREATE INDEX IF NOT EXISTS idx_creator_opportunities_status ON creator_opportunities(status);
CREATE INDEX IF NOT EXISTS idx_creator_deliverables_opportunity ON creator_deliverables(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_creator_payments_creator ON creator_payments(creator_id);
CREATE INDEX IF NOT EXISTS idx_campaign_metrics_campaign ON campaign_metrics(campaign_id);
CREATE INDEX IF NOT EXISTS idx_monetization_notifications_user ON monetization_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_creator_matches_campaign ON campaign_creator_matches(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_creator_matches_creator ON campaign_creator_matches(creator_id);