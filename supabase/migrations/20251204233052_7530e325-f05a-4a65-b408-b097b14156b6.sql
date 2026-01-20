-- Create ad_inventory_items table
CREATE TABLE public.ad_inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('blog_banner', 'newsletter', 'creator_ig', 'creator_tt', 'creator_youtube', 'podcast_midroll', 'event_sponsorship', 'awards_sponsorship', 'other')),
  channel TEXT NOT NULL,
  owner_type TEXT NOT NULL CHECK (owner_type IN ('seeksy', 'creator', 'partner')),
  owner_id UUID,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'active', 'lost', 'reserved')),
  inventory_date DATE,
  capacity INTEGER DEFAULT 1,
  list_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  expected_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  expected_profit NUMERIC(12,2) GENERATED ALWAYS AS (list_price - expected_cost) STORED,
  currency TEXT NOT NULL DEFAULT 'USD',
  linked_campaign_id UUID,
  linked_creator_id UUID,
  linked_ad_id UUID,
  notes TEXT
);

-- Add indexes for common queries
CREATE INDEX idx_ad_inventory_status ON public.ad_inventory_items(status);
CREATE INDEX idx_ad_inventory_type ON public.ad_inventory_items(type);
CREATE INDEX idx_ad_inventory_owner_type ON public.ad_inventory_items(owner_type);
CREATE INDEX idx_ad_inventory_date ON public.ad_inventory_items(inventory_date);

-- Enable RLS
ALTER TABLE public.ad_inventory_items ENABLE ROW LEVEL SECURITY;

-- Admin/CFO/CMO can manage inventory
CREATE POLICY "ad_inventory_admin_manage" ON public.ad_inventory_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin', 'super_admin', 'platform_owner', 'cfo', 'cmo')
    )
  );

-- Board members and analysts can read
CREATE POLICY "ad_inventory_board_read" ON public.ad_inventory_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('board_member', 'read_only_analyst')
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_ad_inventory_items_updated_at
  BEFORE UPDATE ON public.ad_inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert demo seed data (~55 rows)
INSERT INTO public.ad_inventory_items (name, type, channel, owner_type, status, inventory_date, capacity, list_price, expected_cost, currency, notes) VALUES
-- Seeksy Blog Banners
('Seeksy Blog Header Banner - Jan 2025', 'blog_banner', 'Blog', 'seeksy', 'active', '2025-01-01', 1, 2500.00, 250.00, 'USD', 'Premium header placement'),
('Seeksy Blog Header Banner - Feb 2025', 'blog_banner', 'Blog', 'seeksy', 'active', '2025-02-01', 1, 2500.00, 250.00, 'USD', 'Premium header placement'),
('Seeksy Blog Header Banner - Mar 2025', 'blog_banner', 'Blog', 'seeksy', 'reserved', '2025-03-01', 1, 2500.00, 250.00, 'USD', 'Pending contract'),
('Seeksy Blog Header Banner - Apr 2025', 'blog_banner', 'Blog', 'seeksy', 'available', '2025-04-01', 1, 2500.00, 250.00, 'USD', NULL),
('Seeksy Blog Sidebar - Q1 2025', 'blog_banner', 'Blog', 'seeksy', 'active', '2025-01-01', 3, 1200.00, 120.00, 'USD', '3 slots available per quarter'),
('Seeksy Blog Sidebar - Q2 2025', 'blog_banner', 'Blog', 'seeksy', 'available', '2025-04-01', 3, 1200.00, 120.00, 'USD', '3 slots available'),
('Seeksy Blog In-Article - Jan 2025', 'blog_banner', 'Blog', 'seeksy', 'lost', '2025-01-01', 2, 800.00, 80.00, 'USD', 'Client went with competitor'),

-- Seeksy Newsletter
('Seeksy Newsletter Header - Jan 2025', 'newsletter', 'Newsletter', 'seeksy', 'active', '2025-01-15', 1, 3500.00, 350.00, 'USD', '45K subscribers'),
('Seeksy Newsletter Header - Feb 2025', 'newsletter', 'Newsletter', 'seeksy', 'active', '2025-02-15', 1, 3500.00, 350.00, 'USD', '45K subscribers'),
('Seeksy Newsletter Header - Mar 2025', 'newsletter', 'Newsletter', 'seeksy', 'available', '2025-03-15', 1, 3500.00, 350.00, 'USD', NULL),
('Seeksy Newsletter Inline #1 - Jan 2025', 'newsletter', 'Newsletter', 'seeksy', 'active', '2025-01-15', 1, 1800.00, 180.00, 'USD', 'Mid-content placement'),
('Seeksy Newsletter Inline #2 - Jan 2025', 'newsletter', 'Newsletter', 'seeksy', 'reserved', '2025-01-15', 1, 1500.00, 150.00, 'USD', 'Lower placement'),
('Seeksy Newsletter Inline #1 - Feb 2025', 'newsletter', 'Newsletter', 'seeksy', 'available', '2025-02-15', 1, 1800.00, 180.00, 'USD', NULL),

