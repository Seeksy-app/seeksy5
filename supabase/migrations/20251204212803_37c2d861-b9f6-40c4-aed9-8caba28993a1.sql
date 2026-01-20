-- RBAC System Part 2: Tables and Data

-- Create permissions table
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create role_definitions table
CREATE TABLE IF NOT EXISTS public.role_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_key TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  is_system_role BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create role_permissions mapping table
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL,
  permission TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(role, permission)
);

-- Create workspace_members table
CREATE TABLE IF NOT EXISTS public.workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'creator',
  permissions_override JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

-- Create permission_audit_log table
CREATE TABLE IF NOT EXISTS public.permission_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  target_user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  resource_type TEXT,
  resource_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create access_denied_log table
CREATE TABLE IF NOT EXISTS public.access_denied_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  attempted_permission TEXT NOT NULL,
  attempted_resource TEXT,
  resource_id TEXT,
  denied_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert role definitions
INSERT INTO public.role_definitions (role_key, display_name, description, priority, is_system_role) VALUES
  ('platform_owner', 'Platform Owner', 'Full platform ownership and control', 100, true),
  ('super_admin', 'Super Admin', 'Full administrative access to all features', 90, true),
  ('admin', 'Admin', 'Administrative access with some restrictions', 80, true),
  ('support_admin', 'Support Admin', 'Full Help Desk access and support settings', 70, true),
  ('support_agent', 'Support Agent', 'Can reply to tickets but limited settings access', 60, true),
  ('team_manager', 'Team Manager', 'Manage team members and basic operations', 50, true),
  ('creator', 'Creator', 'Standard creator/influencer account', 40, true),
  ('advertiser', 'Advertiser', 'Advertiser/brand account with campaign access', 30, true),
  ('board_member', 'Board Member', 'Read-only board portal access', 20, true),
  ('read_only_analyst', 'Read-Only Analyst', 'View analytics and reports only', 10, true)
ON CONFLICT (role_key) DO NOTHING;

-- Insert permissions
INSERT INTO public.permissions (key, name, description, category) VALUES
  ('core.read', 'Core Read', 'Read access to basic platform features', 'core'),
  ('core.write', 'Core Write', 'Write access to basic platform features', 'core'),
  ('studio.access', 'Studio Access', 'Access to recording studio', 'studio'),
  ('studio.record', 'Studio Record', 'Can record audio/video', 'studio'),
  ('studio.settings', 'Studio Settings', 'Can modify studio settings', 'studio'),
  ('clips.view', 'View Clips', 'Can view clips', 'clips'),
  ('clips.edit', 'Edit Clips', 'Can edit and create clips', 'clips'),
  ('clips.delete', 'Delete Clips', 'Can delete clips', 'clips'),
  ('media.view', 'View Media', 'Can view media library', 'media'),
  ('media.upload', 'Upload Media', 'Can upload media files', 'media'),
  ('media.delete', 'Delete Media', 'Can delete media files', 'media'),
  ('meetings.view', 'View Meetings', 'Can view meetings', 'meetings'),
  ('meetings.manage', 'Manage Meetings', 'Can create and manage meetings', 'meetings'),
  ('meetings.settings', 'Meeting Settings', 'Can modify meeting settings', 'meetings'),
  ('creatorhub.view', 'View Creator Hub', 'Can view creator hub', 'creatorhub'),
  ('creatorhub.manage', 'Manage Creator Hub', 'Full creator hub access', 'creatorhub'),
  ('ads.view', 'View Ads', 'Can view ad campaigns', 'ads'),
  ('ads.manage', 'Manage Ads', 'Can create and manage ads', 'ads'),
  ('ads.billing', 'Ad Billing', 'Can manage ad billing', 'ads'),
  ('ads.analytics', 'Ad Analytics', 'Can view ad analytics', 'ads'),
  ('supportdesk.view', 'View Tickets', 'Can view support tickets', 'supportdesk'),
  ('supportdesk.reply', 'Reply to Tickets', 'Can reply to support tickets', 'supportdesk'),
  ('supportdesk.manage', 'Manage Support Desk', 'Full support desk access', 'supportdesk'),
  ('supportdesk.settings', 'Support Settings', 'Can modify support desk settings', 'supportdesk'),
  ('settings.view', 'View Settings', 'Can view settings', 'settings'),
  ('settings.manage', 'Manage Settings', 'Can modify settings', 'settings'),
  ('billing.view', 'View Billing', 'Can view billing information', 'billing'),
  ('billing.manage', 'Manage Billing', 'Can manage billing and payments', 'billing'),
  ('rnd.read', 'R&D Read', 'Can view R&D intelligence', 'rnd'),
  ('rnd.write', 'R&D Write', 'Can add R&D content', 'rnd'),
  ('admin.users', 'Manage Users', 'Can manage users', 'admin'),
  ('admin.roles', 'Manage Roles', 'Can assign and manage roles', 'admin'),
  ('admin.all', 'Full Admin', 'Full administrative access', 'admin'),
  ('admin.impersonate', 'Impersonate Users', 'Can impersonate other users', 'admin'),
  ('board.view', 'Board View', 'Can view board portal', 'board'),
  ('board.analytics', 'Board Analytics', 'Can view board analytics', 'board'),
  ('events.view', 'View Events', 'Can view events', 'events'),
  ('events.manage', 'Manage Events', 'Can create and manage events', 'events'),
  ('crm.view', 'View CRM', 'Can view contacts and CRM', 'crm'),
  ('crm.manage', 'Manage CRM', 'Can manage contacts and CRM', 'crm'),
  ('marketing.view', 'View Marketing', 'Can view marketing tools', 'marketing'),
  ('marketing.manage', 'Manage Marketing', 'Can manage marketing campaigns', 'marketing')
ON CONFLICT (key) DO NOTHING;

-- Enable RLS
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permission_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_denied_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "permissions_select_policy" ON public.permissions;
CREATE POLICY "permissions_select_policy" ON public.permissions FOR SELECT USING (true);

DROP POLICY IF EXISTS "role_definitions_select_policy" ON public.role_definitions;
CREATE POLICY "role_definitions_select_policy" ON public.role_definitions FOR SELECT USING (true);

DROP POLICY IF EXISTS "role_permissions_select_policy" ON public.role_permissions;
CREATE POLICY "role_permissions_select_policy" ON public.role_permissions FOR SELECT USING (true);

DROP POLICY IF EXISTS "workspace_members_own" ON public.workspace_members;
CREATE POLICY "workspace_members_own" ON public.workspace_members FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "workspace_members_admin" ON public.workspace_members;
CREATE POLICY "workspace_members_admin" ON public.workspace_members FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin', 'platform_owner'))
);

DROP POLICY IF EXISTS "audit_log_admin" ON public.permission_audit_log;
CREATE POLICY "audit_log_admin" ON public.permission_audit_log FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin', 'platform_owner'))
);

DROP POLICY IF EXISTS "denied_log_admin" ON public.access_denied_log;
CREATE POLICY "denied_log_admin" ON public.access_denied_log FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin', 'platform_owner'))
);

-- Fix R&D content_type constraint
ALTER TABLE public.rd_feed_items DROP CONSTRAINT IF EXISTS rd_feed_items_content_type_check;
ALTER TABLE public.rd_feed_items ADD CONSTRAINT rd_feed_items_content_type_check 
  CHECK (content_type IS NULL OR content_type IN ('article', 'video', 'podcast', 'report', 'pdf', 'youtube', 'rss'));