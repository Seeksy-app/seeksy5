-- AITrucking Database Schema

-- Trucking profiles table
CREATE TABLE IF NOT EXISTS public.trucking_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_name text,
  contact_name text,
  phone text,
  email text,
  time_zone text DEFAULT 'America/New_York',
  auto_notify_email text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.trucking_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trucking_profiles_owner_access" ON public.trucking_profiles
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Trucking loads table
CREATE TABLE IF NOT EXISTS public.trucking_loads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  load_number text NOT NULL,
  reference text,
  origin_city text,
  origin_state text,
  origin_zip text,
  pickup_date date,
  pickup_window_start time,
  pickup_window_end time,
  destination_city text,
  destination_state text,
  destination_zip text,
  delivery_date date,
  delivery_window_start time,
  delivery_window_end time,
  equipment_type text DEFAULT 'Dry Van',
  commodity text,
  weight_lbs integer,
  miles integer,
  notes text,
  status text DEFAULT 'open',
  target_rate numeric,
  rate_unit text DEFAULT 'flat',
  floor_rate numeric,
  auto_approve_band_flat numeric DEFAULT 50,
  auto_approve_band_per_mile numeric DEFAULT 0.05,
  escalate_threshold numeric,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.trucking_loads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trucking_loads_owner_access" ON public.trucking_loads
  FOR ALL USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Trucking carriers table
CREATE TABLE IF NOT EXISTS public.trucking_carriers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_name text NOT NULL,
  mc_number text,
  dot_number text,
  contact_name text,
  phone text,
  email text,
  equipment_types text,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.trucking_carriers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trucking_carriers_owner_access" ON public.trucking_carriers
  FOR ALL USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Trucking carrier leads table
CREATE TABLE IF NOT EXISTS public.trucking_carrier_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  load_id uuid REFERENCES public.trucking_loads(id) ON DELETE CASCADE,
  carrier_id uuid REFERENCES public.trucking_carriers(id) ON DELETE SET NULL,
  company_name text,
  mc_number text,
  dot_number text,
  contact_name text,
  phone text,
  email text,
  truck_type text,
  eta_to_pickup timestamptz,
  rate_offered numeric,
  rate_requested numeric,
  status text DEFAULT 'interested',
  source text DEFAULT 'ai_call',
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.trucking_carrier_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trucking_leads_owner_access" ON public.trucking_carrier_leads
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "trucking_leads_update" ON public.trucking_carrier_leads
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "trucking_leads_delete" ON public.trucking_carrier_leads
  FOR DELETE USING (owner_id = auth.uid());

CREATE POLICY "trucking_leads_insert_via_ai" ON public.trucking_carrier_leads
  FOR INSERT WITH CHECK (true);

-- Trucking call logs table
CREATE TABLE IF NOT EXISTS public.trucking_call_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  carrier_phone text,
  load_id uuid REFERENCES public.trucking_loads(id) ON DELETE SET NULL,
  call_direction text DEFAULT 'inbound',
  summary text,
  transcript_url text,
  recording_url text,
  call_started_at timestamptz,
  call_ended_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.trucking_call_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trucking_call_logs_owner_access" ON public.trucking_call_logs
  FOR ALL USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Trucking settings table
CREATE TABLE IF NOT EXISTS public.trucking_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  demo_mode_enabled boolean DEFAULT true,
  notification_email text,
  notification_sms_number text,
  ai_caller_name text DEFAULT 'Christy',
  ai_caller_company_name text DEFAULT 'Dispatch',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.trucking_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trucking_settings_owner_access" ON public.trucking_settings
  FOR ALL USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());