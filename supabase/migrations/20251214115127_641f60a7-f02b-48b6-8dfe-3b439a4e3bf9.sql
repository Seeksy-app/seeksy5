-- =========================================
-- NEWSLETTER SUBSCRIBE: FULL FIX
-- =========================================

-- 1) Ensure unique emails (no duplicates)
CREATE UNIQUE INDEX IF NOT EXISTS newsletter_subscribers_email_unique
ON newsletter_subscribers (email);

-- 2) Enable RLS (required for Supabase)
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- 3) Allow PUBLIC / ANONYMOUS inserts (subscribe form)
DROP POLICY IF EXISTS "public_can_insert_newsletter" ON newsletter_subscribers;
DROP POLICY IF EXISTS "Allow public newsletter subscriptions" ON newsletter_subscribers;
DROP POLICY IF EXISTS "Allow public to check own email subscription" ON newsletter_subscribers;

CREATE POLICY "public_can_insert_newsletter"
ON newsletter_subscribers
FOR INSERT
TO public
WITH CHECK (true);

-- 4) Allow ADMINS to read / manage subscribers
DROP POLICY IF EXISTS "admin_manage_newsletter" ON newsletter_subscribers;
DROP POLICY IF EXISTS "admin_newsletter" ON newsletter_subscribers;

CREATE POLICY "admin_manage_newsletter"
ON newsletter_subscribers
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);