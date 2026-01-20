-- Fix newsletter subscriber privacy
-- Drop existing policies that expose subscriber emails
DROP POLICY IF EXISTS "Users can view their own subscribers" ON newsletter_subscribers;
DROP POLICY IF EXISTS "Anyone can subscribe" ON newsletter_subscribers;
DROP POLICY IF EXISTS "Users can view their own subscription" ON newsletter_subscribers;
DROP POLICY IF EXISTS "Users can unsubscribe" ON newsletter_subscribers;

-- Allow anyone to subscribe (insert their own email)
CREATE POLICY "Anyone can subscribe"
ON newsletter_subscribers
FOR INSERT
TO public
WITH CHECK (true);

-- Allow users to view ONLY their own subscription by email match
CREATE POLICY "Users can view own subscription by email"
ON newsletter_subscribers
FOR SELECT
TO public
USING (email = auth.jwt() ->> 'email');

-- Allow users to update ONLY their own subscription (for unsubscribe)
CREATE POLICY "Users can manage own subscription"
ON newsletter_subscribers
FOR UPDATE
TO public
USING (email = auth.jwt() ->> 'email')
WITH CHECK (email = auth.jwt() ->> 'email');

-- Note: Profile owners (creators) do NOT get access to subscriber emails
-- They should use aggregate analytics instead