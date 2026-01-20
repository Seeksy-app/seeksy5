-- Add import tracking columns to trucking_loads
ALTER TABLE public.trucking_loads 
ADD COLUMN IF NOT EXISTS import_source TEXT,
ADD COLUMN IF NOT EXISTS import_batch_id TEXT,
ADD COLUMN IF NOT EXISTS imported_at TIMESTAMPTZ;

-- Create index for efficient template-based queries
CREATE INDEX IF NOT EXISTS idx_trucking_loads_import_source 
ON public.trucking_loads (import_source, is_active);

-- Update existing loads to have is_active=true if null
UPDATE public.trucking_loads SET is_active = true WHERE is_active IS NULL;