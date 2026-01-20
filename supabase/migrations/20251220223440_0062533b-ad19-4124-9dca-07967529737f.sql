-- ================================================
-- SEO Manager Tables
-- ================================================

-- Table: seo_pages - One row per route/page managed by admin
CREATE TABLE IF NOT EXISTS public.seo_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid, -- For future multi-project support
  route_path text NOT NULL UNIQUE,
  page_name text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  meta_title text,
  meta_description text,
  canonical_url text,
  robots text DEFAULT 'index, follow',
  h1_override text,
  og_title text,
  og_description text,
  og_image_url text,
  og_image_alt text,
  twitter_card_type text DEFAULT 'summary_large_image',
  twitter_title text,
  twitter_description text,
  twitter_image_url text,
  twitter_image_alt text,
  json_ld text,
  score integer NOT NULL DEFAULT 0,
  score_breakdown jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Table: seo_assets - Track uploaded OG/Twitter images
CREATE TABLE IF NOT EXISTS public.seo_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket text NOT NULL DEFAULT 'seo-assets',
  path text NOT NULL UNIQUE,
  public_url text NOT NULL,
  alt_text text,
  width integer,
  height integer,
  content_type text,
  size_bytes integer,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for seo_pages
CREATE INDEX IF NOT EXISTS idx_seo_pages_status ON public.seo_pages(status);
CREATE INDEX IF NOT EXISTS idx_seo_pages_updated_at ON public.seo_pages(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_seo_pages_search ON public.seo_pages 
  USING gin(to_tsvector('english', coalesce(page_name, '') || ' ' || coalesce(route_path, '') || ' ' || coalesce(meta_title, '')));

-- Index for seo_assets
CREATE INDEX IF NOT EXISTS idx_seo_assets_created_at ON public.seo_assets(created_at DESC);

-- Trigger: Auto-update updated_at on seo_pages
CREATE OR REPLACE FUNCTION public.seo_pages_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS seo_pages_updated_at_trigger ON public.seo_pages;
CREATE TRIGGER seo_pages_updated_at_trigger
  BEFORE UPDATE ON public.seo_pages
  FOR EACH ROW
  EXECUTE FUNCTION public.seo_pages_set_updated_at();

-- Enable RLS
ALTER TABLE public.seo_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_assets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for seo_pages (admin only)
CREATE POLICY "Admins can view seo_pages"
  ON public.seo_pages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can insert seo_pages"
  ON public.seo_pages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update seo_pages"
  ON public.seo_pages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can delete seo_pages"
  ON public.seo_pages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin')
    )
  );

-- RLS Policies for seo_assets (admin only)
CREATE POLICY "Admins can view seo_assets"
  ON public.seo_assets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can insert seo_assets"
  ON public.seo_assets FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update seo_assets"
  ON public.seo_assets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can delete seo_assets"
  ON public.seo_assets FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin')
    )
  );

-- Storage bucket for SEO assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('seo-assets', 'seo-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies for seo-assets bucket
CREATE POLICY "Admins can upload seo assets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'seo-assets'
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update seo assets"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'seo-assets'
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can delete seo assets"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'seo-assets'
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Anyone can view seo assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'seo-assets');