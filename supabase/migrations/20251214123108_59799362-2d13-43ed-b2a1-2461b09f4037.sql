-- Marketing Campaigns table
CREATE TABLE public.marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sent')),
  subject TEXT,
  content TEXT,
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Campaign to Lists junction table
CREATE TABLE public.campaign_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.marketing_campaigns(id) ON DELETE CASCADE,
  list_id UUID NOT NULL REFERENCES public.subscriber_lists(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, list_id)
);

-- CTA Definitions table
CREATE TABLE public.cta_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  event_name TEXT NOT NULL UNIQUE,
  auto_lists TEXT[] DEFAULT '{}',
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cta_definitions ENABLE ROW LEVEL SECURITY;

-- RLS policies for marketing_campaigns
CREATE POLICY "Admin full access to marketing_campaigns"
  ON public.marketing_campaigns FOR ALL
  USING (public.user_has_any_role(auth.uid(), ARRAY['admin', 'super_admin']));

-- RLS policies for campaign_lists
CREATE POLICY "Admin full access to campaign_lists"
  ON public.campaign_lists FOR ALL
  USING (public.user_has_any_role(auth.uid(), ARRAY['admin', 'super_admin']));

-- RLS policies for cta_definitions
CREATE POLICY "Admin full access to cta_definitions"
  ON public.cta_definitions FOR ALL
  USING (public.user_has_any_role(auth.uid(), ARRAY['admin', 'super_admin']));

CREATE POLICY "Public read cta_definitions"
  ON public.cta_definitions FOR SELECT
  USING (is_active = true);

-- Seed default CTAs
INSERT INTO public.cta_definitions (name, event_name, auto_lists, description) VALUES
  ('Blog Newsletter Gate', 'blog_subscribe', ARRAY['blog_newsletter'], 'Subscription gate on blog articles'),
  ('Homepage Get Started', 'get_started_free', ARRAY['general_newsletter'], 'Get Started Free CTA on homepage'),
  ('Creator Signup', 'creator_signup', ARRAY['creators', 'general_newsletter'], 'Creator account registration');

-- Updated at trigger
CREATE TRIGGER update_marketing_campaigns_updated_at
  BEFORE UPDATE ON public.marketing_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cta_definitions_updated_at
  BEFORE UPDATE ON public.cta_definitions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();