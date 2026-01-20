-- Drop the problematic policy and function
DROP POLICY IF EXISTS "Users can view their meetings and meetings they attend" ON meetings;
DROP FUNCTION IF EXISTS public.can_view_meeting(_user_id uuid, _meeting_id uuid);

-- Create a simple, direct policy without recursion
CREATE POLICY "Users can view their meetings and meetings they attend"
ON meetings
FOR SELECT
USING (
  -- Users can see meetings they created
  auth.uid() = user_id
  OR
  -- Users can see meetings where their email matches the primary attendee
  (SELECT email FROM auth.users WHERE id = auth.uid()) = attendee_email
  OR
  -- Users can see meetings where they are in the attendees list
  auth.uid() IN (
    SELECT ma.attendee_email::uuid 
    FROM meeting_attendees ma
    WHERE ma.meeting_id = meetings.id
    AND ma.attendee_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);