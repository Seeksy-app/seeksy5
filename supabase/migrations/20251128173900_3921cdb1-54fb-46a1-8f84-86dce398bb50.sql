
-- Fix the notify_sales_team_new_lead trigger function to handle missing unique constraint on contacts.email
CREATE OR REPLACE FUNCTION public.notify_sales_team_new_lead()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    company_name_value := NEW.sponsor_name; 
    contact_phone_value := NULL;
  ELSE
    lead_source_text := 'Unknown';
    contact_name_value := NULL;
    contact_email_value := NULL;
    company_name_value := NULL;
    contact_phone_value := NULL;
  END IF;

  -- Check if contact already exists before inserting
  SELECT id INTO contact_id
  FROM contacts
  WHERE email = contact_email_value
  LIMIT 1;
  
  -- Only insert if contact doesn't exist
  IF contact_id IS NULL THEN
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
    RETURNING id INTO contact_id;
  END IF;

  RETURN NEW;
END;
$function$;
