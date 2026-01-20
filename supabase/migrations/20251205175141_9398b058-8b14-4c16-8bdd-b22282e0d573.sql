-- Add additional fields to lead_magnets table for enhanced tracking
ALTER TABLE public.lead_magnets ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE public.lead_magnets ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.lead_magnets ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE public.lead_magnets ADD COLUMN IF NOT EXISTS conversion_rate DECIMAL DEFAULT 0;
ALTER TABLE public.lead_magnets ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Create lead_magnet_analytics table for detailed tracking
CREATE TABLE IF NOT EXISTS public.lead_magnet_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_magnet_id UUID REFERENCES public.lead_magnets(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'view', 'download', 'email_sent', 'email_opened', 'email_clicked'
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  referrer TEXT,
  user_agent TEXT,
  ip_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for analytics queries
CREATE INDEX IF NOT EXISTS idx_lead_magnet_analytics_lead_magnet_id ON public.lead_magnet_analytics(lead_magnet_id);
CREATE INDEX IF NOT EXISTS idx_lead_magnet_analytics_event_type ON public.lead_magnet_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_lead_magnet_analytics_created_at ON public.lead_magnet_analytics(created_at);

-- Enable RLS
ALTER TABLE public.lead_magnet_analytics ENABLE ROW LEVEL SECURITY;

-- RLS policies for analytics
CREATE POLICY "Admins can view all analytics" ON public.lead_magnet_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Anyone can insert analytics events" ON public.lead_magnet_analytics
  FOR INSERT WITH CHECK (true);

-- Insert the three default lead magnets
INSERT INTO public.lead_magnets (title, description, slug, storage_path, audience_roles, bullets, is_active, category, tags, thumbnail_url)
VALUES 
  (
    'Creator Growth Blueprint',
    'A step-by-step framework for creators to grow audience, scale monetization, and optimize multi-platform distribution.',
    'creator-growth-blueprint',
    'creator-growth-blueprint.pdf',
    ARRAY['podcaster', 'influencer'],
    ARRAY['Proven strategies to grow your audience across platforms', 'Monetization frameworks used by top creators', 'Multi-platform distribution optimization techniques', 'AI-powered content repurposing strategies', 'Analytics and metrics that actually matter'],
    true,
    'Creators',
    ARRAY['Creator', 'Growth', 'Monetization'],
    NULL
  ),
  (
    'Brand ROI Advertising Playbook',
    'A data-driven guide for brands on tracking influencer campaigns, attribution, ROI forecasting, and media optimization.',
    'brand-roi-playbook',
    'brand-roi-playbook.pdf',
    ARRAY['advertiser', 'agency'],
    ARRAY['Complete attribution tracking setup guide', 'ROI forecasting models and templates', 'Influencer campaign measurement frameworks', 'Media mix optimization strategies', 'Real-world case studies with metrics'],
    true,
    'Brands & Agencies',
    ARRAY['Advertising', 'ROI', 'Brands'],
    NULL
  ),
  (
    'Event Growth & Engagement Kit',
    'A toolkit for event planners to grow attendance, increase engagement, and drive post-event lead generation.',
    'event-growth-kit',
    'event-growth-kit.pdf',
    ARRAY['event_creator', 'business'],
    ARRAY['Pre-event promotion playbook', 'Engagement tactics for virtual & hybrid events', 'Post-event lead nurturing sequences', 'Attendee experience optimization', 'Sponsorship value maximization'],
    true,
    'Events',
    ARRAY['Events', 'Engagement', 'Lead Gen'],
    NULL
  )
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  audience_roles = EXCLUDED.audience_roles,
  bullets = EXCLUDED.bullets,
  category = EXCLUDED.category,
  tags = EXCLUDED.tags;