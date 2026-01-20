-- HARDENING: Lock down newsletter_subscribers and subscriber_list_members

-- 1. Drop any existing public INSERT policy that allows anonymous direct inserts
DROP POLICY IF EXISTS "newsletter_subscribers_public_insert" ON newsletter_subscribers;
DROP POLICY IF EXISTS "Public can subscribe" ON newsletter_subscribers;
DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON newsletter_subscribers;

-- 2. Add unique constraint: one email per tenant (allows same email in different tenants)
ALTER TABLE newsletter_subscribers 
ADD CONSTRAINT newsletter_subscribers_tenant_email_unique UNIQUE (tenant_id, email);

-- 3. Make tenant_id NOT NULL (already confirmed no NULL rows)
ALTER TABLE newsletter_subscribers 
ALTER COLUMN tenant_id SET NOT NULL;

-- 4. Make tenant_id NOT NULL on subscriber_list_members
ALTER TABLE subscriber_list_members 
ALTER COLUMN tenant_id SET NOT NULL;

-- 5. Add unique constraint on subscriber_list_members: one subscriber per list per tenant
ALTER TABLE subscriber_list_members 
ADD CONSTRAINT subscriber_list_members_tenant_list_subscriber_unique 
UNIQUE (tenant_id, list_id, subscriber_id);

-- 6. Create index for faster tenant-scoped queries
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_tenant_email 
ON newsletter_subscribers(tenant_id, email);

CREATE INDEX IF NOT EXISTS idx_subscriber_list_members_tenant_list 
ON subscriber_list_members(tenant_id, list_id);