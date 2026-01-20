-- Fix 1: Add ad impression validation function with fraud prevention
CREATE OR REPLACE FUNCTION public.validate_ad_impression(
  p_ad_slot_id uuid,
  p_campaign_id uuid,
  p_listener_ip_hash text,
  p_user_agent text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_impression_count integer;
  campaign_active boolean;
  campaign_budget_remaining numeric;
BEGIN
  -- Check if campaign is active and has budget
  SELECT 
    status = 'active',
    COALESCE(budget - total_spent, 0)
  INTO campaign_active, campaign_budget_remaining
  FROM ad_campaigns
  WHERE id = p_campaign_id;
  
  IF NOT campaign_active OR campaign_budget_remaining <= 0 THEN
    RETURN false;
  END IF;
  
  -- Rate limiting: Check for suspicious impression frequency from same IP
  SELECT COUNT(*)
  INTO recent_impression_count
  FROM ad_impressions
  WHERE listener_ip_hash = p_listener_ip_hash
    AND created_at > NOW() - INTERVAL '1 minute';
  
  IF recent_impression_count >= 5 THEN
    RETURN false;
  END IF;
  
  -- Validate user agent is not empty (basic bot detection)
  IF p_user_agent IS NULL OR LENGTH(TRIM(p_user_agent)) < 10 THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

-- Fix 2: Update all functions to have explicit search_path
CREATE OR REPLACE FUNCTION public.update_gmail_connections_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_task_comment_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_polls_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_saved_proformas_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_pipeline_stages_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_team_invitations_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.initialize_user_credits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_credits (user_id, balance)
  VALUES (NEW.id, 5)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.assign_member_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'member')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_default_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, plan_name, status)
  VALUES (NEW.id, 'free', 'active');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.grant_default_modules()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  seeksy_module_id UUID;
BEGIN
  SELECT id INTO seeksy_module_id
  FROM public.modules
  WHERE name = 'seeksy'
  LIMIT 1;
  
  IF seeksy_module_id IS NOT NULL THEN
    INSERT INTO public.user_modules (user_id, module_id)
    VALUES (NEW.id, seeksy_module_id)
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_voting_link()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.unique_voting_link IS NULL THEN
    NEW.unique_voting_link := replace(gen_random_uuid()::text, '-', '');
  END IF;
  RETURN NEW;
END;
$$;

-- Fix 3: Add comment documenting that pgcrypto extension in public is needed for gen_random_uuid()
COMMENT ON EXTENSION pgcrypto IS 'Required in public schema for gen_random_uuid() function used throughout application';