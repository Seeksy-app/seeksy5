-- Create trucking_contacts table
CREATE TABLE public.trucking_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_type TEXT NOT NULL CHECK (contact_type IN ('driver', 'carrier', 'shipper', 'customer', 'other')),
  company_name TEXT,
  contact_name TEXT,
  phone TEXT,
  phone_alt TEXT,
  email TEXT,
  mc_number TEXT,
  dot_number TEXT,
  equipment_types TEXT[],
  preferred_lanes TEXT,
  notes TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  is_favorite BOOLEAN DEFAULT false,
  last_used_at TIMESTAMPTZ,
  region_short TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trucking_contacts ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "trucking_contacts_select_own" ON public.trucking_contacts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "trucking_contacts_insert_own" ON public.trucking_contacts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "trucking_contacts_update_own" ON public.trucking_contacts
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "trucking_contacts_delete_own" ON public.trucking_contacts
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_trucking_contacts_user_id ON public.trucking_contacts(user_id);
CREATE INDEX idx_trucking_contacts_type ON public.trucking_contacts(contact_type);
CREATE INDEX idx_trucking_contacts_favorite ON public.trucking_contacts(is_favorite) WHERE is_favorite = true;

-- Update trigger
CREATE TRIGGER update_trucking_contacts_updated_at
  BEFORE UPDATE ON public.trucking_contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();