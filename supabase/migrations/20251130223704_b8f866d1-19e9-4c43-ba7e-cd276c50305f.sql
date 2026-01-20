-- Enhance studio_sessions table for flagship experience
ALTER TABLE public.studio_sessions 
ADD COLUMN IF NOT EXISTS show_id UUID REFERENCES public.podcasts(id),
ADD COLUMN IF NOT EXISTS session_type TEXT DEFAULT 'recording' CHECK (session_type IN ('recording', 'live', 'rehearsal')),
ADD COLUMN IF NOT EXISTS duration_seconds INTEGER,
ADD COLUMN IF NOT EXISTS ai_summary TEXT,
ADD COLUMN IF NOT EXISTS identity_verified BOOLEAN DEFAULT FALSE;

-- Create clip_markers table
CREATE TABLE IF NOT EXISTS public.clip_markers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.studio_sessions(id) ON DELETE CASCADE,
  timestamp_seconds INTEGER NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ad_markers table  
CREATE TABLE IF NOT EXISTS public.ad_markers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.studio_sessions(id) ON DELETE CASCADE,
  timestamp_seconds INTEGER NOT NULL,
  slot_type TEXT NOT NULL CHECK (slot_type IN ('pre', 'mid', 'post')),
  notes TEXT,
  ad_script_id UUID REFERENCES public.audio_ads(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create studio_analytics table for tracking
CREATE TABLE IF NOT EXISTS public.studio_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.studio_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  event_type TEXT NOT NULL,
  event_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_clip_markers_session ON public.clip_markers(session_id);
CREATE INDEX IF NOT EXISTS idx_ad_markers_session ON public.ad_markers(session_id);
CREATE INDEX IF NOT EXISTS idx_studio_analytics_session ON public.studio_analytics(session_id);
CREATE INDEX IF NOT EXISTS idx_studio_analytics_user ON public.studio_analytics(user_id);

-- Enable RLS
ALTER TABLE public.clip_markers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_markers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own clip markers"
  ON public.clip_markers
  FOR ALL
  USING (created_by = auth.uid());

CREATE POLICY "Users can manage their own ad markers"
  ON public.ad_markers
  FOR ALL
  USING (created_by = auth.uid());

CREATE POLICY "Users can view their own studio analytics"
  ON public.studio_analytics
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all studio analytics"
  ON public.studio_analytics
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );