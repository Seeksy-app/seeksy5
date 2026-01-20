-- 1. Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can read platform tenant" ON public.tenants;

-- 2. Add safer policy: only admin/super_admin can read platform tenant
CREATE POLICY "Admins can read platform tenant"
ON public.tenants
FOR SELECT
USING (
  tenant_type = 'seeksy_platform'
  AND EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role IN ('super_admin', 'admin')
  )
);

-- 3. Create function to auto-create platform membership for admin users
CREATE OR REPLACE FUNCTION public.ensure_admin_platform_membership()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  platform_tenant_id UUID := 'a0000000-0000-0000-0000-000000000001';
BEGIN
  -- Only for admin/super_admin roles
  IF NEW.role IN ('admin', 'super_admin') THEN
    INSERT INTO public.tenant_memberships (tenant_id, user_id, role, is_default)
    VALUES (platform_tenant_id, NEW.user_id, 'admin', true)
    ON CONFLICT (tenant_id, user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- 4. Create trigger to auto-assign on role insert
DROP TRIGGER IF EXISTS ensure_admin_platform_membership_trigger ON public.user_roles;
CREATE TRIGGER ensure_admin_platform_membership_trigger
AFTER INSERT ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.ensure_admin_platform_membership();

-- 5. Backfill: create memberships for existing admin/super_admin users
INSERT INTO public.tenant_memberships (tenant_id, user_id, role, is_default)
SELECT 
  'a0000000-0000-0000-0000-000000000001'::uuid,
  ur.user_id,
  'admin',
  true
FROM public.user_roles ur
WHERE ur.role IN ('admin', 'super_admin')
ON CONFLICT (tenant_id, user_id) DO NOTHING;