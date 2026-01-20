-- =====================================================
-- Google Analytics + GSC Integration Tables
-- P2.3: Google Search Console + GA4 Integrations
-- =====================================================

-- Table 1: google_connections - Per-workspace OAuth tokens
CREATE TABLE public.google_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  provider TEXT NOT NULL DEFAULT 'google',
  enabled_products JSONB NOT NULL DEFAULT '[]'::jsonb,
  google_account_email TEXT,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT google_connections_workspace_provider_unique UNIQUE (workspace_id, provider)
);

-- Table 2: gsc_sites - Cached GSC sites/properties
CREATE TABLE public.gsc_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  site_url TEXT NOT NULL,
  permission_level TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT gsc_sites_workspace_site_unique UNIQUE (workspace_id, site_url)
);
CREATE INDEX idx_gsc_sites_workspace ON public.gsc_sites(workspace_id);

-- Table 3: ga4_properties - Cached GA4 properties
CREATE TABLE public.ga4_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  property_id TEXT NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ga4_properties_workspace_property_unique UNIQUE (workspace_id, property_id)
);
CREATE INDEX idx_ga4_properties_workspace ON public.ga4_properties(workspace_id);

-- Table 4: workspace_analytics_settings - Selected GSC/GA4 per workspace
CREATE TABLE public.workspace_analytics_settings (
  workspace_id UUID PRIMARY KEY,
  gsc_site_url TEXT,
  ga4_property_id TEXT,
  sync_enabled BOOLEAN NOT NULL DEFAULT true,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table 5: gsc_page_daily - Daily page-level GSC metrics
CREATE TABLE public.gsc_page_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  date DATE NOT NULL,
  page TEXT NOT NULL,
  clicks INTEGER NOT NULL DEFAULT 0,
  impressions INTEGER NOT NULL DEFAULT 0,
  ctr NUMERIC,
  position NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT gsc_page_daily_unique UNIQUE (workspace_id, date, page)
);
CREATE INDEX idx_gsc_page_daily_workspace_page ON public.gsc_page_daily(workspace_id, page);

-- Table 6: ga4_page_daily - Daily page-level GA4 metrics
CREATE TABLE public.ga4_page_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  date DATE NOT NULL,
  page_path TEXT NOT NULL,
  sessions INTEGER NOT NULL DEFAULT 0,
  engagement_rate NUMERIC,
  avg_engagement_time NUMERIC,
  conversions NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ga4_page_daily_unique UNIQUE (workspace_id, date, page_path)
);
CREATE INDEX idx_ga4_page_daily_workspace_page ON public.ga4_page_daily(workspace_id, page_path);

-- Enable RLS on all tables
ALTER TABLE public.google_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gsc_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ga4_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_analytics_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gsc_page_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ga4_page_daily ENABLE ROW LEVEL SECURITY;

-- Admin-only RLS policies for google_connections
CREATE POLICY "Admin can view google_connections"
  ON public.google_connections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admin can insert google_connections"
  ON public.google_connections FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admin can update google_connections"
  ON public.google_connections FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admin can delete google_connections"
  ON public.google_connections FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Admin-only RLS policies for gsc_sites
CREATE POLICY "Admin can view gsc_sites"
  ON public.gsc_sites FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admin can insert gsc_sites"
  ON public.gsc_sites FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admin can update gsc_sites"
  ON public.gsc_sites FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admin can delete gsc_sites"
  ON public.gsc_sites FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Admin-only RLS policies for ga4_properties
CREATE POLICY "Admin can view ga4_properties"
  ON public.ga4_properties FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admin can insert ga4_properties"
  ON public.ga4_properties FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admin can update ga4_properties"
  ON public.ga4_properties FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admin can delete ga4_properties"
  ON public.ga4_properties FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Admin-only RLS policies for workspace_analytics_settings
CREATE POLICY "Admin can view workspace_analytics_settings"
  ON public.workspace_analytics_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admin can insert workspace_analytics_settings"
  ON public.workspace_analytics_settings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admin can update workspace_analytics_settings"
  ON public.workspace_analytics_settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admin can delete workspace_analytics_settings"
  ON public.workspace_analytics_settings FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Admin-only RLS policies for gsc_page_daily
CREATE POLICY "Admin can view gsc_page_daily"
  ON public.gsc_page_daily FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admin can insert gsc_page_daily"
  ON public.gsc_page_daily FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admin can update gsc_page_daily"
  ON public.gsc_page_daily FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admin can delete gsc_page_daily"
  ON public.gsc_page_daily FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Admin-only RLS policies for ga4_page_daily
CREATE POLICY "Admin can view ga4_page_daily"
  ON public.ga4_page_daily FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admin can insert ga4_page_daily"
  ON public.ga4_page_daily FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admin can update ga4_page_daily"
  ON public.ga4_page_daily FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admin can delete ga4_page_daily"
  ON public.ga4_page_daily FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Update triggers for updated_at columns
CREATE TRIGGER update_google_connections_updated_at
  BEFORE UPDATE ON public.google_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workspace_analytics_settings_updated_at
  BEFORE UPDATE ON public.workspace_analytics_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();