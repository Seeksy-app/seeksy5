-- Add phone field to event_registrations table
ALTER TABLE public.event_registrations 
ADD COLUMN attendee_phone text;