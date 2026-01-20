-- Drop existing insert policy and create a more permissive one
DROP POLICY IF EXISTS "Board members can insert meeting notes" ON public.board_meeting_notes;

-- Allow admins, super_admins, and board_members to insert
CREATE POLICY "Authorized users can insert meeting notes" 
ON public.board_meeting_notes 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    public.has_role(auth.uid(), 'super_admin'::app_role) OR
    public.has_role(auth.uid(), 'admin'::app_role) OR
    public.has_role(auth.uid(), 'board_member'::app_role)
  )
);