-- Add soft delete columns to email_events for proper trash functionality
ALTER TABLE public.email_events 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS original_event_type TEXT DEFAULT NULL;

-- Add index for deleted_at for faster trash queries
CREATE INDEX IF NOT EXISTS idx_email_events_deleted_at ON public.email_events(deleted_at) WHERE deleted_at IS NOT NULL;

-- Comment explaining the trash behavior
COMMENT ON COLUMN public.email_events.deleted_at IS 'When set, email is in trash. Null means not deleted.';
COMMENT ON COLUMN public.email_events.original_event_type IS 'Stores original event_type before moving to trash, for restoration.';