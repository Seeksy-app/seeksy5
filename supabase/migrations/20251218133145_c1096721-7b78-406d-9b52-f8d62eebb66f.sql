-- Fix board_meeting_notes delete policy to properly include board_admin role
-- The existing ALL policy for board_admins_manage_meeting_notes only allows super_admin and admin
-- This drops the overly restrictive ALL policy and keeps the DELETE-specific one

DROP POLICY IF EXISTS board_admins_manage_meeting_notes ON public.board_meeting_notes;

-- Recreate as a more targeted policy that includes board_admin for all operations
CREATE POLICY "board_admins_full_access" ON public.board_meeting_notes
FOR ALL
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'board_admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'board_admin'::app_role)
);