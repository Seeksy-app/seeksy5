-- Seeksy VenueOS Database Schema

-- Create venues table
CREATE TABLE public.venues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  slug text UNIQUE,
  type text DEFAULT 'wedding_venue',
  timezone text DEFAULT 'America/New_York',
  address text,
  city text,
  state text,
  country text DEFAULT 'USA',
  capacity integer,
  website_url text,
  phone text,
  brand_primary_color text DEFAULT '#053877',
  brand_logo_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create venue_users table (team members)
CREATE TABLE public.venue_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid REFERENCES public.venues(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text DEFAULT 'staff',
  created_at timestamptz DEFAULT now(),
  UNIQUE(venue_id, user_id)
);

-- Create venue_spaces table
CREATE TABLE public.venue_spaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid REFERENCES public.venues(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  capacity integer,
  indoor boolean DEFAULT true,
  outdoor boolean DEFAULT false,
  default_layout text,
  photos jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create venue_inventory table
CREATE TABLE public.venue_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid REFERENCES public.venues(id) ON DELETE CASCADE NOT NULL,
  category text,
  name text NOT NULL,
  sku text,
  description text,
  quantity_total integer DEFAULT 0,
  quantity_reserved integer DEFAULT 0,
  unit text DEFAULT 'each',
  replacement_cost numeric DEFAULT 0,
  is_rentable boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create venue_pricing_rules table
CREATE TABLE public.venue_pricing_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid REFERENCES public.venues(id) ON DELETE CASCADE NOT NULL,
  space_id uuid REFERENCES public.venue_spaces(id) ON DELETE CASCADE,
  rule_type text DEFAULT 'base',
  season text,
  day_of_week text,
  min_guests integer,
  max_guests integer,
  base_price numeric DEFAULT 0,
  per_guest_price numeric DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create venue_clients table
CREATE TABLE public.venue_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid REFERENCES public.venues(id) ON DELETE CASCADE NOT NULL,
  first_name text NOT NULL,
  last_name text,
  email text,
  phone text,
  organization text,
  type text DEFAULT 'individual',
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create venue_events table
CREATE TABLE public.venue_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid REFERENCES public.venues(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES public.venue_clients(id) ON DELETE SET NULL,
  name text NOT NULL,
  event_type text DEFAULT 'wedding',
  space_id uuid REFERENCES public.venue_spaces(id) ON DELETE SET NULL,
  start_time timestamptz,
  end_time timestamptz,
  guest_count integer,
  status text DEFAULT 'inquiry',
  pipeline_stage text DEFAULT 'lead',
  total_value numeric DEFAULT 0,
  currency text DEFAULT 'USD',
  notes jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create venue_bookings table
CREATE TABLE public.venue_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid REFERENCES public.venues(id) ON DELETE CASCADE NOT NULL,
  event_id uuid REFERENCES public.venue_events(id) ON DELETE CASCADE,
  space_id uuid REFERENCES public.venue_spaces(id) ON DELETE SET NULL,
  hold_status text DEFAULT 'tentative',
  source text DEFAULT 'direct',
  source_detail text,
  contract_status text DEFAULT 'pending',
  signed_contract_url text,
  deposit_amount numeric DEFAULT 0,
  balance_due numeric DEFAULT 0,
  due_date timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create venue_tasks table
CREATE TABLE public.venue_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid REFERENCES public.venues(id) ON DELETE CASCADE NOT NULL,
  event_id uuid REFERENCES public.venue_events(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  assigned_to_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  due_date timestamptz,
  status text DEFAULT 'pending',
  category text,
  created_at timestamptz DEFAULT now()
);

-- Create venue_influencer_profiles table
CREATE TABLE public.venue_influencer_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  display_name text NOT NULL,
  bio text,
  niches text[] DEFAULT '{}',
  platforms jsonb DEFAULT '{}'::jsonb,
  reach_estimate integer DEFAULT 0,
  pricing_packages jsonb DEFAULT '[]'::jsonb,
  portfolio_media jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create venue_influencer_bookings table
CREATE TABLE public.venue_influencer_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid REFERENCES public.venues(id) ON DELETE CASCADE NOT NULL,
  event_id uuid REFERENCES public.venue_events(id) ON DELETE CASCADE,
  influencer_profile_id uuid REFERENCES public.venue_influencer_profiles(id) ON DELETE SET NULL,
  status text DEFAULT 'pending',
  deliverables jsonb DEFAULT '[]'::jsonb,
  budget numeric DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create venue_streams table
CREATE TABLE public.venue_streams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid REFERENCES public.venues(id) ON DELETE CASCADE NOT NULL,
  event_id uuid REFERENCES public.venue_events(id) ON DELETE CASCADE,
  provider text DEFAULT 'aws_ivs',
  stream_key text,
  preview_url text,
  status text DEFAULT 'scheduled',
  starts_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create venue_payments table
CREATE TABLE public.venue_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid REFERENCES public.venues(id) ON DELETE CASCADE NOT NULL,
  event_id uuid REFERENCES public.venue_events(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES public.venue_bookings(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  currency text DEFAULT 'USD',
  status text DEFAULT 'pending',
  provider text DEFAULT 'stripe',
  provider_payment_id text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_influencer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_influencer_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for venues table
CREATE POLICY "Users can view their own venues" ON public.venues
  FOR SELECT USING (owner_user_id = auth.uid());
CREATE POLICY "Users can create venues" ON public.venues
  FOR INSERT WITH CHECK (owner_user_id = auth.uid());
CREATE POLICY "Users can update their own venues" ON public.venues
  FOR UPDATE USING (owner_user_id = auth.uid());
CREATE POLICY "Users can delete their own venues" ON public.venues
  FOR DELETE USING (owner_user_id = auth.uid());

-- RLS Policies for venue_users (staff can view venues they belong to)
CREATE POLICY "Staff can view venue_users for their venues" ON public.venue_users
  FOR SELECT USING (
    venue_id IN (SELECT id FROM public.venues WHERE owner_user_id = auth.uid())
    OR user_id = auth.uid()
  );
CREATE POLICY "Venue owners can manage venue_users" ON public.venue_users
  FOR ALL USING (
    venue_id IN (SELECT id FROM public.venues WHERE owner_user_id = auth.uid())
  );

-- RLS Policies for venue-scoped tables (using venue ownership or membership)
CREATE POLICY "Users can manage venue_spaces" ON public.venue_spaces
  FOR ALL USING (
    venue_id IN (
      SELECT id FROM public.venues WHERE owner_user_id = auth.uid()
      UNION
      SELECT venue_id FROM public.venue_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage venue_inventory" ON public.venue_inventory
  FOR ALL USING (
    venue_id IN (
      SELECT id FROM public.venues WHERE owner_user_id = auth.uid()
      UNION
      SELECT venue_id FROM public.venue_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage venue_pricing_rules" ON public.venue_pricing_rules
  FOR ALL USING (
    venue_id IN (
      SELECT id FROM public.venues WHERE owner_user_id = auth.uid()
      UNION
      SELECT venue_id FROM public.venue_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage venue_clients" ON public.venue_clients
  FOR ALL USING (
    venue_id IN (
      SELECT id FROM public.venues WHERE owner_user_id = auth.uid()
      UNION
      SELECT venue_id FROM public.venue_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage venue_events" ON public.venue_events
  FOR ALL USING (
    venue_id IN (
      SELECT id FROM public.venues WHERE owner_user_id = auth.uid()
      UNION
      SELECT venue_id FROM public.venue_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage venue_bookings" ON public.venue_bookings
  FOR ALL USING (
    venue_id IN (
      SELECT id FROM public.venues WHERE owner_user_id = auth.uid()
      UNION
      SELECT venue_id FROM public.venue_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage venue_tasks" ON public.venue_tasks
  FOR ALL USING (
    venue_id IN (
      SELECT id FROM public.venues WHERE owner_user_id = auth.uid()
      UNION
      SELECT venue_id FROM public.venue_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage venue_influencer_bookings" ON public.venue_influencer_bookings
  FOR ALL USING (
    venue_id IN (
      SELECT id FROM public.venues WHERE owner_user_id = auth.uid()
      UNION
      SELECT venue_id FROM public.venue_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage venue_streams" ON public.venue_streams
  FOR ALL USING (
    venue_id IN (
      SELECT id FROM public.venues WHERE owner_user_id = auth.uid()
      UNION
      SELECT venue_id FROM public.venue_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage venue_payments" ON public.venue_payments
  FOR ALL USING (
    venue_id IN (
      SELECT id FROM public.venues WHERE owner_user_id = auth.uid()
      UNION
      SELECT venue_id FROM public.venue_users WHERE user_id = auth.uid()
    )
  );

-- Influencer profiles are creator-scoped
CREATE POLICY "Creators can manage their influencer profiles" ON public.venue_influencer_profiles
  FOR ALL USING (creator_user_id = auth.uid());
CREATE POLICY "Anyone can view active influencer profiles" ON public.venue_influencer_profiles
  FOR SELECT USING (is_active = true);

-- Create indexes for performance
CREATE INDEX idx_venues_owner ON public.venues(owner_user_id);
CREATE INDEX idx_venue_users_venue ON public.venue_users(venue_id);
CREATE INDEX idx_venue_users_user ON public.venue_users(user_id);
CREATE INDEX idx_venue_events_venue ON public.venue_events(venue_id);
CREATE INDEX idx_venue_events_client ON public.venue_events(client_id);
CREATE INDEX idx_venue_bookings_event ON public.venue_bookings(event_id);
CREATE INDEX idx_venue_tasks_event ON public.venue_tasks(event_id);