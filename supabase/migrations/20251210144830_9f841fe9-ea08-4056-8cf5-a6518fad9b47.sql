-- Track which updates each user has read
CREATE TABLE public.user_update_reads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  update_id UUID NOT NULL REFERENCES public.platform_updates(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, update_id)
);

-- Enable RLS
ALTER TABLE public.user_update_reads ENABLE ROW LEVEL SECURITY;

-- Users can manage their own read status
CREATE POLICY "Users can manage their own read status"
ON public.user_update_reads
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX idx_user_update_reads_user ON public.user_update_reads(user_id);