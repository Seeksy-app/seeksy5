-- Add source_url column to episodes table for RSS feed tracking
ALTER TABLE episodes 
ADD COLUMN IF NOT EXISTS source_url TEXT;

-- Add index for source_url lookups
CREATE INDEX IF NOT EXISTS idx_episodes_source_url ON episodes(source_url);

-- Add comment explaining the column
COMMENT ON COLUMN episodes.source_url IS 'The original RSS feed URL this episode was imported from';