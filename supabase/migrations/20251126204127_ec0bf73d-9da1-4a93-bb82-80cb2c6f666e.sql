-- Create table for AI persona videos
CREATE TABLE IF NOT EXISTS public.ai_personas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL, -- 'creator', 'advertiser', 'agency'
  tagline TEXT NOT NULL,
  description TEXT NOT NULL,
  video_url TEXT NOT NULL, -- URL to HeyGen/D-ID video
  thumbnail_url TEXT, -- Static thumbnail before hover
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_personas ENABLE ROW LEVEL SECURITY;

-- Public read access for personas
CREATE POLICY "Anyone can view active personas"
  ON public.ai_personas
  FOR SELECT
  USING (is_active = true);

-- Admin write access
CREATE POLICY "Admins can manage personas"
  ON public.ai_personas
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin')
    )
  );

-- Create index for ordering
CREATE INDEX idx_ai_personas_order ON public.ai_personas(display_order, created_at);