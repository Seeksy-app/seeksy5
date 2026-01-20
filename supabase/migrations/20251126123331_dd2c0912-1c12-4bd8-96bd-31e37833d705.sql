-- Add newsletter settings to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS newsletter_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS newsletter_heading text DEFAULT 'Stay Updated',
ADD COLUMN IF NOT EXISTS newsletter_description text DEFAULT 'Subscribe to get the latest updates delivered to your inbox.';

-- Add user_id to newsletter_subscribers to link to creator
ALTER TABLE public.newsletter_subscribers
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_user_id ON public.newsletter_subscribers(user_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email ON public.newsletter_subscribers(email);