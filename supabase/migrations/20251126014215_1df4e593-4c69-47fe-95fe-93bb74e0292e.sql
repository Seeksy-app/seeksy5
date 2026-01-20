-- Add source field to client_tickets to distinguish ticket types
ALTER TABLE public.client_tickets
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'user'
CHECK (source IN ('user', 'support_form', 'internal', 'ai_chat'));

COMMENT ON COLUMN public.client_tickets.source IS 'Source of the ticket: user (regular user ticket), support_form (from website support form), internal (system/admin generated), ai_chat (created by AI assistant)';

-- Update existing tickets to have 'user' source by default
UPDATE public.client_tickets
SET source = 'user'
WHERE source IS NULL;