-- Creator Instagram Opportunities
('@VeteranVoices IG Story - Jan 2025', 'creator_ig', 'Instagram', 'creator', 'active', '2025-01-10', 4, 1200.00, 720.00, 'USD', '85K followers, 4.2% engagement'),
('@VeteranVoices IG Feed Post - Jan 2025', 'creator_ig', 'Instagram', 'creator', 'active', '2025-01-12', 2, 2000.00, 1200.00, 'USD', 'Static or carousel'),
('@VeteranVoices IG Reel - Feb 2025', 'creator_ig', 'Instagram', 'creator', 'available', '2025-02-01', 1, 3500.00, 2100.00, 'USD', '60-second reel'),
('@MilSpousePod IG Story - Jan 2025', 'creator_ig', 'Instagram', 'creator', 'active', '2025-01-08', 3, 800.00, 480.00, 'USD', '42K followers'),
('@MilSpousePod IG Feed - Feb 2025', 'creator_ig', 'Instagram', 'creator', 'available', '2025-02-15', 1, 1500.00, 900.00, 'USD', NULL),
('@TransitionTips IG Story Package', 'creator_ig', 'Instagram', 'creator', 'reserved', '2025-01-20', 5, 600.00, 360.00, 'USD', '5 stories over 1 week'),
('@ServiceDogs_USA IG Reel', 'creator_ig', 'Instagram', 'creator', 'lost', '2025-01-05', 1, 2800.00, 1680.00, 'USD', 'Creator declined rate'),
('@NavyWife_Life IG Feed Post', 'creator_ig', 'Instagram', 'creator', 'available', '2025-02-01', 1, 1100.00, 660.00, 'USD', '28K followers'),

-- Creator TikTok Opportunities
('@VeteranVoices TikTok - Jan 2025', 'creator_tt', 'TikTok', 'creator', 'active', '2025-01-15', 2, 2500.00, 1500.00, 'USD', '120K followers'),
('@VeteranVoices TikTok - Feb 2025', 'creator_tt', 'TikTok', 'creator', 'available', '2025-02-15', 2, 2500.00, 1500.00, 'USD', NULL),
('@MilSpousePod TikTok - Jan 2025', 'creator_tt', 'TikTok', 'creator', 'active', '2025-01-10', 1, 1800.00, 1080.00, 'USD', '68K followers'),
('@TransitionCoach TikTok Series', 'creator_tt', 'TikTok', 'creator', 'reserved', '2025-02-01', 3, 4500.00, 2700.00, 'USD', '3-part series'),
('@PodcastProTips TikTok', 'creator_tt', 'TikTok', 'creator', 'available', '2025-02-10', 1, 1200.00, 720.00, 'USD', '35K followers'),
('@DadPodLife TikTok', 'creator_tt', 'TikTok', 'creator', 'lost', '2025-01-20', 1, 900.00, 540.00, 'USD', 'Schedule conflict'),
('@ComedyVet TikTok Skit', 'creator_tt', 'TikTok', 'creator', 'available', '2025-03-01', 1, 3200.00, 1920.00, 'USD', '200K followers, comedy niche'),

-- Creator YouTube
('@VeteranVoices YouTube Integration', 'creator_youtube', 'YouTube', 'creator', 'active', '2025-01-20', 1, 5000.00, 3000.00, 'USD', '60-sec mid-roll integration'),
('@MilSpousePod YouTube Dedicated', 'creator_youtube', 'YouTube', 'creator', 'reserved', '2025-02-15', 1, 8000.00, 4800.00, 'USD', 'Dedicated video sponsorship'),
('@TransitionTips YouTube Pre-roll', 'creator_youtube', 'YouTube', 'creator', 'available', '2025-02-01', 2, 2500.00, 1500.00, 'USD', '15-sec pre-roll read'),

