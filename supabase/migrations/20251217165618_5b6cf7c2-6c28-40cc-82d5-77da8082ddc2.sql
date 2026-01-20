-- Add deleted_at column for soft delete support
ALTER TABLE public.trucking_loads 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create index for performance on deleted_at queries
CREATE INDEX IF NOT EXISTS idx_trucking_loads_deleted_at ON public.trucking_loads(deleted_at);

-- Add comment explaining the column
COMMENT ON COLUMN public.trucking_loads.deleted_at IS 'Soft delete timestamp. NULL means active, timestamp means deleted.';