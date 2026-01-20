# Demo Users Setup Guide

This guide explains how to create demo users for RBAC testing.

## Demo User Accounts

Create these users in the Supabase Dashboard under Authentication > Users:

| Email | Password | Role |
|-------|----------|------|
| super_admin_demo@seeksy.dev | DemoPass123! | super_admin |
| admin_demo@seeksy.dev | DemoPass123! | admin |
| support_admin_demo@seeksy.dev | DemoPass123! | support_admin |
| support_agent_demo@seeksy.dev | DemoPass123! | support_agent |
| creator_demo@seeksy.dev | DemoPass123! | creator |
| advertiser_demo@seeksy.dev | DemoPass123! | advertiser |
| board_member_demo@seeksy.dev | DemoPass123! | board_member |
| analyst_demo@seeksy.dev | DemoPass123! | read_only_analyst |
| team_manager_demo@seeksy.dev | DemoPass123! | team_manager |

## Setup Steps

### 1. Create Users in Supabase Dashboard

1. Go to Supabase Dashboard > Authentication > Users
2. Click "Add User" for each demo account
3. Enter email and password from the table above
4. Note the generated UUID for each user

### 2. Assign Roles via SQL

After creating users, run this SQL (replace UUIDs with actual values):

```sql
-- Replace these UUIDs with actual user IDs from auth.users
INSERT INTO public.user_roles (user_id, role)
VALUES 
  ('<super_admin_uuid>', 'super_admin'),
  ('<admin_uuid>', 'admin'),
  ('<support_admin_uuid>', 'support_admin'),
  ('<support_agent_uuid>', 'support_agent'),
  ('<creator_uuid>', 'creator'),
  ('<advertiser_uuid>', 'advertiser'),
  ('<board_member_uuid>', 'board_member'),
  ('<analyst_uuid>', 'read_only_analyst'),
  ('<team_manager_uuid>', 'team_manager')
ON CONFLICT (user_id, role) DO NOTHING;
```

### 3. Create Demo Workspace (Optional)

```sql
INSERT INTO public.workspaces (name, description, owner_id)
VALUES ('Demo Workspace', 'Workspace for demo and testing purposes', '<super_admin_uuid>');
```

## Testing Each Role

### Super Admin
- Full access to all admin features
- Can manage all users, roles, permissions
- Access: `/admin/*`, `/helpdesk/*`, `/board/*`

### Admin
- Full access to admin portal
- Cannot modify super_admin settings
- Access: `/admin/*`, `/helpdesk/*`

### Support Admin
- Full Help Desk access
- Can manage tickets, settings, routing
- Access: `/helpdesk/*`

### Support Agent
- Can view and respond to tickets
- Cannot access Help Desk settings
- Access: `/helpdesk/tickets/*`

### Creator
- Creator dashboard and tools
- My Page, Studio, Podcasts, Clips
- Access: `/dashboard`, `/studio/*`, `/podcasts/*`

### Advertiser
- Advertiser portal only
- Campaigns, analytics, billing
- Access: `/advertiser/*`

### Board Member
- Board Portal only
- Business Model, GTM, Forecasts
- Access: `/board/*`

### Read-Only Analyst
- R&D Intelligence (read-only)
- Board analytics
- Access: `/admin/rd-feeds` (read), `/board/*`

### Team Manager
- Creator tools + team management
- Can manage team members
- Access: `/dashboard`, `/team/*`, `/meetings/*`

## Verification

Test each role by:
1. Logging in with the demo account
2. Verifying correct navigation items appear
3. Attempting to access restricted routes (should be blocked)
4. Checking PermissionGate components hide unauthorized content
