-- Create security definer function to get current user's email safely
CREATE OR REPLACE FUNCTION public.get_current_user_email()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM auth.users WHERE id = auth.uid()
$$;

-- Drop the problematic policy
DROP POLICY IF EXISTS "meetings_select_attendee" ON public.meetings;

-- Recreate the policy using the security definer function
CREATE POLICY "meetings_select_attendee" ON public.meetings
FOR SELECT
USING (
  id IN (
    SELECT meeting_id FROM meeting_attendees
    WHERE lower(attendee_email) = lower(public.get_current_user_email())
  )
);