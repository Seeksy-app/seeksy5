-- Phase 5: Add collections tracking to workspace_modules
-- Add added_via_collection column to workspace_modules
ALTER TABLE public.workspace_modules 
ADD COLUMN IF NOT EXISTS added_via_collection text DEFAULT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.workspace_modules.added_via_collection IS 'The collection ID that caused this module to be added, NULL if added standalone';

-- Add installed_collections array to custom_packages (workspaces)
ALTER TABLE public.custom_packages
ADD COLUMN IF NOT EXISTS installed_collections text[] DEFAULT '{}';

-- Add comment for clarity
COMMENT ON COLUMN public.custom_packages.installed_collections IS 'Array of collection IDs installed in this workspace';