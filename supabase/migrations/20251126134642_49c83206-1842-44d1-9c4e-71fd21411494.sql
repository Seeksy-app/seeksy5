-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can view their own meetings" ON meetings;

-- Create new policy that allows users to see meetings they created OR are attending
CREATE POLICY "Users can view their meetings and meetings they attend"
ON meetings
FOR SELECT
USING (
  auth.uid() = user_id 
  OR 
  EXISTS (
    SELECT 1 FROM meeting_attendees
    WHERE meeting_attendees.meeting_id = meetings.id
    AND meeting_attendees.attendee_email IN (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  )
);