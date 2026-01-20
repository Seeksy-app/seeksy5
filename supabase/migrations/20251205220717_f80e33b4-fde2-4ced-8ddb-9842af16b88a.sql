-- Drop the problematic policy that directly queries auth.users
DROP POLICY IF EXISTS "attendees_select_self" ON public.meeting_attendees;

-- Recreate using the security definer function instead
CREATE POLICY "attendees_select_self" 
ON public.meeting_attendees 
FOR SELECT 
TO public 
USING (lower(attendee_email) = lower(public.get_current_user_email()));