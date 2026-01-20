-- Add owner_id column to ai_daily_briefs if not exists
ALTER TABLE public.ai_daily_briefs 
ADD COLUMN IF NOT EXISTS owner_id UUID;

-- Add unique constraint for upsert to work
ALTER TABLE public.ai_daily_briefs 
DROP CONSTRAINT IF EXISTS ai_daily_briefs_owner_date_unique;

ALTER TABLE public.ai_daily_briefs 
ADD CONSTRAINT ai_daily_briefs_owner_date_unique UNIQUE (owner_id, date_local);