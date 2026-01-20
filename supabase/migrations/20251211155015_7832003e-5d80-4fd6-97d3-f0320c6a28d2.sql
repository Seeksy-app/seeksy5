-- CampaignStaff.ai Database Tables

-- Candidates table
CREATE TABLE public.campaign_candidates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  preferred_name TEXT,
  office TEXT,
  jurisdiction TEXT,
  election_date DATE,
  party_or_affiliation TEXT,
  campaign_status TEXT DEFAULT 'exploring' CHECK (campaign_status IN ('exploring', 'announced', 'active', 'runoff', 'completed')),
  top_issues TEXT[],
  timezone TEXT DEFAULT 'America/New_York',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Campaign Plans table
CREATE TABLE public.campaign_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID REFERENCES public.campaign_candidates(id) ON DELETE CASCADE,
  high_level_strategy TEXT,
  key_messages TEXT[],
  target_voter_segments TEXT[],
  fundraising_goal NUMERIC(12,2),
  daily_action_items JSONB DEFAULT '[]',
  ai_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Content Items table
CREATE TABLE public.campaign_content_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID REFERENCES public.campaign_candidates(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('speech', 'email', 'social_post', 'video_script', 'fundraising', 'volunteer')),
  title TEXT NOT NULL,
  body TEXT,
  channel TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Campaign Events table
CREATE TABLE public.campaign_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID REFERENCES public.campaign_candidates(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  event_type TEXT DEFAULT 'town_hall',
  datetime TIMESTAMP WITH TIME ZONE,
  location TEXT,
  is_virtual BOOLEAN DEFAULT false,
  virtual_link TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Campaign Sites table
CREATE TABLE public.campaign_sites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID REFERENCES public.campaign_candidates(id) ON DELETE CASCADE,
  slug TEXT UNIQUE,
  brand_colors JSONB DEFAULT '{"primary": "#1e3a5f", "accent": "#d4af37"}',
  logo_url TEXT,
  slogan TEXT,
  about_copy TEXT,
  issues_copy TEXT,
  donate_url TEXT,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Campaign Chat Messages table
CREATE TABLE public.campaign_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID REFERENCES public.campaign_candidates(id) ON DELETE CASCADE,
  session_id TEXT,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.campaign_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for campaign_candidates
CREATE POLICY "Users can view their own candidates" ON public.campaign_candidates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own candidates" ON public.campaign_candidates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own candidates" ON public.campaign_candidates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own candidates" ON public.campaign_candidates FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for campaign_plans
CREATE POLICY "Users can view their own plans" ON public.campaign_plans FOR SELECT USING (EXISTS (SELECT 1 FROM campaign_candidates WHERE id = candidate_id AND user_id = auth.uid()));
CREATE POLICY "Users can create their own plans" ON public.campaign_plans FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM campaign_candidates WHERE id = candidate_id AND user_id = auth.uid()));
CREATE POLICY "Users can update their own plans" ON public.campaign_plans FOR UPDATE USING (EXISTS (SELECT 1 FROM campaign_candidates WHERE id = candidate_id AND user_id = auth.uid()));
CREATE POLICY "Users can delete their own plans" ON public.campaign_plans FOR DELETE USING (EXISTS (SELECT 1 FROM campaign_candidates WHERE id = candidate_id AND user_id = auth.uid()));

-- RLS Policies for campaign_content_items
CREATE POLICY "Users can view their own content" ON public.campaign_content_items FOR SELECT USING (EXISTS (SELECT 1 FROM campaign_candidates WHERE id = candidate_id AND user_id = auth.uid()));
CREATE POLICY "Users can create their own content" ON public.campaign_content_items FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM campaign_candidates WHERE id = candidate_id AND user_id = auth.uid()));
CREATE POLICY "Users can update their own content" ON public.campaign_content_items FOR UPDATE USING (EXISTS (SELECT 1 FROM campaign_candidates WHERE id = candidate_id AND user_id = auth.uid()));
CREATE POLICY "Users can delete their own content" ON public.campaign_content_items FOR DELETE USING (EXISTS (SELECT 1 FROM campaign_candidates WHERE id = candidate_id AND user_id = auth.uid()));

-- RLS Policies for campaign_events
CREATE POLICY "Users can view their own events" ON public.campaign_events FOR SELECT USING (EXISTS (SELECT 1 FROM campaign_candidates WHERE id = candidate_id AND user_id = auth.uid()));
CREATE POLICY "Users can create their own events" ON public.campaign_events FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM campaign_candidates WHERE id = candidate_id AND user_id = auth.uid()));
CREATE POLICY "Users can update their own events" ON public.campaign_events FOR UPDATE USING (EXISTS (SELECT 1 FROM campaign_candidates WHERE id = candidate_id AND user_id = auth.uid()));
CREATE POLICY "Users can delete their own events" ON public.campaign_events FOR DELETE USING (EXISTS (SELECT 1 FROM campaign_candidates WHERE id = candidate_id AND user_id = auth.uid()));

-- RLS Policies for campaign_sites
CREATE POLICY "Users can view their own sites" ON public.campaign_sites FOR SELECT USING (EXISTS (SELECT 1 FROM campaign_candidates WHERE id = candidate_id AND user_id = auth.uid()));
CREATE POLICY "Public can view published sites" ON public.campaign_sites FOR SELECT USING (is_published = true);
CREATE POLICY "Users can create their own sites" ON public.campaign_sites FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM campaign_candidates WHERE id = candidate_id AND user_id = auth.uid()));
CREATE POLICY "Users can update their own sites" ON public.campaign_sites FOR UPDATE USING (EXISTS (SELECT 1 FROM campaign_candidates WHERE id = candidate_id AND user_id = auth.uid()));
CREATE POLICY "Users can delete their own sites" ON public.campaign_sites FOR DELETE USING (EXISTS (SELECT 1 FROM campaign_candidates WHERE id = candidate_id AND user_id = auth.uid()));

-- RLS Policies for campaign_chat_messages
CREATE POLICY "Users can view their own messages" ON public.campaign_chat_messages FOR SELECT USING (EXISTS (SELECT 1 FROM campaign_candidates WHERE id = candidate_id AND user_id = auth.uid()));
CREATE POLICY "Users can create their own messages" ON public.campaign_chat_messages FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM campaign_candidates WHERE id = candidate_id AND user_id = auth.uid()));

-- Triggers for updated_at
CREATE TRIGGER update_campaign_candidates_updated_at BEFORE UPDATE ON public.campaign_candidates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_campaign_plans_updated_at BEFORE UPDATE ON public.campaign_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_campaign_content_items_updated_at BEFORE UPDATE ON public.campaign_content_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_campaign_events_updated_at BEFORE UPDATE ON public.campaign_events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_campaign_sites_updated_at BEFORE UPDATE ON public.campaign_sites FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed CampaignStaff as a Sales Opportunity
INSERT INTO public.sales_opportunities (name, slug, tagline, description, demo_url, status)
VALUES (
  'CampaignStaff.ai',
  'campaignstaff',
  'AI-Powered Campaign Command Center',
  'Turn Seeksy/Civic features into an AI-powered campaign command center for local, state, and federal candidates. Includes AI Campaign Manager, Speechwriter, Digital Director, and Field & Fundraising tools.',
  '/campaigns',
  'active'
) ON CONFLICT (slug) DO NOTHING;