-- Add field to track thumbnail render job separately
ALTER TABLE clips
ADD COLUMN IF NOT EXISTS shotstack_job_id_thumbnail TEXT;