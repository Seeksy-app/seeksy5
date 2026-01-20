-- Extend ad_impressions table to support VAST, blog, and newsletter placements

-- Add new columns for comprehensive ad tracking
ALTER TABLE public.ad_impressions 
ADD COLUMN IF NOT EXISTS platform text DEFAULT 'seeksy',
ADD COLUMN IF NOT EXISTS source_type text DEFAULT 'podcast_episode',
ADD COLUMN IF NOT EXISTS external_impression_id text,
ADD COLUMN IF NOT EXISTS ad_slot_type text,
ADD COLUMN IF NOT EXISTS playback_ms integer,
ADD COLUMN IF NOT EXISTS fully_listened boolean DEFAULT false;

-- Add check constraints for valid enum values
ALTER TABLE public.ad_impressions
DROP CONSTRAINT IF EXISTS ad_impressions_platform_check;

ALTER TABLE public.ad_impressions
ADD CONSTRAINT ad_impressions_platform_check 
CHECK (platform IN ('seeksy', 'spotify', 'apple', 'youtube', 'other'));

ALTER TABLE public.ad_impressions
DROP CONSTRAINT IF EXISTS ad_impressions_source_type_check;

ALTER TABLE public.ad_impressions
ADD CONSTRAINT ad_impressions_source_type_check 
CHECK (source_type IN ('podcast_episode', 'video', 'clip', 'external', 'blog', 'newsletter'));

ALTER TABLE public.ad_impressions
DROP CONSTRAINT IF EXISTS ad_impressions_ad_slot_type_check;

ALTER TABLE public.ad_impressions
ADD CONSTRAINT ad_impressions_ad_slot_type_check 
CHECK (ad_slot_type IS NULL OR ad_slot_type IN ('pre-roll', 'mid-roll', 'post-roll', 'blog-widget', 'newsletter-inline'));

-- Add indexes for improved query performance
CREATE INDEX IF NOT EXISTS idx_ad_impressions_platform 
ON public.ad_impressions(platform);

CREATE INDEX IF NOT EXISTS idx_ad_impressions_source_type 
ON public.ad_impressions(source_type);

CREATE INDEX IF NOT EXISTS idx_ad_impressions_external_id 
ON public.ad_impressions(external_impression_id) 
WHERE external_impression_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ad_impressions_slot_type 
ON public.ad_impressions(ad_slot_type) 
WHERE ad_slot_type IS NOT NULL;

-- Add comment explaining the extended schema
COMMENT ON COLUMN public.ad_impressions.platform IS 
'Distribution platform: seeksy (native), spotify, apple, youtube, other';

COMMENT ON COLUMN public.ad_impressions.source_type IS 
'Content type where ad was displayed: podcast_episode, video, clip, external (VAST), blog, newsletter';

COMMENT ON COLUMN public.ad_impressions.external_impression_id IS 
'Third-party impression ID from VAST or external ad networks for reconciliation';

COMMENT ON COLUMN public.ad_impressions.ad_slot_type IS 
'Ad placement position: pre-roll, mid-roll, post-roll, blog-widget, newsletter-inline';

COMMENT ON COLUMN public.ad_impressions.playback_ms IS 
'Duration of ad playback in milliseconds';

COMMENT ON COLUMN public.ad_impressions.fully_listened IS 
'True if 90%+ of ad was played/viewed';