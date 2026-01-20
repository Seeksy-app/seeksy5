-- Create platform_updates table for dynamic changelog
CREATE TABLE public.platform_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  version TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'feature' CHECK (type IN ('feature', 'improvement', 'bugfix', 'update')),
  items TEXT[] DEFAULT '{}',
  visibility TEXT[] NOT NULL DEFAULT '{admin}' CHECK (visibility <@ ARRAY['admin', 'creator', 'board']::TEXT[]),
  published_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.platform_updates ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage platform updates"
ON public.platform_updates
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- Anyone authenticated can read updates visible to their role
CREATE POLICY "Users can read visible updates"
ON public.platform_updates
FOR SELECT
USING (true);

-- Create index for faster queries
CREATE INDEX idx_platform_updates_published_at ON public.platform_updates(published_at DESC);
CREATE INDEX idx_platform_updates_visibility ON public.platform_updates USING GIN(visibility);

-- Seed with existing changelog entries
INSERT INTO public.platform_updates (version, title, description, type, items, visibility, published_at) VALUES
('2.4.0', 'Email Suite Improvements', 'New email signatures, improved inbox UI, and better email tracking.', 'feature', ARRAY['Added email signature management', 'Improved inbox performance', 'New email analytics dashboard'], ARRAY['admin', 'creator', 'board'], '2024-12-10'),
('2.3.5', 'Board Portal Enhancements', 'Enhanced investor sharing and new settings page for board members.', 'improvement', ARRAY['Board member settings page', 'Improved investor access links', 'New data mode toggles'], ARRAY['admin', 'board'], '2024-12-08'),
('2.3.0', 'CFO Studio V3', 'Complete redesign of the financial modeling experience.', 'feature', ARRAY['Single-page scrolling layout', 'Real-time KPI updates', 'Improved scenario switching'], ARRAY['admin', 'board'], '2024-12-05');