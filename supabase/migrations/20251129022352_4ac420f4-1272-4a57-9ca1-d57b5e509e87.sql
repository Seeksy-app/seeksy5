-- Add columns for dual clip formats (vertical + thumbnail)
ALTER TABLE public.clips 
ADD COLUMN IF NOT EXISTS vertical_url TEXT,
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_clips_status ON public.clips(status);
CREATE INDEX IF NOT EXISTS idx_clips_user_created ON public.clips(user_id, created_at DESC);