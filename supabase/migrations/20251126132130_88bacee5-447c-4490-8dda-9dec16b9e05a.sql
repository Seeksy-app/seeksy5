-- Add photos column to tickets table
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS photos TEXT[];

COMMENT ON COLUMN tickets.photos IS 'Array of photo URLs attached to the ticket';