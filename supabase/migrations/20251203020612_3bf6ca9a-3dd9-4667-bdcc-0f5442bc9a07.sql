-- Create studio scenes table if not exists
CREATE TABLE IF NOT EXISTS public.studio_scenes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT 'Scene',
  scene_type TEXT NOT NULL DEFAULT 'camera' CHECK (scene_type IN ('camera', 'media', 'countdown')),
  layout TEXT NOT NULL DEFAULT 'host-only',
  sort_order INTEGER NOT NULL DEFAULT 0,
  sources JSONB DEFAULT '[]',
  media_id UUID,
  countdown_seconds INTEGER DEFAULT 300,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.studio_scenes ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if exists and recreate
DROP POLICY IF EXISTS "Users can manage scenes in their sessions" ON public.studio_scenes;

CREATE POLICY "Users can manage scenes in their sessions"
ON public.studio_scenes FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.studio_sessions ss
    WHERE ss.id = session_id AND ss.user_id = auth.uid()
  )
);

-- Create indexes if not exist
CREATE INDEX IF NOT EXISTS idx_studio_scenes_session_id ON public.studio_scenes(session_id);
CREATE INDEX IF NOT EXISTS idx_studio_scenes_sort_order ON public.studio_scenes(session_id, sort_order);