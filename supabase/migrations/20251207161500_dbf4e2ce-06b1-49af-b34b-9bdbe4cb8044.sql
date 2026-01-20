-- Create table for persisting user banner dismissals
CREATE TABLE public.user_banner_dismissals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  banner_key TEXT NOT NULL,
  dismissed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, banner_key)
);

-- Enable RLS
ALTER TABLE public.user_banner_dismissals ENABLE ROW LEVEL SECURITY;

-- Users can only see/manage their own dismissals
CREATE POLICY "Users can view their own dismissals"
  ON public.user_banner_dismissals
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own dismissals"
  ON public.user_banner_dismissals
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own dismissals"
  ON public.user_banner_dismissals
  FOR DELETE
  USING (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX idx_user_banner_dismissals_user_id ON public.user_banner_dismissals(user_id);