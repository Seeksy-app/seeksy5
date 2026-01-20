-- Create meeting_attendees table for many-to-many relationship
CREATE TABLE IF NOT EXISTS public.meeting_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  attendee_name TEXT NOT NULL,
  attendee_email TEXT NOT NULL,
  attendee_phone TEXT,
  rsvp_status TEXT DEFAULT 'awaiting' CHECK (rsvp_status IN ('awaiting', 'attending', 'not_attending', 'maybe')),
  rsvp_timestamp TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(meeting_id, attendee_email)
);

-- Add recording fields to meetings table
ALTER TABLE public.meetings 
ADD COLUMN IF NOT EXISTS recording_url TEXT,
ADD COLUMN IF NOT EXISTS recording_duration INTEGER,
ADD COLUMN IF NOT EXISTS recording_size BIGINT;

-- Enable RLS
ALTER TABLE public.meeting_attendees ENABLE ROW LEVEL SECURITY;

-- RLS policies for meeting_attendees
CREATE POLICY "Users can view attendees for their meetings"
  ON public.meeting_attendees FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.meetings
      WHERE meetings.id = meeting_attendees.meeting_id
      AND meetings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert attendees for their meetings"
  ON public.meeting_attendees FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.meetings
      WHERE meetings.id = meeting_attendees.meeting_id
      AND meetings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update attendees for their meetings"
  ON public.meeting_attendees FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.meetings
      WHERE meetings.id = meeting_attendees.meeting_id
      AND meetings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete attendees for their meetings"
  ON public.meeting_attendees FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.meetings
      WHERE meetings.id = meeting_attendees.meeting_id
      AND meetings.user_id = auth.uid()
    )
  );

-- Migrate existing meeting data to attendees table
INSERT INTO public.meeting_attendees (meeting_id, attendee_name, attendee_email, attendee_phone, rsvp_status, rsvp_timestamp)
SELECT 
  id as meeting_id,
  attendee_name,
  attendee_email,
  attendee_phone,
  attendee_rsvp_status as rsvp_status,
  attendee_rsvp_timestamp as rsvp_timestamp
FROM public.meetings
WHERE attendee_name IS NOT NULL
ON CONFLICT (meeting_id, attendee_email) DO NOTHING;