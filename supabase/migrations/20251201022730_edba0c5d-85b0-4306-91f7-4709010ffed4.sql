-- Email Platform v1: Unified CRM Email System with Resend Integration

-- Create Email Accounts table (Multi-Gmail)
CREATE TABLE IF NOT EXISTS email_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_address TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'gmail',
  display_name TEXT,
  is_default BOOLEAN DEFAULT false,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  connected_at TIMESTAMPTZ DEFAULT now(),
  last_used_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create Contact Preferences table
CREATE TABLE IF NOT EXISTS contact_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL UNIQUE REFERENCES contacts(id) ON DELETE CASCADE,
  newsletter BOOLEAN DEFAULT true,
  updates BOOLEAN DEFAULT true,
  promotions BOOLEAN DEFAULT true,
  sms_reminders BOOLEAN DEFAULT true,
  global_unsubscribe BOOLEAN DEFAULT false,
  unsubscribed_at TIMESTAMPTZ,
  unsubscribe_reason TEXT,
  preference_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Alter email_campaigns to add new columns
ALTER TABLE email_campaigns 
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS from_email_account_id UUID REFERENCES email_accounts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS template_id UUID,
  ADD COLUMN IF NOT EXISTS html_content TEXT,
  ADD COLUMN IF NOT EXISTS plain_content TEXT,
  ADD COLUMN IF NOT EXISTS recipient_list_id UUID REFERENCES contact_lists(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS recipient_filter JSONB,
  ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS total_recipients INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_sent INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_delivered INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_opened INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_clicked INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_bounced INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_complained INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Alter email_events to add new columns (handle existing recipient_email column)
DO $$ 
BEGIN
  -- If recipient_email exists, rename it to to_email
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='email_events' AND column_name='recipient_email' AND table_schema='public') THEN
    ALTER TABLE email_events RENAME COLUMN recipient_email TO to_email;
  END IF;
  
  -- If event_data exists, rename it to raw_payload
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='email_events' AND column_name='event_data' AND table_schema='public') THEN
    ALTER TABLE email_events RENAME COLUMN event_data TO raw_payload;
  END IF;
END $$;

-- Now add missing columns
ALTER TABLE email_events
  ADD COLUMN IF NOT EXISTS resend_email_id TEXT,
  ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS email_subject TEXT,
  ADD COLUMN IF NOT EXISTS from_email TEXT,
  ADD COLUMN IF NOT EXISTS to_email TEXT,
  ADD COLUMN IF NOT EXISTS link_url TEXT,
  ADD COLUMN IF NOT EXISTS user_agent TEXT,
  ADD COLUMN IF NOT EXISTS ip_address TEXT,
  ADD COLUMN IF NOT EXISTS occurred_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS raw_payload JSONB;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_email_accounts_user_id ON email_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_user_id ON email_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON email_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_email_events_campaign_id ON email_events(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_events_contact_id ON email_events(contact_id);
CREATE INDEX IF NOT EXISTS idx_email_events_resend_email_id ON email_events(resend_email_id);
CREATE INDEX IF NOT EXISTS idx_email_events_event_type ON email_events(event_type);
CREATE INDEX IF NOT EXISTS idx_contact_preferences_contact_id ON contact_preferences(contact_id);

-- Enable RLS on new tables
ALTER TABLE email_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_accounts
DROP POLICY IF EXISTS "Users can manage their own email accounts" ON email_accounts;
CREATE POLICY "Users can manage their own email accounts"
  ON email_accounts FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for email_campaigns  
DROP POLICY IF EXISTS "Users can manage their own campaigns" ON email_campaigns;
CREATE POLICY "Users can manage their own campaigns"
  ON email_campaigns FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for email_events
DROP POLICY IF EXISTS "Users can view email events for their campaigns" ON email_events;
CREATE POLICY "Users can view email events for their campaigns"
  ON email_events FOR SELECT
  USING (
    campaign_id IN (SELECT id FROM email_campaigns WHERE user_id = auth.uid())
    OR contact_id IN (SELECT id FROM contacts WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "System can insert email events" ON email_events;
CREATE POLICY "System can insert email events"
  ON email_events FOR INSERT
  WITH CHECK (true);

-- RLS Policies for contact_preferences
DROP POLICY IF EXISTS "Users can view preferences for their contacts" ON contact_preferences;
CREATE POLICY "Users can view preferences for their contacts"
  ON contact_preferences FOR SELECT
  USING (
    contact_id IN (SELECT id FROM contacts WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can update preferences for their contacts" ON contact_preferences;
CREATE POLICY "Users can update preferences for their contacts"
  ON contact_preferences FOR UPDATE
  USING (
    contact_id IN (SELECT id FROM contacts WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Contacts can update their own preferences via token" ON contact_preferences;
CREATE POLICY "Contacts can update their own preferences via token"
  ON contact_preferences FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "System can insert contact preferences" ON contact_preferences;
CREATE POLICY "System can insert contact preferences"
  ON contact_preferences FOR INSERT
  WITH CHECK (true);

-- Update triggers
CREATE OR REPLACE FUNCTION update_email_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_email_accounts_updated_at ON email_accounts;
CREATE TRIGGER update_email_accounts_updated_at
  BEFORE UPDATE ON email_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_email_updated_at();

DROP TRIGGER IF EXISTS update_email_campaigns_updated_at ON email_campaigns;
CREATE TRIGGER update_email_campaigns_updated_at
  BEFORE UPDATE ON email_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_email_updated_at();

DROP TRIGGER IF EXISTS update_contact_preferences_updated_at ON contact_preferences;
CREATE TRIGGER update_contact_preferences_updated_at
  BEFORE UPDATE ON contact_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_email_updated_at();