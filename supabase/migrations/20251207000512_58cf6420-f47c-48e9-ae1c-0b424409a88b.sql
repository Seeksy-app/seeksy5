
-- Newsletter Templates for drag-drop blocks
CREATE TABLE public.newsletter_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  blocks JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Newsletter Ad Placements for tracking ad markers and sponsorships
CREATE TABLE public.newsletter_ad_placements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES public.newsletter_campaigns(id) ON DELETE CASCADE,
  position_index INTEGER NOT NULL,
  placement_type TEXT NOT NULL DEFAULT 'manual', -- 'manual' or 'ai_suggested'
  ad_type TEXT NOT NULL DEFAULT 'cpm', -- 'cpm', 'cpc', 'flat_rate', 'hybrid'
  advertiser_id UUID REFERENCES public.advertisers(id),
  ad_content JSONB,
  cpm_rate NUMERIC(10,4),
  cpc_rate NUMERIC(10,4),
  flat_rate NUMERIC(10,2),
  is_filled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Newsletter Revenue tracking per send
CREATE TABLE public.newsletter_revenue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES public.newsletter_campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  ad_placement_id UUID REFERENCES public.newsletter_ad_placements(id),
  revenue_type TEXT NOT NULL, -- 'cpm', 'cpc', 'flat_rate'
  gross_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  platform_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  creator_share NUMERIC(10,2) NOT NULL DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Newsletter Ad Clicks for CPC tracking
CREATE TABLE public.newsletter_ad_clicks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ad_placement_id UUID REFERENCES public.newsletter_ad_placements(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.newsletter_campaigns(id) ON DELETE CASCADE,
  subscriber_id UUID REFERENCES public.newsletter_subscribers(id),
  clicked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_hash TEXT,
  user_agent TEXT
);

-- Add blocks column to newsletter_campaigns for storing the drag-drop content
ALTER TABLE public.newsletter_campaigns 
ADD COLUMN IF NOT EXISTS blocks JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.newsletter_templates(id),
ADD COLUMN IF NOT EXISTS ai_ad_placement_enabled BOOLEAN DEFAULT false;

-- Enable RLS
ALTER TABLE public.newsletter_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_ad_placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_revenue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_ad_clicks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for newsletter_templates
CREATE POLICY "Users can view their own templates" ON public.newsletter_templates
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own templates" ON public.newsletter_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates" ON public.newsletter_templates
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates" ON public.newsletter_templates
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for newsletter_ad_placements
CREATE POLICY "Users can view ad placements for their campaigns" ON public.newsletter_ad_placements
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM newsletter_campaigns nc WHERE nc.id = campaign_id AND nc.user_id = auth.uid())
  );

CREATE POLICY "Users can manage ad placements for their campaigns" ON public.newsletter_ad_placements
  FOR ALL USING (
    EXISTS (SELECT 1 FROM newsletter_campaigns nc WHERE nc.id = campaign_id AND nc.user_id = auth.uid())
  );

-- RLS Policies for newsletter_revenue
CREATE POLICY "Users can view their own revenue" ON public.newsletter_revenue
  FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for newsletter_ad_clicks (public for tracking)
CREATE POLICY "Ad clicks are insertable" ON public.newsletter_ad_clicks
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view clicks on their campaigns" ON public.newsletter_ad_clicks
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM newsletter_campaigns nc WHERE nc.id = campaign_id AND nc.user_id = auth.uid())
  );

-- Trigger for updated_at
CREATE TRIGGER update_newsletter_templates_updated_at
  BEFORE UPDATE ON public.newsletter_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_newsletter_ad_placements_updated_at
  BEFORE UPDATE ON public.newsletter_ad_placements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
