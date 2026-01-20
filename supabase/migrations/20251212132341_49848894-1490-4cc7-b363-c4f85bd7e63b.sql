-- Add special_instructions to trucking_loads if not exists
ALTER TABLE public.trucking_loads ADD COLUMN IF NOT EXISTS special_instructions text;

-- Create trucking_cities table for master cities directory
CREATE TABLE IF NOT EXISTS public.trucking_cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  state_code text NOT NULL,
  zip text,
  aliases text[] DEFAULT '{}',
  is_favorite boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create unique index to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS trucking_cities_unique_idx 
ON public.trucking_cities (name, state_code, COALESCE(zip, ''));

-- Enable RLS
ALTER TABLE public.trucking_cities ENABLE ROW LEVEL SECURITY;

-- RLS policies for authenticated users
CREATE POLICY "Users can view all cities" ON public.trucking_cities
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert cities" ON public.trucking_cities
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update cities" ON public.trucking_cities
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Users can delete cities" ON public.trucking_cities
  FOR DELETE TO authenticated USING (true);

-- Seed some common cities
INSERT INTO public.trucking_cities (name, state_code, aliases, is_favorite) VALUES
  ('Dallas', 'TX', ARRAY['DFW'], true),
  ('Houston', 'TX', ARRAY['HTX'], true),
  ('Phoenix', 'AZ', ARRAY['Phx', 'PHX'], true),
  ('Atlanta', 'GA', ARRAY['ATL'], true),
  ('Los Angeles', 'CA', ARRAY['LA', 'LAX'], true),
  ('Chicago', 'IL', ARRAY['CHI'], true),
  ('Memphis', 'TN', ARRAY['MEM'], true),
  ('Denver', 'CO', ARRAY['DEN'], true),
  ('Miami', 'FL', ARRAY['MIA'], true),
  ('Seattle', 'WA', ARRAY['SEA'], false)
ON CONFLICT DO NOTHING;