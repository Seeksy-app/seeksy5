-- Add Shotstack integration fields to clips table
ALTER TABLE clips
ADD COLUMN IF NOT EXISTS shotstack_job_id TEXT,
ADD COLUMN IF NOT EXISTS shotstack_status TEXT,
ADD COLUMN IF NOT EXISTS source_cloudflare_url TEXT;

-- Add index for webhook lookups
CREATE INDEX IF NOT EXISTS idx_clips_shotstack_job_id ON clips(shotstack_job_id);

-- Add comment
COMMENT ON COLUMN clips.shotstack_job_id IS 'Shotstack render job ID for tracking async processing';
COMMENT ON COLUMN clips.shotstack_status IS 'Shotstack job status: queued, fetching, rendering, done, failed';
COMMENT ON COLUMN clips.source_cloudflare_url IS 'Cloudflare Stream MP4 download URL used as source for Shotstack';