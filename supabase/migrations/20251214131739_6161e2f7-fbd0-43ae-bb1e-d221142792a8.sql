-- =====================================================
-- PHASE 0: MULTI-TENANT FOUNDATION
-- =====================================================

-- 1. Create tenant_type enum
CREATE TYPE public.tenant_type AS ENUM (
  'seeksy_platform',
  'creator',
  'advertiser',
  'board',
  'subscriber'
);

-- 2. Create tenant_role enum
CREATE TYPE public.tenant_role AS ENUM (
  'viewer',
  'editor',
  'admin'
);

-- 3. Create tenants table
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_type public.tenant_type NOT NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  metadata JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Create tenant_memberships table
CREATE TABLE public.tenant_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.tenant_role NOT NULL DEFAULT 'viewer',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, user_id)
);

-- 5. Create indexes
CREATE INDEX idx_tenants_type ON public.tenants(tenant_type);
CREATE INDEX idx_tenants_slug ON public.tenants(slug);
CREATE INDEX idx_tenant_memberships_user_id ON public.tenant_memberships(user_id);
CREATE INDEX idx_tenant_memberships_tenant_id ON public.tenant_memberships(tenant_id);
CREATE INDEX idx_tenant_memberships_user_tenant ON public.tenant_memberships(user_id, tenant_id);

-- 6. Create helper function: get_user_tenant_ids
CREATE OR REPLACE FUNCTION public.get_user_tenant_ids(_user_id UUID DEFAULT auth.uid())
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT tenant_id FROM public.tenant_memberships WHERE user_id = _user_id
$$;

-- 7. Create helper function: is_seeksy_platform_admin
CREATE OR REPLACE FUNCTION public.is_seeksy_platform_admin(_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.tenant_memberships tm
    JOIN public.tenants t ON t.id = tm.tenant_id
    WHERE tm.user_id = _user_id
      AND t.tenant_type = 'seeksy_platform'
      AND tm.role = 'admin'
  )
$$;

-- 8. Create helper function: has_tenant_role
CREATE OR REPLACE FUNCTION public.has_tenant_role(
  _tenant_id UUID,
  _min_role public.tenant_role DEFAULT 'viewer',
  _user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.tenant_memberships
    WHERE tenant_id = _tenant_id
      AND user_id = _user_id
      AND (
        (_min_role = 'viewer') OR
        (_min_role = 'editor' AND role IN ('editor', 'admin')) OR
        (_min_role = 'admin' AND role = 'admin')
      )
  )
$$;

-- 9. Create helper function: get_user_default_tenant
CREATE OR REPLACE FUNCTION public.get_user_default_tenant(_user_id UUID DEFAULT auth.uid())
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT tenant_id 
  FROM public.tenant_memberships 
  WHERE user_id = _user_id AND is_default = true
  LIMIT 1
$$;

-- 10. Enable RLS on tenants
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins can manage all tenants"
  ON public.tenants FOR ALL
  USING (is_seeksy_platform_admin());

CREATE POLICY "Users can view tenants they belong to"
  ON public.tenants FOR SELECT
  USING (id IN (SELECT get_user_tenant_ids()));

-- 11. Enable RLS on tenant_memberships
ALTER TABLE public.tenant_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins can manage all memberships"
  ON public.tenant_memberships FOR ALL
  USING (is_seeksy_platform_admin());

CREATE POLICY "Users can view their own memberships"
  ON public.tenant_memberships FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Tenant admins can manage memberships in their tenant"
  ON public.tenant_memberships FOR ALL
  USING (has_tenant_role(tenant_id, 'admin'));

-- 12. Create updated_at trigger
CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tenant_memberships_updated_at
  BEFORE UPDATE ON public.tenant_memberships
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 13. Seed the Seeksy Platform tenant
INSERT INTO public.tenants (id, tenant_type, name, slug)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'seeksy_platform',
  'Seeksy Platform',
  'seeksy-platform'
);

-- 14. Create function to auto-create creator tenant on signup
CREATE OR REPLACE FUNCTION public.create_user_tenant()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  new_tenant_id UUID;
  user_name TEXT;
BEGIN
  -- Get user's name from metadata or email
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    SPLIT_PART(NEW.email, '@', 1)
  );
  
  -- Create a personal creator tenant for the user
  INSERT INTO public.tenants (tenant_type, name, slug)
  VALUES (
    'creator',
    user_name || '''s Workspace',
    'creator-' || NEW.id::text
  )
  RETURNING id INTO new_tenant_id;
  
  -- Add user as admin of their own tenant
  INSERT INTO public.tenant_memberships (tenant_id, user_id, role, is_default)
  VALUES (new_tenant_id, NEW.id, 'admin', true);
  
  RETURN NEW;
END;
$$;

-- 15. Attach trigger to auth.users (runs after profile creation)
CREATE TRIGGER on_auth_user_created_tenant
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_user_tenant();