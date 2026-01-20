
-- Guest Appearance Scans table for tracking user appearances on podcasts/videos
CREATE TABLE public.guest_appearance_scans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('youtube', 'spotify', 'apple_podcasts', 'other')),
  external_id TEXT,
  title TEXT NOT NULL,
  show_name TEXT,
  description TEXT,
  thumbnail_url TEXT,
  external_url TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  detection_method TEXT CHECK (detection_method IN ('metadata', 'voice', 'manual')),
  voice_confidence NUMERIC(5,4),
  is_verified BOOLEAN DEFAULT false,
  is_hidden BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, platform, external_id)
);

-- Enable RLS
ALTER TABLE public.guest_appearance_scans ENABLE ROW LEVEL SECURITY;

-- Users can view their own appearances
CREATE POLICY "Users can view own appearance scans"
  ON public.guest_appearance_scans FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own appearances
CREATE POLICY "Users can insert own appearance scans"
  ON public.guest_appearance_scans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own appearances
CREATE POLICY "Users can update own appearance scans"
  ON public.guest_appearance_scans FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own appearances
CREATE POLICY "Users can delete own appearance scans"
  ON public.guest_appearance_scans FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_guest_appearance_scans_user_id ON public.guest_appearance_scans(user_id);
CREATE INDEX idx_guest_appearance_scans_platform ON public.guest_appearance_scans(platform);
CREATE INDEX idx_guest_appearance_scans_published_at ON public.guest_appearance_scans(published_at DESC);
