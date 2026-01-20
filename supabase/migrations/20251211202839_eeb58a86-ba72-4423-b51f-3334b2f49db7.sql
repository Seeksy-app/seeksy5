-- Create video watch logs table for tracking video views
CREATE TABLE IF NOT EXISTS public.video_watch_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES public.demo_videos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  watch_duration_seconds INTEGER DEFAULT 0,
  video_duration_seconds INTEGER,
  completed BOOLEAN DEFAULT false,
  ip_hash TEXT,
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for querying
CREATE INDEX IF NOT EXISTS idx_video_watch_logs_video_id ON public.video_watch_logs(video_id);
CREATE INDEX IF NOT EXISTS idx_video_watch_logs_user_id ON public.video_watch_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_video_watch_logs_created_at ON public.video_watch_logs(created_at DESC);

-- Enable RLS
ALTER TABLE public.video_watch_logs ENABLE ROW LEVEL SECURITY;

-- Allow public inserts (for anonymous viewers)
CREATE POLICY "Anyone can log video watches"
  ON public.video_watch_logs
  FOR INSERT
  WITH CHECK (true);

-- Allow updates to own session logs
CREATE POLICY "Anyone can update their session logs"
  ON public.video_watch_logs
  FOR UPDATE
  USING (true);

-- Only authenticated users with admin role can view all logs
CREATE POLICY "Admins can view all video watch logs"
  ON public.video_watch_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('super_admin', 'admin', 'platform_owner', 'board_member')
    )
  );

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_video_watch_logs_updated_at()
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

CREATE TRIGGER update_video_watch_logs_updated_at
  BEFORE UPDATE ON public.video_watch_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_video_watch_logs_updated_at();