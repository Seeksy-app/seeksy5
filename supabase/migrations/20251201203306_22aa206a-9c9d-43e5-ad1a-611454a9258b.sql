
-- Add source tracking and GUID columns to episodes table for RSS import support
ALTER TABLE episodes 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'native',
ADD COLUMN IF NOT EXISTS guid TEXT UNIQUE;

-- Add source tracking to podcasts (if not exists)
ALTER TABLE podcasts
ADD COLUMN IF NOT EXISTS source_url TEXT;

-- Create index on GUID for faster lookups during re-import
CREATE INDEX IF NOT EXISTS idx_episodes_guid ON episodes(guid) WHERE guid IS NOT NULL;

-- Create index on source for filtering
CREATE INDEX IF NOT EXISTS idx_episodes_source ON episodes(source);

COMMENT ON COLUMN episodes.source IS 'Source of the episode: native (created in Seeksy), rss (imported from RSS feed)';
COMMENT ON COLUMN episodes.guid IS 'Unique identifier from RSS feed, used to prevent duplicate imports';
COMMENT ON COLUMN podcasts.source_url IS 'Original RSS feed URL if imported';
