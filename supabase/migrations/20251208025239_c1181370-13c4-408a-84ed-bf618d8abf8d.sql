-- Drop the broken triggers that reference non-existent attendee_email column
DROP TRIGGER IF EXISTS on_meeting_booking_created ON public.meetings;
DROP TRIGGER IF EXISTS on_meeting_created ON public.meetings;
DROP TRIGGER IF EXISTS trigger_log_meeting_created ON public.meetings;

-- Drop the broken functions
DROP FUNCTION IF EXISTS handle_meeting_booking();
DROP FUNCTION IF EXISTS log_meeting_created();