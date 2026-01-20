-- Drop ALL existing policies on meetings table
DROP POLICY IF EXISTS "Users can manage their meetings and meetings they attend" ON public.meetings;
DROP POLICY IF EXISTS "Users can view their meetings and meetings they attend" ON public.meetings;
DROP POLICY IF EXISTS "Users can create their own meetings" ON public.meetings;
DROP POLICY IF EXISTS "Users can update their own meetings" ON public.meetings;
DROP POLICY IF EXISTS "Users can delete their own meetings" ON public.meetings;

-- Create separate policies for different operations to avoid recursion

-- INSERT: Only check ownership (no need to check attendees on creation)
CREATE POLICY "meetings_insert_policy"
ON public.meetings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- SELECT: Check ownership or attendee status
CREATE POLICY "meetings_select_policy"
ON public.meetings
FOR SELECT
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM meeting_attendees ma 
    WHERE ma.meeting_id = meetings.id 
    AND ma.attendee_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

-- UPDATE: Only owner can update
CREATE POLICY "meetings_update_policy"
ON public.meetings
FOR UPDATE
USING (auth.uid() = user_id);

-- DELETE: Only owner can delete
CREATE POLICY "meetings_delete_policy"
ON public.meetings
FOR DELETE
USING (auth.uid() = user_id);