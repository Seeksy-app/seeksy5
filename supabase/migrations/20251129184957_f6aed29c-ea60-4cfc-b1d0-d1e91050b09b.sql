-- Add field to track if clip should be certified
ALTER TABLE clips
ADD COLUMN IF NOT EXISTS enable_certification BOOLEAN DEFAULT false;