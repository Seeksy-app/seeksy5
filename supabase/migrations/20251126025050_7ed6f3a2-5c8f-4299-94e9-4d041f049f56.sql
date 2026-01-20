-- Add RSVP tracking fields to meetings table
ALTER TABLE public.meetings 
ADD COLUMN IF NOT EXISTS attendee_rsvp_status TEXT DEFAULT 'awaiting' CHECK (attendee_rsvp_status IN ('awaiting', 'attending', 'not_attending', 'maybe')),
ADD COLUMN IF NOT EXISTS attendee_rsvp_timestamp TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS attendee_rsvp_method TEXT CHECK (attendee_rsvp_method IN ('sms', 'email'));

COMMENT ON COLUMN public.meetings.attendee_rsvp_status IS 'RSVP confirmation status: awaiting, attending, not_attending, or maybe';
COMMENT ON COLUMN public.meetings.attendee_rsvp_timestamp IS 'Timestamp when RSVP was received';
COMMENT ON COLUMN public.meetings.attendee_rsvp_method IS 'Method used for RSVP: sms or email';