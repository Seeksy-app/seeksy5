
-- Module Groups table
CREATE TABLE public.module_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  icon TEXT,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Module Group Modules junction table
CREATE TYPE module_relationship_type AS ENUM ('primary', 'associated');

CREATE TABLE public.module_group_modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.module_groups(id) ON DELETE CASCADE,
  module_key TEXT NOT NULL,
  relationship_type module_relationship_type NOT NULL DEFAULT 'primary',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, module_key, relationship_type)
);

-- Enable RLS
ALTER TABLE public.module_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_group_modules ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Anyone can read, only admins can modify
CREATE POLICY "Anyone can view module groups" ON public.module_groups FOR SELECT USING (true);
CREATE POLICY "Admins can manage module groups" ON public.module_groups FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
);

CREATE POLICY "Anyone can view module group modules" ON public.module_group_modules FOR SELECT USING (true);
CREATE POLICY "Admins can manage module group modules" ON public.module_group_modules FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- Indexes
CREATE INDEX idx_module_groups_sort ON public.module_groups(sort_order);
CREATE INDEX idx_module_group_modules_group ON public.module_group_modules(group_id);
CREATE INDEX idx_module_group_modules_module ON public.module_group_modules(module_key);

-- Trigger for updated_at
CREATE TRIGGER update_module_groups_updated_at
  BEFORE UPDATE ON public.module_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed initial groups
INSERT INTO public.module_groups (key, label, icon, description, sort_order, is_system) VALUES
  ('creator-studio', 'Creator Studio', 'Video', 'Recording, editing, and media tools', 1, false),
  ('podcasting', 'Podcasting', 'Podcast', 'Podcast creation and distribution', 2, false),
  ('campaigns', 'Campaigns', 'Megaphone', 'Marketing campaigns and automations', 3, false),
  ('events', 'Events', 'Calendar', 'Events, meetings, and scheduling', 4, false),
  ('crm-business', 'CRM & Business', 'Users', 'Contacts, tasks, and business tools', 5, false),
  ('identity-profile', 'Identity & Profile', 'User', 'Creator profile and identity', 6, false),
  ('system-settings', 'System / Settings', 'Settings', 'App settings and configuration', 7, true);

-- Seed module assignments
-- Creator Studio
INSERT INTO public.module_group_modules (group_id, module_key, relationship_type, sort_order)
SELECT g.id, m.module_key, m.rel_type::module_relationship_type, m.sort_ord
FROM public.module_groups g
CROSS JOIN (VALUES 
  ('studio-recording', 'primary', 1),
  ('media-library', 'primary', 2),
  ('video-editor', 'primary', 3),
  ('ai-clips', 'associated', 1),
  ('ai-post-production', 'associated', 2),
  ('cloning', 'associated', 3),
  ('podcast-rss', 'associated', 4)
) AS m(module_key, rel_type, sort_ord)
WHERE g.key = 'creator-studio';

-- Podcasting
INSERT INTO public.module_group_modules (group_id, module_key, relationship_type, sort_order)
SELECT g.id, m.module_key, m.rel_type::module_relationship_type, m.sort_ord
FROM public.module_groups g
CROSS JOIN (VALUES 
  ('podcasts', 'primary', 1),
  ('podcast-hosting', 'primary', 2),
  ('podcast-rss', 'primary', 3),
  ('studio-recording', 'associated', 1),
  ('ai-post-production', 'associated', 2),
  ('media-library', 'associated', 3)
) AS m(module_key, rel_type, sort_ord)
WHERE g.key = 'podcasting';

-- Campaigns
INSERT INTO public.module_group_modules (group_id, module_key, relationship_type, sort_order)
SELECT g.id, m.module_key, m.rel_type::module_relationship_type, m.sort_ord
FROM public.module_groups g
CROSS JOIN (VALUES 
  ('email', 'primary', 1),
  ('newsletter', 'primary', 2),
  ('automations', 'primary', 3),
  ('blog', 'primary', 4),
  ('sms', 'primary', 5)
) AS m(module_key, rel_type, sort_ord)
WHERE g.key = 'campaigns';

-- Events
INSERT INTO public.module_group_modules (group_id, module_key, relationship_type, sort_order)
SELECT g.id, m.module_key, m.rel_type::module_relationship_type, m.sort_ord
FROM public.module_groups g
CROSS JOIN (VALUES 
  ('events', 'primary', 1),
  ('meetings', 'primary', 2),
  ('forms', 'primary', 3),
  ('polls', 'primary', 4),
  ('awards', 'primary', 5)
) AS m(module_key, rel_type, sort_ord)
WHERE g.key = 'events';

-- CRM & Business
INSERT INTO public.module_group_modules (group_id, module_key, relationship_type, sort_order)
SELECT g.id, m.module_key, m.rel_type::module_relationship_type, m.sort_ord
FROM public.module_groups g
CROSS JOIN (VALUES 
  ('crm', 'primary', 1),
  ('contacts', 'primary', 2),
  ('tasks', 'primary', 3),
  ('projects', 'primary', 4),
  ('proposals', 'primary', 5)
) AS m(module_key, rel_type, sort_ord)
WHERE g.key = 'crm-business';

-- Identity & Profile
INSERT INTO public.module_group_modules (group_id, module_key, relationship_type, sort_order)
SELECT g.id, m.module_key, m.rel_type::module_relationship_type, m.sort_ord
FROM public.module_groups g
CROSS JOIN (VALUES 
  ('my-page', 'primary', 1),
  ('identity', 'primary', 2)
) AS m(module_key, rel_type, sort_ord)
WHERE g.key = 'identity-profile';

-- System / Settings
INSERT INTO public.module_group_modules (group_id, module_key, relationship_type, sort_order)
SELECT g.id, m.module_key, m.rel_type::module_relationship_type, m.sort_ord
FROM public.module_groups g
CROSS JOIN (VALUES 
  ('app-store', 'primary', 1),
  ('settings', 'primary', 2)
) AS m(module_key, rel_type, sort_ord)
WHERE g.key = 'system-settings';
