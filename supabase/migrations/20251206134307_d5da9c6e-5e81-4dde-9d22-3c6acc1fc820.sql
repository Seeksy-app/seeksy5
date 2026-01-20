-- Seed the module_registry with default modules
INSERT INTO public.module_registry (id, name, description, icon, category, scope, route, display_order, is_active) VALUES
-- Workspace-scoped modules
('studio', 'Studio', 'Record and stream audio/video content', 'mic', 'content', 'workspace', '/studio', 10, true),
('podcasts', 'Podcasts', 'Manage your podcast shows and episodes', 'podcast', 'content', 'workspace', '/podcasts', 20, true),
('clips', 'AI Clips', 'Generate viral clips from your content', 'scissors', 'content', 'workspace', '/clips-studio', 30, true),
('ai-post-production', 'AI Post-Production', 'AI-powered video editing and enhancement', 'sparkles', 'content', 'workspace', '/studio/ai-production', 40, true),
('blog', 'Blog', 'Create and publish blog posts', 'file-text', 'marketing', 'workspace', '/blog', 50, true),
('newsletters', 'Newsletters', 'Email newsletter campaigns', 'mail', 'marketing', 'workspace', '/newsletter', 60, true),
('campaigns', 'Campaigns', 'Marketing campaign management', 'megaphone', 'marketing', 'workspace', '/email-campaigns', 70, true),
('automations', 'Automations', 'Workflow automations and triggers', 'zap', 'operations', 'workspace', '/automations', 80, true),
('crm', 'CRM', 'Customer relationship management', 'users', 'operations', 'workspace', '/crm', 90, true),
('tasks', 'Tasks', 'Task and project management', 'check-square', 'operations', 'workspace', '/tasks', 100, true),
('projects', 'Projects', 'Project portfolio and management', 'folder', 'operations', 'workspace', '/project-management', 110, true),
('meetings', 'Meetings', 'Schedule and manage meetings', 'calendar', 'operations', 'workspace', '/meetings', 120, true),
('events', 'Events', 'Event planning and ticketing', 'calendar-days', 'operations', 'workspace', '/events', 130, true),
('awards', 'Awards', 'Awards programs and ceremonies', 'trophy', 'operations', 'workspace', '/awards', 140, true),
('proposals', 'Proposals', 'Create and send proposals', 'file-text', 'operations', 'workspace', '/proposals', 150, true),
('forms', 'Forms', 'Lead capture and signup forms', 'form-input', 'marketing', 'workspace', '/forms', 160, true),
('polls', 'Polls', 'Create polls and surveys', 'vote', 'marketing', 'workspace', '/polls', 170, true),
-- Hybrid modules (global data, workspace filtered)
('contacts', 'Contacts', 'Manage your contacts and audience', 'users', 'operations', 'hybrid', '/contacts', 200, true),
('media-library', 'Media Library', 'Organize and manage media files', 'image', 'content', 'hybrid', '/studio/media-library', 210, true),
-- Global modules
('email', 'Email Inbox', 'Your email communications hub', 'mail', 'communication', 'global', '/email', 300, true),
('identity', 'Identity', 'Voice and face verification', 'shield', 'account', 'global', '/identity', 310, true),
('my-page', 'My Page', 'Your public creator profile', 'layout', 'account', 'global', '/mypage', 320, true),
('settings', 'Settings', 'Account and workspace settings', 'settings', 'account', 'global', '/settings', 400, true),
('billing', 'Billing', 'Subscription and payment management', 'credit-card', 'account', 'global', '/settings/billing', 410, true),
('help', 'Help', 'Support and documentation', 'help-circle', 'account', 'global', '/help', 420, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  route = EXCLUDED.route,
  scope = EXCLUDED.scope,
  category = EXCLUDED.category,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active;