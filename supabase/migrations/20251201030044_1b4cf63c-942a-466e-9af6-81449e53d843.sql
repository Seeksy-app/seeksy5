-- Email Platform v1.7 Migration
-- Add preheader, scheduling, and preference enforcement

-- Add preheader and scheduling to email_campaigns
ALTER TABLE email_campaigns
ADD COLUMN IF NOT EXISTS preheader TEXT,
ADD COLUMN IF NOT EXISTS scheduled_send_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS total_delivered INTEGER DEFAULT 0;

-- Add preheader to email_templates
ALTER TABLE email_templates
ADD COLUMN IF NOT EXISTS default_preheader TEXT;

-- Create index for scheduled campaigns
CREATE INDEX IF NOT EXISTS idx_email_campaigns_scheduled 
ON email_campaigns(scheduled_send_at) 
WHERE scheduled_send_at IS NOT NULL AND status = 'scheduled';

-- Update email_logs to track more details
ALTER TABLE email_logs
ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES email_campaigns(id),
ADD COLUMN IF NOT EXISTS resent_from_log_id UUID REFERENCES email_logs(id);

-- Create index for campaign analytics
CREATE INDEX IF NOT EXISTS idx_email_events_campaign 
ON email_events(campaign_id, event_type, occurred_at);