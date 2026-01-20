-- Create email_templates table
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key TEXT UNIQUE NOT NULL,
  template_name TEXT NOT NULL,
  description TEXT,
  variables JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  version TEXT DEFAULT '1.0',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Allow admins to manage templates
CREATE POLICY "Admins can manage email templates"
  ON email_templates
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin')
    )
  );

-- Allow all authenticated users to read active templates
CREATE POLICY "Users can read active email templates"
  ON email_templates
  FOR SELECT
  USING (is_active = true);

-- Create updated_at trigger
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Seed email templates
INSERT INTO email_templates (template_key, template_name, description, variables, is_active, version) VALUES
(
  'welcome',
  'Welcome Email',
  'Sent when a new account is created',
  '{"name": "User first name"}'::jsonb,
  true,
  '1.0'
),
(
  'verify-email',
  'Verify Your Email',
  'Sent during login/signup flow for email verification',
  '{"code": "6-digit verification code"}'::jsonb,
  true,
  '1.0'
),
(
  'password-reset',
  'Password Reset',
  'Sent when user requests password reset',
  '{"resetLink": "Password reset URL with token"}'::jsonb,
  true,
  '1.0'
),
(
  'meeting-invitation',
  'Meeting Invitation',
  'Sent from Meetings module to invite participants',
  '{"hostName": "Meeting host name", "meetingTitle": "Meeting title", "date": "Meeting date", "time": "Meeting time", "meetingLink": "Join meeting URL"}'::jsonb,
  true,
  '1.0'
),
(
  'event-registration',
  'Event Registration Confirmation',
  'Sent from Events module after registration',
  '{"eventName": "Event name", "date": "Event date", "time": "Event time", "location": "Event location", "addToCalendarLink": "Calendar link"}'::jsonb,
  true,
  '1.0'
),
(
  'podcast-published',
  'Podcast Episode Published',
  'Sent when a new podcast episode is published',
  '{"episodeTitle": "Episode title", "showName": "Podcast name", "episodeLink": "Listen link"}'::jsonb,
  true,
  '1.0'
),
(
  'ai-production-ready',
  'AI Post-Production Ready',
  'Sent when AI editing completes from Studio',
  '{"sessionTitle": "Studio session title", "downloadLink": "Download assets link", "clipsLink": "View clips link"}'::jsonb,
  true,
  '1.0'
),
(
  'new-subscriber',
  'New Subscriber Joined',
  'Sent when someone subscribes to creator content',
  '{"subscriberEmail": "Subscriber email address", "preferencesLink": "View subscriber link"}'::jsonb,
  true,
  '1.0'
),
(
  'campaign-email',
  'Campaign Email',
  'Template for email marketing campaigns',
  '{"subject": "Email subject", "body": "Email body HTML", "ctaText": "Button text (optional)", "ctaLink": "Button URL (optional)"}'::jsonb,
  true,
  '1.0'
),
(
  'identity-verified',
  'Identity Verified',
  'Sent when Face or Voice identity is verified',
  '{"type": "Face or Voice", "certificateUrl": "View certificate link"}'::jsonb,
  true,
  '1.0'
)
ON CONFLICT (template_key) DO NOTHING;