-- Admin Share Pages table
CREATE TABLE public.admin_share_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  password_hash TEXT, -- bcrypt hash of password
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  branding_logo_url TEXT,
  branding_color TEXT DEFAULT '#2C6BED',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Share page content blocks
CREATE TABLE public.admin_share_page_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID NOT NULL REFERENCES public.admin_share_pages(id) ON DELETE CASCADE,
  block_type TEXT NOT NULL, -- 'video', 'document', 'text', 'metrics', 'timeline', 'team'
  title TEXT,
  content JSONB NOT NULL DEFAULT '{}',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Access logs for tracking views
CREATE TABLE public.admin_share_page_access_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID NOT NULL REFERENCES public.admin_share_pages(id) ON DELETE CASCADE,
  accessed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_hash TEXT,
  user_agent TEXT
);

-- Enable RLS
ALTER TABLE public.admin_share_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_share_page_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_share_page_access_logs ENABLE ROW LEVEL SECURITY;

-- Admin policies
CREATE POLICY "Admins can manage share pages" ON public.admin_share_pages
  FOR ALL USING (public.is_adm());

CREATE POLICY "Admins can manage share page blocks" ON public.admin_share_page_blocks
  FOR ALL USING (public.is_adm());

CREATE POLICY "Admins can view access logs" ON public.admin_share_page_access_logs
  FOR SELECT USING (public.is_adm());

-- Public read for active, non-expired pages (password checked in app)
CREATE POLICY "Public can view active pages" ON public.admin_share_pages
  FOR SELECT USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

CREATE POLICY "Public can view blocks of accessible pages" ON public.admin_share_page_blocks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admin_share_pages 
      WHERE id = page_id 
      AND is_active = true 
      AND (expires_at IS NULL OR expires_at > now())
    )
  );

-- Public can insert access logs
CREATE POLICY "Public can log access" ON public.admin_share_page_access_logs
  FOR INSERT WITH CHECK (true);

-- Indexes
CREATE INDEX idx_share_pages_slug ON public.admin_share_pages(slug);
CREATE INDEX idx_share_pages_active ON public.admin_share_pages(is_active, expires_at);
CREATE INDEX idx_share_page_blocks_page ON public.admin_share_page_blocks(page_id, display_order);

-- Updated at trigger
CREATE TRIGGER update_admin_share_pages_updated_at
  BEFORE UPDATE ON public.admin_share_pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_admin_share_page_blocks_updated_at
  BEFORE UPDATE ON public.admin_share_page_blocks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();