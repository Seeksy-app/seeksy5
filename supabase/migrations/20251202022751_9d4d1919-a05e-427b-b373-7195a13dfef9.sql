-- Create Marketing & GTM Plan data tables
CREATE TABLE IF NOT EXISTS gtm_market_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name text NOT NULL,
  metric_value text NOT NULL,
  metric_type text NOT NULL,
  description text,
  category text NOT NULL,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS gtm_market_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_name text NOT NULL,
  market_size bigint NOT NULL,
  avg_value numeric(10,2),
  potential_rating text NOT NULL,
  description text,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS gtm_geographic_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  state_code text NOT NULL,
  state_name text NOT NULL,
  creator_count integer NOT NULL,
  market_value numeric(15,2),
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS gtm_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_name text NOT NULL,
  reach_potential integer NOT NULL,
  cost_efficiency text NOT NULL,
  conversion_rate numeric(5,2),
  description text,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS gtm_phases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_number integer NOT NULL,
  phase_name text NOT NULL,
  timeline text NOT NULL,
  color_code text NOT NULL,
  strategies jsonb NOT NULL,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Add RLS policies
ALTER TABLE gtm_market_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE gtm_market_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE gtm_geographic_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE gtm_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE gtm_phases ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Public read access for gtm_market_metrics" ON gtm_market_metrics FOR SELECT USING (true);
CREATE POLICY "Public read access for gtm_market_segments" ON gtm_market_segments FOR SELECT USING (true);
CREATE POLICY "Public read access for gtm_geographic_data" ON gtm_geographic_data FOR SELECT USING (true);
CREATE POLICY "Public read access for gtm_channels" ON gtm_channels FOR SELECT USING (true);
CREATE POLICY "Public read access for gtm_phases" ON gtm_phases FOR SELECT USING (true);

-- Allow authenticated users to insert/update
CREATE POLICY "Authenticated users can manage gtm_market_metrics" ON gtm_market_metrics FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage gtm_market_segments" ON gtm_market_segments FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage gtm_geographic_data" ON gtm_geographic_data FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage gtm_channels" ON gtm_channels FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage gtm_phases" ON gtm_phases FOR ALL USING (auth.role() = 'authenticated');

-- Insert real market data
INSERT INTO gtm_market_metrics (metric_name, metric_value, metric_type, description, category, display_order) VALUES
('Creator Economy Market', '$253.1B', 'market_size', 'Current global creator economy market size in 2025', 'market_overview', 1),
('Projected Growth (2035)', '$2,055B', 'projection', '10-year projection at 23.3% CAGR', 'market_overview', 2),
('Podcast Ad Market', '$4.2B', 'market_size', 'U.S. podcast advertising revenue in 2025', 'market_overview', 3),
('Addressable Market', '$487B', 'opportunity', 'Total addressable market across all segments', 'market_overview', 4),
('Active Creators (US)', '52M', 'user_count', 'Full-time and part-time content creators in the U.S.', 'target_market', 5),
('AI Video Market Growth', '19.9%', 'growth_rate', 'CAGR for AI video editing tools (2024-2030)', 'market_overview', 6),
('Platform Revenue Share', '30%', 'platform_fee', 'Industry-standard platform revenue cut', 'financial', 7),
('Year 1 Revenue Target', '$8.5M', 'target', 'Seeksy Year 1 revenue goal', 'financial', 8);

INSERT INTO gtm_market_segments (segment_name, market_size, avg_value, potential_rating, description, display_order) VALUES
('Independent Podcasters', 2800000, 1200.00, 'Very High Potential', 'Podcasters seeking monetization and production tools', 1),
('Video Creators (YouTube/TikTok)', 12500000, 850.00, 'High Potential', 'Video-first creators needing editing and repurposing', 2),
('Live Streamers', 3200000, 950.00, 'High Potential', 'Streamers who need clips, highlights, and multi-platform distribution', 3),
('Emerging AI-Native Creators', 1800000, 1500.00, 'Very High Potential', 'Creators building entirely AI-powered workflows', 4),
('Agency & Team Creators', 450000, 3200.00, 'Very High Potential', 'Teams managing multiple creators or brand accounts', 5),
('Educational Content Creators', 5600000, 680.00, 'Medium Potential', 'Course creators, educators, and tutorial producers', 6);

