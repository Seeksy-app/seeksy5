-- Add additional permissions for extended RBAC coverage
INSERT INTO public.permissions (key, name, description, category) VALUES
  ('podcasts.view', 'View Podcasts', 'View podcast content', 'podcasts'),
  ('podcasts.manage', 'Manage Podcasts', 'Create and edit podcasts', 'podcasts'),
  ('podcasts.publish', 'Publish Podcasts', 'Publish podcast episodes', 'podcasts'),
  ('monetization.view', 'View Monetization', 'View monetization data', 'monetization'),
  ('monetization.manage', 'Manage Monetization', 'Manage monetization settings', 'monetization'),
  ('identity.view', 'View Identity', 'View identity assets', 'identity'),
  ('identity.manage', 'Manage Identity', 'Manage identity settings', 'identity'),
  ('identity.certify', 'Certify Identity', 'Certify voice and face', 'identity')
ON CONFLICT (key) DO NOTHING;

-- Assign new permissions to roles
INSERT INTO public.role_permissions (role, permission) VALUES
  -- Platform Owner
  ('platform_owner', 'podcasts.view'),
  ('platform_owner', 'podcasts.manage'),
  ('platform_owner', 'podcasts.publish'),
  ('platform_owner', 'monetization.view'),
  ('platform_owner', 'monetization.manage'),
  ('platform_owner', 'identity.view'),
  ('platform_owner', 'identity.manage'),
  ('platform_owner', 'identity.certify'),
  -- Super Admin
  ('super_admin', 'podcasts.view'),
  ('super_admin', 'podcasts.manage'),
  ('super_admin', 'podcasts.publish'),
  ('super_admin', 'monetization.view'),
  ('super_admin', 'monetization.manage'),
  ('super_admin', 'identity.view'),
  ('super_admin', 'identity.manage'),
  ('super_admin', 'identity.certify'),
  -- Admin
  ('admin', 'podcasts.view'),
  ('admin', 'podcasts.manage'),
  ('admin', 'monetization.view'),
  ('admin', 'identity.view'),
  -- Creator
  ('creator', 'podcasts.view'),
  ('creator', 'podcasts.manage'),
  ('creator', 'podcasts.publish'),
  ('creator', 'monetization.view'),
  ('creator', 'monetization.manage'),
  ('creator', 'identity.view'),
  ('creator', 'identity.manage'),
  ('creator', 'identity.certify'),
  -- Support Admin - Help Desk full access
  ('support_admin', 'supportdesk.view'),
  ('support_admin', 'supportdesk.reply'),
  ('support_admin', 'supportdesk.manage'),
  ('support_admin', 'supportdesk.settings'),
  ('support_admin', 'core.read'),
  -- Support Agent - Help Desk limited
  ('support_agent', 'supportdesk.view'),
  ('support_agent', 'supportdesk.reply'),
  ('support_agent', 'core.read')
ON CONFLICT (role, permission) DO NOTHING;