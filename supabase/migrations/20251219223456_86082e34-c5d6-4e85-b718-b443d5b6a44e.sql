-- Migrate studio-recording to studio in workspace_modules
-- This consolidates all "studio-recording" references to use "studio" as the single entry point

-- Replace studio-recording with studio (avoid duplicates)
UPDATE workspace_modules 
SET module_id = 'studio'
WHERE module_id = 'studio-recording'
AND NOT EXISTS (
  SELECT 1 FROM workspace_modules wm2 
  WHERE wm2.workspace_id = workspace_modules.workspace_id 
  AND wm2.module_id = 'studio'
);

-- Delete any remaining studio-recording entries (where studio already exists)
DELETE FROM workspace_modules 
WHERE module_id = 'studio-recording';

-- Also clean up module_groups if they reference studio-recording
DELETE FROM module_group_modules 
WHERE module_key = 'studio-recording';