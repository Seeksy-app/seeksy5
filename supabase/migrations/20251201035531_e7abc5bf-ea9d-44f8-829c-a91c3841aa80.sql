-- Email Segments table for audience targeting
CREATE TABLE IF NOT EXISTS public.email_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  rules JSONB NOT NULL DEFAULT '[]'::jsonb,
  last_calculated_count INTEGER DEFAULT 0,
  last_calculated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies for email_segments
ALTER TABLE public.email_segments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own segments"
  ON public.email_segments
  FOR ALL
  USING (auth.uid() = user_id);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_email_events_campaign_id ON public.email_events(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_events_contact_id ON public.email_events(contact_id);
CREATE INDEX IF NOT EXISTS idx_email_events_event_type ON public.email_events(event_type);
CREATE INDEX IF NOT EXISTS idx_email_events_resend_email_id ON public.email_events(resend_email_id);
CREATE INDEX IF NOT EXISTS idx_contact_preferences_contact_id ON public.contact_preferences(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_preferences_global_unsubscribe ON public.contact_preferences(global_unsubscribe);

-- Add last_opened_at and last_clicked_at to contacts for smart send optimization
ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS last_opened_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS last_clicked_at TIMESTAMP WITH TIME ZONE;

-- Create index for smart send optimization
CREATE INDEX IF NOT EXISTS idx_contacts_last_opened_at ON public.contacts(last_opened_at);
CREATE INDEX IF NOT EXISTS idx_contacts_last_clicked_at ON public.contacts(last_clicked_at);