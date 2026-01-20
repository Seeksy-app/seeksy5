-- Drop the policy with incorrect logic
DROP POLICY IF EXISTS "Users can view their meetings and meetings they attend" ON meetings;

-- Create corrected policy
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
  -- Users can see meetings where they are in the meeting_attendees table
  EXISTS (
    SELECT 1 
    FROM meeting_attendees ma
    WHERE ma.meeting_id = meetings.id
    AND ma.attendee_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);