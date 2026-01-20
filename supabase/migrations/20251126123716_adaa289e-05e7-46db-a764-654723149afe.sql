-- Add RLS policies for newsletter_subscribers
CREATE POLICY "Users can view their own subscribers"
ON public.newsletter_subscribers
FOR SELECT
USING (auth.uid() = user_id OR auth.uid() IN (SELECT id FROM auth.users WHERE email IN (SELECT email FROM newsletter_subscribers WHERE id = newsletter_subscribers.id)));

CREATE POLICY "Anyone can subscribe"
ON public.newsletter_subscribers
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update their own subscription"
ON public.newsletter_subscribers
FOR UPDATE
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR auth.uid() = user_id);