-- Podcast Midroll/Pre-roll
('Veteran Voices Podcast - Pre-roll Jan', 'podcast_midroll', 'Podcast', 'creator', 'active', '2025-01-01', 4, 1500.00, 900.00, 'USD', '15K downloads/ep'),
('Veteran Voices Podcast - Midroll Jan', 'podcast_midroll', 'Podcast', 'creator', 'active', '2025-01-01', 4, 2200.00, 1320.00, 'USD', '60-sec read'),
('Veteran Voices Podcast - Pre-roll Feb', 'podcast_midroll', 'Podcast', 'creator', 'available', '2025-02-01', 4, 1500.00, 900.00, 'USD', NULL),
('MilSpouse Life Podcast - Midroll', 'podcast_midroll', 'Podcast', 'creator', 'active', '2025-01-15', 2, 1200.00, 720.00, 'USD', '8K downloads/ep'),
('Transition Stories Podcast - Host Read', 'podcast_midroll', 'Podcast', 'creator', 'reserved', '2025-02-01', 1, 3000.00, 1800.00, 'USD', 'Premium host-read'),
('Dad Life Uncensored - Pre-roll', 'podcast_midroll', 'Podcast', 'creator', 'lost', '2025-01-10', 2, 800.00, 480.00, 'USD', 'Advertiser pulled out'),
('Comedy Veterans Pod - Baked-in', 'podcast_midroll', 'Podcast', 'creator', 'available', '2025-03-01', 1, 4000.00, 2400.00, 'USD', 'Permanent baked-in ad'),

-- Event Sponsorships
('National Military Podcast Day 2025 - Title Sponsor', 'event_sponsorship', 'Event', 'seeksy', 'active', '2025-05-15', 1, 25000.00, 5000.00, 'USD', 'Full branding, keynote intro, booth'),
('National Military Podcast Day 2025 - Gold Sponsor', 'event_sponsorship', 'Event', 'seeksy', 'reserved', '2025-05-15', 2, 10000.00, 2000.00, 'USD', 'Logo, booth, 1 breakout session'),
('National Military Podcast Day 2025 - Silver Sponsor', 'event_sponsorship', 'Event', 'seeksy', 'available', '2025-05-15', 4, 5000.00, 1000.00, 'USD', 'Logo placement, swag bag insert'),
('National Military Podcast Day 2025 - Bronze Sponsor', 'event_sponsorship', 'Event', 'seeksy', 'available', '2025-05-15', 6, 2500.00, 500.00, 'USD', 'Logo on website'),
('Seeksy Creator Summit 2025 - Presenting Sponsor', 'event_sponsorship', 'Event', 'seeksy', 'available', '2025-09-20', 1, 50000.00, 10000.00, 'USD', 'Naming rights, all materials'),
('Seeksy Creator Summit 2025 - Lunch Sponsor', 'event_sponsorship', 'Event', 'seeksy', 'available', '2025-09-20', 1, 15000.00, 5000.00, 'USD', 'Branded lunch experience'),

-- Awards Sponsorships
('Veteran Podcast Awards 2025 - Title Sponsor', 'awards_sponsorship', 'Awards', 'seeksy', 'reserved', '2025-11-11', 1, 30000.00, 6000.00, 'USD', 'Full ceremony branding'),
('Veteran Podcast Awards 2025 - Category Sponsor', 'awards_sponsorship', 'Awards', 'seeksy', 'active', '2025-11-11', 5, 5000.00, 1000.00, 'USD', 'Sponsor one award category'),
('Veteran Podcast Awards 2025 - Trophy Sponsor', 'awards_sponsorship', 'Awards', 'seeksy', 'available', '2025-11-11', 1, 8000.00, 2000.00, 'USD', 'Logo on all trophies'),
('Veteran Podcast Awards 2025 - After Party', 'awards_sponsorship', 'Awards', 'seeksy', 'available', '2025-11-11', 1, 12000.00, 4000.00, 'USD', 'Host the after party'),
('Seeksy Creator Awards - Best New Show', 'awards_sponsorship', 'Awards', 'seeksy', 'available', '2025-12-01', 1, 3500.00, 700.00, 'USD', 'Single category sponsor'),
('Seeksy Creator Awards - Lifetime Achievement', 'awards_sponsorship', 'Awards', 'seeksy', 'available', '2025-12-01', 1, 7500.00, 1500.00, 'USD', 'Premium category'),

-- Other/Misc
('Seeksy Mobile App Splash - Q1 2025', 'other', 'App', 'seeksy', 'lost', '2025-01-01', 1, 5000.00, 500.00, 'USD', 'Feature delayed'),
('Partner Network Bundle - Jan 2025', 'other', 'Network', 'partner', 'active', '2025-01-01', 1, 15000.00, 9000.00, 'USD', '10 creator bundle deal');