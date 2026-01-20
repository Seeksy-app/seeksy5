-- Create SMS consent tracking table for Twilio compliance
CREATE TABLE public.sms_consent_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number text NOT NULL,
  consent_given boolean NOT NULL DEFAULT false,
  consent_text text NOT NULL,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create notification preferences table
CREATE TABLE public.notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type text NOT NULL, -- 'meeting_confirmation', 'event_registration', 'ticket_assignment', 'meeting_reminder'
  email_enabled boolean NOT NULL DEFAULT true,
  sms_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, notification_type)
);

-- Enable RLS
ALTER TABLE public.sms_consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies for SMS consent records
CREATE POLICY "Users can view their own consent records"
  ON public.sms_consent_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own consent records"
  ON public.sms_consent_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all consent records"
  ON public.sms_consent_records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- RLS policies for notification preferences
CREATE POLICY "Users can view their own preferences"
  ON public.notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON public.notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON public.notification_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_sms_consent_user_id ON public.sms_consent_records(user_id);
CREATE INDEX idx_sms_consent_phone ON public.sms_consent_records(phone_number);
CREATE INDEX idx_notification_prefs_user_id ON public.notification_preferences(user_id);

-- Add timestamp trigger
CREATE TRIGGER update_sms_consent_records_updated_at
  BEFORE UPDATE ON public.sms_consent_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();