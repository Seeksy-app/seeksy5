-- Landing Pages System
-- Tables for creator and guest landing pages

-- 1. Main landing pages table
CREATE TABLE IF NOT EXISTS public.landing_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  page_type TEXT NOT NULL CHECK (page_type IN ('creator', 'guest', 'show', 'custom')),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  subtitle TEXT,
  hero_variant_id UUID,
  theme TEXT DEFAULT 'light',
  primary_color TEXT,
  accent_color TEXT,
  bio TEXT,
  avatar_url TEXT,
  main_player_url TEXT,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Social links for landing pages
CREATE TABLE IF NOT EXISTS public.landing_social_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landing_page_id UUID NOT NULL REFERENCES public.landing_pages(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('twitter', 'linkedin', 'instagram', 'youtube', 'website', 'newsletter', 'tiktok', 'other')),
  label TEXT,
  url TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Guest appearances (podcast playlist)
CREATE TABLE IF NOT EXISTS public.guest_appearances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landing_page_id UUID NOT NULL REFERENCES public.landing_pages(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  show_name TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('youtube', 'spotify', 'apple_podcasts', 'rss_audio', 'other')),
  episode_url TEXT NOT NULL,
  embed_url TEXT,
  published_at TIMESTAMPTZ,
  duration_seconds INT,
  is_featured BOOLEAN DEFAULT false,
  tags TEXT[],
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. CTAs for landing pages
CREATE TABLE IF NOT EXISTS public.landing_ctas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landing_page_id UUID NOT NULL REFERENCES public.landing_pages(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  cta_type TEXT DEFAULT 'primary' CHECK (cta_type IN ('primary', 'secondary', 'outline', 'ghost')),
  icon TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_social_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_appearances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_ctas ENABLE ROW LEVEL SECURITY;

-- RLS Policies for landing_pages
CREATE POLICY "Anyone can view published landing pages"
  ON public.landing_pages FOR SELECT
  USING (is_published = true);

CREATE POLICY "Creators can view their own landing pages"
  ON public.landing_pages FOR SELECT
  USING (auth.uid() = owner_user_id);

CREATE POLICY "Creators can create their own landing pages"
  ON public.landing_pages FOR INSERT
  WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Creators can update their own landing pages"
  ON public.landing_pages FOR UPDATE
  USING (auth.uid() = owner_user_id);

CREATE POLICY "Admins can manage all landing pages"
  ON public.landing_pages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- RLS Policies for landing_social_links
CREATE POLICY "Anyone can view social links for published pages"
  ON public.landing_social_links FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.landing_pages
      WHERE id = landing_social_links.landing_page_id
      AND is_published = true
    )
  );

CREATE POLICY "Creators can manage their own social links"
  ON public.landing_social_links FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.landing_pages
      WHERE id = landing_social_links.landing_page_id
      AND owner_user_id = auth.uid()
    )
  );

-- RLS Policies for guest_appearances
CREATE POLICY "Anyone can view appearances for published pages"
  ON public.guest_appearances FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.landing_pages
      WHERE id = guest_appearances.landing_page_id
      AND is_published = true
    )
  );

CREATE POLICY "Creators can manage their own appearances"
  ON public.guest_appearances FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.landing_pages
      WHERE id = guest_appearances.landing_page_id
      AND owner_user_id = auth.uid()
    )
  );

-- RLS Policies for landing_ctas
CREATE POLICY "Anyone can view CTAs for published pages"
  ON public.landing_ctas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.landing_pages
      WHERE id = landing_ctas.landing_page_id
      AND is_published = true
    )
  );

CREATE POLICY "Creators can manage their own CTAs"
  ON public.landing_ctas FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.landing_pages
      WHERE id = landing_ctas.landing_page_id
      AND owner_user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX idx_landing_pages_slug ON public.landing_pages(slug);
CREATE INDEX idx_landing_pages_owner ON public.landing_pages(owner_user_id);
CREATE INDEX idx_landing_pages_published ON public.landing_pages(is_published);
CREATE INDEX idx_guest_appearances_landing_page ON public.guest_appearances(landing_page_id);
CREATE INDEX idx_landing_social_links_landing_page ON public.landing_social_links(landing_page_id);
CREATE INDEX idx_landing_ctas_landing_page ON public.landing_ctas(landing_page_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_landing_pages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER landing_pages_updated_at
  BEFORE UPDATE ON public.landing_pages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_landing_pages_updated_at();

CREATE TRIGGER guest_appearances_updated_at
  BEFORE UPDATE ON public.guest_appearances
  FOR EACH ROW
  EXECUTE FUNCTION public.update_landing_pages_updated_at();