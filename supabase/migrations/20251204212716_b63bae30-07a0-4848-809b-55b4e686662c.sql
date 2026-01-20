-- Step 1: Add new enum values to app_role
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'platform_owner';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'support_admin';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'support_agent';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'team_manager';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'read_only_analyst';