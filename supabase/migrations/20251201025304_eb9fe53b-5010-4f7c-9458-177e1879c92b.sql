-- Email Template System v1.5 Schema Updates

-- Add new fields to email_templates
ALTER TABLE email_templates
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS persona TEXT,
ADD COLUMN IF NOT EXISTS preference_channel TEXT,
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Update existing templates with categories and personas
UPDATE email_templates SET category = 'System / Admin', persona = 'Scribe', preference_channel = 'general_updates' WHERE template_key = 'welcome';
UPDATE email_templates SET category = 'System / Admin', persona = 'Scribe', preference_channel = 'general_updates' WHERE template_key = 'verify-email';
UPDATE email_templates SET category = 'System / Admin', persona = 'Scribe', preference_channel = 'general_updates' WHERE template_key = 'password-reset';
UPDATE email_templates SET category = 'Meetings & Events', persona = 'Mia', preference_channel = 'meeting_notifications' WHERE template_key = 'meeting-invitation';
UPDATE email_templates SET category = 'Meetings & Events', persona = 'Mia', preference_channel = 'event_updates' WHERE template_key = 'event-registration';
UPDATE email_templates SET category = 'Podcasting', persona = 'Castor', preference_channel = 'podcast_notifications' WHERE template_key = 'podcast-published';
UPDATE email_templates SET category = 'Studio & Clips', persona = 'Echo', preference_channel = 'studio_updates' WHERE template_key = 'ai-production-ready';
UPDATE email_templates SET category = 'Subscribers & Audience', persona = 'Atlas', preference_channel = 'subscriber_updates' WHERE template_key = 'new-subscriber';
UPDATE email_templates SET category = 'Marketing / Campaigns', persona = 'Scribe', preference_channel = 'marketing_emails' WHERE template_key = 'campaign-email';
UPDATE email_templates SET category = 'Identity & Rights', persona = 'Lex', preference_channel = 'identity_notifications' WHERE template_key = 'identity-verified';

-- Add draft_status to email_campaigns
ALTER TABLE email_campaigns
ADD COLUMN IF NOT EXISTS draft_status TEXT DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP WITH TIME ZONE;

-- Create index for category filtering
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON email_templates(category);
CREATE INDEX IF NOT EXISTS idx_email_templates_persona ON email_templates(persona);

-- Add template_id reference to email_campaigns
ALTER TABLE email_campaigns
ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES email_templates(id);