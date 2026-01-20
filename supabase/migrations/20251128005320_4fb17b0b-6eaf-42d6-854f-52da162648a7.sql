-- CRITICAL SECURITY FIX: Phase 1 - Fix most critical token/credential exposure
-- Focus on tables with OAuth tokens, API keys, and credentials that MUST be protected

-- Helper function
CREATE OR REPLACE FUNCTION drop_policies(tname text) RETURNS void LANGUAGE plpgsql AS $$
DECLARE p RECORD;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = tname LOOP
    EXECUTE format('DROP POLICY %I ON %I', p.policyname, tname);
  END LOOP;
END $$;

-- 1. PROFILES - personal data (names, emails, phones, Stripe IDs)
SELECT drop_policies('profiles');
CREATE POLICY "own_profile" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "admin_profiles" ON profiles FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- 2. CONTACTS - customer data
SELECT drop_policies('contacts');
CREATE POLICY "own_contacts" ON contacts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "admin_contacts" ON contacts FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- 3. SOCIAL_ACCOUNTS - OAuth tokens
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;
SELECT drop_policies('social_accounts');
CREATE POLICY "own_social" ON social_accounts FOR ALL USING (auth.uid() = user_id);

-- 4. CALENDAR_CONNECTIONS - calendar tokens
SELECT drop_policies('calendar_connections');
CREATE POLICY "own_calendar" ON calendar_connections FOR ALL USING (auth.uid() = user_id);

-- 5. ZOOM_CONNECTIONS - Zoom credentials
SELECT drop_policies('zoom_connections');
CREATE POLICY "own_zoom" ON zoom_connections FOR ALL USING (auth.uid() = user_id);

-- 6. GMAIL_CONNECTIONS - Gmail tokens
SELECT drop_policies('gmail_connections');
CREATE POLICY "own_gmail" ON gmail_connections FOR ALL USING (auth.uid() = user_id);

-- 7. MICROSOFT_CONNECTIONS - Microsoft tokens
SELECT drop_policies('microsoft_connections');
CREATE POLICY "own_microsoft" ON microsoft_connections FOR ALL USING (auth.uid() = user_id);

-- 8. CREATOR_SHOPIFY_STORES - Shopify credentials
ALTER TABLE creator_shopify_stores ENABLE ROW LEVEL SECURITY;
SELECT drop_policies('creator_shopify_stores');
CREATE POLICY "own_shopify" ON creator_shopify_stores FOR ALL USING (auth.uid() = user_id);

-- 9. SOCIAL_MEDIA_ACCOUNTS - social tokens
ALTER TABLE social_media_accounts ENABLE ROW LEVEL SECURITY;
SELECT drop_policies('social_media_accounts');
CREATE POLICY "own_social_media" ON social_media_accounts FOR ALL USING (auth.uid() = user_id);

-- 10. NEWSLETTER_SUBSCRIBERS - email list
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
SELECT drop_policies('newsletter_subscribers');
CREATE POLICY "admin_newsletter" ON newsletter_subscribers FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- 11. INVESTOR_SHARES - access codes
SELECT drop_policies('investor_shares');
CREATE POLICY "admin_investor" ON investor_shares FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- 12. ACTIVITY_LOGS - add SELECT policy
SELECT drop_policies('activity_logs');
CREATE POLICY "own_activity_insert" ON activity_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_activity_select" ON activity_logs FOR SELECT USING (auth.uid() = user_id);

DROP FUNCTION drop_policies(text);