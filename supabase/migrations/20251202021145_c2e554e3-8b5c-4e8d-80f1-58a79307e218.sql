-- Create demo_videos table for investor presentation videos
CREATE TABLE IF NOT EXISTS public.demo_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('Creator Tools', 'Advertiser Tools', 'Monetization', 'Onboarding', 'AI Features', 'Platform Overview')),
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  order_index INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create index for ordering and filtering
CREATE INDEX IF NOT EXISTS idx_demo_videos_category ON public.demo_videos(category);
CREATE INDEX IF NOT EXISTS idx_demo_videos_order ON public.demo_videos(order_index);

-- Enable RLS
ALTER TABLE public.demo_videos ENABLE ROW LEVEL SECURITY;

-- Anyone can view demo videos (public access for investor links)
CREATE POLICY "Anyone can view demo videos"
  ON public.demo_videos
  FOR SELECT
  USING (true);

-- Only authenticated users can insert demo videos
CREATE POLICY "Authenticated users can create demo videos"
  ON public.demo_videos
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Only the creator can update their own demo videos
CREATE POLICY "Users can update own demo videos"
  ON public.demo_videos
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

-- Only the creator can delete their own demo videos
CREATE POLICY "Users can delete own demo videos"
  ON public.demo_videos
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_demo_videos_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_demo_videos_updated_at
  BEFORE UPDATE ON public.demo_videos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_demo_videos_updated_at();