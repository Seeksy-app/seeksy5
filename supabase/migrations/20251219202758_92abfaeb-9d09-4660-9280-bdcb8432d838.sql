-- Create video page settings table for controlling the /videos page
CREATE TABLE public.video_page_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_key TEXT UNIQUE NOT NULL DEFAULT 'main',
  page_title TEXT NOT NULL DEFAULT 'Platform Videos',
  page_subtitle TEXT DEFAULT 'Explore our collection of demo videos showcasing the Seeksy creator platform.',
  header_button_text TEXT DEFAULT 'Platform Overview',
  header_button_link TEXT DEFAULT '/platform',
  show_featured_section BOOLEAN DEFAULT true,
  show_categories BOOLEAN DEFAULT true,
  is_published BOOLEAN DEFAULT true,
  custom_css TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create video categories table for controlling category display
CREATE TABLE public.video_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.video_page_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_categories ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can view video page settings"
ON public.video_page_settings FOR SELECT USING (true);

CREATE POLICY "Anyone can view video categories"
ON public.video_categories FOR SELECT USING (true);

-- Admin write access
CREATE POLICY "Admins can manage video page settings"
ON public.video_page_settings FOR ALL
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')));

CREATE POLICY "Admins can manage video categories"
ON public.video_categories FOR ALL
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')));

-- Insert default settings
INSERT INTO public.video_page_settings (page_key, page_title, page_subtitle, header_button_text, header_button_link)
VALUES ('main', 'Platform Videos', 'Explore our collection of demo videos showcasing the Seeksy creator platform.', 'Platform Overview', '/platform');

-- Insert existing categories
INSERT INTO public.video_categories (name, display_order, is_visible)
VALUES 
  ('Platform Overview', 1, true),
  ('Onboarding', 2, true),
  ('Monetization', 3, true)
ON CONFLICT (name) DO NOTHING;

-- Triggers for updated_at
CREATE TRIGGER update_video_page_settings_updated_at
  BEFORE UPDATE ON public.video_page_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_video_categories_updated_at
  BEFORE UPDATE ON public.video_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();