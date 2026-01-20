-- Create module_tooltips table for CMS-style editing
CREATE TABLE IF NOT EXISTS public.module_tooltips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id TEXT UNIQUE NOT NULL,
  short_description TEXT NOT NULL,
  best_for TEXT NOT NULL,
  unlocks JSONB DEFAULT '[]'::jsonb,
  credit_estimate INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create category_tooltips table
CREATE TABLE IF NOT EXISTS public.category_tooltips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id TEXT UNIQUE NOT NULL,
  purpose TEXT NOT NULL,
  best_for_users TEXT NOT NULL,
  recommended_modules JSONB DEFAULT '[]'::jsonb,
  example_workflows TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create custom_packages table
CREATE TABLE IF NOT EXISTS public.custom_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  modules JSONB DEFAULT '[]'::jsonb,
  estimated_monthly_credits INTEGER DEFAULT 0,
  recommended_bundle TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.module_tooltips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_tooltips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_packages ENABLE ROW LEVEL SECURITY;

-- RLS policies for module_tooltips (public read, admin write)
CREATE POLICY "Anyone can view module tooltips" ON public.module_tooltips FOR SELECT USING (true);
CREATE POLICY "Admins can manage module tooltips" ON public.module_tooltips FOR ALL
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')));

-- RLS policies for category_tooltips (public read, admin write)
CREATE POLICY "Anyone can view category tooltips" ON public.category_tooltips FOR SELECT USING (true);
CREATE POLICY "Admins can manage category tooltips" ON public.category_tooltips FOR ALL
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')));

-- RLS policies for custom_packages
CREATE POLICY "Users can view own packages" ON public.custom_packages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own packages" ON public.custom_packages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own packages" ON public.custom_packages FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own packages" ON public.custom_packages FOR DELETE USING (auth.uid() = user_id);

-- Seed initial module tooltips
INSERT INTO module_tooltips (module_id, short_description, best_for, unlocks, credit_estimate) VALUES
  ('social-connect', 'Connect and sync your social media accounts to import followers and engagement data', 'Influencers managing multiple platforms', '["Import follower data", "Sync engagement metrics", "Track growth"]', 5),
  ('audience-insights', 'Deep analytics on your followers, engagement patterns, and demographics', 'Growth-focused creators', '["Demographic breakdown", "Engagement analytics", "Audience trends"]', 10),
  ('brand-campaigns', 'Apply for sponsorships, manage brand deals, and track campaign performance', 'Influencers managing brand deals', '["Brand deal proposals", "Campaign tracking", "Revenue reporting"]', 15),
  ('studio', 'Professional AI-powered recording studio for podcasts, videos, and livestreams', 'Podcast creators and content producers', '["HD recording", "AI noise removal", "Multi-track editing"]', 50),
  ('podcasts', 'Host and distribute your podcast with RSS feeds and analytics', 'New podcast creators', '["RSS feed generation", "Distribution to platforms", "Episode analytics"]', 20),
  ('media-library', 'Store and organize all your media files securely in the cloud', 'Creators with large content libraries', '["Cloud storage", "File organization", "Quick access"]', 10),
  ('clips-editing', 'AI-powered clip generation and video editing tools', 'Short-form content creators', '["Auto-clip detection", "AI editing", "Multi-format export"]', 30),
  ('contacts', 'Manage your audience database, leads, and subscriber lists', 'Creators building email lists', '["Contact management", "Lead tracking", "Subscriber lists"]', 5),
  ('campaigns', 'Run multi-channel marketing campaigns across email, SMS, and social', 'Marketing-focused creators', '["Email campaigns", "SMS blasts", "Campaign analytics"]', 25),
  ('events', 'Create events, manage RSVPs, and handle ticketing', 'Event organizers and speakers', '["Event creation", "RSVP management", "Ticket sales"]', 15),
  ('my-page', 'Build your personal link-in-bio landing page', 'All creators', '["Custom landing page", "Link management", "Analytics"]', 5),
  ('identity-verification', 'Blockchain-backed voice and face verification for authenticity', 'Professional creators', '["Voice verification", "Face verification", "Blockchain certificate"]', 20)
ON CONFLICT (module_id) DO NOTHING;

-- Seed initial category tooltips
INSERT INTO category_tooltips (category_id, purpose, best_for_users, recommended_modules, example_workflows) VALUES
  ('creator', 'Tools designed to help creators manage their audience, personal brand, and engagement insights', 'New or growing creators who need analytics, audience syncing, and brand deal management', '["social-connect", "audience-insights", "brand-campaigns"]', 'Connect socials → Analyze audience → Apply for brand deals → Track revenue'),
  ('media', 'Create, manage, and publish professional audio, video, and media content', 'Podcasters, video creators, and content producers', '["studio", "podcasts", "clips-editing"]', 'Record in Studio → Edit with AI → Generate clips → Publish to podcast'),
  ('marketing', 'Communication, segmentation, automation, and multi-channel marketing tools', 'Creators with audiences to nurture and grow', '["contacts", "campaigns", "automations"]', 'Import contacts → Create segments → Run campaigns → Track results'),
  ('business', 'Professional tools for managing clients, projects, tasks, and events', 'Event organizers, speakers, and professional creators', '["events", "proposals", "tasks"]', 'Create event → Build proposal → Manage tasks → Track completion'),
  ('identity', 'Everything related to who you are and how you show up publicly', 'Creators building their personal brand', '["my-page", "identity-verification"]', 'Verify identity → Build My Page → Share link → Track visitors'),
  ('integrations', 'Platform and third-party data connections to sync your workflow', 'Tech-savvy creators who use multiple tools', '["social-connect", "calendar-integrations"]', 'Connect platforms → Sync data → Automate workflows')
ON CONFLICT (category_id) DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_custom_packages_user_id ON public.custom_packages(user_id);
CREATE INDEX IF NOT EXISTS idx_module_tooltips_module_id ON public.module_tooltips(module_id);
CREATE INDEX IF NOT EXISTS idx_category_tooltips_category_id ON public.category_tooltips(category_id);