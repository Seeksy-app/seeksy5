-- Add source column to podcasts table for RSS import tracking
ALTER TABLE podcasts
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'native';

-- Add source_url column to store the original RSS feed URL
ALTER TABLE podcasts
ADD COLUMN IF NOT EXISTS source_url TEXT;

-- Add index on source for filtering imported vs native podcasts
CREATE INDEX IF NOT EXISTS idx_podcasts_source ON podcasts(source);

COMMENT ON COLUMN podcasts.source IS 'Source of the podcast: "native" for created in Seeksy, "rss" for imported from RSS feed';
COMMENT ON COLUMN podcasts.source_url IS 'Original RSS feed URL if imported from external source';