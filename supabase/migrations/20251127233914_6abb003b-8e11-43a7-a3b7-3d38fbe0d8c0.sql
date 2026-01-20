-- Add slug column to podcasts table for clean RSS URLs
ALTER TABLE public.podcasts 
ADD COLUMN IF NOT EXISTS slug TEXT;

-- Create unique index on slug
CREATE UNIQUE INDEX IF NOT EXISTS podcasts_slug_key ON public.podcasts(slug);

-- Generate slugs for existing podcasts
UPDATE public.podcasts
SET slug = lower(regexp_replace(regexp_replace(title, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'))
WHERE slug IS NULL;

-- Add NOT NULL constraint after populating existing rows
ALTER TABLE public.podcasts
ALTER COLUMN slug SET NOT NULL;

-- Create function to auto-generate slug on insert if not provided
CREATE OR REPLACE FUNCTION generate_podcast_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := lower(regexp_replace(regexp_replace(NEW.title, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate slug
DROP TRIGGER IF EXISTS podcast_slug_trigger ON public.podcasts;
CREATE TRIGGER podcast_slug_trigger
BEFORE INSERT OR UPDATE ON public.podcasts
FOR EACH ROW
EXECUTE FUNCTION generate_podcast_slug();