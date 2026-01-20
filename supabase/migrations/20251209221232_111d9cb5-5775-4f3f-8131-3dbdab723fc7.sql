
-- Add missing columns to match your schema
ALTER TABLE milestones 
  ADD COLUMN IF NOT EXISTS team TEXT,
  ADD COLUMN IF NOT EXISTS tags TEXT[],
  ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS metric_unit TEXT,
  ADD COLUMN IF NOT EXISTS ai_summary TEXT,
  ADD COLUMN IF NOT EXISTS ai_risks TEXT[];

-- Rename progress_percent to progress_value for consistency
ALTER TABLE milestones RENAME COLUMN progress_percent TO progress_value;
