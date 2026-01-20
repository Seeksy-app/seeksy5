-- Investor Links table for sharing board content
CREATE TABLE public.investor_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  passcode TEXT NOT NULL,
  investor_name TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  data_mode TEXT NOT NULL DEFAULT 'demo' CHECK (data_mode IN ('demo', 'real')),
  scope TEXT[] NOT NULL DEFAULT ARRAY['dashboard', 'business-model', 'gtm', 'forecasts', 'videos', 'documents'],
  allow_ai BOOLEAN DEFAULT true,
  allow_pdf_export BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
  last_viewed_at TIMESTAMP WITH TIME ZONE,
  total_views INTEGER DEFAULT 0,
  tabs_viewed TEXT[] DEFAULT ARRAY[]::TEXT[]
);

-- Investor link activity log
CREATE TABLE public.investor_link_activity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  link_id UUID REFERENCES public.investor_links(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  tab_viewed TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.investor_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investor_link_activity ENABLE ROW LEVEL SECURITY;

-- RLS policies for investor_links
CREATE POLICY "Admins can manage investor links" ON public.investor_links
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin', 'board_member'))
  );

CREATE POLICY "Public can view active links by token" ON public.investor_links
  FOR SELECT USING (status = 'active');

-- RLS policies for activity log
CREATE POLICY "Admins can view activity" ON public.investor_link_activity
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin', 'board_member'))
  );

CREATE POLICY "Anyone can insert activity" ON public.investor_link_activity
  FOR INSERT WITH CHECK (true);

-- Create indexes
CREATE INDEX idx_investor_links_token ON public.investor_links(token);
CREATE INDEX idx_investor_links_status ON public.investor_links(status);
CREATE INDEX idx_investor_link_activity_link_id ON public.investor_link_activity(link_id);