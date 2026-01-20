-- Add column to control which lists are included in general subscribe
ALTER TABLE public.subscriber_lists 
ADD COLUMN IF NOT EXISTS include_in_general_subscribe BOOLEAN DEFAULT false;

-- Add preferences token to subscribers for preference management
ALTER TABLE public.newsletter_subscribers
ADD COLUMN IF NOT EXISTS preferences_token TEXT DEFAULT encode(gen_random_bytes(16), 'hex');

-- Update existing subscribers with tokens
UPDATE public.newsletter_subscribers 
SET preferences_token = encode(gen_random_bytes(16), 'hex')
WHERE preferences_token IS NULL;

-- Update existing lists to include in general subscribe
UPDATE public.subscriber_lists 
SET include_in_general_subscribe = true 
WHERE slug IN ('general_newsletter', 'blog_newsletter');