-- Add new integration fields for Events, Signup Sheets, Polls, and QR Codes
ALTER TABLE public.user_preferences 
  ADD COLUMN IF NOT EXISTS module_events_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS module_signup_sheets_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS module_polls_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS module_qr_codes_enabled BOOLEAN DEFAULT false;