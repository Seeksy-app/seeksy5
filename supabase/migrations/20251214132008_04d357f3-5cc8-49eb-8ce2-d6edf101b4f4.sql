-- =====================================================
-- PHASE 1: MIGRATE SHARED ENGINES TO TENANT SCOPE
-- =====================================================

-- 1. Add tenant_id to subscriber_lists
ALTER TABLE public.subscriber_lists
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);

-- 2. Add tenant_id to marketing_campaigns
ALTER TABLE public.marketing_campaigns
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);

-- 3. Add tenant_id to cta_definitions
ALTER TABLE public.cta_definitions
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);

-- 4. Add tenant_id to newsletter_subscribers
ALTER TABLE public.newsletter_subscribers
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);

-- 5. Add tenant_id to campaign_lists (junction table)
ALTER TABLE public.campaign_lists
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);

-- 6. Add tenant_id to contact_lists (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contact_lists' AND table_schema = 'public') THEN
    EXECUTE 'ALTER TABLE public.contact_lists ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id)';
  END IF;
END $$;

-- 7. Add tenant_id to email_campaigns
ALTER TABLE public.email_campaigns
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);

-- 8. Add tenant_id to subscriber_list_members
ALTER TABLE public.subscriber_list_members
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);

-- 9. Create indexes for tenant_id on all tables
CREATE INDEX IF NOT EXISTS idx_subscriber_lists_tenant ON public.subscriber_lists(tenant_id);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_tenant ON public.marketing_campaigns(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cta_definitions_tenant ON public.cta_definitions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_tenant ON public.newsletter_subscribers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_campaign_lists_tenant ON public.campaign_lists(tenant_id);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_tenant ON public.email_campaigns(tenant_id);
CREATE INDEX IF NOT EXISTS idx_subscriber_list_members_tenant ON public.subscriber_list_members(tenant_id);

-- 10. Backfill existing rows with seeksy_platform tenant (platform-level data)
UPDATE public.subscriber_lists 
SET tenant_id = 'a0000000-0000-0000-0000-000000000001'
WHERE tenant_id IS NULL;

UPDATE public.marketing_campaigns 
SET tenant_id = 'a0000000-0000-0000-0000-000000000001'
WHERE tenant_id IS NULL;

UPDATE public.cta_definitions 
SET tenant_id = 'a0000000-0000-0000-0000-000000000001'
WHERE tenant_id IS NULL;

UPDATE public.newsletter_subscribers 
SET tenant_id = 'a0000000-0000-0000-0000-000000000001'
WHERE tenant_id IS NULL;

UPDATE public.campaign_lists 
SET tenant_id = 'a0000000-0000-0000-0000-000000000001'
WHERE tenant_id IS NULL;

UPDATE public.email_campaigns 
SET tenant_id = 'a0000000-0000-0000-0000-000000000001'
WHERE tenant_id IS NULL;

UPDATE public.subscriber_list_members 
SET tenant_id = 'a0000000-0000-0000-0000-000000000001'
WHERE tenant_id IS NULL;

-- 11. Add RLS policies for tenant-scoped tables

-- subscriber_lists RLS
DROP POLICY IF EXISTS "Platform admins manage subscriber_lists" ON public.subscriber_lists;
DROP POLICY IF EXISTS "Tenant members view subscriber_lists" ON public.subscriber_lists;
DROP POLICY IF EXISTS "Tenant editors manage subscriber_lists" ON public.subscriber_lists;

CREATE POLICY "Platform admins manage subscriber_lists"
  ON public.subscriber_lists FOR ALL
  USING (is_seeksy_platform_admin());

CREATE POLICY "Tenant members view subscriber_lists"
  ON public.subscriber_lists FOR SELECT
  USING (has_tenant_role(tenant_id, 'viewer'));

CREATE POLICY "Tenant editors manage subscriber_lists"
  ON public.subscriber_lists FOR ALL
  USING (has_tenant_role(tenant_id, 'editor'));

-- marketing_campaigns RLS
DROP POLICY IF EXISTS "Platform admins manage marketing_campaigns" ON public.marketing_campaigns;
DROP POLICY IF EXISTS "Tenant members view marketing_campaigns" ON public.marketing_campaigns;
DROP POLICY IF EXISTS "Tenant editors manage marketing_campaigns" ON public.marketing_campaigns;

CREATE POLICY "Platform admins manage marketing_campaigns"
  ON public.marketing_campaigns FOR ALL
  USING (is_seeksy_platform_admin());

CREATE POLICY "Tenant members view marketing_campaigns"
  ON public.marketing_campaigns FOR SELECT
  USING (has_tenant_role(tenant_id, 'viewer'));

CREATE POLICY "Tenant editors manage marketing_campaigns"
  ON public.marketing_campaigns FOR ALL
  USING (has_tenant_role(tenant_id, 'editor'));

-- cta_definitions RLS
DROP POLICY IF EXISTS "Anyone can read active CTAs" ON public.cta_definitions;
DROP POLICY IF EXISTS "Admins can manage CTAs" ON public.cta_definitions;
DROP POLICY IF EXISTS "Platform admins manage cta_definitions" ON public.cta_definitions;
DROP POLICY IF EXISTS "Tenant members view cta_definitions" ON public.cta_definitions;
DROP POLICY IF EXISTS "Tenant editors manage cta_definitions" ON public.cta_definitions;

CREATE POLICY "Platform admins manage cta_definitions"
  ON public.cta_definitions FOR ALL
  USING (is_seeksy_platform_admin());

CREATE POLICY "Tenant members view cta_definitions"
  ON public.cta_definitions FOR SELECT
  USING (has_tenant_role(tenant_id, 'viewer'));

CREATE POLICY "Tenant editors manage cta_definitions"
  ON public.cta_definitions FOR ALL
  USING (has_tenant_role(tenant_id, 'editor'));

-- Public can read active CTAs (for subscribe forms)
CREATE POLICY "Public can read active CTAs"
  ON public.cta_definitions FOR SELECT
  USING (is_active = true);

-- newsletter_subscribers RLS
DROP POLICY IF EXISTS "Platform admins manage newsletter_subscribers" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Tenant members view newsletter_subscribers" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Tenant editors manage newsletter_subscribers" ON public.newsletter_subscribers;

CREATE POLICY "Platform admins manage newsletter_subscribers"
  ON public.newsletter_subscribers FOR ALL
  USING (is_seeksy_platform_admin());

CREATE POLICY "Tenant members view newsletter_subscribers"
  ON public.newsletter_subscribers FOR SELECT
  USING (has_tenant_role(tenant_id, 'viewer'));

CREATE POLICY "Tenant editors manage newsletter_subscribers"
  ON public.newsletter_subscribers FOR ALL
  USING (has_tenant_role(tenant_id, 'editor'));

-- Public can subscribe (insert only)
CREATE POLICY "Public can subscribe"
  ON public.newsletter_subscribers FOR INSERT
  WITH CHECK (true);

-- email_campaigns RLS
DROP POLICY IF EXISTS "Platform admins manage email_campaigns" ON public.email_campaigns;
DROP POLICY IF EXISTS "Tenant members view email_campaigns" ON public.email_campaigns;
DROP POLICY IF EXISTS "Tenant editors manage email_campaigns" ON public.email_campaigns;

CREATE POLICY "Platform admins manage email_campaigns"
  ON public.email_campaigns FOR ALL
  USING (is_seeksy_platform_admin());

CREATE POLICY "Tenant members view email_campaigns"
  ON public.email_campaigns FOR SELECT
  USING (has_tenant_role(tenant_id, 'viewer'));

CREATE POLICY "Tenant editors manage email_campaigns"
  ON public.email_campaigns FOR ALL
  USING (has_tenant_role(tenant_id, 'editor'));