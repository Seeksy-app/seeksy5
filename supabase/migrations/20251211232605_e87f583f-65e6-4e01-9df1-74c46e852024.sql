-- Add shipper/contact fields to trucking_loads
ALTER TABLE public.trucking_loads 
ADD COLUMN IF NOT EXISTS shipper_name text,
ADD COLUMN IF NOT EXISTS shipper_phone text,
ADD COLUMN IF NOT EXISTS shipper_contact_id uuid REFERENCES public.trucking_contacts(id),
ADD COLUMN IF NOT EXISTS contact_name text,
ADD COLUMN IF NOT EXISTS contact_phone text,
ADD COLUMN IF NOT EXISTS main_contact_id uuid REFERENCES public.trucking_contacts(id);