-- Create sales opportunities table for investor pages
CREATE TABLE public.sales_opportunities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  tagline TEXT,
  description TEXT,
  video_url TEXT,
  demo_url TEXT,
  site_url TEXT,
  thumbnail_url TEXT,
  
  -- Proforma fields
  target_market TEXT,
  market_size TEXT,
  revenue_model TEXT,
  projected_revenue_year1 NUMERIC,
  projected_revenue_year2 NUMERIC,
  projected_revenue_year3 NUMERIC,
  key_metrics JSONB DEFAULT '[]'::jsonb,
  competitive_advantage TEXT,
  
  -- Status and visibility
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sales_opportunities ENABLE ROW LEVEL SECURITY;

-- Public read access for active opportunities (investor pages are public)
CREATE POLICY "Active opportunities are publicly viewable"
  ON public.sales_opportunities
  FOR SELECT
  USING (status = 'active');

-- Board members and admins can manage opportunities
CREATE POLICY "Admins can manage opportunities"
  ON public.sales_opportunities
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('super_admin', 'platform_owner', 'admin', 'board_member')
    )
  );

-- Create updated_at trigger
CREATE TRIGGER update_sales_opportunities_updated_at
  BEFORE UPDATE ON public.sales_opportunities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed initial opportunities
INSERT INTO public.sales_opportunities (
  slug,
  name,
  tagline,
  description,
  status,
  is_featured,
  display_order,
  target_market,
  market_size,
  revenue_model,
  projected_revenue_year1,
  projected_revenue_year2,
  projected_revenue_year3,
  competitive_advantage
) VALUES (
  'veteran-calculators',
  'Veteran Calculators',
  'Federal Benefits Calculators for Military Veterans & Federal Employees',
  'A comprehensive suite of federal employee benefits calculators including Military Buy-Back, MRA (Minimum Retirement Age), and Sick Leave calculators. Helps veterans and federal employees maximize their retirement benefits.',
  'active',
  true,
  1,
  'Federal Employees & Military Veterans',
  '2.1M federal employees + 18M veterans',
  'Lead generation for financial advisors, subscription for advanced features',
  150000,
  450000,
  1200000,
  'First-to-market comprehensive calculator suite with lead capture integration'
),
(
  'event-crunch',
  'Event Crunch',
  'AI-Powered Event Management & Analytics Platform',
  'Complete event management platform with AI-powered attendee matching, sponsor ROI tracking, and real-time engagement analytics.',
  'active',
  true,
  2,
  'Event Organizers, Conference Planners, Corporate Events',
  '$1.1T global events industry',
  'SaaS subscription + transaction fees on ticket sales',
  200000,
  600000,
  1500000,
  'AI-driven attendee matching and sponsor ROI analytics not available in competitors'
),
(
  'vpa',
  'VPA (Virtual Production Assistant)',
  'AI-Powered Content Production & Editing Platform',
  'End-to-end virtual production assistant for creators, podcasters, and video producers. Automates editing, transcription, and content repurposing.',
  'active',
  true,
  3,
  'Content Creators, Podcasters, Video Producers',
  '50M+ content creators globally',
  'Usage-based AI credits + Pro subscription tiers',
  300000,
  900000,
  2500000,
  'Integrated voice certification and content protection built-in'
);