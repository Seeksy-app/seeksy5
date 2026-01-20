-- Create trucking_agencies table (e.g., D&L Transport, other agencies)
CREATE TABLE public.trucking_agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  phone_number TEXT,
  email TEXT,
  address TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trucking_agencies ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can manage agencies
CREATE POLICY "Admins can manage agencies"
ON public.trucking_agencies
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create trucking_admin_users table for admin access
CREATE TABLE public.trucking_admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES public.trucking_agencies(id) ON DELETE SET NULL,
  role TEXT DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'agent')),
  full_name TEXT,
  email TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.trucking_admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin users can view admin users"
ON public.trucking_admin_users
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Super admins can manage admin users"
ON public.trucking_admin_users
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.trucking_admin_users tau 
    WHERE tau.user_id = auth.uid() 
    AND tau.role = 'super_admin'
  )
);

-- Add agency_id and profile_image_url to trucking_agents
ALTER TABLE public.trucking_agents 
ADD COLUMN IF NOT EXISTS agency_id UUID REFERENCES public.trucking_agencies(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS profile_image_url TEXT;

-- Create trucking_ai_phone_numbers table
CREATE TABLE public.trucking_ai_phone_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES public.trucking_agencies(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  label TEXT,
  elevenlabs_agent_id TEXT,
  is_primary BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.trucking_ai_phone_numbers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view phone numbers"
ON public.trucking_ai_phone_numbers
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage phone numbers"
ON public.trucking_ai_phone_numbers
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.trucking_admin_users tau 
    WHERE tau.user_id = auth.uid() 
    AND tau.role IN ('super_admin', 'admin')
  )
);

-- Create trucking_rate_preferences table (global rate settings)
CREATE TABLE public.trucking_rate_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES public.trucking_agencies(id) ON DELETE CASCADE,
  target_margin_percent NUMERIC DEFAULT 15,
  absolute_rate_floor NUMERIC DEFAULT 500,
  rate_increment NUMERIC DEFAULT 25,
  max_negotiation_rounds INTEGER DEFAULT 3,
  equipment_types TEXT[] DEFAULT ARRAY['Van', 'Reefer', 'Flatbed'],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(agency_id)
);

ALTER TABLE public.trucking_rate_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view rate preferences"
ON public.trucking_rate_preferences
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage rate preferences"
ON public.trucking_rate_preferences
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.trucking_admin_users tau 
    WHERE tau.user_id = auth.uid() 
    AND tau.role IN ('super_admin', 'admin')
  )
);

-- Create trucking_ai_voice_settings table
CREATE TABLE public.trucking_ai_voice_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES public.trucking_agencies(id) ON DELETE CASCADE,
  voice_id TEXT NOT NULL,
  voice_name TEXT,
  default_language TEXT DEFAULT 'en',
  greeting_script TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(agency_id)
);

ALTER TABLE public.trucking_ai_voice_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view voice settings"
ON public.trucking_ai_voice_settings
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage voice settings"
ON public.trucking_ai_voice_settings
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.trucking_admin_users tau 
    WHERE tau.user_id = auth.uid() 
    AND tau.role IN ('super_admin', 'admin')
  )
);

-- Seed D&L Transport as the default agency
INSERT INTO public.trucking_agencies (name, slug, phone_number) 
VALUES ('D & L Transport', 'd-l-transport', '(888) 785-7499');

-- Get the agency ID and seed the two admin users
DO $$
DECLARE
  agency_uuid UUID;
BEGIN
  SELECT id INTO agency_uuid FROM public.trucking_agencies WHERE slug = 'd-l-transport';
  
  -- Insert admin users (seeksytrucking@gmail.com and trucking@gmail.com)
  INSERT INTO public.trucking_admin_users (user_id, agency_id, role, full_name, email)
  SELECT id, agency_uuid, 'super_admin', 'Admin', email
  FROM auth.users
  WHERE email IN ('seeksytrucking@gmail.com', 'trucking@gmail.com')
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Create default rate preferences
  INSERT INTO public.trucking_rate_preferences (agency_id, target_margin_percent, absolute_rate_floor, equipment_types)
  VALUES (agency_uuid, 15, 500, ARRAY['Van', 'Reefer', 'Flatbed', 'Step Deck', 'Power Only', 'Other']);
  
  -- Create default voice settings
  INSERT INTO public.trucking_ai_voice_settings (agency_id, voice_id, voice_name, default_language)
  VALUES (agency_uuid, '09AoN6tYyW3VSTQqCo7C', 'Jess (English)', 'en');
END $$;