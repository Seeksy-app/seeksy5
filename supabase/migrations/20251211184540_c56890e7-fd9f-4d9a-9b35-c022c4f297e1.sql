-- VenueOS V1 Database Schema - Add missing columns and new tables

-- Add missing columns to existing venues table
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS event_types text[] DEFAULT '{}';
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS booking_policy jsonb DEFAULT '{}';
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS stripe_account_id text;
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS max_capacity integer;

-- Venue staff (team members)
CREATE TABLE IF NOT EXISTS public.venue_staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid REFERENCES public.venues(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  role text DEFAULT 'staff' CHECK (role IN ('owner', 'manager', 'staff')),
  created_at timestamptz DEFAULT now()
);

-- Venue spaces (rooms, halls, areas)
CREATE TABLE IF NOT EXISTS public.venue_spaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid REFERENCES public.venues(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  capacity integer,
  description text,
  photos text[] DEFAULT '{}',
  hourly_rate numeric,
  created_at timestamptz DEFAULT now()
);

-- Venue clients (CRM)
CREATE TABLE IF NOT EXISTS public.venue_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid REFERENCES public.venues(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  email text,
  phone text,
  company text,
  tags text[] DEFAULT '{}',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Venue bookings
CREATE TABLE IF NOT EXISTS public.venue_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid REFERENCES public.venues(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES public.venue_clients(id),
  space_id uuid REFERENCES public.venue_spaces(id),
  title text NOT NULL,
  event_type text,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  status text DEFAULT 'inquiry' CHECK (status IN ('inquiry', 'hold', 'proposal', 'contract_sent', 'confirmed', 'cancelled')),
  guest_count integer,
  estimated_value numeric,
  deposit_amount numeric,
  balance_due numeric,
  notes_internal text,
  source text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Venue inventory
CREATE TABLE IF NOT EXISTS public.venue_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid REFERENCES public.venues(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  category text,
  sku text,
  quantity_on_hand integer DEFAULT 0,
  reorder_level integer DEFAULT 0,
  unit_cost numeric,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Venue events marketing
CREATE TABLE IF NOT EXISTS public.venue_events_marketing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid REFERENCES public.venues(id) ON DELETE CASCADE NOT NULL,
  booking_id uuid REFERENCES public.venue_bookings(id),
  name text NOT NULL,
  event_date date,
  budget numeric,
  channel_mix jsonb DEFAULT '{}',
  goals jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Venue influencers
CREATE TABLE IF NOT EXISTS public.venue_influencers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid REFERENCES public.venues(id) ON DELETE CASCADE,
  name text NOT NULL,
  handle text,
  platforms text[] DEFAULT '{}',
  primary_location text,
  niche_tags text[] DEFAULT '{}',
  avg_reach integer,
  avg_engagement_rate numeric,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Venue influencer campaigns
CREATE TABLE IF NOT EXISTS public.venue_influencer_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid REFERENCES public.venues(id) ON DELETE CASCADE NOT NULL,
  influencer_id uuid REFERENCES public.venue_influencers(id) NOT NULL,
  booking_id uuid REFERENCES public.venue_bookings(id),
  campaign_name text NOT NULL,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'invited', 'active', 'completed', 'cancelled')),
  comp_structure jsonb DEFAULT '{}',
  tracking_links jsonb DEFAULT '{}',
  results jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Venue automations
CREATE TABLE IF NOT EXISTS public.venue_automations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid REFERENCES public.venues(id) ON DELETE CASCADE NOT NULL,
  trigger text,
  channel text DEFAULT 'email' CHECK (channel IN ('email', 'sms')),
  template_subject text,
  template_body text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Venue AI sessions
CREATE TABLE IF NOT EXISTS public.venue_ai_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid REFERENCES public.venues(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  role text DEFAULT 'ai_venue_manager',
  messages jsonb DEFAULT '[]',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.venue_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_events_marketing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_influencers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_influencer_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_ai_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies (using owner_user_id which is the actual column name)
CREATE POLICY "venue_staff_owner_all" ON public.venue_staff FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.venues v WHERE v.id = venue_id AND v.owner_user_id = auth.uid()));

CREATE POLICY "venue_spaces_owner_all" ON public.venue_spaces FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.venues v WHERE v.id = venue_id AND v.owner_user_id = auth.uid()));

CREATE POLICY "venue_clients_owner_all" ON public.venue_clients FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.venues v WHERE v.id = venue_id AND v.owner_user_id = auth.uid()));

CREATE POLICY "venue_bookings_owner_all" ON public.venue_bookings FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.venues v WHERE v.id = venue_id AND v.owner_user_id = auth.uid()));

CREATE POLICY "venue_bookings_public_insert" ON public.venue_bookings FOR INSERT WITH CHECK (source = 'widget');

CREATE POLICY "venue_inventory_owner_all" ON public.venue_inventory FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.venues v WHERE v.id = venue_id AND v.owner_user_id = auth.uid()));

CREATE POLICY "venue_events_marketing_owner_all" ON public.venue_events_marketing FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.venues v WHERE v.id = venue_id AND v.owner_user_id = auth.uid()));

CREATE POLICY "venue_influencers_owner_all" ON public.venue_influencers FOR ALL 
  USING (venue_id IS NULL OR EXISTS (SELECT 1 FROM public.venues v WHERE v.id = venue_id AND v.owner_user_id = auth.uid()));

CREATE POLICY "venue_influencer_campaigns_owner_all" ON public.venue_influencer_campaigns FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.venues v WHERE v.id = venue_id AND v.owner_user_id = auth.uid()));

CREATE POLICY "venue_automations_owner_all" ON public.venue_automations FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.venues v WHERE v.id = venue_id AND v.owner_user_id = auth.uid()));

CREATE POLICY "venue_ai_sessions_owner_all" ON public.venue_ai_sessions FOR ALL 
  USING (auth.uid() = user_id);