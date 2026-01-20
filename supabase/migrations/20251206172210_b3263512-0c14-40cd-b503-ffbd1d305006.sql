-- Create module_bundle_relations table for defining bundled integrations
CREATE TABLE IF NOT EXISTS public.module_bundle_relations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bundle_module_id TEXT NOT NULL,
  related_module_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(bundle_module_id, related_module_id)
);

-- Enable RLS
ALTER TABLE public.module_bundle_relations ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read bundle relations
CREATE POLICY "Anyone can view bundle relations"
ON public.module_bundle_relations
FOR SELECT
TO authenticated
USING (true);

-- Add is_standalone column to workspace_modules
ALTER TABLE public.workspace_modules 
ADD COLUMN IF NOT EXISTS is_standalone BOOLEAN DEFAULT false;

-- Seed Studio bundle with its integrations
INSERT INTO public.module_bundle_relations (bundle_module_id, related_module_id) VALUES
  ('studio', 'ai-clips'),
  ('studio', 'ai-post-production'),
  ('studio', 'media-library'),
  ('studio', 'video-editor'),
  ('studio', 'podcast-hosting'),
  ('studio', 'cloning'),
  ('campaigns', 'email'),
  ('campaigns', 'newsletter'),
  ('campaigns', 'automations'),
  ('campaigns', 'sms'),
  ('campaigns', 'segments'),
  ('campaigns', 'blog'),
  ('events', 'meetings'),
  ('events', 'forms'),
  ('events', 'polls'),
  ('events', 'awards'),
  ('crm', 'contacts'),
  ('crm', 'project-management'),
  ('crm', 'tasks'),
  ('crm', 'proposals'),
  ('crm', 'deals')
ON CONFLICT (bundle_module_id, related_module_id) DO NOTHING;