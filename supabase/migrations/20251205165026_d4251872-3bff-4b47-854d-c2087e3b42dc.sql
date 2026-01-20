-- Add missing columns to media_files for external imports
ALTER TABLE public.media_files 
ADD COLUMN IF NOT EXISTS external_id text,
ADD COLUMN IF NOT EXISTS original_source_url text,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'ready',
ADD COLUMN IF NOT EXISTS error_message text;

-- Add indexes for import queries
CREATE INDEX IF NOT EXISTS idx_media_files_source ON public.media_files(source);
CREATE INDEX IF NOT EXISTS idx_media_files_status ON public.media_files(status);
CREATE INDEX IF NOT EXISTS idx_media_files_external_id ON public.media_files(external_id);

-- Update existing rows to have 'ready' status
UPDATE public.media_files SET status = 'ready' WHERE status IS NULL;