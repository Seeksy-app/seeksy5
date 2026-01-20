-- Insert role-permission mappings only (no functions)
INSERT INTO public.role_permissions (role, permission)
SELECT 'platform_owner', key FROM public.permissions ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role, permission)
SELECT 'super_admin', key FROM public.permissions ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role, permission)
SELECT 'admin', key FROM public.permissions WHERE key != 'admin.impersonate' ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role, permission) VALUES
  ('support_admin', 'core.read'), ('support_admin', 'supportdesk.view'),
  ('support_admin', 'supportdesk.reply'), ('support_admin', 'supportdesk.manage'),
  ('support_agent', 'core.read'), ('support_agent', 'supportdesk.view'), ('support_agent', 'supportdesk.reply'),
  ('creator', 'core.read'), ('creator', 'core.write'), ('creator', 'studio.access'),
  ('creator', 'clips.view'), ('creator', 'clips.edit'), ('creator', 'media.view'), ('creator', 'media.upload'),
  ('advertiser', 'core.read'), ('advertiser', 'ads.view'), ('advertiser', 'ads.manage'),
  ('board_member', 'core.read'), ('board_member', 'board.view'),
  ('read_only_analyst', 'core.read'), ('read_only_analyst', 'rnd.read')
ON CONFLICT DO NOTHING;