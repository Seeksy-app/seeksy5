-- Add thumbnail_url and cloudflare columns to media_files table
ALTER TABLE public.media_files 
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS cloudflare_download_url TEXT,
ADD COLUMN IF NOT EXISTS cloudflare_uid TEXT;

-- Add comment explaining the columns
COMMENT ON COLUMN public.media_files.thumbnail_url IS 'URL to generated thumbnail image for video/audio files';
COMMENT ON COLUMN public.media_files.cloudflare_download_url IS 'Cloudflare Stream/R2 direct download URL';
COMMENT ON COLUMN public.media_files.cloudflare_uid IS 'Cloudflare Stream video UID';