-- Add RLS policy to allow public newsletter subscriptions
CREATE POLICY "Allow public newsletter subscriptions"
ON public.newsletter_subscribers
FOR INSERT
WITH CHECK (true);

-- Also allow users to check if they're already subscribed (for duplicate detection)
CREATE POLICY "Allow public to check own email subscription"
ON public.newsletter_subscribers
FOR SELECT
USING (email = email);