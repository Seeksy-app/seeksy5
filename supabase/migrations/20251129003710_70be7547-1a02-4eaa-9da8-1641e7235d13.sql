
-- Add admin override policies for podcasts
CREATE POLICY "Admins can view all podcasts"
ON public.podcasts
FOR SELECT
TO public
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

CREATE POLICY "Admins can manage all podcasts"
ON public.podcasts
FOR ALL
TO public
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

-- Add admin override policies for episodes
CREATE POLICY "Admins can view all episodes"
ON public.episodes
FOR SELECT
TO public
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

CREATE POLICY "Admins can manage all episodes"
ON public.episodes
FOR ALL
TO public
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

-- Ensure the has_role function exists and is properly configured
-- (This should already exist from previous migrations, but confirming)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
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
      AND role = _role
  )
$$;
