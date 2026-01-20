-- FINAL HARDENING: Remove remaining public INSERT policies and lock down to edge function only

-- Remove old public insert policies that bypass tenant scoping
DROP POLICY IF EXISTS "public_can_insert_newsletter" ON newsletter_subscribers;
DROP POLICY IF EXISTS "Allow public insert for subscriptions" ON subscriber_list_members;

-- Add service role insert policy for edge functions (uses service_role key)
-- Note: Edge functions with service_role bypass RLS, so no policy needed for them

-- Create audit/tracking policy for anonymous subscribe attempts (read-only for debugging)
CREATE POLICY "Service role can manage newsletter_subscribers"
ON newsletter_subscribers FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role can manage subscriber_list_members"
ON subscriber_list_members FOR ALL  
TO service_role
USING (true)
WITH CHECK (true);