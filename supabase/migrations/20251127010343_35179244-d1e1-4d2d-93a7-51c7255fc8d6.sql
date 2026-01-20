-- Create media_clips table for generated clips from broadcasts and videos
CREATE TABLE IF NOT EXISTS public.media_clips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_media_id UUID REFERENCES public.media_files(id) ON DELETE CASCADE,
  broadcast_id UUID REFERENCES public.studio_broadcasts(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  clip_url TEXT,
  start_time NUMERIC NOT NULL,
  end_time NUMERIC NOT NULL,
  duration_seconds NUMERIC NOT NULL,
  clip_type TEXT DEFAULT 'manual' CHECK (clip_type IN ('manual', 'ai_generated', 'highlight')),
  text_overlay TEXT,
  thumbnail_url TEXT,
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'failed')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_media_clips_user_id ON public.media_clips(user_id);
CREATE INDEX idx_media_clips_source_media_id ON public.media_clips(source_media_id);
CREATE INDEX idx_media_clips_broadcast_id ON public.media_clips(broadcast_id);
CREATE INDEX idx_media_clips_clip_type ON public.media_clips(clip_type);
CREATE INDEX idx_media_clips_status ON public.media_clips(status);

-- Enable RLS
ALTER TABLE public.media_clips ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own clips"
  ON public.media_clips
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own clips"
  ON public.media_clips
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clips"
  ON public.media_clips
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own clips"
  ON public.media_clips
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER update_media_clips_updated_at
  BEFORE UPDATE ON public.media_clips
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add broadcast_id column to media_files if it doesn't exist
ALTER TABLE public.media_files 
  ADD COLUMN IF NOT EXISTS broadcast_id UUID REFERENCES public.studio_broadcasts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_media_files_broadcast_id ON public.media_files(broadcast_id);