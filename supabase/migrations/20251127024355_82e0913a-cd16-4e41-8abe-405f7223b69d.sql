-- Create studio_intro_outro_library table
CREATE TABLE IF NOT EXISTS public.studio_intro_outro_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_id UUID REFERENCES public.studio_sessions(id) ON DELETE SET NULL,
  media_file_id UUID REFERENCES public.media_files(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('intro', 'outro')),
  title TEXT,
  script TEXT,
  audio_url TEXT,
  voice_id TEXT,
  voice_name TEXT,
  music_asset_id TEXT,
  is_ai_generated BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.studio_intro_outro_library ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own intro/outro library"
  ON public.studio_intro_outro_library
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own intro/outro library items"
  ON public.studio_intro_outro_library
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own intro/outro library items"
  ON public.studio_intro_outro_library
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own intro/outro library items"
  ON public.studio_intro_outro_library
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_intro_outro_library_user_id ON public.studio_intro_outro_library(user_id);
CREATE INDEX idx_intro_outro_library_type ON public.studio_intro_outro_library(type);

-- Add updated_at trigger
CREATE TRIGGER update_intro_outro_library_updated_at
  BEFORE UPDATE ON public.studio_intro_outro_library
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();