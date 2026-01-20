-- Add RLS policy to allow admins to view all support tickets
CREATE POLICY "Admins can view all support tickets"
ON public.client_tickets
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'super_admin')
  )
);