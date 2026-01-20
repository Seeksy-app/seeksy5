-- Add detailed address fields to contacts table
ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS street TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS zip_code TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'United States';

-- Add index for location-based queries
CREATE INDEX IF NOT EXISTS idx_contacts_city_state ON public.contacts(city, state) WHERE city IS NOT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.contacts.street IS 'Street address line';
COMMENT ON COLUMN public.contacts.city IS 'City';
COMMENT ON COLUMN public.contacts.state IS 'State or Province';
COMMENT ON COLUMN public.contacts.zip_code IS 'ZIP or Postal Code';
COMMENT ON COLUMN public.contacts.country IS 'Country';