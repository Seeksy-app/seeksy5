-- Allow authenticated users to read the seeksy_platform tenant
-- This is needed because admins need to query this tenant for platform-wide operations
CREATE POLICY "Authenticated users can read platform tenant" 
ON public.tenants 
FOR SELECT 
USING (
  auth.role() = 'authenticated' 
  AND tenant_type = 'seeksy_platform'
);

-- Also add policy to allow platform tenant reads for form_templates operations
-- Drop existing policy if it exists and recreate
DROP POLICY IF EXISTS "Authenticated users can read platform tenant" ON public.tenants;

CREATE POLICY "Authenticated users can read platform tenant" 
ON public.tenants 
FOR SELECT 
USING (
  auth.role() = 'authenticated' 
  AND tenant_type = 'seeksy_platform'
);

-- Create tenant membership for super_admin user to seeksy_platform tenant
INSERT INTO public.tenant_memberships (tenant_id, user_id, role, is_default)
SELECT 
  'a0000000-0000-0000-0000-000000000001'::uuid,
  ur.user_id,
  'admin',
  true
FROM public.user_roles ur
WHERE ur.role = 'super_admin'
ON CONFLICT DO NOTHING;