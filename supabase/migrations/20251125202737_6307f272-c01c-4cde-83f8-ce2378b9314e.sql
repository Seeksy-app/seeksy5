-- Add SMS notification preference columns to user_preferences table
ALTER TABLE public.user_preferences
ADD COLUMN IF NOT EXISTS sms_notifications_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sms_meeting_confirmations BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS sms_event_registrations BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS sms_ticket_assignments BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS sms_meeting_reminders BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS sms_maintenance_alerts BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS sms_feature_updates BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sms_follower_requests BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sms_new_account_alerts BOOLEAN DEFAULT true;