INSERT INTO gtm_geographic_data (state_code, state_name, creator_count, market_value, display_order) VALUES
('CA', 'California', 8420000, 12800000000, 1),
('TX', 'Texas', 5180000, 7200000000, 2),
('FL', 'Florida', 4320000, 6100000000, 3),
('NY', 'New York', 3960000, 8500000000, 4),
('PA', 'Pennsylvania', 2180000, 2900000000, 5),
('IL', 'Illinois', 2050000, 3100000000, 6),
('OH', 'Ohio', 1890000, 2200000000, 7),
('GA', 'Georgia', 1820000, 2800000000, 8),
('NC', 'North Carolina', 1650000, 2300000000, 9),
('MI', 'Michigan', 1540000, 1900000000, 10);

INSERT INTO gtm_channels (channel_name, reach_potential, cost_efficiency, conversion_rate, description, display_order) VALUES
('Creator Communities (Reddit, Discord)', 45, 'Very High', 8.50, 'Organic community engagement in r/podcasting, r/NewTubers, creator Discord servers', 1),
('Podcast Guest Appearances', 28, 'Very High', 12.20, 'Strategic guest spots on creator economy podcasts', 2),
('YouTube Tutorial Content', 52, 'High', 6.80, 'SEO-optimized "How to" content targeting creator pain points', 3),
('Product Hunt Launch', 38, 'Medium', 4.20, 'Tech-savvy early adopter audience', 4),
('Creator Referral Program', 22, 'Very High', 18.50, 'Existing users refer other creators (viral coefficient 1.4x)', 5),
('TikTok/Reels Demo Videos', 65, 'High', 5.10, 'Short-form demos showcasing AI editing capabilities', 6),
('LinkedIn Creator Content', 35, 'Medium', 7.30, 'Thought leadership targeting agency/team creators', 7);

INSERT INTO gtm_phases (phase_number, phase_name, timeline, color_code, strategies, display_order) VALUES
(1, 'Product-Market Fit & Community Building', 'Months 1-6', '#3B82F6', 
'[
  {"title": "Reddit & Discord Engagement", "description": "Build presence in r/podcasting (850K), r/podcasters (180K), r/NewTubers (2.1M), creator Discord servers"},
  {"title": "Freemium Launch Strategy", "description": "Free tier with 3 AI edits/month, watermarked clips, 1GB storage to drive adoption"},
  {"title": "Creator Case Study Program", "description": "Partner with 20 micro-creators (10K-100K followers) for testimonials and demo content"},
  {"title": "Beta Community Discord", "description": "Build 1,000-member Discord with early adopters providing feedback and UGC"},
  {"title": "Product Hunt Launch", "description": "Coordinate Product Hunt #1 Product of the Day campaign for tech visibility"}
]'::jsonb, 1),
(2, 'Scale Content & Partnerships', 'Months 7-12', '#EF4444',
'[
  {"title": "YouTube SEO Domination", "description": "Publish 40+ tutorial videos targeting \"how to edit podcast\", \"AI video editing\", \"repurpose content\""},
  {"title": "Podcast Guest Tour", "description": "Appear on 15+ creator economy podcasts (My First Million, Creator Economy, The Colin & Samir Show)"},
  {"title": "Affiliate Partner Program", "description": "Launch 15% recurring commission for creator influencers and agencies"},
  {"title": "Integration Partnerships", "description": "Partner with Riverside.fm, Descript, Buzzsprout for cross-promotion and API integrations"},
  {"title": "TikTok/Reels Virality Campaign", "description": "1-2 viral demos per week showcasing before/after AI edits (target 10M+ monthly views)"}
]'::jsonb, 2),
(3, 'Enterprise & Revenue Acceleration', 'Months 13-24', '#10B981',
'[
  {"title": "Agency & Team Plans", "description": "Launch $499-$999/mo multi-seat plans with white-label options for agencies"},
  {"title": "Creator Marketplace Integration", "description": "Build two-sided marketplace connecting certified creators with brands for sponsored content"},
  {"title": "Conference & Event Presence", "description": "Sponsor Podcast Movement, VidCon, Creator Economy Expo with booth demos"},
  {"title": "Content Marketing Flywheel", "description": "Scale to 8-10 blog posts/week + 6 YouTube videos/week targeting long-tail creator queries"},
  {"title": "International Expansion", "description": "Localize platform for Spanish, Portuguese, French markets (Latin America, Europe, Brazil)"}
]'::jsonb, 3);

COMMENT ON TABLE gtm_market_metrics IS 'Key market metrics and financial targets for GTM dashboard';
COMMENT ON TABLE gtm_market_segments IS 'Target creator segments with market size and opportunity';
COMMENT ON TABLE gtm_geographic_data IS 'Geographic distribution of creators by state';
COMMENT ON TABLE gtm_channels IS 'Marketing channel performance and efficiency data';
COMMENT ON TABLE gtm_phases IS 'GTM strategy phases with detailed action plans';