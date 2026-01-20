-- Add missing contacts_enabled column to user_preferences
ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS contacts_enabled BOOLEAN DEFAULT false;

-- Create investor_portal_emails table to track all investor portal access emails
CREATE TABLE IF NOT EXISTS investor_portal_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sent_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  access_code TEXT NOT NULL,
  forecast_type TEXT, -- 'ai' or 'custom'
  resend_email_id TEXT, -- Resend's email ID for tracking
  status TEXT DEFAULT 'sent', -- 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed'
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for investor_portal_emails
ALTER TABLE investor_portal_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their sent investor emails"
  ON investor_portal_emails FOR SELECT
  USING (auth.uid() = sent_by_user_id);

CREATE POLICY "Users can insert their own investor emails"
  ON investor_portal_emails FOR INSERT
  WITH CHECK (auth.uid() = sent_by_user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_investor_portal_emails_sent_by 
  ON investor_portal_emails(sent_by_user_id);

CREATE INDEX IF NOT EXISTS idx_investor_portal_emails_access_code 
  ON investor_portal_emails(access_code);

-- Add trigger for updated_at
CREATE TRIGGER update_investor_portal_emails_updated_at
  BEFORE UPDATE ON investor_portal_emails
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();