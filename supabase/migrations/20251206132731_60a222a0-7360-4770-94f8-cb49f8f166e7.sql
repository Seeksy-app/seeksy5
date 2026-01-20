-- =============================================
-- WORKSPACE SYSTEM MIGRATION
-- Extends custom_packages to serve as workspaces
-- =============================================

-- 1. Add workspace-specific columns to custom_packages
ALTER TABLE public.custom_packages 
ADD COLUMN IF NOT EXISTS slug TEXT,
ADD COLUMN IF NOT EXISTS icon_color TEXT DEFAULT '#2C6BED',
ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS description TEXT;

-- Create unique index on slug per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_custom_packages_user_slug 
ON public.custom_packages(user_id, slug) 
WHERE slug IS NOT NULL;

-- 2. Create workspace_modules junction table for better module management
CREATE TABLE IF NOT EXISTS public.workspace_modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.custom_packages(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL,
  position INTEGER DEFAULT 0,
  settings JSONB DEFAULT '{}',
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(workspace_id, module_id)
);

-- 3. Create module_registry table with scope definitions
CREATE TABLE IF NOT EXISTS public.module_registry (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  category TEXT,
  scope TEXT NOT NULL DEFAULT 'workspace' CHECK (scope IN ('global', 'workspace', 'hybrid')),
  route TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Insert module registry data
INSERT INTO public.module_registry (id, name, description, icon, category, scope, route, display_order) VALUES
-- Workspace-scoped modules
('studio', 'Studio Hub', 'Record podcasts, videos, and livestreams', 'Mic', 'media', 'workspace', '/studio', 10),
('podcasts', 'Podcasts', 'Podcast hosting and RSS distribution', 'Podcast', 'media', 'workspace', '/podcasts', 20),
('clips', 'AI Clips', 'Generate viral clips with AI', 'Scissors', 'media', 'workspace', '/clips-studio', 30),
('ai-post-production', 'AI Post-Production', 'Enhance audio and video with AI', 'Sparkles', 'media', 'workspace', '/studio/ai-post-production', 40),
('blog', 'Blog', 'Create and publish blog posts', 'FileText', 'marketing', 'workspace', '/marketing/blog', 50),
('newsletters', 'Newsletters', 'Email newsletter campaigns', 'Mail', 'marketing', 'workspace', '/marketing/newsletters', 60),
('campaigns', 'Campaigns', 'Multi-channel marketing campaigns', 'Megaphone', 'marketing', 'workspace', '/marketing/campaigns', 70),
('automations', 'Automations', 'Automated workflows', 'Zap', 'marketing', 'workspace', '/marketing/automations', 80),
('crm', 'CRM', 'Customer relationship management', 'Users', 'business', 'workspace', '/contacts', 90),
('tasks', 'Tasks', 'Task and project management', 'CheckSquare', 'business', 'workspace', '/tasks', 100),
('projects', 'Projects', 'Project portfolio management', 'FolderOpen', 'business', 'workspace', '/project-management', 110),
('meetings', 'Meetings', 'Schedule and manage meetings', 'Calendar', 'business', 'workspace', '/meetings', 120),
('events', 'Events', 'Event creation and ticketing', 'CalendarDays', 'business', 'workspace', '/events', 130),
('awards', 'Awards', 'Award programs and nominations', 'Trophy', 'business', 'workspace', '/awards', 140),
('proposals', 'Proposals', 'Create professional proposals', 'FileText', 'business', 'workspace', '/proposals', 150),
('forms', 'Forms', 'Build forms and collect data', 'FormInput', 'business', 'workspace', '/forms', 160),
('polls', 'Polls', 'Create polls and surveys', 'Vote', 'business', 'workspace', '/polls', 170),
-- Hybrid modules (global data, workspace filter)
('contacts', 'Contacts', 'Manage contacts and audience', 'Users', 'crm', 'hybrid', '/contacts', 200),
('media-library', 'Media Library', 'Store and organize media files', 'Image', 'media', 'hybrid', '/studio/media', 210),
('email', 'Email', 'Email inbox and management', 'Mail', 'communication', 'hybrid', '/email/inbox', 220),
-- Global modules (never workspace-scoped)
('settings', 'Settings', 'Account and app settings', 'Settings', 'system', 'global', '/settings', 300),
('billing', 'Billing', 'Subscription and billing', 'CreditCard', 'system', 'global', '/settings/billing', 310),
('help', 'Help Center', 'Support and documentation', 'HelpCircle', 'system', 'global', '/help', 320),
('identity', 'Identity', 'Voice and face verification', 'Shield', 'identity', 'workspace', '/identity', 180),
('my-page', 'My Page', 'Personal landing page builder', 'Layout', 'identity', 'workspace', '/profile/edit', 190)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  scope = EXCLUDED.scope,
  route = EXCLUDED.route;

-- 5. Create trigger to ensure only one default workspace per user
CREATE OR REPLACE FUNCTION public.ensure_single_default_workspace()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE public.custom_packages 
    SET is_default = false 
    WHERE user_id = NEW.user_id 
    AND id != NEW.id 
    AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ensure_single_default_workspace_trigger ON public.custom_packages;
CREATE TRIGGER ensure_single_default_workspace_trigger
  BEFORE INSERT OR UPDATE ON public.custom_packages
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_single_default_workspace();

-- 6. Create trigger for updated_at on workspace_modules
CREATE OR REPLACE FUNCTION public.update_workspace_modules_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_workspace_modules_updated_at_trigger ON public.workspace_modules;
CREATE TRIGGER update_workspace_modules_updated_at_trigger
  BEFORE UPDATE ON public.workspace_modules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_workspace_modules_updated_at();

-- 7. Enable RLS on new tables
ALTER TABLE public.workspace_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_registry ENABLE ROW LEVEL SECURITY;

-- 8. RLS policies for workspace_modules
CREATE POLICY "Users can view their own workspace modules"
  ON public.workspace_modules FOR SELECT
  USING (
    workspace_id IN (
      SELECT id FROM public.custom_packages WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own workspace modules"
  ON public.workspace_modules FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT id FROM public.custom_packages WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own workspace modules"
  ON public.workspace_modules FOR UPDATE
  USING (
    workspace_id IN (
      SELECT id FROM public.custom_packages WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own workspace modules"
  ON public.workspace_modules FOR DELETE
  USING (
    workspace_id IN (
      SELECT id FROM public.custom_packages WHERE user_id = auth.uid()
    )
  );

-- 9. RLS policy for module_registry (public read)
CREATE POLICY "Anyone can view module registry"
  ON public.module_registry FOR SELECT
  USING (true);

-- 10. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_workspace_modules_workspace_id ON public.workspace_modules(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_modules_module_id ON public.workspace_modules(module_id);
CREATE INDEX IF NOT EXISTS idx_custom_packages_is_default ON public.custom_packages(user_id, is_default) WHERE is_default = true;