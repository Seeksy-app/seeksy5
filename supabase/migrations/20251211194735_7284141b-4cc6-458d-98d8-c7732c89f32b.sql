-- Add mode column to venues for demo/real toggle
ALTER TABLE public.venues 
ADD COLUMN IF NOT EXISTS mode text DEFAULT 'demo' CHECK (mode IN ('demo', 'real'));

-- Create venue_communications table for CRM functionality
CREATE TABLE IF NOT EXISTS public.venue_communications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid REFERENCES public.venues(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.venue_clients(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('email', 'sms', 'call', 'note')),
  direction text NOT NULL CHECK (direction IN ('outbound', 'inbound', 'internal')),
  subject text,
  body text,
  channel_metadata jsonb DEFAULT '{}',
  is_demo boolean DEFAULT false,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);

-- Create venue_proposals table for proposal management
CREATE TABLE IF NOT EXISTS public.venue_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid REFERENCES public.venues(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.venue_clients(id) ON DELETE SET NULL,
  space_id uuid REFERENCES public.venue_spaces(id) ON DELETE SET NULL,
  event_type text,
  event_date date,
  guest_count integer,
  base_price numeric(10,2),
  add_ons jsonb DEFAULT '[]',
  total_price numeric(10,2),
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'declined', 'expired')),
  sent_at timestamptz,
  notes text,
  is_demo boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add is_demo column to relevant tables for demo data tagging
ALTER TABLE public.venue_clients
ADD COLUMN IF NOT EXISTS is_demo boolean DEFAULT false;

ALTER TABLE public.venue_bookings
ADD COLUMN IF NOT EXISTS is_demo boolean DEFAULT false;

-- Enable RLS
ALTER TABLE public.venue_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_proposals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for venue_communications (allow all for now since auth is managed at app level)
CREATE POLICY "Allow all venue communications access" ON public.venue_communications FOR ALL USING (true);

-- RLS Policies for venue_proposals
CREATE POLICY "Allow all venue proposals access" ON public.venue_proposals FOR ALL USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_venue_communications_venue_id ON public.venue_communications(venue_id);
CREATE INDEX IF NOT EXISTS idx_venue_communications_client_id ON public.venue_communications(client_id);
CREATE INDEX IF NOT EXISTS idx_venue_proposals_venue_id ON public.venue_proposals(venue_id);
CREATE INDEX IF NOT EXISTS idx_venue_proposals_client_id ON public.venue_proposals(client_id);