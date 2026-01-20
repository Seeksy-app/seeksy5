-- Create trucking_lead_notifications table for realtime notifications
CREATE TABLE IF NOT EXISTS public.trucking_lead_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid REFERENCES public.agencies(id) ON DELETE CASCADE,
  owner_id uuid,
  source text DEFAULT 'elevenlabs',
  conversation_id text UNIQUE,
  caller_number text,
  receiver_number text,
  summary text,
  transcript text,
  call_sid text,
  stream_sid text,
  status text DEFAULT 'pending',
  lead_id uuid REFERENCES public.trucking_carrier_leads(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trucking_lead_notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for trucking_lead_notifications
CREATE POLICY "Users can view their own agency notifications"
  ON public.trucking_lead_notifications
  FOR SELECT
  USING (
    agency_id IN (
      SELECT agency_id FROM public.trucking_admin_users 
      WHERE user_id = auth.uid()
    )
    OR owner_id = auth.uid()
  );

CREATE POLICY "Service role can insert notifications"
  ON public.trucking_lead_notifications
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update notifications"
  ON public.trucking_lead_notifications
  FOR UPDATE
  USING (true);

-- Create index for faster lookups
CREATE INDEX idx_trucking_lead_notifications_agency ON public.trucking_lead_notifications(agency_id);
CREATE INDEX idx_trucking_lead_notifications_conversation ON public.trucking_lead_notifications(conversation_id);
CREATE INDEX idx_trucking_lead_notifications_status ON public.trucking_lead_notifications(status);

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.trucking_lead_notifications;