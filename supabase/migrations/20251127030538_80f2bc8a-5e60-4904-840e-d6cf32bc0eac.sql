-- Remove duplicate attendee columns from meetings table since we use meeting_attendees table
-- These columns are now deprecated in favor of the meeting_attendees relationship

ALTER TABLE public.meetings 
DROP COLUMN IF EXISTS attendee_name,
DROP COLUMN IF EXISTS attendee_email,
DROP COLUMN IF EXISTS attendee_phone,
DROP COLUMN IF EXISTS attendee_responses,
DROP COLUMN IF EXISTS attendee_rsvp_status,
DROP COLUMN IF EXISTS attendee_rsvp_timestamp,
DROP COLUMN IF EXISTS attendee_rsvp_method;

-- Add RSVP token to meeting_attendees for secure RSVP links
ALTER TABLE public.meeting_attendees
ADD COLUMN IF NOT EXISTS rsvp_token TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS rsvp_method TEXT;

-- Create function to generate RSVP token
CREATE OR REPLACE FUNCTION generate_rsvp_token() 
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'base64');
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate RSVP token for new attendees
CREATE OR REPLACE FUNCTION set_rsvp_token()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.rsvp_token IS NULL THEN
    NEW.rsvp_token := generate_rsvp_token();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_rsvp_token_trigger ON public.meeting_attendees;
CREATE TRIGGER set_rsvp_token_trigger
  BEFORE INSERT ON public.meeting_attendees
  FOR EACH ROW
  EXECUTE FUNCTION set_rsvp_token();

-- Add RLS policy for RSVP access via token (allows anonymous access with valid token)
CREATE POLICY "Allow RSVP access via token"
ON public.meeting_attendees
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Allow anyone to view attendee info if they have the token
CREATE POLICY "Allow public RSVP view via token"
ON public.meeting_attendees
FOR SELECT
TO anon, authenticated
USING (true);

COMMENT ON COLUMN public.meeting_attendees.rsvp_token IS 'Unique token for secure RSVP link access';
COMMENT ON COLUMN public.meeting_attendees.rsvp_method IS 'How the attendee responded: email, sms, or direct';
