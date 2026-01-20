-- Add external_id column to protected_content table for tracking imported content
ALTER TABLE public.protected_content 
ADD COLUMN IF NOT EXISTS external_id TEXT;

-- Add source column if it doesn't exist
ALTER TABLE public.protected_content 
ADD COLUMN IF NOT EXISTS source TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_protected_content_external_id ON public.protected_content(external_id);
CREATE INDEX IF NOT EXISTS idx_protected_content_source ON public.protected_content(source);