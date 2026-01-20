-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view their meetings and meetings they attend" ON meetings;

-- Create a security definer function to check meeting access
CREATE OR REPLACE FUNCTION public.can_view_meeting(_user_id uuid, _meeting_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  meeting_owner_id uuid;
  user_email text;
  is_attendee boolean;
BEGIN
  -- Get the meeting owner
  SELECT user_id INTO meeting_owner_id
  FROM meetings
  WHERE id = _meeting_id;
  
  -- If user is the meeting owner, they can view it
  IF meeting_owner_id = _user_id THEN
    RETURN true;
  END IF;
  
  -- Get the user's email
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = _user_id;
  
  -- Check if user is an attendee
  SELECT EXISTS (
    SELECT 1 FROM meeting_attendees
    WHERE meeting_id = _meeting_id
    AND attendee_email = user_email
  ) INTO is_attendee;
  
  RETURN is_attendee;
END;
$$;

-- Create the new policy using the function
CREATE POLICY "Users can view their meetings and meetings they attend"
ON meetings
FOR SELECT
USING (public.can_view_meeting(auth.uid(), id));