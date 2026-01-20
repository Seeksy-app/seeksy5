-- Fix notify_sales_team_new_lead() to handle both advertisers and award_sponsorships correctly
-- The function was trying to use sponsor_name/sponsor_email on advertisers table, which no longer has those columns

DROP FUNCTION IF EXISTS public.notify_sales_team_new_lead() CASCADE;

CREATE OR REPLACE FUNCTION public.notify_sales_team_new_lead() 
RETURNS trigger
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  contact_id uuid;
  lead_source_text text;
  contact_name_value text;
  contact_email_value text;
  company_name_value text;
  contact_phone_value text;
BEGIN
  -- Determine lead source and extract correct fields based on table
  IF TG_TABLE_NAME = 'advertisers' THEN
    lead_source_text := 'Advertiser Account';
    contact_name_value := NEW.contact_name;
    contact_email_value := NEW.contact_email;
    company_name_value := NEW.company_name;
    contact_phone_value := NEW.contact_phone;
  ELSIF TG_TABLE_NAME = 'award_sponsorships' THEN
    lead_source_text := 'Award Sponsorship';
    contact_name_value := NEW.sponsor_name;
    contact_email_value := NEW.sponsor_email;
    company_name_value := NEW.sponsor_name; -- sponsor_name serves as company name for sponsorships
    contact_phone_value := NULL; -- sponsorships don't have phone
  ELSE
    lead_source_text := 'Unknown';
    contact_name_value := NULL;
    contact_email_value := NULL;
    company_name_value := NULL;
    contact_phone_value := NULL;
  END IF;

  -- Create contact for the lead (without owner for now - admin will assign)
  INSERT INTO contacts (
    name,
    email,
    company,
    phone,
    lead_status,
    lead_source,
    notes
  ) VALUES (
    contact_name_value,
    contact_email_value,
    company_name_value,
    contact_phone_value,
    'new',
    lead_source_text,
    'Auto-generated from ' || lead_source_text
  )
  ON CONFLICT (email) DO NOTHING -- Prevent duplicate contacts
  RETURNING id INTO contact_id;

  RETURN NEW;
END;
$$;

-- Recreate the triggers
DROP TRIGGER IF EXISTS on_new_advertiser_create_lead ON public.advertisers;
CREATE TRIGGER on_new_advertiser_create_lead 
  AFTER INSERT ON public.advertisers 
  FOR EACH ROW 
  WHEN (NEW.status = 'pending'::text) 
  EXECUTE FUNCTION public.notify_sales_team_new_lead();

DROP TRIGGER IF EXISTS on_new_sponsorship_create_lead ON public.award_sponsorships;
CREATE TRIGGER on_new_sponsorship_create_lead 
  AFTER INSERT ON public.award_sponsorships 
  FOR EACH ROW 
  WHEN (NEW.status = 'pending'::text) 
  EXECUTE FUNCTION public.notify_sales_team_new_lead();