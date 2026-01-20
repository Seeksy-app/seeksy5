-- Create ui_screenshots table for Page Scraper system
CREATE TABLE IF NOT EXISTS public.ui_screenshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_name TEXT NOT NULL,
  url TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('advertiser-tools', 'creator-tools', 'internal', 'external', 'onboarding')),
  screenshot_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create index for fast category filtering
CREATE INDEX IF NOT EXISTS idx_ui_screenshots_category ON public.ui_screenshots(category);
CREATE INDEX IF NOT EXISTS idx_ui_screenshots_created_at ON public.ui_screenshots(created_at DESC);

-- Enable RLS
ALTER TABLE public.ui_screenshots ENABLE ROW LEVEL SECURITY;

-- Admin users can do everything
CREATE POLICY "Admins can manage screenshots"
  ON public.ui_screenshots
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- All authenticated users can view screenshots
CREATE POLICY "Authenticated users can view screenshots"
  ON public.ui_screenshots
  FOR SELECT
  TO authenticated
  USING (true);