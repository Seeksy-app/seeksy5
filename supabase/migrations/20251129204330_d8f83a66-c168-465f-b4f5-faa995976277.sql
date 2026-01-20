-- Add new roles to app_role enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'subscriber';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'influencer';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'agency';

-- Create a helper function to check if user has any of the specified roles
CREATE OR REPLACE FUNCTION public.user_has_any_role(_user_id uuid, _roles text[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role::text = ANY(_roles)
  )
$$;