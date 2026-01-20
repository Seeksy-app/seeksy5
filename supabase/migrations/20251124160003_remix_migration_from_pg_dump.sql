CREATE EXTENSION IF NOT EXISTS "pg_cron";
CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_net";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.7

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: account_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.account_type AS ENUM (
    'creator',
    'advertiser',
    'meeting_planner',
    'seeksy_admin'
);


--
-- Name: advertiser_team_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.advertiser_team_role AS ENUM (
    'super_admin',
    'admin',
    'ad_manager',
    'creative',
    'sales'
);


--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'creator',
    'attendee',
    'super_admin',
    'manager',
    'scheduler',
    'sales',
    'member',
    'advertiser',
    'staff'
);


--
-- Name: award_program_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.award_program_status AS ENUM (
    'draft',
    'nominations_open',
    'voting_open',
    'closed',
    'completed'
);


--
-- Name: chat_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.chat_type AS ENUM (
    'team_chat',
    'admin_internal',
    'support_chat'
);


--
-- Name: location_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.location_type AS ENUM (
    'phone',
    'zoom',
    'teams',
    'meet',
    'in-person',
    'custom'
);


--
-- Name: meeting_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.meeting_status AS ENUM (
    'scheduled',
    'completed',
    'cancelled'
);


--
-- Name: nominee_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.nominee_status AS ENUM (
    'pending',
    'approved',
    'rejected'
);


--
-- Name: voting_method; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.voting_method AS ENUM (
    'public',
    'jury',
    'hybrid',
    'ranked_choice'
);


--
-- Name: add_to_system_list(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.add_to_system_list(_contact_id uuid, _list_name text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  list_id uuid;
BEGIN
  -- Find the system list by name
  SELECT id INTO list_id
  FROM contact_lists
  WHERE name = _list_name AND is_system = true
  LIMIT 1;
  
  -- If list exists and contact isn't already a member, add them
  IF list_id IS NOT NULL THEN
    INSERT INTO contact_list_members (list_id, contact_id)
    VALUES (list_id, _contact_id)
    ON CONFLICT DO NOTHING;
  END IF;
END;
$$;


--
-- Name: assign_member_role(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.assign_member_role() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'member')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;


--
-- Name: calculate_impression_revenue(uuid, uuid, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calculate_impression_revenue(_campaign_id uuid, _creator_id uuid, _impression_count integer) RETURNS TABLE(revenue_generated numeric, creator_share numeric, platform_share numeric)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  campaign_cpm DECIMAL;
  creator_percentage DECIMAL;
  total_revenue DECIMAL;
  creator_amount DECIMAL;
  platform_amount DECIMAL;
BEGIN
  -- Get campaign CPM
  SELECT cpm_bid INTO campaign_cpm
  FROM ad_campaigns
  WHERE id = _campaign_id;
  
  -- Get creator's revenue share percentage (default 70%)
  SELECT COALESCE(
    (SELECT revenue_share_percentage 
     FROM podcast_ad_settings ps
     JOIN episodes e ON e.podcast_id = ps.podcast_id
     JOIN ad_slots ads ON ads.episode_id = e.id
     WHERE ads.assigned_campaign_id = _campaign_id
     LIMIT 1),
    70.00
  ) INTO creator_percentage;
  
  -- Calculate revenue (CPM = cost per 1000 impressions)
  total_revenue := (campaign_cpm * _impression_count) / 1000.0;
  creator_amount := total_revenue * (creator_percentage / 100.0);
  platform_amount := total_revenue - creator_amount;
  
  RETURN QUERY SELECT total_revenue, creator_amount, platform_amount;
END;
$$;


--
-- Name: create_default_subscription(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_default_subscription() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, plan_name, status)
  VALUES (NEW.id, 'free', 'active');
  RETURN NEW;
END;
$$;


--
-- Name: create_meeting_public(uuid, uuid, text, text, timestamp with time zone, timestamp with time zone, public.location_type, text, text, text, text, jsonb, public.meeting_status); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_meeting_public(p_user_id uuid, p_meeting_type_id uuid, p_title text, p_description text, p_start_time timestamp with time zone, p_end_time timestamp with time zone, p_location_type public.location_type, p_location_details text, p_attendee_name text, p_attendee_email text, p_attendee_phone text DEFAULT NULL::text, p_attendee_responses jsonb DEFAULT '{}'::jsonb, p_status public.meeting_status DEFAULT 'scheduled'::public.meeting_status) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  new_meeting_id uuid;
BEGIN
  INSERT INTO public.meetings (
    user_id,
    meeting_type_id,
    title,
    description,
    start_time,
    end_time,
    location_type,
    location_details,
    attendee_name,
    attendee_email,
    attendee_phone,
    attendee_responses,
    status
  ) VALUES (
    p_user_id,
    p_meeting_type_id,
    p_title,
    p_description,
    p_start_time,
    p_end_time,
    p_location_type,
    p_location_details,
    p_attendee_name,
    p_attendee_email,
    p_attendee_phone,
    p_attendee_responses,
    p_status
  )
  RETURNING id INTO new_meeting_id;
  
  RETURN new_meeting_id;
END;
$$;


--
-- Name: ensure_contact_exists(uuid, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.ensure_contact_exists(_owner_id uuid, _email text, _name text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  contact_id uuid;
BEGIN
  -- Try to find existing contact by owner_id and email
  IF _owner_id IS NOT NULL THEN
    SELECT id INTO contact_id
    FROM contacts
    WHERE user_id = _owner_id AND email = _email
    LIMIT 1;
  ELSE
    -- If no owner_id provided, look for contact without owner
    SELECT id INTO contact_id
    FROM contacts
    WHERE email = _email AND user_id IS NULL
    LIMIT 1;
  END IF;
  
  -- If contact doesn't exist, create it
  IF contact_id IS NULL THEN
    INSERT INTO contacts (user_id, email, name)
    VALUES (_owner_id, _email, _name)
    RETURNING id INTO contact_id;
  END IF;
  
  RETURN contact_id;
END;
$$;


--
-- Name: generate_voting_link(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_voting_link() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  IF NEW.unique_voting_link IS NULL THEN
    -- Use gen_random_uuid() which is built-in, no extension needed
    NEW.unique_voting_link := replace(gen_random_uuid()::text, '-', '');
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: get_current_usage(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_current_usage(_user_id uuid, _feature_type text) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  current_usage INTEGER;
  current_period_start TIMESTAMP WITH TIME ZONE;
  current_period_end TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get the current period from subscription
  SELECT 
    COALESCE(current_period_start, date_trunc('month', now())),
    COALESCE(current_period_end, date_trunc('month', now()) + interval '1 month')
  INTO current_period_start, current_period_end
  FROM subscriptions
  WHERE user_id = _user_id;
  
  -- If no subscription, use current month
  IF current_period_start IS NULL THEN
    current_period_start := date_trunc('month', now());
    current_period_end := date_trunc('month', now()) + interval '1 month';
  END IF;
  
  -- Get usage for current period
  SELECT COALESCE(SUM(usage_count), 0)
  INTO current_usage
  FROM usage_tracking
  WHERE user_id = _user_id
    AND feature_type = _feature_type
    AND period_start >= current_period_start
    AND period_end <= current_period_end;
  
  RETURN current_usage;
END;
$$;


--
-- Name: grant_default_modules(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.grant_default_modules() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  seeksy_module_id UUID;
BEGIN
  -- Get Seeksy Core module ID
  SELECT id INTO seeksy_module_id
  FROM public.modules
  WHERE name = 'seeksy'
  LIMIT 1;
  
  -- Grant Seeksy Core module to new user
  IF seeksy_module_id IS NOT NULL THEN
    INSERT INTO public.user_modules (user_id, module_id)
    VALUES (NEW.id, seeksy_module_id)
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: handle_event_registration(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_event_registration() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  contact_id uuid;
  event_owner_id uuid;
BEGIN
  -- Get the event owner's user_id
  SELECT user_id INTO event_owner_id
  FROM events
  WHERE id = NEW.event_id;
  
  -- Create/get contact for the attendee
  contact_id := ensure_contact_exists(
    event_owner_id,
    NEW.attendee_email,
    NEW.attendee_name
  );
  
  -- Add to Event Attendees system list
  PERFORM add_to_system_list(contact_id, 'Event Attendees');
  
  RETURN NEW;
END;
$$;


--
-- Name: handle_meeting_booking(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_meeting_booking() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  contact_id uuid;
BEGIN
  -- Create/get contact for the meeting attendee with the meeting owner
  contact_id := ensure_contact_exists(
    NEW.user_id,
    NEW.attendee_email,
    NEW.attendee_name
  );
  
  -- Add to Meeting Bookers system list
  PERFORM add_to_system_list(contact_id, 'Meeting Bookers');
  
  RETURN NEW;
END;
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  contact_id uuid;
  creators_list_id uuid;
  base_username text;
  final_username text;
  username_counter integer := 0;
BEGIN
  -- Generate base username from email
  base_username := COALESCE(
    NEW.raw_user_meta_data->>'username', 
    SPLIT_PART(NEW.email, '@', 1)
  );
  
  -- Ensure username is unique by appending a number if needed
  final_username := base_username;
  
  WHILE EXISTS (SELECT 1 FROM profiles WHERE username = final_username) LOOP
    username_counter := username_counter + 1;
    final_username := base_username || username_counter::text;
  END LOOP;
  
  -- Insert into profiles with unique username
  INSERT INTO public.profiles (id, username, full_name)
  VALUES (
    NEW.id,
    final_username,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  
  -- Create contact for this creator
  contact_id := ensure_contact_exists(
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1))
  );
  
  -- Add to Creators system list
  PERFORM add_to_system_list(contact_id, 'Creators');
  
  RETURN NEW;
END;
$$;


--
-- Name: handle_poll_vote(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_poll_vote() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  contact_id uuid;
  poll_owner_id uuid;
BEGIN
  -- Get the poll owner's user_id
  SELECT user_id INTO poll_owner_id
  FROM polls
  WHERE id = NEW.poll_id;
  
  -- Create/get contact for the voter under the poll owner
  contact_id := ensure_contact_exists(
    poll_owner_id,
    NEW.voter_email,
    NEW.voter_name
  );
  
  -- Add to Poll Participants system list
  PERFORM add_to_system_list(contact_id, 'Poll Participants');
  
  RETURN NEW;
END;
$$;


--
-- Name: handle_signup_volunteer(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_signup_volunteer() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  contact_id uuid;
  sheet_owner_id uuid;
BEGIN
  -- Only process if the slot is being filled (has volunteer info)
  IF NEW.is_filled = true AND NEW.volunteer_email IS NOT NULL THEN
    -- Get the sheet owner's user_id
    SELECT user_id INTO sheet_owner_id
    FROM signup_sheets
    WHERE id = NEW.sheet_id;
    
    -- Create/get contact for the volunteer
    contact_id := ensure_contact_exists(
      sheet_owner_id,
      NEW.volunteer_email,
      NEW.volunteer_name
    );
    
    -- Add to Sign-up Volunteers system list
    PERFORM add_to_system_list(contact_id, 'Sign-up Volunteers');
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: has_permission(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_permission(_user_id uuid, _permission text) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.role = rp.role
    WHERE ur.user_id = _user_id
      AND rp.permission = _permission
  )
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;


--
-- Name: increment_usage(uuid, text, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.increment_usage(_user_id uuid, _feature_type text, _increment integer DEFAULT 1) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  current_period_start TIMESTAMP WITH TIME ZONE;
  current_period_end TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get the current period from subscription
  SELECT 
    COALESCE(current_period_start, date_trunc('month', now())),
    COALESCE(current_period_end, date_trunc('month', now()) + interval '1 month')
  INTO current_period_start, current_period_end
  FROM subscriptions
  WHERE user_id = _user_id;
  
  -- If no subscription, use current month
  IF current_period_start IS NULL THEN
    current_period_start := date_trunc('month', now());
    current_period_end := date_trunc('month', now()) + interval '1 month';
  END IF;
  
  -- Insert or update usage
  INSERT INTO usage_tracking (user_id, feature_type, usage_count, period_start, period_end)
  VALUES (_user_id, _feature_type, _increment, current_period_start, current_period_end)
  ON CONFLICT (user_id, feature_type, period_start)
  DO UPDATE SET
    usage_count = usage_tracking.usage_count + _increment,
    updated_at = now();
END;
$$;


--
-- Name: log_episode_created(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_episode_created() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  podcast_user_id UUID;
BEGIN
  -- Get podcast owner
  SELECT user_id INTO podcast_user_id
  FROM podcasts
  WHERE id = NEW.podcast_id;
  
  PERFORM log_user_activity(
    podcast_user_id,
    'episode_uploaded',
    'Uploaded episode: ' || NEW.title,
    'episode',
    NEW.id,
    jsonb_build_object('podcast_id', NEW.podcast_id)
  );
  RETURN NEW;
END;
$$;


--
-- Name: log_event_created(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_event_created() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  PERFORM log_user_activity(
    NEW.user_id,
    'event_created',
    'Created event: ' || NEW.title,
    'event',
    NEW.id,
    jsonb_build_object('event_date', NEW.event_date)
  );
  RETURN NEW;
END;
$$;


--
-- Name: log_meeting_created(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_meeting_created() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  PERFORM log_user_activity(
    NEW.user_id,
    'meeting_created',
    'Created meeting: ' || NEW.title || ' with ' || NEW.attendee_name,
    'meeting',
    NEW.id,
    jsonb_build_object(
      'attendee_email', NEW.attendee_email,
      'start_time', NEW.start_time
    )
  );
  RETURN NEW;
END;
$$;


--
-- Name: log_podcast_created(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_podcast_created() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  PERFORM log_user_activity(
    NEW.user_id,
    'podcast_created',
    'Created podcast: ' || NEW.title,
    'podcast',
    NEW.id,
    NULL
  );
  RETURN NEW;
END;
$$;


--
-- Name: log_poll_created(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_poll_created() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  PERFORM log_user_activity(
    NEW.user_id,
    'poll_created',
    'Created poll: ' || NEW.title,
    'poll',
    NEW.id,
    NULL
  );
  RETURN NEW;
END;
$$;


--
-- Name: log_signup_sheet_created(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_signup_sheet_created() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  PERFORM log_user_activity(
    NEW.user_id,
    'signup_sheet_created',
    'Created signup sheet: ' || NEW.title,
    'signup_sheet',
    NEW.id,
    NULL
  );
  RETURN NEW;
END;
$$;


--
-- Name: log_task_created(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_task_created() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  PERFORM log_user_activity(
    NEW.user_id,
    'task_created',
    'Created task: ' || NEW.title,
    'task',
    NEW.id,
    jsonb_build_object('priority', NEW.priority, 'status', NEW.status)
  );
  RETURN NEW;
END;
$$;


--
-- Name: log_user_activity(uuid, text, text, text, uuid, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_user_activity(p_user_id uuid, p_action_type text, p_action_description text, p_related_entity_type text DEFAULT NULL::text, p_related_entity_id uuid DEFAULT NULL::uuid, p_metadata jsonb DEFAULT NULL::jsonb) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  new_log_id UUID;
BEGIN
  INSERT INTO public.activity_logs (
    user_id,
    action_type,
    action_description,
    related_entity_type,
    related_entity_id,
    metadata
  ) VALUES (
    p_user_id,
    p_action_type,
    p_action_description,
    p_related_entity_type,
    p_related_entity_id,
    p_metadata
  )
  RETURNING id INTO new_log_id;
  
  RETURN new_log_id;
END;
$$;


--
-- Name: notify_sales_team_new_lead(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.notify_sales_team_new_lead() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  contact_id uuid;
  lead_source_text text;
BEGIN
  -- Determine lead source
  IF TG_TABLE_NAME = 'advertisers' THEN
    lead_source_text := 'Advertiser Account';
  ELSIF TG_TABLE_NAME = 'award_sponsorships' THEN
    lead_source_text := 'Award Sponsorship';
  ELSE
    lead_source_text := 'Unknown';
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
    COALESCE(NEW.contact_name, NEW.sponsor_name),
    COALESCE(NEW.contact_email, NEW.sponsor_email),
    COALESCE(NEW.company_name, NEW.sponsor_name),
    NEW.contact_phone,
    'new',
    lead_source_text,
    'Auto-generated from ' || lead_source_text
  )
  RETURNING id INTO contact_id;

  RETURN NEW;
END;
$$;


--
-- Name: update_ad_videos_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_ad_videos_updated_at() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: update_campaign_totals(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_campaign_totals() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.is_valid = true THEN
    UPDATE ad_campaigns
    SET 
      total_impressions = total_impressions + 1,
      total_spent = total_spent + (cpm_bid / 1000.0)
    WHERE id = NEW.campaign_id;
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: update_integration_metadata_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_integration_metadata_updated_at() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: update_nominee_vote_count(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_nominee_vote_count() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.award_nominees
    SET total_votes = total_votes + NEW.vote_weight
    WHERE id = NEW.nominee_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.award_nominees
    SET total_votes = total_votes - OLD.vote_weight
    WHERE id = OLD.nominee_id;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: update_polls_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_polls_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: update_saved_proformas_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_saved_proformas_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: activity_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.activity_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    action_type text NOT NULL,
    action_description text NOT NULL,
    related_entity_type text,
    related_entity_id uuid,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: ad_call_inquiries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ad_call_inquiries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    audio_ad_id uuid,
    advertiser_id uuid,
    campaign_id uuid,
    caller_number text NOT NULL,
    call_start timestamp with time zone NOT NULL,
    call_end timestamp with time zone,
    call_duration_seconds integer,
    promo_code_used text,
    is_billable boolean DEFAULT false,
    is_qualified boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: ad_campaigns; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ad_campaigns (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    advertiser_id uuid,
    name text NOT NULL,
    budget numeric(10,2) NOT NULL,
    cpm_bid numeric(10,2) NOT NULL,
    start_date timestamp with time zone NOT NULL,
    end_date timestamp with time zone NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    targeting_rules jsonb DEFAULT '{}'::jsonb,
    total_impressions integer DEFAULT 0,
    total_spent numeric(10,2) DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    campaign_type text DEFAULT 'standard'::text NOT NULL,
    max_impressions integer,
    remaining_impressions integer,
    CONSTRAINT ad_campaigns_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'active'::text, 'paused'::text, 'completed'::text]))),
    CONSTRAINT campaign_type_check CHECK ((campaign_type = ANY (ARRAY['standard'::text, 'quick'::text])))
);


--
-- Name: ad_creatives; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ad_creatives (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    campaign_id uuid NOT NULL,
    audio_url text,
    duration_seconds integer NOT NULL,
    vast_tag_url text,
    creative_type text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT ad_creatives_creative_type_check CHECK ((creative_type = ANY (ARRAY['audio'::text, 'vast'::text])))
);


--
-- Name: ad_cta_clicks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ad_cta_clicks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ad_slot_id uuid NOT NULL,
    campaign_id uuid,
    episode_id uuid NOT NULL,
    podcast_id uuid NOT NULL,
    creator_id uuid NOT NULL,
    clicked_at timestamp with time zone DEFAULT now(),
    listener_ip_hash text NOT NULL,
    user_agent text,
    referrer text
);


--
-- Name: ad_impressions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ad_impressions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ad_slot_id uuid NOT NULL,
    campaign_id uuid,
    episode_id uuid NOT NULL,
    podcast_id uuid NOT NULL,
    creator_id uuid NOT NULL,
    listener_ip_hash text NOT NULL,
    user_agent text,
    played_at timestamp with time zone DEFAULT now(),
    country text,
    city text,
    is_valid boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: ad_slots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ad_slots (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    episode_id uuid NOT NULL,
    slot_type text NOT NULL,
    position_seconds integer DEFAULT 0,
    ad_source text DEFAULT 'manual'::text NOT NULL,
    manual_audio_url text,
    assigned_campaign_id uuid,
    status text DEFAULT 'empty'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    cta_url text,
    cta_text text DEFAULT 'Learn More'::text,
    CONSTRAINT ad_slots_ad_source_check CHECK ((ad_source = ANY (ARRAY['manual'::text, 'platform'::text]))),
    CONSTRAINT ad_slots_slot_type_check CHECK ((slot_type = ANY (ARRAY['pre'::text, 'mid'::text, 'post'::text]))),
    CONSTRAINT ad_slots_status_check CHECK ((status = ANY (ARRAY['empty'::text, 'filled'::text, 'active'::text])))
);


--
-- Name: ad_videos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ad_videos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    video_url text NOT NULL,
    thumbnail_url text,
    duration_seconds integer,
    advertiser_company text,
    campaign_name text,
    created_by_user_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    is_active boolean DEFAULT true
);


--
-- Name: advertiser_pricing_tiers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.advertiser_pricing_tiers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tier_name text NOT NULL,
    min_deposit numeric NOT NULL,
    cpm_min numeric NOT NULL,
    cpm_max numeric NOT NULL,
    conversational_ad_rate numeric DEFAULT 0.25 NOT NULL,
    conversational_ad_discount numeric DEFAULT 0,
    features jsonb DEFAULT '[]'::jsonb,
    display_order integer NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: advertiser_team_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.advertiser_team_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    advertiser_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role public.advertiser_team_role DEFAULT 'ad_manager'::public.advertiser_team_role NOT NULL,
    invited_by uuid,
    invited_at timestamp with time zone DEFAULT now(),
    accepted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: advertiser_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.advertiser_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    advertiser_id uuid NOT NULL,
    transaction_type text NOT NULL,
    amount numeric(10,2) NOT NULL,
    balance_after numeric(10,2) NOT NULL,
    description text,
    campaign_id uuid,
    stripe_payment_intent_id text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT advertiser_transactions_transaction_type_check CHECK ((transaction_type = ANY (ARRAY['deposit'::text, 'charge'::text, 'refund'::text, 'topup'::text])))
);


--
-- Name: advertisers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.advertisers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    company_name text NOT NULL,
    contact_name text NOT NULL,
    contact_email text NOT NULL,
    contact_phone text,
    website_url text,
    business_description text,
    status text DEFAULT 'pending'::text,
    stripe_customer_id text,
    account_balance numeric(10,2) DEFAULT 0.00,
    auto_topup_enabled boolean DEFAULT false,
    auto_topup_threshold numeric(10,2) DEFAULT 100.00,
    auto_topup_amount numeric(10,2) DEFAULT 500.00,
    approved_by uuid,
    approved_at timestamp with time zone,
    rejection_reason text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    pricing_tier_id uuid,
    campaign_goals text[],
    target_categories text[],
    CONSTRAINT advertisers_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'suspended'::text])))
);


--
-- Name: ai_conversations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_conversations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: ai_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    conversation_id uuid NOT NULL,
    role text NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ai_messages_role_check CHECK ((role = ANY (ARRAY['user'::text, 'assistant'::text])))
);


--
-- Name: audio_ads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audio_ads (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    advertiser_id uuid NOT NULL,
    campaign_id uuid,
    script text NOT NULL,
    voice_id text NOT NULL,
    voice_name text,
    audio_url text,
    duration_seconds integer,
    status text DEFAULT 'generating'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    ad_type text DEFAULT 'standard'::text NOT NULL,
    conversation_config jsonb,
    elevenlabs_agent_id text,
    phone_number text,
    phone_number_type text DEFAULT 'shared'::text,
    agent_setup_fee_charged boolean DEFAULT false,
    custom_phone_fee_charged boolean DEFAULT false,
    promo_code text,
    payout_type text,
    payout_amount numeric(10,2),
    tracking_phone_number text,
    greeting_script text,
    greeting_audio_url text,
    greeting_voice_id text,
    campaign_name text,
    thumbnail_url text,
    CONSTRAINT audio_ads_ad_type_check CHECK ((ad_type = ANY (ARRAY['standard'::text, 'conversational'::text]))),
    CONSTRAINT audio_ads_payout_type_check CHECK ((payout_type = ANY (ARRAY['ppi'::text, 'ppc'::text])))
);


--
-- Name: availability_schedules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.availability_schedules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    day_of_week integer NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    is_available boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT availability_schedules_day_of_week_check CHECK (((day_of_week >= 0) AND (day_of_week <= 6))),
    CONSTRAINT valid_time_range CHECK ((end_time > start_time))
);


--
-- Name: award_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.award_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    program_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    display_order integer DEFAULT 0,
    max_nominees integer,
    allow_media_submission boolean DEFAULT false,
    media_type text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: award_nominees; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.award_nominees (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    category_id uuid NOT NULL,
    program_id uuid NOT NULL,
    nominee_name text NOT NULL,
    nominee_email text,
    nominee_description text,
    nominee_image_url text,
    rss_feed_url text,
    video_url text,
    audio_url text,
    status public.nominee_status DEFAULT 'pending'::public.nominee_status NOT NULL,
    submitted_by_user_id uuid,
    unique_voting_link text,
    total_votes integer DEFAULT 0,
    vote_breakdown jsonb DEFAULT '{}'::jsonb,
    predicted_rank integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: award_payouts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.award_payouts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    program_id uuid NOT NULL,
    creator_user_id uuid NOT NULL,
    payout_type text NOT NULL,
    source_id uuid NOT NULL,
    amount numeric NOT NULL,
    platform_fee numeric DEFAULT 0,
    net_amount numeric NOT NULL,
    stripe_transfer_id text,
    status text DEFAULT 'pending'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    paid_at timestamp with time zone,
    payout_scheduled_date timestamp with time zone,
    processing_started_at timestamp with time zone,
    hold_until_date timestamp with time zone,
    CONSTRAINT award_payouts_payout_type_check CHECK ((payout_type = ANY (ARRAY['nomination_fee'::text, 'sponsorship'::text]))),
    CONSTRAINT award_payouts_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'processing'::text, 'paid'::text, 'failed'::text])))
);


--
-- Name: award_registrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.award_registrations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    program_id uuid NOT NULL,
    attendee_name text NOT NULL,
    attendee_email text NOT NULL,
    amount_paid numeric NOT NULL,
    stripe_payment_intent_id text,
    status text DEFAULT 'pending'::text NOT NULL,
    paid_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: award_self_nominations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.award_self_nominations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    program_id uuid NOT NULL,
    category_id uuid NOT NULL,
    nominee_id uuid NOT NULL,
    user_id uuid NOT NULL,
    amount_paid numeric NOT NULL,
    stripe_payment_intent_id text,
    status text DEFAULT 'pending'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    paid_at timestamp with time zone,
    CONSTRAINT award_self_nominations_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'paid'::text, 'refunded'::text])))
);


--
-- Name: award_sponsorship_packages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.award_sponsorship_packages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    program_id uuid NOT NULL,
    package_name text NOT NULL,
    package_description text,
    price numeric NOT NULL,
    benefits jsonb DEFAULT '[]'::jsonb,
    logo_size text DEFAULT 'medium'::text,
    display_order integer DEFAULT 0,
    max_sponsors integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    fee_configuration jsonb DEFAULT '{"creator_percentage": 0, "who_pays_processing": "sponsor"}'::jsonb,
    CONSTRAINT award_sponsorship_packages_logo_size_check CHECK ((logo_size = ANY (ARRAY['small'::text, 'medium'::text, 'large'::text])))
);


--
-- Name: award_sponsorships; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.award_sponsorships (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    program_id uuid NOT NULL,
    package_id uuid NOT NULL,
    sponsor_name text NOT NULL,
    sponsor_email text NOT NULL,
    sponsor_logo_url text,
    sponsor_website_url text,
    amount_paid numeric NOT NULL,
    stripe_payment_intent_id text,
    status text DEFAULT 'pending'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    paid_at timestamp with time zone,
    social_media_handles jsonb DEFAULT '{}'::jsonb,
    hashtags text[] DEFAULT '{}'::text[],
    mentions text[] DEFAULT '{}'::text[],
    CONSTRAINT award_sponsorships_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'paid'::text, 'refunded'::text])))
);


--
-- Name: award_votes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.award_votes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    program_id uuid NOT NULL,
    category_id uuid NOT NULL,
    nominee_id uuid NOT NULL,
    voter_id uuid,
    voter_email text,
    voter_name text,
    voter_ip_hash text,
    vote_weight integer DEFAULT 1,
    rank_position integer,
    voted_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: award_winners; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.award_winners (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    program_id uuid NOT NULL,
    category_id uuid NOT NULL,
    nominee_id uuid NOT NULL,
    placement integer NOT NULL,
    announced_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: awards_programs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.awards_programs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    cover_image_url text,
    status public.award_program_status DEFAULT 'draft'::public.award_program_status NOT NULL,
    voting_method public.voting_method DEFAULT 'public'::public.voting_method NOT NULL,
    nominations_open_date timestamp with time zone,
    nominations_close_date timestamp with time zone,
    voting_open_date timestamp with time zone,
    voting_close_date timestamp with time zone,
    ceremony_date timestamp with time zone,
    allow_public_nominations boolean DEFAULT false,
    require_voter_registration boolean DEFAULT false,
    show_live_results boolean DEFAULT false,
    max_votes_per_voter integer DEFAULT 1,
    studio_session_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    nomination_type text DEFAULT 'public_only'::text,
    self_nomination_fee numeric DEFAULT 0,
    stripe_connect_account_id text,
    stripe_connect_status text DEFAULT 'not_connected'::text,
    registration_fee numeric DEFAULT 0,
    fee_configuration jsonb DEFAULT '{"creator_percentage": 4.0, "platform_percentage": 4.0, "who_pays_processing": "creator", "platform_processing_fee": 10.95}'::jsonb,
    payout_scheduled_date timestamp with time zone,
    sponsorship_flyer_url text,
    CONSTRAINT awards_programs_nomination_type_check CHECK ((nomination_type = ANY (ARRAY['public_only'::text, 'self_only'::text, 'both'::text]))),
    CONSTRAINT awards_programs_stripe_connect_status_check CHECK ((stripe_connect_status = ANY (ARRAY['not_connected'::text, 'pending'::text, 'connected'::text])))
);


--
-- Name: blocked_times; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blocked_times (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone NOT NULL,
    reason text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT valid_blocked_range CHECK ((end_time > start_time))
);


--
-- Name: blog_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blog_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: blog_post_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blog_post_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    post_id uuid NOT NULL,
    category_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: blog_posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blog_posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    content text NOT NULL,
    excerpt text,
    featured_image_url text,
    status text DEFAULT 'draft'::text NOT NULL,
    published_at timestamp with time zone,
    seo_title text,
    seo_description text,
    seo_keywords text[],
    podcast_id uuid,
    episode_id uuid,
    is_ai_generated boolean DEFAULT false,
    views_count integer DEFAULT 0,
    publish_to_master boolean DEFAULT false,
    master_published_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    source_rss_url text,
    source_platform text,
    external_id text,
    CONSTRAINT blog_posts_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text])))
);


--
-- Name: calendar_connections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.calendar_connections (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    provider text DEFAULT 'google'::text NOT NULL,
    access_token text NOT NULL,
    refresh_token text NOT NULL,
    token_expiry timestamp with time zone NOT NULL,
    calendar_id text,
    calendar_email text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: campaign_properties; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.campaign_properties (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    multi_channel_campaign_id uuid,
    property_type text NOT NULL,
    property_id uuid NOT NULL,
    property_name text NOT NULL,
    allocated_impressions integer NOT NULL,
    allocated_budget numeric(10,2) NOT NULL,
    cpm_rate numeric(10,2) NOT NULL,
    status text DEFAULT 'pending'::text,
    creator_id uuid,
    creator_response_date timestamp with time zone,
    rejection_reason text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT campaign_properties_property_type_check CHECK ((property_type = ANY (ARRAY['podcast'::text, 'website'::text, 'email'::text, 'my_page'::text, 'event'::text, 'social_media'::text]))),
    CONSTRAINT campaign_properties_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'active'::text, 'completed'::text])))
);


--
-- Name: campaign_property_impressions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.campaign_property_impressions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    campaign_property_id uuid,
    multi_channel_campaign_id uuid,
    impression_count integer DEFAULT 1,
    tracked_at timestamp with time zone DEFAULT now(),
    tracking_method text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT campaign_property_impressions_tracking_method_check CHECK ((tracking_method = ANY (ARRAY['pixel'::text, 'api'::text, 'manual'::text, 'link_click'::text])))
);


--
-- Name: civic_articles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.civic_articles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    author text,
    category text,
    related_event_ids uuid[],
    topics text[],
    hero_image_url text,
    content text NOT NULL,
    publish_date timestamp with time zone,
    status text DEFAULT 'draft'::text NOT NULL,
    ai_drafted boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: civic_compliance_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.civic_compliance_records (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    funding_notes text,
    disclosure_notes text,
    required_notices jsonb,
    filing_links text[],
    recap_summary text,
    recap_documents jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: civic_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.civic_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    event_type text NOT NULL,
    location_type text,
    location_details text,
    event_date timestamp with time zone NOT NULL,
    end_date timestamp with time zone,
    visibility text DEFAULT 'public'::text NOT NULL,
    agenda text,
    status text DEFAULT 'scheduled'::text NOT NULL,
    topics text[],
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: civic_live_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.civic_live_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    stream_status text DEFAULT 'preparing'::text NOT NULL,
    recording_enabled boolean DEFAULT true,
    recording_url text,
    started_at timestamp with time zone,
    ended_at timestamp with time zone,
    view_count integer DEFAULT 0,
    key_moments jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: client_tickets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_tickets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    client_contact_id uuid,
    title text NOT NULL,
    description text,
    priority text DEFAULT 'medium'::text,
    status text DEFAULT 'open'::text,
    due_date timestamp with time zone,
    category text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT client_tickets_priority_check CHECK ((priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'urgent'::text]))),
    CONSTRAINT client_tickets_status_check CHECK ((status = ANY (ARRAY['open'::text, 'in_progress'::text, 'completed'::text, 'closed'::text])))
);


--
-- Name: constituent_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.constituent_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    address text,
    topic text NOT NULL,
    message text NOT NULL,
    status text DEFAULT 'new'::text NOT NULL,
    assigned_to uuid,
    ai_suggested_response text,
    staff_response text,
    responded_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: contact_list_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contact_list_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    list_id uuid NOT NULL,
    contact_id uuid NOT NULL,
    added_at timestamp with time zone DEFAULT now()
);


--
-- Name: contact_lists; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contact_lists (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    color text DEFAULT '#0064B1'::text,
    is_system boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: contact_tag_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contact_tag_assignments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    contact_id uuid NOT NULL,
    tag_id uuid NOT NULL,
    assigned_at timestamp with time zone DEFAULT now()
);


--
-- Name: contact_tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contact_tags (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    color text DEFAULT '#F0A71F'::text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: contacts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contacts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    name text NOT NULL,
    email text NOT NULL,
    phone text,
    title text,
    company text,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    sales_rep_id uuid,
    lead_status text DEFAULT 'new'::text,
    lead_source text,
    CONSTRAINT contacts_lead_status_check CHECK ((lead_status = ANY (ARRAY['new'::text, 'contacted'::text, 'qualified'::text, 'negotiating'::text, 'won'::text, 'lost'::text])))
);


--
-- Name: conversational_ad_charges; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conversational_ad_charges (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    advertiser_id uuid NOT NULL,
    campaign_id uuid,
    audio_ad_id uuid,
    charge_type text NOT NULL,
    amount numeric NOT NULL,
    description text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: conversational_ad_usage; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conversational_ad_usage (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    advertiser_id uuid NOT NULL,
    campaign_id uuid,
    audio_ad_id uuid,
    conversation_id text,
    duration_seconds integer NOT NULL,
    cost_per_minute numeric NOT NULL,
    total_cost numeric NOT NULL,
    caller_phone text,
    started_at timestamp with time zone NOT NULL,
    ended_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: creator_campaign_alerts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.creator_campaign_alerts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    creator_id uuid,
    multi_channel_campaign_id uuid,
    property_type text NOT NULL,
    property_id uuid NOT NULL,
    alert_type text DEFAULT 'invitation'::text,
    viewed_at timestamp with time zone,
    responded_at timestamp with time zone,
    response text,
    counter_bid_amount numeric(10,2),
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT creator_campaign_alerts_alert_type_check CHECK ((alert_type = ANY (ARRAY['invitation'::text, 'bid_request'::text, 'auto_match'::text]))),
    CONSTRAINT creator_campaign_alerts_response_check CHECK ((response = ANY (ARRAY['accepted'::text, 'rejected'::text, 'counter_bid'::text])))
);


--
-- Name: creator_earnings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.creator_earnings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    campaign_id uuid NOT NULL,
    period_start timestamp with time zone NOT NULL,
    period_end timestamp with time zone NOT NULL,
    total_impressions integer DEFAULT 0,
    revenue_generated numeric(10,2) DEFAULT 0,
    creator_share numeric(10,2) DEFAULT 0,
    platform_share numeric(10,2) DEFAULT 0,
    payout_status text DEFAULT 'pending'::text NOT NULL,
    paid_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT creator_earnings_payout_status_check CHECK ((payout_status = ANY (ARRAY['pending'::text, 'processing'::text, 'paid'::text, 'failed'::text])))
);


--
-- Name: creator_tips; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.creator_tips (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    creator_id uuid NOT NULL,
    amount numeric(10,2) NOT NULL,
    message text,
    stripe_session_id text,
    stripe_payment_intent_id text,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    paid_at timestamp with time zone,
    CONSTRAINT valid_amount CHECK ((amount > (0)::numeric)),
    CONSTRAINT valid_status CHECK ((status = ANY (ARRAY['pending'::text, 'completed'::text, 'failed'::text, 'refunded'::text])))
);


--
-- Name: custom_link_sections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.custom_link_sections (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    profile_id uuid NOT NULL,
    name text NOT NULL,
    image_url text,
    display_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: custom_links; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.custom_links (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    profile_id uuid NOT NULL,
    title text NOT NULL,
    url text NOT NULL,
    description text,
    image_url text,
    display_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    section text
);


--
-- Name: digital_ads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.digital_ads (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    advertiser_id uuid NOT NULL,
    campaign_id uuid,
    platform_type text NOT NULL,
    social_platform text,
    ad_size_preset text NOT NULL,
    width integer NOT NULL,
    height integer NOT NULL,
    creative_url text NOT NULL,
    creative_type text NOT NULL,
    cta_url text NOT NULL,
    cta_text text DEFAULT 'Learn More'::text NOT NULL,
    caption text,
    hashtags text[],
    mentions text[],
    status text DEFAULT 'draft'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT digital_ads_creative_type_check CHECK ((creative_type = ANY (ARRAY['image'::text, 'video'::text]))),
    CONSTRAINT digital_ads_platform_type_check CHECK ((platform_type = ANY (ARRAY['website'::text, 'social_media'::text]))),
    CONSTRAINT digital_ads_social_platform_check CHECK ((social_platform = ANY (ARRAY['instagram_post'::text, 'instagram_story'::text, 'facebook'::text, 'linkedin'::text, 'tiktok'::text]))),
    CONSTRAINT digital_ads_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'ready'::text, 'live'::text, 'paused'::text])))
);


--
-- Name: email_campaigns; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_campaigns (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    campaign_name text NOT NULL,
    subject text,
    created_at timestamp with time zone DEFAULT now(),
    sent_at timestamp with time zone,
    status text DEFAULT 'draft'::text,
    CONSTRAINT email_campaigns_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'scheduled'::text, 'sending'::text, 'sent'::text, 'cancelled'::text])))
);


--
-- Name: email_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    campaign_id uuid,
    recipient_email text NOT NULL,
    event_type text NOT NULL,
    event_data jsonb,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT email_events_event_type_check CHECK ((event_type = ANY (ARRAY['sent'::text, 'delivered'::text, 'opened'::text, 'clicked'::text, 'bounced'::text, 'complained'::text])))
);


--
-- Name: email_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    email_type text NOT NULL,
    recipient_email text NOT NULL,
    recipient_name text NOT NULL,
    subject text NOT NULL,
    sent_at timestamp with time zone DEFAULT now() NOT NULL,
    status text DEFAULT 'sent'::text NOT NULL,
    error_message text,
    related_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: email_reminders_sent; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_reminders_sent (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    reminder_type text NOT NULL,
    related_id uuid NOT NULL,
    recipient_email text NOT NULL,
    sent_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: episodes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.episodes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    podcast_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    audio_url text NOT NULL,
    duration_seconds integer,
    file_size_bytes bigint,
    episode_number integer,
    season_number integer,
    publish_date timestamp with time zone DEFAULT now() NOT NULL,
    is_published boolean DEFAULT false,
    transcript text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: event_registrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_registrations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    attendee_name text NOT NULL,
    attendee_email text NOT NULL,
    custom_responses jsonb DEFAULT '{}'::jsonb,
    checked_in boolean DEFAULT false,
    registered_at timestamp with time zone DEFAULT now()
);


--
-- Name: event_sponsorship_packages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_sponsorship_packages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    package_name text NOT NULL,
    package_description text,
    price numeric(10,2) NOT NULL,
    max_sponsors integer,
    benefits jsonb,
    display_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: event_sponsorships; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_sponsorships (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    package_id uuid NOT NULL,
    sponsor_name text NOT NULL,
    sponsor_email text NOT NULL,
    sponsor_website_url text,
    sponsor_logo_url text,
    amount_paid numeric(10,2) NOT NULL,
    status text DEFAULT 'pending'::text,
    stripe_payment_intent_id text,
    paid_at timestamp with time zone,
    social_media_handles jsonb,
    hashtags text[],
    mentions text[],
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    event_date timestamp with time zone NOT NULL,
    location text,
    capacity integer,
    image_url text,
    registration_questions jsonb DEFAULT '[]'::jsonb,
    is_published boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    show_on_profile boolean DEFAULT true
);


--
-- Name: financial_assumptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.financial_assumptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    assumption_name text NOT NULL,
    assumption_type text NOT NULL,
    current_value numeric(15,2),
    projected_values jsonb,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: financial_snapshots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.financial_snapshots (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    snapshot_date timestamp with time zone NOT NULL,
    snapshot_type text NOT NULL,
    subscription_mrr numeric(15,2) DEFAULT 0,
    ad_revenue numeric(15,2) DEFAULT 0,
    sponsorship_revenue numeric(15,2) DEFAULT 0,
    total_revenue numeric(15,2) DEFAULT 0,
    storage_costs numeric(15,2) DEFAULT 0,
    ai_compute_costs numeric(15,2) DEFAULT 0,
    payment_processing_costs numeric(15,2) DEFAULT 0,
    creator_payouts numeric(15,2) DEFAULT 0,
    total_costs numeric(15,2) DEFAULT 0,
    total_users integer DEFAULT 0,
    active_creators integer DEFAULT 0,
    total_podcasts integer DEFAULT 0,
    total_episodes integer DEFAULT 0,
    total_impressions integer DEFAULT 0,
    average_cpm numeric(10,2) DEFAULT 0,
    fill_rate numeric(5,2) DEFAULT 0,
    cac numeric(10,2) DEFAULT 0,
    ltv numeric(10,2) DEFAULT 0,
    gross_margin numeric(5,2),
    burn_rate numeric(15,2),
    runway_months integer,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: influencehub_creators; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.influencehub_creators (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    agency_user_id uuid NOT NULL,
    creator_user_id uuid,
    creator_name text NOT NULL,
    creator_email text,
    creator_bio text,
    creator_image_url text,
    is_managed boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: influencehub_posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.influencehub_posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    creator_id uuid,
    social_account_id uuid,
    caption text,
    media_urls text[] DEFAULT ARRAY[]::text[],
    platforms text[] DEFAULT ARRAY[]::text[],
    scheduled_for timestamp with time zone,
    published_at timestamp with time zone,
    status text DEFAULT 'draft'::text,
    post_ids jsonb DEFAULT '{}'::jsonb,
    hashtags text[] DEFAULT ARRAY[]::text[],
    first_comment text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT influencehub_posts_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'scheduled'::text, 'published'::text, 'failed'::text])))
);


--
-- Name: integration_metadata; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.integration_metadata (
    id text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    tooltip_text text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: investor_talking_points; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.investor_talking_points (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    generated_by_user_id uuid NOT NULL,
    generation_date timestamp with time zone DEFAULT now(),
    period_start date NOT NULL,
    period_end date NOT NULL,
    talking_points text NOT NULL,
    key_metrics jsonb,
    assumptions_used jsonb,
    version integer DEFAULT 1,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: invoices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    client_contact_id uuid,
    proposal_id uuid,
    invoice_number text NOT NULL,
    title text NOT NULL,
    description text,
    items jsonb DEFAULT '[]'::jsonb,
    subtotal numeric(10,2) DEFAULT 0 NOT NULL,
    tax_rate numeric(5,2) DEFAULT 0,
    tax_amount numeric(10,2) DEFAULT 0,
    total_amount numeric(10,2) DEFAULT 0 NOT NULL,
    amount_paid numeric(10,2) DEFAULT 0,
    status text DEFAULT 'draft'::text,
    due_date date,
    paid_at timestamp with time zone,
    stripe_payment_intent_id text,
    payment_link text,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT invoices_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'sent'::text, 'viewed'::text, 'paid'::text, 'overdue'::text, 'cancelled'::text])))
);


--
-- Name: link_clicks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.link_clicks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    profile_id uuid NOT NULL,
    link_url text NOT NULL,
    link_type text NOT NULL,
    clicked_at timestamp with time zone DEFAULT now() NOT NULL,
    visitor_country text,
    visitor_city text
);


--
-- Name: live_stream_viewers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.live_stream_viewers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    profile_id uuid NOT NULL,
    session_id text NOT NULL,
    joined_at timestamp with time zone DEFAULT now() NOT NULL,
    last_seen_at timestamp with time zone DEFAULT now() NOT NULL,
    is_active boolean DEFAULT true
);


--
-- Name: media_ad_slots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.media_ad_slots (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    media_file_id uuid NOT NULL,
    processing_job_id uuid,
    slot_type text NOT NULL,
    position_seconds numeric,
    audio_ad_id uuid,
    ad_file_url text,
    ad_duration_seconds numeric,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT media_ad_slots_slot_type_check CHECK ((slot_type = ANY (ARRAY['pre_roll'::text, 'mid_roll'::text, 'post_roll'::text])))
);


--
-- Name: media_files; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.media_files (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    file_url text NOT NULL,
    file_type text NOT NULL,
    file_name text NOT NULL,
    duration_seconds integer,
    file_size_bytes bigint,
    edit_status text DEFAULT 'unprocessed'::text,
    edit_transcript jsonb,
    original_file_url text,
    converted_to_episode_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    source text DEFAULT 'upload'::text,
    clip_metadata jsonb,
    CONSTRAINT media_files_edit_status_check CHECK ((edit_status = ANY (ARRAY['unprocessed'::text, 'processing'::text, 'edited'::text, 'error'::text])))
);


--
-- Name: media_processing_jobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.media_processing_jobs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    media_file_id uuid NOT NULL,
    job_type text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    processing_started_at timestamp with time zone,
    processing_completed_at timestamp with time zone,
    error_message text,
    config jsonb DEFAULT '{}'::jsonb,
    output_file_url text,
    output_file_size_bytes bigint,
    output_duration_seconds numeric,
    processing_time_seconds numeric,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT media_processing_jobs_job_type_check CHECK ((job_type = ANY (ARRAY['ai_edit'::text, 'ad_insertion'::text, 'full_process'::text]))),
    CONSTRAINT media_processing_jobs_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'failed'::text])))
);


--
-- Name: media_versions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.media_versions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    original_media_id uuid NOT NULL,
    processing_job_id uuid,
    version_type text NOT NULL,
    file_url text NOT NULL,
    file_size_bytes bigint,
    duration_seconds numeric,
    edits_applied jsonb DEFAULT '[]'::jsonb,
    ads_inserted integer DEFAULT 0,
    time_saved_seconds numeric,
    is_primary boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT media_versions_version_type_check CHECK ((version_type = ANY (ARRAY['original'::text, 'ai_edited'::text, 'with_ads'::text, 'full_processed'::text])))
);


--
-- Name: meeting_invitations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.meeting_invitations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    meeting_type_id uuid NOT NULL,
    inviter_id uuid NOT NULL,
    invitee_name text NOT NULL,
    invitee_email text NOT NULL,
    custom_message text,
    status text DEFAULT 'pending'::text NOT NULL,
    sent_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: meeting_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.meeting_types (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    duration integer NOT NULL,
    location_type public.location_type DEFAULT 'zoom'::public.location_type NOT NULL,
    custom_location_url text,
    pre_meeting_questions jsonb DEFAULT '[]'::jsonb,
    availability_windows jsonb DEFAULT '[]'::jsonb,
    buffer_time_before integer DEFAULT 0,
    buffer_time_after integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: meetings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.meetings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    meeting_type_id uuid,
    title text NOT NULL,
    description text,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone NOT NULL,
    location_type public.location_type NOT NULL,
    location_details text,
    attendee_name text NOT NULL,
    attendee_email text NOT NULL,
    attendee_phone text,
    attendee_responses jsonb DEFAULT '{}'::jsonb,
    status public.meeting_status DEFAULT 'scheduled'::public.meeting_status,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: microsoft_connections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.microsoft_connections (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    access_token text NOT NULL,
    refresh_token text NOT NULL,
    token_expiry timestamp with time zone NOT NULL,
    microsoft_email text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: module_purchases; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.module_purchases (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    module_id uuid NOT NULL,
    amount_paid numeric(10,2) NOT NULL,
    stripe_payment_intent_id text,
    purchased_at timestamp with time zone DEFAULT now(),
    status text DEFAULT 'completed'::text,
    CONSTRAINT module_purchases_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'completed'::text, 'refunded'::text])))
);


--
-- Name: modules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.modules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    display_name text NOT NULL,
    description text,
    icon text,
    route text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    tier text DEFAULT 'free'::text NOT NULL,
    price numeric(10,2) DEFAULT 0,
    stripe_product_id text,
    stripe_price_id text,
    features jsonb DEFAULT '[]'::jsonb,
    CONSTRAINT modules_tier_check CHECK ((tier = ANY (ARRAY['free'::text, 'premium'::text])))
);


--
-- Name: multi_channel_campaigns; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.multi_channel_campaigns (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sales_team_member_id uuid,
    campaign_name text NOT NULL,
    advertiser_id uuid,
    impression_goal integer NOT NULL,
    total_budget numeric(10,2) NOT NULL,
    start_date timestamp with time zone NOT NULL,
    end_date timestamp with time zone NOT NULL,
    status text DEFAULT 'draft'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT multi_channel_campaigns_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'active'::text, 'paused'::text, 'completed'::text, 'cancelled'::text])))
);


--
-- Name: my_page_video_impressions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.my_page_video_impressions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    profile_id uuid NOT NULL,
    video_type text NOT NULL,
    video_id uuid NOT NULL,
    viewer_ip_hash text,
    user_agent text,
    viewed_at timestamp with time zone DEFAULT now(),
    session_duration_seconds integer,
    CONSTRAINT my_page_video_impressions_video_type_check CHECK ((video_type = ANY (ARRAY['own'::text, 'ad'::text])))
);


--
-- Name: podcast_ad_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.podcast_ad_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    podcast_id uuid NOT NULL,
    user_id uuid NOT NULL,
    platform_ads_enabled boolean DEFAULT false,
    minimum_cpm numeric(10,2) DEFAULT 15.00,
    blocked_categories text[] DEFAULT '{}'::text[],
    auto_approve_ads boolean DEFAULT false,
    revenue_share_percentage numeric(5,2) DEFAULT 70.00,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    ad_mode text DEFAULT 'auto'::text,
    CONSTRAINT podcast_ad_settings_ad_mode_check CHECK ((ad_mode = ANY (ARRAY['auto'::text, 'manual'::text])))
);


--
-- Name: podcast_campaign_selections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.podcast_campaign_selections (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    podcast_id uuid NOT NULL,
    campaign_id uuid NOT NULL,
    opted_in_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: podcasts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.podcasts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    cover_image_url text,
    author_name text,
    author_email text,
    website_url text,
    language text DEFAULT 'en'::text,
    category text,
    is_explicit boolean DEFAULT false,
    is_published boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    rss_feed_url text,
    show_on_profile boolean DEFAULT true
);


--
-- Name: poll_options; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.poll_options (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    poll_id uuid NOT NULL,
    option_date date NOT NULL,
    start_time time without time zone,
    end_time time without time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: poll_votes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.poll_votes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    poll_id uuid NOT NULL,
    option_id uuid NOT NULL,
    voter_email text NOT NULL,
    voter_name text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: polls; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.polls (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    is_published boolean DEFAULT false NOT NULL,
    allow_multiple_votes boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deadline timestamp with time zone,
    image_url text,
    require_voter_info boolean DEFAULT true NOT NULL
);


--
-- Name: profile_section_order; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profile_section_order (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    profile_id uuid NOT NULL,
    section_type text NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    is_visible boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: profile_views; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profile_views (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    profile_id uuid NOT NULL,
    viewed_at timestamp with time zone DEFAULT now() NOT NULL,
    visitor_country text,
    visitor_city text,
    referrer text,
    user_agent text
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    username text NOT NULL,
    full_name text,
    bio text,
    avatar_url text,
    theme_color text DEFAULT '#FF6B6B'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    social_icons_color boolean DEFAULT true,
    legal_on_profile boolean DEFAULT false,
    account_avatar_url text,
    account_full_name text,
    account_type public.account_type DEFAULT 'creator'::public.account_type,
    account_phone text,
    stripe_connect_account_id text,
    stripe_connect_status text,
    stripe_connect_details_submitted boolean DEFAULT false,
    stripe_connect_charges_enabled boolean DEFAULT false,
    stripe_connect_payouts_enabled boolean DEFAULT false,
    auto_publish_rss boolean DEFAULT false,
    blog_rss_url text,
    show_blog_on_profile boolean DEFAULT true,
    show_latest_blog_only boolean DEFAULT false,
    is_live_on_profile boolean DEFAULT false,
    live_stream_title text,
    blog_name text,
    live_video_url text,
    is_live boolean DEFAULT false,
    my_page_video_type text,
    my_page_video_id uuid,
    my_page_video_loop boolean DEFAULT true,
    page_background_color text DEFAULT '#000000'::text,
    qr_code_color text DEFAULT '#000000'::text,
    include_logo_in_qr boolean DEFAULT false,
    hero_section_color text DEFAULT '#000000'::text,
    my_page_ad_id text,
    custom_theme_colors jsonb DEFAULT '[]'::jsonb,
    custom_bg_colors jsonb DEFAULT '[]'::jsonb,
    custom_hero_colors jsonb DEFAULT '[]'::jsonb,
    categories text[] DEFAULT '{}'::text[],
    tipping_enabled boolean DEFAULT true,
    tipping_button_text text DEFAULT 'Send a Tip'::text,
    my_page_cta_button_text text DEFAULT 'Tip'::text,
    my_page_cta_phone_number text,
    my_page_cta_text_keyword text,
    CONSTRAINT profiles_my_page_video_type_check CHECK ((my_page_video_type = ANY (ARRAY['own'::text, 'ad'::text]))),
    CONSTRAINT profiles_stripe_connect_status_check CHECK ((stripe_connect_status = ANY (ARRAY['pending'::text, 'active'::text, 'restricted'::text, 'disconnected'::text]))),
    CONSTRAINT profiles_tipping_button_text_check CHECK ((tipping_button_text = ANY (ARRAY['Send a Tip'::text, 'Donate'::text, 'Send Funds'::text])))
);


--
-- Name: proposals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.proposals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    client_contact_id uuid,
    proposal_number text NOT NULL,
    title text NOT NULL,
    description text,
    items jsonb DEFAULT '[]'::jsonb,
    subtotal numeric(10,2) DEFAULT 0 NOT NULL,
    tax_rate numeric(5,2) DEFAULT 0,
    tax_amount numeric(10,2) DEFAULT 0,
    total_amount numeric(10,2) DEFAULT 0 NOT NULL,
    status text DEFAULT 'draft'::text,
    valid_until date,
    signed_at timestamp with time zone,
    signed_by_name text,
    signed_by_email text,
    signature_data text,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT proposals_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'sent'::text, 'viewed'::text, 'accepted'::text, 'declined'::text])))
);


--
-- Name: qr_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.qr_codes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    url text NOT NULL,
    type text NOT NULL,
    item_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT qr_codes_type_check CHECK ((type = ANY (ARRAY['custom'::text, 'meeting'::text, 'event'::text, 'signup'::text, 'poll'::text])))
);


--
-- Name: rate_limit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rate_limit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ip_address text NOT NULL,
    endpoint text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    role public.app_role NOT NULL,
    permission text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: sales_commissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sales_commissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sales_team_member_id uuid,
    multi_channel_campaign_id uuid,
    campaign_revenue numeric(10,2) NOT NULL,
    commission_rate numeric(5,2) NOT NULL,
    commission_amount numeric(10,2) NOT NULL,
    paid_at timestamp with time zone,
    status text DEFAULT 'pending'::text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT sales_commissions_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'paid'::text, 'cancelled'::text])))
);


--
-- Name: sales_team_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sales_team_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    full_name text NOT NULL,
    email text NOT NULL,
    commission_rate numeric(5,2) DEFAULT 10.00,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: saved_proformas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.saved_proformas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    proforma_name text NOT NULL,
    proforma_data jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: signup_sheets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.signup_sheets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    start_date timestamp with time zone NOT NULL,
    end_date timestamp with time zone NOT NULL,
    slot_duration integer NOT NULL,
    location text,
    is_published boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: signup_slots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.signup_slots (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sheet_id uuid NOT NULL,
    slot_start timestamp with time zone NOT NULL,
    slot_end timestamp with time zone NOT NULL,
    volunteer_name text,
    volunteer_email text,
    volunteer_phone text,
    notes text,
    is_filled boolean DEFAULT false,
    signed_up_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: social_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.social_accounts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    platform text NOT NULL,
    account_id text NOT NULL,
    account_name text NOT NULL,
    account_username text,
    account_image_url text,
    access_token text NOT NULL,
    refresh_token text,
    token_expires_at timestamp with time zone,
    is_active boolean DEFAULT true,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT social_accounts_platform_check CHECK ((platform = ANY (ARRAY['instagram'::text, 'facebook'::text, 'tiktok'::text, 'youtube'::text, 'linkedin'::text, 'twitter'::text])))
);


--
-- Name: social_links; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.social_links (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    profile_id uuid NOT NULL,
    platform text NOT NULL,
    url text NOT NULL,
    display_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: social_media_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.social_media_accounts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    platform text NOT NULL,
    platform_user_id text,
    platform_username text,
    access_token text,
    token_expires_at timestamp with time zone,
    refresh_token text,
    is_business_account boolean DEFAULT false,
    account_metadata jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    username text,
    followers_count integer,
    engagement_rate numeric(5,2),
    is_verified boolean DEFAULT false,
    profile_url text,
    last_synced_at timestamp with time zone,
    CONSTRAINT social_media_accounts_platform_check CHECK ((platform = ANY (ARRAY['instagram'::text, 'facebook'::text, 'tiktok'::text, 'youtube'::text, 'twitter'::text, 'x'::text, 'linkedin'::text, 'twitch'::text, 'snapchat'::text])))
);


--
-- Name: social_media_properties; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.social_media_properties (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    creator_id uuid,
    platform text NOT NULL,
    account_handle text NOT NULL,
    follower_count integer,
    avg_engagement_rate numeric(5,2),
    rate_per_post numeric(10,2),
    rate_per_story numeric(10,2),
    rate_per_reel numeric(10,2),
    is_verified boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT social_media_properties_platform_check CHECK ((platform = ANY (ARRAY['instagram'::text, 'facebook'::text, 'tiktok'::text, 'twitter'::text, 'youtube'::text])))
);


--
-- Name: stream_impressions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stream_impressions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    creator_id uuid NOT NULL,
    viewer_ip_hash text NOT NULL,
    session_id text NOT NULL,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    ended_at timestamp with time zone,
    watch_duration_seconds integer DEFAULT 0,
    stream_type text NOT NULL,
    stream_title text,
    viewer_location json,
    user_agent text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT stream_impressions_stream_type_check CHECK ((stream_type = ANY (ARRAY['camera'::text, 'video'::text, 'screenshare'::text])))
);


--
-- Name: studio_guests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.studio_guests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    studio_session_id uuid,
    guest_name text NOT NULL,
    guest_title text,
    guest_website text,
    display_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: studio_recording_ads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.studio_recording_ads (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    recording_id uuid NOT NULL,
    ad_slot_id uuid NOT NULL,
    inserted_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: studio_recordings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.studio_recordings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id uuid NOT NULL,
    user_id uuid NOT NULL,
    daily_recording_id text,
    recording_url text,
    duration_seconds integer,
    file_size_bytes bigint,
    status text DEFAULT 'processing'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    original_recording_url text,
    edited_recording_url text,
    edit_transcript jsonb,
    edit_status text DEFAULT 'unprocessed'::text,
    converted_to_episode_id uuid,
    CONSTRAINT studio_recordings_edit_status_check CHECK ((edit_status = ANY (ARRAY['unprocessed'::text, 'processing'::text, 'edited'::text, 'error'::text])))
);


--
-- Name: studio_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.studio_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    room_name text NOT NULL,
    daily_room_url text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    recording_status text DEFAULT 'not_started'::text,
    participants_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    ended_at timestamp with time zone,
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: studio_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.studio_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    session_name text NOT NULL,
    host_name text,
    description text,
    thumbnail_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    stripe_customer_id text,
    stripe_subscription_id text,
    stripe_price_id text,
    plan_name text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    current_period_start timestamp with time zone,
    current_period_end timestamp with time zone,
    cancel_at_period_end boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT subscriptions_plan_name_check CHECK ((plan_name = ANY (ARRAY['free'::text, 'creator_pro'::text, 'creator_business'::text, 'enterprise'::text]))),
    CONSTRAINT subscriptions_status_check CHECK ((status = ANY (ARRAY['active'::text, 'cancelled'::text, 'past_due'::text, 'incomplete'::text])))
);


--
-- Name: support_chat_participants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.support_chat_participants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    chat_id uuid NOT NULL,
    admin_user_id uuid,
    account_holder_user_id uuid,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: tab_views; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tab_views (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    profile_id uuid NOT NULL,
    tab_name text NOT NULL,
    viewed_at timestamp with time zone DEFAULT now(),
    visitor_country text,
    visitor_city text
);


--
-- Name: tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    category text DEFAULT 'general'::text,
    priority text DEFAULT 'medium'::text,
    status text DEFAULT 'backlog'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    assigned_to uuid,
    due_date date,
    CONSTRAINT tasks_priority_check CHECK ((priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text]))),
    CONSTRAINT tasks_status_check CHECK ((status = ANY (ARRAY['backlog'::text, 'todo'::text, 'in_progress'::text, 'done'::text, 'cancelled'::text])))
);


--
-- Name: team_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.team_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    team_id uuid NOT NULL,
    user_id uuid NOT NULL,
    added_at timestamp with time zone DEFAULT now(),
    role text DEFAULT 'member'::text NOT NULL,
    invited_by uuid,
    joined_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: team_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.team_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    message text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    team_id uuid,
    chat_type public.chat_type DEFAULT 'team_chat'::public.chat_type
);


--
-- Name: teams; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.teams (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    owner_id uuid
);


--
-- Name: usage_tracking; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usage_tracking (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    feature_type text NOT NULL,
    usage_count integer DEFAULT 0 NOT NULL,
    period_start timestamp with time zone NOT NULL,
    period_end timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT usage_tracking_feature_type_check CHECK ((feature_type = ANY (ARRAY['ai_messages'::text, 'podcast_storage_mb'::text, 'meetings'::text, 'events'::text])))
);


--
-- Name: user_modules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_modules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    module_id uuid NOT NULL,
    granted_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_preferences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_preferences (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    task_reminder_enabled boolean DEFAULT false,
    task_reminder_frequency text DEFAULT 'start_of_day'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    theme_preference text DEFAULT 'system'::text,
    module_awards_enabled boolean DEFAULT false,
    module_media_enabled boolean DEFAULT false,
    module_civic_enabled boolean DEFAULT false,
    module_influencer_enabled boolean DEFAULT false,
    module_agency_enabled boolean DEFAULT false,
    module_project_management_enabled boolean DEFAULT false,
    module_monetization_enabled boolean DEFAULT false,
    module_team_chat_enabled boolean DEFAULT false,
    module_blog_enabled boolean DEFAULT false,
    module_rss_podcast_posting_enabled boolean DEFAULT false,
    CONSTRAINT user_preferences_task_reminder_frequency_check CHECK ((task_reminder_frequency = ANY (ARRAY['hourly'::text, 'start_of_day'::text, 'end_of_day'::text]))),
    CONSTRAINT user_preferences_theme_preference_check CHECK ((theme_preference = ANY (ARRAY['light'::text, 'dark'::text, 'system'::text])))
);

ALTER TABLE ONLY public.user_preferences REPLICA IDENTITY FULL;


--
-- Name: user_presence; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_presence (
    user_id uuid NOT NULL,
    last_seen timestamp with time zone DEFAULT now() NOT NULL,
    is_online boolean DEFAULT true NOT NULL,
    team_id uuid
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    timezone text DEFAULT 'America/New_York'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: video_markers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.video_markers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    media_file_id uuid NOT NULL,
    marker_type text NOT NULL,
    timestamp_seconds numeric NOT NULL,
    duration_seconds numeric DEFAULT 5,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    CONSTRAINT video_markers_marker_type_check CHECK ((marker_type = ANY (ARRAY['b-roll'::text, 'lower-third'::text])))
);


--
-- Name: zoom_connections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.zoom_connections (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    access_token text NOT NULL,
    refresh_token text NOT NULL,
    token_expiry timestamp with time zone NOT NULL,
    zoom_user_id text,
    zoom_email text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: activity_logs activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_pkey PRIMARY KEY (id);


--
-- Name: ad_call_inquiries ad_call_inquiries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ad_call_inquiries
    ADD CONSTRAINT ad_call_inquiries_pkey PRIMARY KEY (id);


--
-- Name: ad_campaigns ad_campaigns_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ad_campaigns
    ADD CONSTRAINT ad_campaigns_pkey PRIMARY KEY (id);


--
-- Name: ad_creatives ad_creatives_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ad_creatives
    ADD CONSTRAINT ad_creatives_pkey PRIMARY KEY (id);


--
-- Name: ad_cta_clicks ad_cta_clicks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ad_cta_clicks
    ADD CONSTRAINT ad_cta_clicks_pkey PRIMARY KEY (id);


--
-- Name: ad_impressions ad_impressions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ad_impressions
    ADD CONSTRAINT ad_impressions_pkey PRIMARY KEY (id);


--
-- Name: ad_slots ad_slots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ad_slots
    ADD CONSTRAINT ad_slots_pkey PRIMARY KEY (id);


--
-- Name: ad_videos ad_videos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ad_videos
    ADD CONSTRAINT ad_videos_pkey PRIMARY KEY (id);


--
-- Name: advertiser_pricing_tiers advertiser_pricing_tiers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.advertiser_pricing_tiers
    ADD CONSTRAINT advertiser_pricing_tiers_pkey PRIMARY KEY (id);


--
-- Name: advertiser_team_members advertiser_team_members_advertiser_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.advertiser_team_members
    ADD CONSTRAINT advertiser_team_members_advertiser_id_user_id_key UNIQUE (advertiser_id, user_id);


--
-- Name: advertiser_team_members advertiser_team_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.advertiser_team_members
    ADD CONSTRAINT advertiser_team_members_pkey PRIMARY KEY (id);


--
-- Name: advertiser_transactions advertiser_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.advertiser_transactions
    ADD CONSTRAINT advertiser_transactions_pkey PRIMARY KEY (id);


--
-- Name: advertisers advertisers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.advertisers
    ADD CONSTRAINT advertisers_pkey PRIMARY KEY (id);


--
-- Name: ai_conversations ai_conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_conversations
    ADD CONSTRAINT ai_conversations_pkey PRIMARY KEY (id);


--
-- Name: ai_messages ai_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_messages
    ADD CONSTRAINT ai_messages_pkey PRIMARY KEY (id);


--
-- Name: audio_ads audio_ads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audio_ads
    ADD CONSTRAINT audio_ads_pkey PRIMARY KEY (id);


--
-- Name: availability_schedules availability_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.availability_schedules
    ADD CONSTRAINT availability_schedules_pkey PRIMARY KEY (id);


--
-- Name: award_categories award_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.award_categories
    ADD CONSTRAINT award_categories_pkey PRIMARY KEY (id);


--
-- Name: award_nominees award_nominees_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.award_nominees
    ADD CONSTRAINT award_nominees_pkey PRIMARY KEY (id);


--
-- Name: award_nominees award_nominees_unique_voting_link_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.award_nominees
    ADD CONSTRAINT award_nominees_unique_voting_link_key UNIQUE (unique_voting_link);


--
-- Name: award_payouts award_payouts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.award_payouts
    ADD CONSTRAINT award_payouts_pkey PRIMARY KEY (id);


--
-- Name: award_registrations award_registrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.award_registrations
    ADD CONSTRAINT award_registrations_pkey PRIMARY KEY (id);


--
-- Name: award_self_nominations award_self_nominations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.award_self_nominations
    ADD CONSTRAINT award_self_nominations_pkey PRIMARY KEY (id);


--
-- Name: award_sponsorship_packages award_sponsorship_packages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.award_sponsorship_packages
    ADD CONSTRAINT award_sponsorship_packages_pkey PRIMARY KEY (id);


--
-- Name: award_sponsorships award_sponsorships_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.award_sponsorships
    ADD CONSTRAINT award_sponsorships_pkey PRIMARY KEY (id);


--
-- Name: award_votes award_votes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.award_votes
    ADD CONSTRAINT award_votes_pkey PRIMARY KEY (id);


--
-- Name: award_votes award_votes_program_id_category_id_voter_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.award_votes
    ADD CONSTRAINT award_votes_program_id_category_id_voter_email_key UNIQUE (program_id, category_id, voter_email);


--
-- Name: award_votes award_votes_program_id_category_id_voter_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.award_votes
    ADD CONSTRAINT award_votes_program_id_category_id_voter_id_key UNIQUE (program_id, category_id, voter_id);


--
-- Name: award_winners award_winners_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.award_winners
    ADD CONSTRAINT award_winners_pkey PRIMARY KEY (id);


--
-- Name: awards_programs awards_programs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.awards_programs
    ADD CONSTRAINT awards_programs_pkey PRIMARY KEY (id);


--
-- Name: blocked_times blocked_times_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blocked_times
    ADD CONSTRAINT blocked_times_pkey PRIMARY KEY (id);


--
-- Name: blog_categories blog_categories_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_categories
    ADD CONSTRAINT blog_categories_name_key UNIQUE (name);


--
-- Name: blog_categories blog_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_categories
    ADD CONSTRAINT blog_categories_pkey PRIMARY KEY (id);


--
-- Name: blog_categories blog_categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_categories
    ADD CONSTRAINT blog_categories_slug_key UNIQUE (slug);


--
-- Name: blog_post_categories blog_post_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_post_categories
    ADD CONSTRAINT blog_post_categories_pkey PRIMARY KEY (id);


--
-- Name: blog_post_categories blog_post_categories_post_id_category_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_post_categories
    ADD CONSTRAINT blog_post_categories_post_id_category_id_key UNIQUE (post_id, category_id);


--
-- Name: blog_posts blog_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT blog_posts_pkey PRIMARY KEY (id);


--
-- Name: calendar_connections calendar_connections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calendar_connections
    ADD CONSTRAINT calendar_connections_pkey PRIMARY KEY (id);


--
-- Name: campaign_properties campaign_properties_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_properties
    ADD CONSTRAINT campaign_properties_pkey PRIMARY KEY (id);


--
-- Name: campaign_property_impressions campaign_property_impressions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_property_impressions
    ADD CONSTRAINT campaign_property_impressions_pkey PRIMARY KEY (id);


--
-- Name: civic_articles civic_articles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.civic_articles
    ADD CONSTRAINT civic_articles_pkey PRIMARY KEY (id);


--
-- Name: civic_articles civic_articles_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.civic_articles
    ADD CONSTRAINT civic_articles_slug_key UNIQUE (slug);


--
-- Name: civic_compliance_records civic_compliance_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.civic_compliance_records
    ADD CONSTRAINT civic_compliance_records_pkey PRIMARY KEY (id);


--
-- Name: civic_events civic_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.civic_events
    ADD CONSTRAINT civic_events_pkey PRIMARY KEY (id);


--
-- Name: civic_live_sessions civic_live_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.civic_live_sessions
    ADD CONSTRAINT civic_live_sessions_pkey PRIMARY KEY (id);


--
-- Name: client_tickets client_tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_tickets
    ADD CONSTRAINT client_tickets_pkey PRIMARY KEY (id);


--
-- Name: constituent_requests constituent_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.constituent_requests
    ADD CONSTRAINT constituent_requests_pkey PRIMARY KEY (id);


--
-- Name: contact_list_members contact_list_members_list_id_contact_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_list_members
    ADD CONSTRAINT contact_list_members_list_id_contact_id_key UNIQUE (list_id, contact_id);


--
-- Name: contact_list_members contact_list_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_list_members
    ADD CONSTRAINT contact_list_members_pkey PRIMARY KEY (id);


--
-- Name: contact_lists contact_lists_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_lists
    ADD CONSTRAINT contact_lists_pkey PRIMARY KEY (id);


--
-- Name: contact_tag_assignments contact_tag_assignments_contact_id_tag_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_tag_assignments
    ADD CONSTRAINT contact_tag_assignments_contact_id_tag_id_key UNIQUE (contact_id, tag_id);


--
-- Name: contact_tag_assignments contact_tag_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_tag_assignments
    ADD CONSTRAINT contact_tag_assignments_pkey PRIMARY KEY (id);


--
-- Name: contact_tags contact_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_tags
    ADD CONSTRAINT contact_tags_pkey PRIMARY KEY (id);


--
-- Name: contact_tags contact_tags_user_id_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_tags
    ADD CONSTRAINT contact_tags_user_id_name_key UNIQUE (user_id, name);


--
-- Name: contacts contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_pkey PRIMARY KEY (id);


--
-- Name: conversational_ad_charges conversational_ad_charges_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversational_ad_charges
    ADD CONSTRAINT conversational_ad_charges_pkey PRIMARY KEY (id);


--
-- Name: conversational_ad_usage conversational_ad_usage_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversational_ad_usage
    ADD CONSTRAINT conversational_ad_usage_pkey PRIMARY KEY (id);


--
-- Name: creator_campaign_alerts creator_campaign_alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.creator_campaign_alerts
    ADD CONSTRAINT creator_campaign_alerts_pkey PRIMARY KEY (id);


--
-- Name: creator_earnings creator_earnings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.creator_earnings
    ADD CONSTRAINT creator_earnings_pkey PRIMARY KEY (id);


--
-- Name: creator_tips creator_tips_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.creator_tips
    ADD CONSTRAINT creator_tips_pkey PRIMARY KEY (id);


--
-- Name: custom_link_sections custom_link_sections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.custom_link_sections
    ADD CONSTRAINT custom_link_sections_pkey PRIMARY KEY (id);


--
-- Name: custom_link_sections custom_link_sections_profile_id_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.custom_link_sections
    ADD CONSTRAINT custom_link_sections_profile_id_name_key UNIQUE (profile_id, name);


--
-- Name: custom_links custom_links_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.custom_links
    ADD CONSTRAINT custom_links_pkey PRIMARY KEY (id);


--
-- Name: digital_ads digital_ads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.digital_ads
    ADD CONSTRAINT digital_ads_pkey PRIMARY KEY (id);


--
-- Name: email_campaigns email_campaigns_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_campaigns
    ADD CONSTRAINT email_campaigns_pkey PRIMARY KEY (id);


--
-- Name: email_events email_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_events
    ADD CONSTRAINT email_events_pkey PRIMARY KEY (id);


--
-- Name: email_logs email_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_logs
    ADD CONSTRAINT email_logs_pkey PRIMARY KEY (id);


--
-- Name: email_reminders_sent email_reminders_sent_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_reminders_sent
    ADD CONSTRAINT email_reminders_sent_pkey PRIMARY KEY (id);


--
-- Name: episodes episodes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.episodes
    ADD CONSTRAINT episodes_pkey PRIMARY KEY (id);


--
-- Name: event_registrations event_registrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_registrations
    ADD CONSTRAINT event_registrations_pkey PRIMARY KEY (id);


--
-- Name: event_sponsorship_packages event_sponsorship_packages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_sponsorship_packages
    ADD CONSTRAINT event_sponsorship_packages_pkey PRIMARY KEY (id);


--
-- Name: event_sponsorships event_sponsorships_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_sponsorships
    ADD CONSTRAINT event_sponsorships_pkey PRIMARY KEY (id);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- Name: financial_assumptions financial_assumptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financial_assumptions
    ADD CONSTRAINT financial_assumptions_pkey PRIMARY KEY (id);


--
-- Name: financial_assumptions financial_assumptions_user_id_assumption_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financial_assumptions
    ADD CONSTRAINT financial_assumptions_user_id_assumption_name_key UNIQUE (user_id, assumption_name);


--
-- Name: financial_snapshots financial_snapshots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financial_snapshots
    ADD CONSTRAINT financial_snapshots_pkey PRIMARY KEY (id);


--
-- Name: influencehub_creators influencehub_creators_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.influencehub_creators
    ADD CONSTRAINT influencehub_creators_pkey PRIMARY KEY (id);


--
-- Name: influencehub_posts influencehub_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.influencehub_posts
    ADD CONSTRAINT influencehub_posts_pkey PRIMARY KEY (id);


--
-- Name: integration_metadata integration_metadata_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.integration_metadata
    ADD CONSTRAINT integration_metadata_pkey PRIMARY KEY (id);


--
-- Name: investor_talking_points investor_talking_points_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.investor_talking_points
    ADD CONSTRAINT investor_talking_points_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_invoice_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_invoice_number_key UNIQUE (invoice_number);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: link_clicks link_clicks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.link_clicks
    ADD CONSTRAINT link_clicks_pkey PRIMARY KEY (id);


--
-- Name: live_stream_viewers live_stream_viewers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.live_stream_viewers
    ADD CONSTRAINT live_stream_viewers_pkey PRIMARY KEY (id);


--
-- Name: live_stream_viewers live_stream_viewers_profile_id_session_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.live_stream_viewers
    ADD CONSTRAINT live_stream_viewers_profile_id_session_id_key UNIQUE (profile_id, session_id);


--
-- Name: media_ad_slots media_ad_slots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media_ad_slots
    ADD CONSTRAINT media_ad_slots_pkey PRIMARY KEY (id);


--
-- Name: media_files media_files_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media_files
    ADD CONSTRAINT media_files_pkey PRIMARY KEY (id);


--
-- Name: media_processing_jobs media_processing_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media_processing_jobs
    ADD CONSTRAINT media_processing_jobs_pkey PRIMARY KEY (id);


--
-- Name: media_versions media_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media_versions
    ADD CONSTRAINT media_versions_pkey PRIMARY KEY (id);


--
-- Name: meeting_invitations meeting_invitations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meeting_invitations
    ADD CONSTRAINT meeting_invitations_pkey PRIMARY KEY (id);


--
-- Name: meeting_types meeting_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meeting_types
    ADD CONSTRAINT meeting_types_pkey PRIMARY KEY (id);


--
-- Name: meetings meetings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meetings
    ADD CONSTRAINT meetings_pkey PRIMARY KEY (id);


--
-- Name: microsoft_connections microsoft_connections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.microsoft_connections
    ADD CONSTRAINT microsoft_connections_pkey PRIMARY KEY (id);


--
-- Name: module_purchases module_purchases_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.module_purchases
    ADD CONSTRAINT module_purchases_pkey PRIMARY KEY (id);


--
-- Name: module_purchases module_purchases_user_id_module_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.module_purchases
    ADD CONSTRAINT module_purchases_user_id_module_id_key UNIQUE (user_id, module_id);


--
-- Name: modules modules_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_name_key UNIQUE (name);


--
-- Name: modules modules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_pkey PRIMARY KEY (id);


--
-- Name: multi_channel_campaigns multi_channel_campaigns_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.multi_channel_campaigns
    ADD CONSTRAINT multi_channel_campaigns_pkey PRIMARY KEY (id);


--
-- Name: my_page_video_impressions my_page_video_impressions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.my_page_video_impressions
    ADD CONSTRAINT my_page_video_impressions_pkey PRIMARY KEY (id);


--
-- Name: podcast_ad_settings podcast_ad_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.podcast_ad_settings
    ADD CONSTRAINT podcast_ad_settings_pkey PRIMARY KEY (id);


--
-- Name: podcast_ad_settings podcast_ad_settings_podcast_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.podcast_ad_settings
    ADD CONSTRAINT podcast_ad_settings_podcast_id_key UNIQUE (podcast_id);


--
-- Name: podcast_campaign_selections podcast_campaign_selections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.podcast_campaign_selections
    ADD CONSTRAINT podcast_campaign_selections_pkey PRIMARY KEY (id);


--
-- Name: podcast_campaign_selections podcast_campaign_selections_podcast_id_campaign_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.podcast_campaign_selections
    ADD CONSTRAINT podcast_campaign_selections_podcast_id_campaign_id_key UNIQUE (podcast_id, campaign_id);


--
-- Name: podcasts podcasts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.podcasts
    ADD CONSTRAINT podcasts_pkey PRIMARY KEY (id);


--
-- Name: poll_options poll_options_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.poll_options
    ADD CONSTRAINT poll_options_pkey PRIMARY KEY (id);


--
-- Name: poll_votes poll_votes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.poll_votes
    ADD CONSTRAINT poll_votes_pkey PRIMARY KEY (id);


--
-- Name: poll_votes poll_votes_poll_id_option_id_voter_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.poll_votes
    ADD CONSTRAINT poll_votes_poll_id_option_id_voter_email_key UNIQUE (poll_id, option_id, voter_email);


--
-- Name: polls polls_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.polls
    ADD CONSTRAINT polls_pkey PRIMARY KEY (id);


--
-- Name: profile_section_order profile_section_order_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profile_section_order
    ADD CONSTRAINT profile_section_order_pkey PRIMARY KEY (id);


--
-- Name: profile_section_order profile_section_order_profile_id_section_type_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profile_section_order
    ADD CONSTRAINT profile_section_order_profile_id_section_type_key UNIQUE (profile_id, section_type);


--
-- Name: profile_views profile_views_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profile_views
    ADD CONSTRAINT profile_views_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_username_key UNIQUE (username);


--
-- Name: proposals proposals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proposals
    ADD CONSTRAINT proposals_pkey PRIMARY KEY (id);


--
-- Name: proposals proposals_proposal_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proposals
    ADD CONSTRAINT proposals_proposal_number_key UNIQUE (proposal_number);


--
-- Name: qr_codes qr_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qr_codes
    ADD CONSTRAINT qr_codes_pkey PRIMARY KEY (id);


--
-- Name: rate_limit_logs rate_limit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rate_limit_logs
    ADD CONSTRAINT rate_limit_logs_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_role_permission_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_permission_key UNIQUE (role, permission);


--
-- Name: sales_commissions sales_commissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_commissions
    ADD CONSTRAINT sales_commissions_pkey PRIMARY KEY (id);


--
-- Name: sales_team_members sales_team_members_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_team_members
    ADD CONSTRAINT sales_team_members_email_key UNIQUE (email);


--
-- Name: sales_team_members sales_team_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_team_members
    ADD CONSTRAINT sales_team_members_pkey PRIMARY KEY (id);


--
-- Name: saved_proformas saved_proformas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_proformas
    ADD CONSTRAINT saved_proformas_pkey PRIMARY KEY (id);


--
-- Name: signup_sheets signup_sheets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.signup_sheets
    ADD CONSTRAINT signup_sheets_pkey PRIMARY KEY (id);


--
-- Name: signup_slots signup_slots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.signup_slots
    ADD CONSTRAINT signup_slots_pkey PRIMARY KEY (id);


--
-- Name: social_accounts social_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_accounts
    ADD CONSTRAINT social_accounts_pkey PRIMARY KEY (id);


--
-- Name: social_accounts social_accounts_user_id_platform_account_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_accounts
    ADD CONSTRAINT social_accounts_user_id_platform_account_id_key UNIQUE (user_id, platform, account_id);


--
-- Name: social_links social_links_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_links
    ADD CONSTRAINT social_links_pkey PRIMARY KEY (id);


--
-- Name: social_media_accounts social_media_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_media_accounts
    ADD CONSTRAINT social_media_accounts_pkey PRIMARY KEY (id);


--
-- Name: social_media_accounts social_media_accounts_user_id_platform_platform_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_media_accounts
    ADD CONSTRAINT social_media_accounts_user_id_platform_platform_user_id_key UNIQUE (user_id, platform, platform_user_id);


--
-- Name: social_media_properties social_media_properties_creator_id_platform_account_handle_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_media_properties
    ADD CONSTRAINT social_media_properties_creator_id_platform_account_handle_key UNIQUE (creator_id, platform, account_handle);


--
-- Name: social_media_properties social_media_properties_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_media_properties
    ADD CONSTRAINT social_media_properties_pkey PRIMARY KEY (id);


--
-- Name: stream_impressions stream_impressions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stream_impressions
    ADD CONSTRAINT stream_impressions_pkey PRIMARY KEY (id);


--
-- Name: studio_guests studio_guests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.studio_guests
    ADD CONSTRAINT studio_guests_pkey PRIMARY KEY (id);


--
-- Name: studio_recording_ads studio_recording_ads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.studio_recording_ads
    ADD CONSTRAINT studio_recording_ads_pkey PRIMARY KEY (id);


--
-- Name: studio_recording_ads studio_recording_ads_recording_id_ad_slot_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.studio_recording_ads
    ADD CONSTRAINT studio_recording_ads_recording_id_ad_slot_id_key UNIQUE (recording_id, ad_slot_id);


--
-- Name: studio_recordings studio_recordings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.studio_recordings
    ADD CONSTRAINT studio_recordings_pkey PRIMARY KEY (id);


--
-- Name: studio_sessions studio_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.studio_sessions
    ADD CONSTRAINT studio_sessions_pkey PRIMARY KEY (id);


--
-- Name: studio_sessions studio_sessions_room_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.studio_sessions
    ADD CONSTRAINT studio_sessions_room_name_key UNIQUE (room_name);


--
-- Name: studio_templates studio_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.studio_templates
    ADD CONSTRAINT studio_templates_pkey PRIMARY KEY (id);


--
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);


--
-- Name: subscriptions subscriptions_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_user_id_key UNIQUE (user_id);


--
-- Name: support_chat_participants support_chat_participants_admin_user_id_account_holder_user_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_chat_participants
    ADD CONSTRAINT support_chat_participants_admin_user_id_account_holder_user_key UNIQUE (admin_user_id, account_holder_user_id);


--
-- Name: support_chat_participants support_chat_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_chat_participants
    ADD CONSTRAINT support_chat_participants_pkey PRIMARY KEY (id);


--
-- Name: tab_views tab_views_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tab_views
    ADD CONSTRAINT tab_views_pkey PRIMARY KEY (id);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: team_members team_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_pkey PRIMARY KEY (id);


--
-- Name: team_members team_members_team_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_team_id_user_id_key UNIQUE (team_id, user_id);


--
-- Name: team_messages team_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_messages
    ADD CONSTRAINT team_messages_pkey PRIMARY KEY (id);


--
-- Name: teams teams_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_pkey PRIMARY KEY (id);


--
-- Name: usage_tracking usage_tracking_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usage_tracking
    ADD CONSTRAINT usage_tracking_pkey PRIMARY KEY (id);


--
-- Name: user_modules user_modules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_modules
    ADD CONSTRAINT user_modules_pkey PRIMARY KEY (id);


--
-- Name: user_modules user_modules_user_id_module_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_modules
    ADD CONSTRAINT user_modules_user_id_module_id_key UNIQUE (user_id, module_id);


--
-- Name: user_preferences user_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_pkey PRIMARY KEY (id);


--
-- Name: user_preferences user_preferences_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_user_id_key UNIQUE (user_id);


--
-- Name: user_presence user_presence_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_presence
    ADD CONSTRAINT user_presence_pkey PRIMARY KEY (user_id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: user_settings user_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_settings
    ADD CONSTRAINT user_settings_pkey PRIMARY KEY (id);


--
-- Name: user_settings user_settings_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_settings
    ADD CONSTRAINT user_settings_user_id_key UNIQUE (user_id);


--
-- Name: video_markers video_markers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_markers
    ADD CONSTRAINT video_markers_pkey PRIMARY KEY (id);


--
-- Name: zoom_connections zoom_connections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zoom_connections
    ADD CONSTRAINT zoom_connections_pkey PRIMARY KEY (id);


--
-- Name: contacts_user_email_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX contacts_user_email_unique ON public.contacts USING btree (user_id, email) WHERE (user_id IS NOT NULL);


--
-- Name: idx_activity_logs_user_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_activity_logs_user_created ON public.activity_logs USING btree (user_id, created_at DESC);


--
-- Name: idx_ad_call_inquiries_advertiser_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ad_call_inquiries_advertiser_id ON public.ad_call_inquiries USING btree (advertiser_id);


--
-- Name: idx_ad_call_inquiries_audio_ad_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ad_call_inquiries_audio_ad_id ON public.ad_call_inquiries USING btree (audio_ad_id);


--
-- Name: idx_ad_call_inquiries_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ad_call_inquiries_created_at ON public.ad_call_inquiries USING btree (created_at DESC);


--
-- Name: idx_ad_campaigns_dates; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ad_campaigns_dates ON public.ad_campaigns USING btree (start_date, end_date);


--
-- Name: idx_ad_campaigns_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ad_campaigns_status ON public.ad_campaigns USING btree (status);


--
-- Name: idx_ad_cta_clicks_ad_slot_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ad_cta_clicks_ad_slot_id ON public.ad_cta_clicks USING btree (ad_slot_id);


--
-- Name: idx_ad_cta_clicks_clicked_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ad_cta_clicks_clicked_at ON public.ad_cta_clicks USING btree (clicked_at);


--
-- Name: idx_ad_cta_clicks_creator_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ad_cta_clicks_creator_id ON public.ad_cta_clicks USING btree (creator_id);


--
-- Name: idx_ad_impressions_campaign; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ad_impressions_campaign ON public.ad_impressions USING btree (campaign_id);


--
-- Name: idx_ad_impressions_creator; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ad_impressions_creator ON public.ad_impressions USING btree (creator_id);


--
-- Name: idx_ad_impressions_played_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ad_impressions_played_at ON public.ad_impressions USING btree (played_at);


--
-- Name: idx_ad_slots_episode; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ad_slots_episode ON public.ad_slots USING btree (episode_id);


--
-- Name: idx_ad_slots_media_file; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ad_slots_media_file ON public.media_ad_slots USING btree (media_file_id);


--
-- Name: idx_advertiser_transactions_advertiser_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_advertiser_transactions_advertiser_id ON public.advertiser_transactions USING btree (advertiser_id);


--
-- Name: idx_advertiser_transactions_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_advertiser_transactions_created_at ON public.advertiser_transactions USING btree (created_at DESC);


--
-- Name: idx_advertisers_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_advertisers_status ON public.advertisers USING btree (status);


--
-- Name: idx_advertisers_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_advertisers_user_id ON public.advertisers USING btree (user_id);


--
-- Name: idx_ai_conversations_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_conversations_user_id ON public.ai_conversations USING btree (user_id);


--
-- Name: idx_ai_messages_conversation_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_messages_conversation_id ON public.ai_messages USING btree (conversation_id);


--
-- Name: idx_audio_ads_advertiser; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audio_ads_advertiser ON public.audio_ads USING btree (advertiser_id);


--
-- Name: idx_audio_ads_campaign; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audio_ads_campaign ON public.audio_ads USING btree (campaign_id);


--
-- Name: idx_availability_schedules_day; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_availability_schedules_day ON public.availability_schedules USING btree (day_of_week);


--
-- Name: idx_availability_schedules_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_availability_schedules_user_id ON public.availability_schedules USING btree (user_id);


--
-- Name: idx_award_categories_program_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_award_categories_program_id ON public.award_categories USING btree (program_id);


--
-- Name: idx_award_nominees_category_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_award_nominees_category_id ON public.award_nominees USING btree (category_id);


--
-- Name: idx_award_nominees_program_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_award_nominees_program_id ON public.award_nominees USING btree (program_id);


--
-- Name: idx_award_votes_nominee_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_award_votes_nominee_id ON public.award_votes USING btree (nominee_id);


--
-- Name: idx_award_votes_program_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_award_votes_program_id ON public.award_votes USING btree (program_id);


--
-- Name: idx_award_winners_program_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_award_winners_program_id ON public.award_winners USING btree (program_id);


--
-- Name: idx_awards_programs_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_awards_programs_status ON public.awards_programs USING btree (status);


--
-- Name: idx_awards_programs_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_awards_programs_user_id ON public.awards_programs USING btree (user_id);


--
-- Name: idx_blocked_times_time_range; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_blocked_times_time_range ON public.blocked_times USING btree (start_time, end_time);


--
-- Name: idx_blocked_times_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_blocked_times_user_id ON public.blocked_times USING btree (user_id);


--
-- Name: idx_blog_posts_external_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_blog_posts_external_id ON public.blog_posts USING btree (external_id);


--
-- Name: idx_blog_posts_master; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_blog_posts_master ON public.blog_posts USING btree (publish_to_master, master_published_at DESC) WHERE ((publish_to_master = true) AND (status = 'published'::text));


--
-- Name: idx_blog_posts_published; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_blog_posts_published ON public.blog_posts USING btree (status, published_at DESC) WHERE (status = 'published'::text);


--
-- Name: idx_blog_posts_source_rss; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_blog_posts_source_rss ON public.blog_posts USING btree (source_rss_url);


--
-- Name: idx_blog_posts_user_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_blog_posts_user_slug ON public.blog_posts USING btree (user_id, slug);


--
-- Name: idx_campaign_properties_campaign; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_campaign_properties_campaign ON public.campaign_properties USING btree (multi_channel_campaign_id);


--
-- Name: idx_campaign_properties_creator; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_campaign_properties_creator ON public.campaign_properties USING btree (creator_id);


--
-- Name: idx_civic_articles_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_civic_articles_slug ON public.civic_articles USING btree (slug);


--
-- Name: idx_civic_articles_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_civic_articles_status ON public.civic_articles USING btree (status);


--
-- Name: idx_civic_events_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_civic_events_date ON public.civic_events USING btree (event_date);


--
-- Name: idx_civic_events_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_civic_events_status ON public.civic_events USING btree (status);


--
-- Name: idx_civic_events_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_civic_events_user_id ON public.civic_events USING btree (user_id);


--
-- Name: idx_civic_live_sessions_event_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_civic_live_sessions_event_id ON public.civic_live_sessions USING btree (event_id);


--
-- Name: idx_client_tickets_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_tickets_status ON public.client_tickets USING btree (status);


--
-- Name: idx_client_tickets_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_tickets_user_id ON public.client_tickets USING btree (user_id);


--
-- Name: idx_constituent_requests_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_constituent_requests_status ON public.constituent_requests USING btree (status);


--
-- Name: idx_contacts_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contacts_email ON public.contacts USING btree (email);


--
-- Name: idx_contacts_lead_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contacts_lead_status ON public.contacts USING btree (lead_status);


--
-- Name: idx_contacts_sales_rep; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contacts_sales_rep ON public.contacts USING btree (sales_rep_id);


--
-- Name: idx_contacts_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contacts_user_id ON public.contacts USING btree (user_id);


--
-- Name: idx_conversational_ad_charges_advertiser; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversational_ad_charges_advertiser ON public.conversational_ad_charges USING btree (advertiser_id);


--
-- Name: idx_conversational_ad_charges_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversational_ad_charges_created_at ON public.conversational_ad_charges USING btree (created_at);


--
-- Name: idx_conversational_ad_usage_advertiser; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversational_ad_usage_advertiser ON public.conversational_ad_usage USING btree (advertiser_id);


--
-- Name: idx_conversational_ad_usage_campaign; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversational_ad_usage_campaign ON public.conversational_ad_usage USING btree (campaign_id);


--
-- Name: idx_conversational_ad_usage_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversational_ad_usage_created_at ON public.conversational_ad_usage USING btree (created_at);


--
-- Name: idx_creator_alerts_creator; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_creator_alerts_creator ON public.creator_campaign_alerts USING btree (creator_id);


--
-- Name: idx_creator_earnings_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_creator_earnings_status ON public.creator_earnings USING btree (payout_status);


--
-- Name: idx_creator_earnings_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_creator_earnings_user ON public.creator_earnings USING btree (user_id);


--
-- Name: idx_creator_tips_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_creator_tips_created_at ON public.creator_tips USING btree (created_at DESC);


--
-- Name: idx_creator_tips_creator_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_creator_tips_creator_id ON public.creator_tips USING btree (creator_id);


--
-- Name: idx_creator_tips_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_creator_tips_status ON public.creator_tips USING btree (status);


--
-- Name: idx_custom_link_sections_profile_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_custom_link_sections_profile_id ON public.custom_link_sections USING btree (profile_id);


--
-- Name: idx_custom_links_display_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_custom_links_display_order ON public.custom_links USING btree (display_order);


--
-- Name: idx_custom_links_profile_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_custom_links_profile_id ON public.custom_links USING btree (profile_id);


--
-- Name: idx_email_events_campaign_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_events_campaign_id ON public.email_events USING btree (campaign_id);


--
-- Name: idx_email_events_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_events_created_at ON public.email_events USING btree (created_at);


--
-- Name: idx_email_events_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_events_type ON public.email_events USING btree (event_type);


--
-- Name: idx_email_events_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_events_user_id ON public.email_events USING btree (user_id);


--
-- Name: idx_email_logs_email_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_logs_email_type ON public.email_logs USING btree (email_type);


--
-- Name: idx_email_logs_sent_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_logs_sent_at ON public.email_logs USING btree (sent_at DESC);


--
-- Name: idx_email_logs_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_logs_user_id ON public.email_logs USING btree (user_id);


--
-- Name: idx_event_sponsorship_packages_event_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_sponsorship_packages_event_id ON public.event_sponsorship_packages USING btree (event_id);


--
-- Name: idx_event_sponsorships_event_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_sponsorships_event_id ON public.event_sponsorships USING btree (event_id);


--
-- Name: idx_event_sponsorships_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_sponsorships_status ON public.event_sponsorships USING btree (status);


--
-- Name: idx_financial_assumptions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_financial_assumptions_user_id ON public.financial_assumptions USING btree (user_id);


--
-- Name: idx_financial_snapshots_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_financial_snapshots_date ON public.financial_snapshots USING btree (snapshot_date DESC);


--
-- Name: idx_impressions_campaign; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_impressions_campaign ON public.campaign_property_impressions USING btree (multi_channel_campaign_id);


--
-- Name: idx_investor_talking_points_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_investor_talking_points_date ON public.investor_talking_points USING btree (generation_date DESC);


--
-- Name: idx_invoices_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoices_status ON public.invoices USING btree (status);


--
-- Name: idx_invoices_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoices_user_id ON public.invoices USING btree (user_id);


--
-- Name: idx_link_clicks_clicked_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_link_clicks_clicked_at ON public.link_clicks USING btree (clicked_at);


--
-- Name: idx_link_clicks_profile_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_link_clicks_profile_id ON public.link_clicks USING btree (profile_id);


--
-- Name: idx_live_stream_viewers_profile_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_live_stream_viewers_profile_active ON public.live_stream_viewers USING btree (profile_id, is_active, last_seen_at);


--
-- Name: idx_media_files_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_media_files_created_at ON public.media_files USING btree (created_at DESC);


--
-- Name: idx_media_files_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_media_files_user_id ON public.media_files USING btree (user_id);


--
-- Name: idx_media_versions_original; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_media_versions_original ON public.media_versions USING btree (original_media_id);


--
-- Name: idx_media_versions_primary; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_media_versions_primary ON public.media_versions USING btree (original_media_id, is_primary);


--
-- Name: idx_meeting_invitations_inviter; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_meeting_invitations_inviter ON public.meeting_invitations USING btree (inviter_id);


--
-- Name: idx_meeting_invitations_meeting_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_meeting_invitations_meeting_type ON public.meeting_invitations USING btree (meeting_type_id);


--
-- Name: idx_meeting_types_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_meeting_types_user_id ON public.meeting_types USING btree (user_id);


--
-- Name: idx_meetings_start_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_meetings_start_time ON public.meetings USING btree (start_time);


--
-- Name: idx_meetings_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_meetings_user_id ON public.meetings USING btree (user_id);


--
-- Name: idx_module_purchases_module_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_module_purchases_module_id ON public.module_purchases USING btree (module_id);


--
-- Name: idx_module_purchases_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_module_purchases_user_id ON public.module_purchases USING btree (user_id);


--
-- Name: idx_my_page_impressions_profile_video; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_my_page_impressions_profile_video ON public.my_page_video_impressions USING btree (profile_id, video_type, video_id);


--
-- Name: idx_my_page_impressions_viewed_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_my_page_impressions_viewed_at ON public.my_page_video_impressions USING btree (viewed_at DESC);


--
-- Name: idx_payouts_creator; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payouts_creator ON public.award_payouts USING btree (creator_user_id);


--
-- Name: idx_podcast_campaign_selections_campaign_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_podcast_campaign_selections_campaign_id ON public.podcast_campaign_selections USING btree (campaign_id);


--
-- Name: idx_podcast_campaign_selections_podcast_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_podcast_campaign_selections_podcast_id ON public.podcast_campaign_selections USING btree (podcast_id);


--
-- Name: idx_processing_jobs_media_file; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_processing_jobs_media_file ON public.media_processing_jobs USING btree (media_file_id);


--
-- Name: idx_processing_jobs_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_processing_jobs_status ON public.media_processing_jobs USING btree (status);


--
-- Name: idx_profile_section_order_display_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profile_section_order_display_order ON public.profile_section_order USING btree (profile_id, display_order);


--
-- Name: idx_profile_section_order_profile_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profile_section_order_profile_id ON public.profile_section_order USING btree (profile_id);


--
-- Name: idx_profile_views_profile_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profile_views_profile_id ON public.profile_views USING btree (profile_id);


--
-- Name: idx_profile_views_viewed_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profile_views_viewed_at ON public.profile_views USING btree (viewed_at);


--
-- Name: idx_profiles_blog_rss_url; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_blog_rss_url ON public.profiles USING btree (blog_rss_url) WHERE (blog_rss_url IS NOT NULL);


--
-- Name: idx_profiles_categories; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_categories ON public.profiles USING gin (categories);


--
-- Name: idx_proposals_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_proposals_status ON public.proposals USING btree (status);


--
-- Name: idx_proposals_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_proposals_user_id ON public.proposals USING btree (user_id);


--
-- Name: idx_qr_codes_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_qr_codes_type ON public.qr_codes USING btree (type);


--
-- Name: idx_qr_codes_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_qr_codes_user_id ON public.qr_codes USING btree (user_id);


--
-- Name: idx_rate_limit_logs_lookup; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rate_limit_logs_lookup ON public.rate_limit_logs USING btree (ip_address, endpoint, created_at);


--
-- Name: idx_reminders_sent_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reminders_sent_created_at ON public.email_reminders_sent USING btree (created_at DESC);


--
-- Name: idx_reminders_sent_type_related; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reminders_sent_type_related ON public.email_reminders_sent USING btree (reminder_type, related_id);


--
-- Name: idx_saved_proformas_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_saved_proformas_user_id ON public.saved_proformas USING btree (user_id);


--
-- Name: idx_self_nominations_nominee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_self_nominations_nominee ON public.award_self_nominations USING btree (nominee_id);


--
-- Name: idx_social_media_accounts_platform; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_social_media_accounts_platform ON public.social_media_accounts USING btree (platform);


--
-- Name: idx_social_media_accounts_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_social_media_accounts_user_id ON public.social_media_accounts USING btree (user_id);


--
-- Name: idx_social_media_creator; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_social_media_creator ON public.social_media_properties USING btree (creator_id);


--
-- Name: idx_social_media_engagement; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_social_media_engagement ON public.social_media_accounts USING btree (engagement_rate);


--
-- Name: idx_social_media_followers; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_social_media_followers ON public.social_media_accounts USING btree (followers_count);


--
-- Name: idx_social_media_platform_search; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_social_media_platform_search ON public.social_media_accounts USING btree (platform, followers_count, engagement_rate);


--
-- Name: idx_sponsorship_packages_program; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sponsorship_packages_program ON public.award_sponsorship_packages USING btree (program_id);


--
-- Name: idx_sponsorships_program; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sponsorships_program ON public.award_sponsorships USING btree (program_id);


--
-- Name: idx_stream_impressions_creator_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_stream_impressions_creator_id ON public.stream_impressions USING btree (creator_id);


--
-- Name: idx_stream_impressions_session_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_stream_impressions_session_id ON public.stream_impressions USING btree (session_id);


--
-- Name: idx_stream_impressions_started_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_stream_impressions_started_at ON public.stream_impressions USING btree (started_at);


--
-- Name: idx_studio_guests_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_studio_guests_active ON public.studio_guests USING btree (is_active) WHERE (is_active = true);


--
-- Name: idx_studio_guests_session_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_studio_guests_session_id ON public.studio_guests USING btree (studio_session_id);


--
-- Name: idx_studio_recording_ads_recording; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_studio_recording_ads_recording ON public.studio_recording_ads USING btree (recording_id);


--
-- Name: idx_studio_recording_ads_slot; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_studio_recording_ads_slot ON public.studio_recording_ads USING btree (ad_slot_id);


--
-- Name: idx_studio_recordings_converted; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_studio_recordings_converted ON public.studio_recordings USING btree (converted_to_episode_id) WHERE (converted_to_episode_id IS NOT NULL);


--
-- Name: idx_subscriptions_stripe; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscriptions_stripe ON public.subscriptions USING btree (stripe_subscription_id);


--
-- Name: idx_subscriptions_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscriptions_user ON public.subscriptions USING btree (user_id);


--
-- Name: idx_tab_views_profile_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tab_views_profile_id ON public.tab_views USING btree (profile_id);


--
-- Name: idx_tab_views_viewed_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tab_views_viewed_at ON public.tab_views USING btree (viewed_at);


--
-- Name: idx_team_members_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_team_members_user_id ON public.team_members USING btree (user_id);


--
-- Name: idx_team_messages_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_team_messages_created_at ON public.team_messages USING btree (created_at DESC);


--
-- Name: idx_team_messages_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_team_messages_user_id ON public.team_messages USING btree (user_id);


--
-- Name: idx_teams_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_teams_created_by ON public.teams USING btree (created_by);


--
-- Name: idx_usage_tracking_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_usage_tracking_unique ON public.usage_tracking USING btree (user_id, feature_type, period_start);


--
-- Name: idx_usage_tracking_user_feature; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_usage_tracking_user_feature ON public.usage_tracking USING btree (user_id, feature_type, period_start);


--
-- Name: idx_user_presence_is_online; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_presence_is_online ON public.user_presence USING btree (is_online);


--
-- Name: idx_user_settings_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_settings_user_id ON public.user_settings USING btree (user_id);


--
-- Name: idx_video_markers_media_file_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_video_markers_media_file_id ON public.video_markers USING btree (media_file_id);


--
-- Name: idx_video_markers_timestamp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_video_markers_timestamp ON public.video_markers USING btree (timestamp_seconds);


--
-- Name: award_nominees generate_voting_link_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER generate_voting_link_trigger BEFORE INSERT ON public.award_nominees FOR EACH ROW EXECUTE FUNCTION public.generate_voting_link();


--
-- Name: event_registrations on_event_registration_created; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_event_registration_created AFTER INSERT ON public.event_registrations FOR EACH ROW EXECUTE FUNCTION public.handle_event_registration();


--
-- Name: ad_impressions on_impression_created; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_impression_created AFTER INSERT ON public.ad_impressions FOR EACH ROW EXECUTE FUNCTION public.update_campaign_totals();


--
-- Name: meetings on_meeting_booking_created; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_meeting_booking_created AFTER INSERT ON public.meetings FOR EACH ROW EXECUTE FUNCTION public.handle_meeting_booking();


--
-- Name: meetings on_meeting_created; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_meeting_created AFTER INSERT ON public.meetings FOR EACH ROW EXECUTE FUNCTION public.handle_meeting_booking();


--
-- Name: advertisers on_new_advertiser_create_lead; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_new_advertiser_create_lead AFTER INSERT ON public.advertisers FOR EACH ROW WHEN ((new.status = 'pending'::text)) EXECUTE FUNCTION public.notify_sales_team_new_lead();


--
-- Name: award_sponsorships on_new_sponsorship_create_lead; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_new_sponsorship_create_lead AFTER INSERT ON public.award_sponsorships FOR EACH ROW WHEN ((new.status = 'pending'::text)) EXECUTE FUNCTION public.notify_sales_team_new_lead();


--
-- Name: poll_votes on_poll_vote_created; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_poll_vote_created AFTER INSERT ON public.poll_votes FOR EACH ROW EXECUTE FUNCTION public.handle_poll_vote();


--
-- Name: signup_slots on_signup_slot_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_signup_slot_updated AFTER UPDATE ON public.signup_slots FOR EACH ROW EXECUTE FUNCTION public.handle_signup_volunteer();


--
-- Name: episodes trigger_log_episode_created; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_log_episode_created AFTER INSERT ON public.episodes FOR EACH ROW EXECUTE FUNCTION public.log_episode_created();


--
-- Name: events trigger_log_event_created; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_log_event_created AFTER INSERT ON public.events FOR EACH ROW EXECUTE FUNCTION public.log_event_created();


--
-- Name: meetings trigger_log_meeting_created; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_log_meeting_created AFTER INSERT ON public.meetings FOR EACH ROW EXECUTE FUNCTION public.log_meeting_created();


--
-- Name: podcasts trigger_log_podcast_created; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_log_podcast_created AFTER INSERT ON public.podcasts FOR EACH ROW EXECUTE FUNCTION public.log_podcast_created();


--
-- Name: polls trigger_log_poll_created; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_log_poll_created AFTER INSERT ON public.polls FOR EACH ROW EXECUTE FUNCTION public.log_poll_created();


--
-- Name: signup_sheets trigger_log_signup_sheet_created; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_log_signup_sheet_created AFTER INSERT ON public.signup_sheets FOR EACH ROW EXECUTE FUNCTION public.log_signup_sheet_created();


--
-- Name: tasks trigger_log_task_created; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_log_task_created AFTER INSERT ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.log_task_created();


--
-- Name: media_ad_slots update_ad_slots_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_ad_slots_updated_at BEFORE UPDATE ON public.media_ad_slots FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: ad_videos update_ad_videos_updated_at_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_ad_videos_updated_at_trigger BEFORE UPDATE ON public.ad_videos FOR EACH ROW EXECUTE FUNCTION public.update_ad_videos_updated_at();


--
-- Name: advertisers update_advertisers_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_advertisers_updated_at BEFORE UPDATE ON public.advertisers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: ai_conversations update_ai_conversations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_ai_conversations_updated_at BEFORE UPDATE ON public.ai_conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: availability_schedules update_availability_schedules_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_availability_schedules_updated_at BEFORE UPDATE ON public.availability_schedules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: blog_posts update_blog_posts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON public.blog_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: calendar_connections update_calendar_connections_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_calendar_connections_updated_at BEFORE UPDATE ON public.calendar_connections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: civic_articles update_civic_articles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_civic_articles_updated_at BEFORE UPDATE ON public.civic_articles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: civic_compliance_records update_civic_compliance_records_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_civic_compliance_records_updated_at BEFORE UPDATE ON public.civic_compliance_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: civic_events update_civic_events_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_civic_events_updated_at BEFORE UPDATE ON public.civic_events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: civic_live_sessions update_civic_live_sessions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_civic_live_sessions_updated_at BEFORE UPDATE ON public.civic_live_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: client_tickets update_client_tickets_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_client_tickets_updated_at BEFORE UPDATE ON public.client_tickets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: constituent_requests update_constituent_requests_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_constituent_requests_updated_at BEFORE UPDATE ON public.constituent_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: contact_lists update_contact_lists_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_contact_lists_updated_at BEFORE UPDATE ON public.contact_lists FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: contacts update_contacts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON public.contacts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: custom_links update_custom_links_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_custom_links_updated_at BEFORE UPDATE ON public.custom_links FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: episodes update_episodes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_episodes_updated_at BEFORE UPDATE ON public.episodes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: events update_events_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: integration_metadata update_integration_metadata_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_integration_metadata_updated_at BEFORE UPDATE ON public.integration_metadata FOR EACH ROW EXECUTE FUNCTION public.update_integration_metadata_updated_at();


--
-- Name: invoices update_invoices_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: media_files update_media_files_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_media_files_updated_at BEFORE UPDATE ON public.media_files FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: media_versions update_media_versions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_media_versions_updated_at BEFORE UPDATE ON public.media_versions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: meeting_invitations update_meeting_invitations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_meeting_invitations_updated_at BEFORE UPDATE ON public.meeting_invitations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: meeting_types update_meeting_types_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_meeting_types_updated_at BEFORE UPDATE ON public.meeting_types FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: meetings update_meetings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_meetings_updated_at BEFORE UPDATE ON public.meetings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: microsoft_connections update_microsoft_connections_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_microsoft_connections_updated_at BEFORE UPDATE ON public.microsoft_connections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: podcasts update_podcasts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_podcasts_updated_at BEFORE UPDATE ON public.podcasts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: polls update_polls_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_polls_updated_at BEFORE UPDATE ON public.polls FOR EACH ROW EXECUTE FUNCTION public.update_polls_updated_at();


--
-- Name: media_processing_jobs update_processing_jobs_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_processing_jobs_updated_at BEFORE UPDATE ON public.media_processing_jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: proposals update_proposals_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_proposals_updated_at BEFORE UPDATE ON public.proposals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: qr_codes update_qr_codes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_qr_codes_updated_at BEFORE UPDATE ON public.qr_codes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: saved_proformas update_saved_proformas_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_saved_proformas_updated_at BEFORE UPDATE ON public.saved_proformas FOR EACH ROW EXECUTE FUNCTION public.update_saved_proformas_updated_at();


--
-- Name: signup_sheets update_signup_sheets_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_signup_sheets_updated_at BEFORE UPDATE ON public.signup_sheets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: social_media_accounts update_social_media_accounts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_social_media_accounts_updated_at BEFORE UPDATE ON public.social_media_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: award_sponsorship_packages update_sponsorship_packages_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_sponsorship_packages_updated_at BEFORE UPDATE ON public.award_sponsorship_packages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: studio_recordings update_studio_recordings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_studio_recordings_updated_at BEFORE UPDATE ON public.studio_recordings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: studio_sessions update_studio_sessions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_studio_sessions_updated_at BEFORE UPDATE ON public.studio_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: studio_templates update_studio_templates_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_studio_templates_updated_at BEFORE UPDATE ON public.studio_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: tasks update_tasks_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: team_messages update_team_messages_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_team_messages_updated_at BEFORE UPDATE ON public.team_messages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_preferences update_user_preferences_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON public.user_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_settings update_user_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON public.user_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: award_votes update_vote_count_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_vote_count_trigger AFTER INSERT OR DELETE ON public.award_votes FOR EACH ROW EXECUTE FUNCTION public.update_nominee_vote_count();


--
-- Name: zoom_connections update_zoom_connections_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_zoom_connections_updated_at BEFORE UPDATE ON public.zoom_connections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: activity_logs activity_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: ad_call_inquiries ad_call_inquiries_advertiser_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ad_call_inquiries
    ADD CONSTRAINT ad_call_inquiries_advertiser_id_fkey FOREIGN KEY (advertiser_id) REFERENCES public.advertisers(id) ON DELETE CASCADE;


--
-- Name: ad_call_inquiries ad_call_inquiries_audio_ad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ad_call_inquiries
    ADD CONSTRAINT ad_call_inquiries_audio_ad_id_fkey FOREIGN KEY (audio_ad_id) REFERENCES public.audio_ads(id) ON DELETE CASCADE;


--
-- Name: ad_call_inquiries ad_call_inquiries_campaign_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ad_call_inquiries
    ADD CONSTRAINT ad_call_inquiries_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.ad_campaigns(id) ON DELETE SET NULL;


--
-- Name: ad_campaigns ad_campaigns_advertiser_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ad_campaigns
    ADD CONSTRAINT ad_campaigns_advertiser_id_fkey FOREIGN KEY (advertiser_id) REFERENCES public.advertisers(id) ON DELETE CASCADE;


--
-- Name: ad_creatives ad_creatives_campaign_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ad_creatives
    ADD CONSTRAINT ad_creatives_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.ad_campaigns(id) ON DELETE CASCADE;


--
-- Name: ad_cta_clicks ad_cta_clicks_ad_slot_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ad_cta_clicks
    ADD CONSTRAINT ad_cta_clicks_ad_slot_id_fkey FOREIGN KEY (ad_slot_id) REFERENCES public.ad_slots(id) ON DELETE CASCADE;


--
-- Name: ad_cta_clicks ad_cta_clicks_campaign_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ad_cta_clicks
    ADD CONSTRAINT ad_cta_clicks_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.ad_campaigns(id) ON DELETE SET NULL;


--
-- Name: ad_cta_clicks ad_cta_clicks_episode_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ad_cta_clicks
    ADD CONSTRAINT ad_cta_clicks_episode_id_fkey FOREIGN KEY (episode_id) REFERENCES public.episodes(id) ON DELETE CASCADE;


--
-- Name: ad_cta_clicks ad_cta_clicks_podcast_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ad_cta_clicks
    ADD CONSTRAINT ad_cta_clicks_podcast_id_fkey FOREIGN KEY (podcast_id) REFERENCES public.podcasts(id) ON DELETE CASCADE;


--
-- Name: ad_impressions ad_impressions_ad_slot_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ad_impressions
    ADD CONSTRAINT ad_impressions_ad_slot_id_fkey FOREIGN KEY (ad_slot_id) REFERENCES public.ad_slots(id) ON DELETE CASCADE;


--
-- Name: ad_impressions ad_impressions_campaign_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ad_impressions
    ADD CONSTRAINT ad_impressions_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.ad_campaigns(id) ON DELETE CASCADE;


--
-- Name: ad_impressions ad_impressions_episode_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ad_impressions
    ADD CONSTRAINT ad_impressions_episode_id_fkey FOREIGN KEY (episode_id) REFERENCES public.episodes(id) ON DELETE CASCADE;


--
-- Name: ad_impressions ad_impressions_podcast_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ad_impressions
    ADD CONSTRAINT ad_impressions_podcast_id_fkey FOREIGN KEY (podcast_id) REFERENCES public.podcasts(id) ON DELETE CASCADE;


--
-- Name: ad_slots ad_slots_assigned_campaign_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ad_slots
    ADD CONSTRAINT ad_slots_assigned_campaign_id_fkey FOREIGN KEY (assigned_campaign_id) REFERENCES public.ad_campaigns(id) ON DELETE SET NULL;


--
-- Name: ad_slots ad_slots_episode_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ad_slots
    ADD CONSTRAINT ad_slots_episode_id_fkey FOREIGN KEY (episode_id) REFERENCES public.episodes(id) ON DELETE CASCADE;


--
-- Name: ad_videos ad_videos_created_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ad_videos
    ADD CONSTRAINT ad_videos_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES auth.users(id);


--
-- Name: advertiser_team_members advertiser_team_members_advertiser_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.advertiser_team_members
    ADD CONSTRAINT advertiser_team_members_advertiser_id_fkey FOREIGN KEY (advertiser_id) REFERENCES public.advertisers(id) ON DELETE CASCADE;


--
-- Name: advertiser_transactions advertiser_transactions_advertiser_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.advertiser_transactions
    ADD CONSTRAINT advertiser_transactions_advertiser_id_fkey FOREIGN KEY (advertiser_id) REFERENCES public.advertisers(id) ON DELETE CASCADE;


--
-- Name: advertiser_transactions advertiser_transactions_campaign_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.advertiser_transactions
    ADD CONSTRAINT advertiser_transactions_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.ad_campaigns(id);


--
-- Name: advertisers advertisers_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.advertisers
    ADD CONSTRAINT advertisers_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES auth.users(id);


--
-- Name: advertisers advertisers_pricing_tier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.advertisers
    ADD CONSTRAINT advertisers_pricing_tier_id_fkey FOREIGN KEY (pricing_tier_id) REFERENCES public.advertiser_pricing_tiers(id);


--
-- Name: advertisers advertisers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.advertisers
    ADD CONSTRAINT advertisers_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: ai_messages ai_messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_messages
    ADD CONSTRAINT ai_messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.ai_conversations(id) ON DELETE CASCADE;


--
-- Name: audio_ads audio_ads_advertiser_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audio_ads
    ADD CONSTRAINT audio_ads_advertiser_id_fkey FOREIGN KEY (advertiser_id) REFERENCES public.advertisers(id) ON DELETE CASCADE;


--
-- Name: audio_ads audio_ads_campaign_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audio_ads
    ADD CONSTRAINT audio_ads_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.ad_campaigns(id) ON DELETE SET NULL;


--
-- Name: award_categories award_categories_program_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.award_categories
    ADD CONSTRAINT award_categories_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.awards_programs(id) ON DELETE CASCADE;


--
-- Name: award_nominees award_nominees_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.award_nominees
    ADD CONSTRAINT award_nominees_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.award_categories(id) ON DELETE CASCADE;


--
-- Name: award_nominees award_nominees_program_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.award_nominees
    ADD CONSTRAINT award_nominees_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.awards_programs(id) ON DELETE CASCADE;


--
-- Name: award_payouts award_payouts_program_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.award_payouts
    ADD CONSTRAINT award_payouts_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.awards_programs(id) ON DELETE CASCADE;


--
-- Name: award_registrations award_registrations_program_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.award_registrations
    ADD CONSTRAINT award_registrations_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.awards_programs(id) ON DELETE CASCADE;


--
-- Name: award_self_nominations award_self_nominations_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.award_self_nominations
    ADD CONSTRAINT award_self_nominations_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.award_categories(id) ON DELETE CASCADE;


--
-- Name: award_self_nominations award_self_nominations_nominee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.award_self_nominations
    ADD CONSTRAINT award_self_nominations_nominee_id_fkey FOREIGN KEY (nominee_id) REFERENCES public.award_nominees(id) ON DELETE CASCADE;


--
-- Name: award_self_nominations award_self_nominations_program_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.award_self_nominations
    ADD CONSTRAINT award_self_nominations_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.awards_programs(id) ON DELETE CASCADE;


--
-- Name: award_sponsorship_packages award_sponsorship_packages_program_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.award_sponsorship_packages
    ADD CONSTRAINT award_sponsorship_packages_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.awards_programs(id) ON DELETE CASCADE;


--
-- Name: award_sponsorships award_sponsorships_package_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.award_sponsorships
    ADD CONSTRAINT award_sponsorships_package_id_fkey FOREIGN KEY (package_id) REFERENCES public.award_sponsorship_packages(id) ON DELETE CASCADE;


--
-- Name: award_sponsorships award_sponsorships_program_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.award_sponsorships
    ADD CONSTRAINT award_sponsorships_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.awards_programs(id) ON DELETE CASCADE;


--
-- Name: award_votes award_votes_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.award_votes
    ADD CONSTRAINT award_votes_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.award_categories(id) ON DELETE CASCADE;


--
-- Name: award_votes award_votes_nominee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.award_votes
    ADD CONSTRAINT award_votes_nominee_id_fkey FOREIGN KEY (nominee_id) REFERENCES public.award_nominees(id) ON DELETE CASCADE;


--
-- Name: award_votes award_votes_program_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.award_votes
    ADD CONSTRAINT award_votes_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.awards_programs(id) ON DELETE CASCADE;


--
-- Name: award_winners award_winners_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.award_winners
    ADD CONSTRAINT award_winners_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.award_categories(id) ON DELETE CASCADE;


--
-- Name: award_winners award_winners_nominee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.award_winners
    ADD CONSTRAINT award_winners_nominee_id_fkey FOREIGN KEY (nominee_id) REFERENCES public.award_nominees(id) ON DELETE CASCADE;


--
-- Name: award_winners award_winners_program_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.award_winners
    ADD CONSTRAINT award_winners_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.awards_programs(id) ON DELETE CASCADE;


--
-- Name: blog_post_categories blog_post_categories_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_post_categories
    ADD CONSTRAINT blog_post_categories_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.blog_categories(id) ON DELETE CASCADE;


--
-- Name: blog_post_categories blog_post_categories_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_post_categories
    ADD CONSTRAINT blog_post_categories_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.blog_posts(id) ON DELETE CASCADE;


--
-- Name: blog_posts blog_posts_episode_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT blog_posts_episode_id_fkey FOREIGN KEY (episode_id) REFERENCES public.episodes(id) ON DELETE SET NULL;


--
-- Name: blog_posts blog_posts_podcast_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT blog_posts_podcast_id_fkey FOREIGN KEY (podcast_id) REFERENCES public.podcasts(id) ON DELETE SET NULL;


--
-- Name: blog_posts blog_posts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT blog_posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: campaign_properties campaign_properties_creator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_properties
    ADD CONSTRAINT campaign_properties_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: campaign_properties campaign_properties_multi_channel_campaign_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_properties
    ADD CONSTRAINT campaign_properties_multi_channel_campaign_id_fkey FOREIGN KEY (multi_channel_campaign_id) REFERENCES public.multi_channel_campaigns(id) ON DELETE CASCADE;


--
-- Name: campaign_property_impressions campaign_property_impressions_campaign_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_property_impressions
    ADD CONSTRAINT campaign_property_impressions_campaign_property_id_fkey FOREIGN KEY (campaign_property_id) REFERENCES public.campaign_properties(id) ON DELETE CASCADE;


--
-- Name: campaign_property_impressions campaign_property_impressions_multi_channel_campaign_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_property_impressions
    ADD CONSTRAINT campaign_property_impressions_multi_channel_campaign_id_fkey FOREIGN KEY (multi_channel_campaign_id) REFERENCES public.multi_channel_campaigns(id) ON DELETE CASCADE;


--
-- Name: civic_compliance_records civic_compliance_records_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.civic_compliance_records
    ADD CONSTRAINT civic_compliance_records_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.civic_events(id) ON DELETE CASCADE;


--
-- Name: civic_live_sessions civic_live_sessions_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.civic_live_sessions
    ADD CONSTRAINT civic_live_sessions_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.civic_events(id) ON DELETE CASCADE;


--
-- Name: client_tickets client_tickets_client_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_tickets
    ADD CONSTRAINT client_tickets_client_contact_id_fkey FOREIGN KEY (client_contact_id) REFERENCES public.contacts(id) ON DELETE SET NULL;


--
-- Name: contact_list_members contact_list_members_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_list_members
    ADD CONSTRAINT contact_list_members_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE CASCADE;


--
-- Name: contact_list_members contact_list_members_list_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_list_members
    ADD CONSTRAINT contact_list_members_list_id_fkey FOREIGN KEY (list_id) REFERENCES public.contact_lists(id) ON DELETE CASCADE;


--
-- Name: contact_tag_assignments contact_tag_assignments_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_tag_assignments
    ADD CONSTRAINT contact_tag_assignments_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE CASCADE;


--
-- Name: contact_tag_assignments contact_tag_assignments_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_tag_assignments
    ADD CONSTRAINT contact_tag_assignments_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.contact_tags(id) ON DELETE CASCADE;


--
-- Name: contacts contacts_sales_rep_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_sales_rep_id_fkey FOREIGN KEY (sales_rep_id) REFERENCES public.sales_team_members(id);


--
-- Name: conversational_ad_charges conversational_ad_charges_advertiser_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversational_ad_charges
    ADD CONSTRAINT conversational_ad_charges_advertiser_id_fkey FOREIGN KEY (advertiser_id) REFERENCES public.advertisers(id) ON DELETE CASCADE;


--
-- Name: conversational_ad_charges conversational_ad_charges_audio_ad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversational_ad_charges
    ADD CONSTRAINT conversational_ad_charges_audio_ad_id_fkey FOREIGN KEY (audio_ad_id) REFERENCES public.audio_ads(id) ON DELETE SET NULL;


--
-- Name: conversational_ad_charges conversational_ad_charges_campaign_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversational_ad_charges
    ADD CONSTRAINT conversational_ad_charges_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.ad_campaigns(id) ON DELETE SET NULL;


--
-- Name: conversational_ad_usage conversational_ad_usage_advertiser_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversational_ad_usage
    ADD CONSTRAINT conversational_ad_usage_advertiser_id_fkey FOREIGN KEY (advertiser_id) REFERENCES public.advertisers(id) ON DELETE CASCADE;


--
-- Name: conversational_ad_usage conversational_ad_usage_audio_ad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversational_ad_usage
    ADD CONSTRAINT conversational_ad_usage_audio_ad_id_fkey FOREIGN KEY (audio_ad_id) REFERENCES public.audio_ads(id) ON DELETE SET NULL;


--
-- Name: conversational_ad_usage conversational_ad_usage_campaign_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversational_ad_usage
    ADD CONSTRAINT conversational_ad_usage_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.ad_campaigns(id) ON DELETE SET NULL;


--
-- Name: creator_campaign_alerts creator_campaign_alerts_creator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.creator_campaign_alerts
    ADD CONSTRAINT creator_campaign_alerts_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: creator_campaign_alerts creator_campaign_alerts_multi_channel_campaign_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.creator_campaign_alerts
    ADD CONSTRAINT creator_campaign_alerts_multi_channel_campaign_id_fkey FOREIGN KEY (multi_channel_campaign_id) REFERENCES public.multi_channel_campaigns(id) ON DELETE CASCADE;


--
-- Name: creator_earnings creator_earnings_campaign_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.creator_earnings
    ADD CONSTRAINT creator_earnings_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.ad_campaigns(id) ON DELETE CASCADE;


--
-- Name: creator_tips creator_tips_creator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.creator_tips
    ADD CONSTRAINT creator_tips_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: custom_link_sections custom_link_sections_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.custom_link_sections
    ADD CONSTRAINT custom_link_sections_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: custom_links custom_links_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.custom_links
    ADD CONSTRAINT custom_links_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: digital_ads digital_ads_advertiser_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.digital_ads
    ADD CONSTRAINT digital_ads_advertiser_id_fkey FOREIGN KEY (advertiser_id) REFERENCES public.advertisers(id) ON DELETE CASCADE;


--
-- Name: digital_ads digital_ads_campaign_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.digital_ads
    ADD CONSTRAINT digital_ads_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.ad_campaigns(id) ON DELETE SET NULL;


--
-- Name: email_campaigns email_campaigns_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_campaigns
    ADD CONSTRAINT email_campaigns_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: email_events email_events_campaign_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_events
    ADD CONSTRAINT email_events_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.email_campaigns(id) ON DELETE SET NULL;


--
-- Name: email_events email_events_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_events
    ADD CONSTRAINT email_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: episodes episodes_podcast_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.episodes
    ADD CONSTRAINT episodes_podcast_id_fkey FOREIGN KEY (podcast_id) REFERENCES public.podcasts(id) ON DELETE CASCADE;


--
-- Name: event_registrations event_registrations_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_registrations
    ADD CONSTRAINT event_registrations_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: event_sponsorship_packages event_sponsorship_packages_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_sponsorship_packages
    ADD CONSTRAINT event_sponsorship_packages_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: event_sponsorships event_sponsorships_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_sponsorships
    ADD CONSTRAINT event_sponsorships_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: event_sponsorships event_sponsorships_package_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_sponsorships
    ADD CONSTRAINT event_sponsorships_package_id_fkey FOREIGN KEY (package_id) REFERENCES public.event_sponsorship_packages(id) ON DELETE CASCADE;


--
-- Name: events events_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: influencehub_creators influencehub_creators_agency_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.influencehub_creators
    ADD CONSTRAINT influencehub_creators_agency_user_id_fkey FOREIGN KEY (agency_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: influencehub_creators influencehub_creators_creator_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.influencehub_creators
    ADD CONSTRAINT influencehub_creators_creator_user_id_fkey FOREIGN KEY (creator_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: influencehub_posts influencehub_posts_creator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.influencehub_posts
    ADD CONSTRAINT influencehub_posts_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.influencehub_creators(id) ON DELETE CASCADE;


--
-- Name: influencehub_posts influencehub_posts_social_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.influencehub_posts
    ADD CONSTRAINT influencehub_posts_social_account_id_fkey FOREIGN KEY (social_account_id) REFERENCES public.social_accounts(id) ON DELETE CASCADE;


--
-- Name: influencehub_posts influencehub_posts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.influencehub_posts
    ADD CONSTRAINT influencehub_posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: invoices invoices_client_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_client_contact_id_fkey FOREIGN KEY (client_contact_id) REFERENCES public.contacts(id) ON DELETE SET NULL;


--
-- Name: invoices invoices_proposal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_proposal_id_fkey FOREIGN KEY (proposal_id) REFERENCES public.proposals(id) ON DELETE SET NULL;


--
-- Name: link_clicks link_clicks_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.link_clicks
    ADD CONSTRAINT link_clicks_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: live_stream_viewers live_stream_viewers_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.live_stream_viewers
    ADD CONSTRAINT live_stream_viewers_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: media_ad_slots media_ad_slots_audio_ad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media_ad_slots
    ADD CONSTRAINT media_ad_slots_audio_ad_id_fkey FOREIGN KEY (audio_ad_id) REFERENCES public.audio_ads(id) ON DELETE SET NULL;


--
-- Name: media_ad_slots media_ad_slots_media_file_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media_ad_slots
    ADD CONSTRAINT media_ad_slots_media_file_id_fkey FOREIGN KEY (media_file_id) REFERENCES public.media_files(id) ON DELETE CASCADE;


--
-- Name: media_ad_slots media_ad_slots_processing_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media_ad_slots
    ADD CONSTRAINT media_ad_slots_processing_job_id_fkey FOREIGN KEY (processing_job_id) REFERENCES public.media_processing_jobs(id) ON DELETE SET NULL;


--
-- Name: media_files media_files_converted_to_episode_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media_files
    ADD CONSTRAINT media_files_converted_to_episode_id_fkey FOREIGN KEY (converted_to_episode_id) REFERENCES public.episodes(id) ON DELETE SET NULL;


--
-- Name: media_files media_files_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media_files
    ADD CONSTRAINT media_files_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: media_processing_jobs media_processing_jobs_media_file_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media_processing_jobs
    ADD CONSTRAINT media_processing_jobs_media_file_id_fkey FOREIGN KEY (media_file_id) REFERENCES public.media_files(id) ON DELETE CASCADE;


--
-- Name: media_versions media_versions_original_media_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media_versions
    ADD CONSTRAINT media_versions_original_media_id_fkey FOREIGN KEY (original_media_id) REFERENCES public.media_files(id) ON DELETE CASCADE;


--
-- Name: media_versions media_versions_processing_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media_versions
    ADD CONSTRAINT media_versions_processing_job_id_fkey FOREIGN KEY (processing_job_id) REFERENCES public.media_processing_jobs(id) ON DELETE SET NULL;


--
-- Name: meeting_invitations meeting_invitations_meeting_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meeting_invitations
    ADD CONSTRAINT meeting_invitations_meeting_type_id_fkey FOREIGN KEY (meeting_type_id) REFERENCES public.meeting_types(id) ON DELETE CASCADE;


--
-- Name: meetings meetings_meeting_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meetings
    ADD CONSTRAINT meetings_meeting_type_id_fkey FOREIGN KEY (meeting_type_id) REFERENCES public.meeting_types(id) ON DELETE SET NULL;


--
-- Name: microsoft_connections microsoft_connections_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.microsoft_connections
    ADD CONSTRAINT microsoft_connections_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: module_purchases module_purchases_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.module_purchases
    ADD CONSTRAINT module_purchases_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE CASCADE;


--
-- Name: module_purchases module_purchases_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.module_purchases
    ADD CONSTRAINT module_purchases_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: multi_channel_campaigns multi_channel_campaigns_advertiser_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.multi_channel_campaigns
    ADD CONSTRAINT multi_channel_campaigns_advertiser_id_fkey FOREIGN KEY (advertiser_id) REFERENCES public.advertisers(id) ON DELETE CASCADE;


--
-- Name: multi_channel_campaigns multi_channel_campaigns_sales_team_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.multi_channel_campaigns
    ADD CONSTRAINT multi_channel_campaigns_sales_team_member_id_fkey FOREIGN KEY (sales_team_member_id) REFERENCES public.sales_team_members(id) ON DELETE SET NULL;


--
-- Name: my_page_video_impressions my_page_video_impressions_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.my_page_video_impressions
    ADD CONSTRAINT my_page_video_impressions_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: podcast_ad_settings podcast_ad_settings_podcast_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.podcast_ad_settings
    ADD CONSTRAINT podcast_ad_settings_podcast_id_fkey FOREIGN KEY (podcast_id) REFERENCES public.podcasts(id) ON DELETE CASCADE;


--
-- Name: podcast_campaign_selections podcast_campaign_selections_campaign_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.podcast_campaign_selections
    ADD CONSTRAINT podcast_campaign_selections_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.ad_campaigns(id) ON DELETE CASCADE;


--
-- Name: podcast_campaign_selections podcast_campaign_selections_podcast_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.podcast_campaign_selections
    ADD CONSTRAINT podcast_campaign_selections_podcast_id_fkey FOREIGN KEY (podcast_id) REFERENCES public.podcasts(id) ON DELETE CASCADE;


--
-- Name: poll_options poll_options_poll_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.poll_options
    ADD CONSTRAINT poll_options_poll_id_fkey FOREIGN KEY (poll_id) REFERENCES public.polls(id) ON DELETE CASCADE;


--
-- Name: poll_votes poll_votes_option_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.poll_votes
    ADD CONSTRAINT poll_votes_option_id_fkey FOREIGN KEY (option_id) REFERENCES public.poll_options(id) ON DELETE CASCADE;


--
-- Name: poll_votes poll_votes_poll_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.poll_votes
    ADD CONSTRAINT poll_votes_poll_id_fkey FOREIGN KEY (poll_id) REFERENCES public.polls(id) ON DELETE CASCADE;


--
-- Name: profile_section_order profile_section_order_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profile_section_order
    ADD CONSTRAINT profile_section_order_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: profile_views profile_views_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profile_views
    ADD CONSTRAINT profile_views_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: proposals proposals_client_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proposals
    ADD CONSTRAINT proposals_client_contact_id_fkey FOREIGN KEY (client_contact_id) REFERENCES public.contacts(id) ON DELETE SET NULL;


--
-- Name: sales_commissions sales_commissions_multi_channel_campaign_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_commissions
    ADD CONSTRAINT sales_commissions_multi_channel_campaign_id_fkey FOREIGN KEY (multi_channel_campaign_id) REFERENCES public.multi_channel_campaigns(id) ON DELETE CASCADE;


--
-- Name: sales_commissions sales_commissions_sales_team_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_commissions
    ADD CONSTRAINT sales_commissions_sales_team_member_id_fkey FOREIGN KEY (sales_team_member_id) REFERENCES public.sales_team_members(id) ON DELETE CASCADE;


--
-- Name: sales_team_members sales_team_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_team_members
    ADD CONSTRAINT sales_team_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: saved_proformas saved_proformas_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_proformas
    ADD CONSTRAINT saved_proformas_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: signup_sheets signup_sheets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.signup_sheets
    ADD CONSTRAINT signup_sheets_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: signup_slots signup_slots_sheet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.signup_slots
    ADD CONSTRAINT signup_slots_sheet_id_fkey FOREIGN KEY (sheet_id) REFERENCES public.signup_sheets(id) ON DELETE CASCADE;


--
-- Name: social_accounts social_accounts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_accounts
    ADD CONSTRAINT social_accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: social_links social_links_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_links
    ADD CONSTRAINT social_links_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: social_media_accounts social_media_accounts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_media_accounts
    ADD CONSTRAINT social_media_accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: social_media_properties social_media_properties_creator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_media_properties
    ADD CONSTRAINT social_media_properties_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: stream_impressions stream_impressions_creator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stream_impressions
    ADD CONSTRAINT stream_impressions_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: studio_guests studio_guests_studio_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.studio_guests
    ADD CONSTRAINT studio_guests_studio_session_id_fkey FOREIGN KEY (studio_session_id) REFERENCES public.studio_sessions(id) ON DELETE CASCADE;


--
-- Name: studio_recording_ads studio_recording_ads_ad_slot_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.studio_recording_ads
    ADD CONSTRAINT studio_recording_ads_ad_slot_id_fkey FOREIGN KEY (ad_slot_id) REFERENCES public.ad_slots(id) ON DELETE CASCADE;


--
-- Name: studio_recording_ads studio_recording_ads_recording_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.studio_recording_ads
    ADD CONSTRAINT studio_recording_ads_recording_id_fkey FOREIGN KEY (recording_id) REFERENCES public.studio_recordings(id) ON DELETE CASCADE;


--
-- Name: studio_recordings studio_recordings_converted_to_episode_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.studio_recordings
    ADD CONSTRAINT studio_recordings_converted_to_episode_id_fkey FOREIGN KEY (converted_to_episode_id) REFERENCES public.episodes(id);


--
-- Name: studio_recordings studio_recordings_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.studio_recordings
    ADD CONSTRAINT studio_recordings_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.studio_sessions(id) ON DELETE CASCADE;


--
-- Name: studio_templates studio_templates_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.studio_templates
    ADD CONSTRAINT studio_templates_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: subscriptions subscriptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: support_chat_participants support_chat_participants_account_holder_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_chat_participants
    ADD CONSTRAINT support_chat_participants_account_holder_user_id_fkey FOREIGN KEY (account_holder_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: support_chat_participants support_chat_participants_admin_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_chat_participants
    ADD CONSTRAINT support_chat_participants_admin_user_id_fkey FOREIGN KEY (admin_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: tab_views tab_views_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tab_views
    ADD CONSTRAINT tab_views_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: tasks tasks_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: team_members team_members_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE;


--
-- Name: team_members team_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: team_messages team_messages_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_messages
    ADD CONSTRAINT team_messages_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE;


--
-- Name: team_messages team_messages_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_messages
    ADD CONSTRAINT team_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: teams teams_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: usage_tracking usage_tracking_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usage_tracking
    ADD CONSTRAINT usage_tracking_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_modules user_modules_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_modules
    ADD CONSTRAINT user_modules_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE CASCADE;


--
-- Name: user_modules user_modules_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_modules
    ADD CONSTRAINT user_modules_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_presence user_presence_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_presence
    ADD CONSTRAINT user_presence_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id);


--
-- Name: user_presence user_presence_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_presence
    ADD CONSTRAINT user_presence_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: video_markers video_markers_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_markers
    ADD CONSTRAINT video_markers_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: video_markers video_markers_media_file_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_markers
    ADD CONSTRAINT video_markers_media_file_id_fkey FOREIGN KEY (media_file_id) REFERENCES public.media_files(id) ON DELETE CASCADE;


--
-- Name: support_chat_participants Account holders can view their support chats; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Account holders can view their support chats" ON public.support_chat_participants FOR SELECT TO authenticated USING ((account_holder_user_id = auth.uid()));


--
-- Name: contacts Admin can assign sales reps; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can assign sales reps" ON public.contacts FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: support_chat_participants Admins can create support chats; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can create support chats" ON public.support_chat_participants FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.account_type = 'seeksy_admin'::public.account_type)))));


--
-- Name: user_roles Admins can delete user roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete user roles" ON public.user_roles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can insert user roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert user roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: advertisers Admins can manage all advertisers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all advertisers" ON public.advertisers USING ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::public.app_role)))));


--
-- Name: financial_assumptions Admins can manage all assumptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all assumptions" ON public.financial_assumptions USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: audio_ads Admins can manage all audio ads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all audio ads" ON public.audio_ads USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: ad_campaigns Admins can manage all campaigns; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all campaigns" ON public.ad_campaigns USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: ad_creatives Admins can manage all creatives; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all creatives" ON public.ad_creatives USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: digital_ads Admins can manage all digital ads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all digital ads" ON public.digital_ads USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: creator_earnings Admins can manage all earnings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all earnings" ON public.creator_earnings USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: team_members Admins can manage all team members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all team members" ON public.team_members USING ((public.has_role(auth.uid(), 'super_admin'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: advertiser_pricing_tiers Admins can manage pricing tiers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage pricing tiers" ON public.advertiser_pricing_tiers USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: sales_team_members Admins can manage sales team; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage sales team" ON public.sales_team_members USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: investor_talking_points Admins can manage talking points; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage talking points" ON public.investor_talking_points USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'super_admin'::public.app_role)));


--
-- Name: user_modules Admins can manage user modules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage user modules" ON public.user_modules USING ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::public.app_role)))));


--
-- Name: integration_metadata Admins can update integration metadata; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update integration metadata" ON public.integration_metadata FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['super_admin'::public.app_role, 'admin'::public.app_role]))))));


--
-- Name: user_roles Admins can update user roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update user roles" ON public.user_roles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: ad_cta_clicks Admins can view all CTA clicks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all CTA clicks" ON public.ad_cta_clicks FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: ad_slots Admins can view all ad slots; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all ad slots" ON public.ad_slots FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: advertisers Admins can view all advertisers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all advertisers" ON public.advertisers FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::public.app_role)))));


--
-- Name: conversational_ad_charges Admins can view all conversational ad charges; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all conversational ad charges" ON public.conversational_ad_charges FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: conversational_ad_usage Admins can view all conversational ad usage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all conversational ad usage" ON public.conversational_ad_usage FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: ad_impressions Admins can view all impressions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all impressions" ON public.ad_impressions FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: podcast_ad_settings Admins can view all podcast ad settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all podcast ad settings" ON public.podcast_ad_settings FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: financial_snapshots Admins can view all snapshots; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all snapshots" ON public.financial_snapshots FOR SELECT USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'super_admin'::public.app_role)));


--
-- Name: support_chat_participants Admins can view all support chats; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all support chats" ON public.support_chat_participants FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.account_type = 'seeksy_admin'::public.account_type)))));


--
-- Name: advertiser_transactions Admins can view all transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all transactions" ON public.advertiser_transactions FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::public.app_role)))));


--
-- Name: user_roles Admins can view all user roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all user roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: rate_limit_logs Admins can view rate limit logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view rate limit logs" ON public.rate_limit_logs FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: advertiser_team_members Advertiser admins can view team members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Advertiser admins can view team members" ON public.advertiser_team_members FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.advertiser_team_members atm
  WHERE ((atm.advertiser_id = advertiser_team_members.advertiser_id) AND (atm.user_id = auth.uid()) AND (atm.role = ANY (ARRAY['super_admin'::public.advertiser_team_role, 'admin'::public.advertiser_team_role]))))));


--
-- Name: advertiser_team_members Advertiser super_admins can add team members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Advertiser super_admins can add team members" ON public.advertiser_team_members FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.advertiser_team_members atm
  WHERE ((atm.advertiser_id = advertiser_team_members.advertiser_id) AND (atm.user_id = auth.uid()) AND (atm.role = 'super_admin'::public.advertiser_team_role)))));


--
-- Name: advertiser_team_members Advertiser super_admins can delete team members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Advertiser super_admins can delete team members" ON public.advertiser_team_members FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.advertiser_team_members atm
  WHERE ((atm.advertiser_id = advertiser_team_members.advertiser_id) AND (atm.user_id = auth.uid()) AND (atm.role = 'super_admin'::public.advertiser_team_role)))));


--
-- Name: advertiser_team_members Advertiser super_admins can update team members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Advertiser super_admins can update team members" ON public.advertiser_team_members FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.advertiser_team_members atm
  WHERE ((atm.advertiser_id = advertiser_team_members.advertiser_id) AND (atm.user_id = auth.uid()) AND (atm.role = 'super_admin'::public.advertiser_team_role)))));


--
-- Name: audio_ads Advertisers can create their own audio ads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Advertisers can create their own audio ads" ON public.audio_ads FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.advertisers
  WHERE ((advertisers.id = audio_ads.advertiser_id) AND (advertisers.user_id = auth.uid())))));


--
-- Name: ad_campaigns Advertisers can create their own campaigns; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Advertisers can create their own campaigns" ON public.ad_campaigns FOR INSERT WITH CHECK ((advertiser_id IN ( SELECT advertisers.id
   FROM public.advertisers
  WHERE (advertisers.user_id = auth.uid()))));


--
-- Name: ad_creatives Advertisers can create their own creatives; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Advertisers can create their own creatives" ON public.ad_creatives FOR INSERT WITH CHECK ((campaign_id IN ( SELECT ac.id
   FROM (public.ad_campaigns ac
     JOIN public.advertisers a ON ((a.id = ac.advertiser_id)))
  WHERE (a.user_id = auth.uid()))));


--
-- Name: digital_ads Advertisers can create their own digital ads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Advertisers can create their own digital ads" ON public.digital_ads FOR INSERT WITH CHECK ((advertiser_id IN ( SELECT advertisers.id
   FROM public.advertisers
  WHERE ((advertisers.user_id = auth.uid()) AND (advertisers.status = 'approved'::text)))));


--
-- Name: audio_ads Advertisers can delete their own audio ads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Advertisers can delete their own audio ads" ON public.audio_ads FOR DELETE USING ((advertiser_id IN ( SELECT advertisers.id
   FROM public.advertisers
  WHERE (advertisers.user_id = auth.uid()))));


--
-- Name: ad_campaigns Advertisers can delete their own campaigns; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Advertisers can delete their own campaigns" ON public.ad_campaigns FOR DELETE USING ((advertiser_id IN ( SELECT advertisers.id
   FROM public.advertisers
  WHERE (advertisers.user_id = auth.uid()))));


--
-- Name: digital_ads Advertisers can delete their own digital ads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Advertisers can delete their own digital ads" ON public.digital_ads FOR DELETE USING ((advertiser_id IN ( SELECT advertisers.id
   FROM public.advertisers
  WHERE (advertisers.user_id = auth.uid()))));


--
-- Name: audio_ads Advertisers can update their own audio ads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Advertisers can update their own audio ads" ON public.audio_ads FOR UPDATE USING ((advertiser_id IN ( SELECT advertisers.id
   FROM public.advertisers
  WHERE (advertisers.user_id = auth.uid()))));


--
-- Name: ad_campaigns Advertisers can update their own campaigns; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Advertisers can update their own campaigns" ON public.ad_campaigns FOR UPDATE USING ((advertiser_id IN ( SELECT advertisers.id
   FROM public.advertisers
  WHERE (advertisers.user_id = auth.uid()))));


--
-- Name: digital_ads Advertisers can update their own digital ads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Advertisers can update their own digital ads" ON public.digital_ads FOR UPDATE USING ((advertiser_id IN ( SELECT advertisers.id
   FROM public.advertisers
  WHERE (advertisers.user_id = auth.uid()))));


--
-- Name: advertisers Advertisers can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Advertisers can update their own profile" ON public.advertisers FOR UPDATE USING ((user_id = auth.uid()));


--
-- Name: ad_call_inquiries Advertisers can view own call inquiries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Advertisers can view own call inquiries" ON public.ad_call_inquiries FOR SELECT USING ((advertiser_id IN ( SELECT advertisers.id
   FROM public.advertisers
  WHERE (advertisers.user_id = auth.uid()))));


--
-- Name: studio_recording_ads Advertisers can view their ad placements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Advertisers can view their ad placements" ON public.studio_recording_ads FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (public.ad_slots
     JOIN public.ad_campaigns ON ((ad_slots.assigned_campaign_id = ad_campaigns.id)))
  WHERE ((ad_slots.id = studio_recording_ads.ad_slot_id) AND (ad_campaigns.advertiser_id = auth.uid())))));


--
-- Name: audio_ads Advertisers can view their own audio ads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Advertisers can view their own audio ads" ON public.audio_ads FOR SELECT USING ((advertiser_id IN ( SELECT advertisers.id
   FROM public.advertisers
  WHERE (advertisers.user_id = auth.uid()))));


--
-- Name: ad_campaigns Advertisers can view their own campaigns; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Advertisers can view their own campaigns" ON public.ad_campaigns FOR SELECT USING ((advertiser_id IN ( SELECT advertisers.id
   FROM public.advertisers
  WHERE (advertisers.user_id = auth.uid()))));


--
-- Name: conversational_ad_charges Advertisers can view their own conversational ad charges; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Advertisers can view their own conversational ad charges" ON public.conversational_ad_charges FOR SELECT USING ((advertiser_id IN ( SELECT advertisers.id
   FROM public.advertisers
  WHERE (advertisers.user_id = auth.uid()))));


--
-- Name: conversational_ad_usage Advertisers can view their own conversational ad usage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Advertisers can view their own conversational ad usage" ON public.conversational_ad_usage FOR SELECT USING ((advertiser_id IN ( SELECT advertisers.id
   FROM public.advertisers
  WHERE (advertisers.user_id = auth.uid()))));


--
-- Name: digital_ads Advertisers can view their own digital ads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Advertisers can view their own digital ads" ON public.digital_ads FOR SELECT USING ((advertiser_id IN ( SELECT advertisers.id
   FROM public.advertisers
  WHERE (advertisers.user_id = auth.uid()))));


--
-- Name: advertisers Advertisers can view their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Advertisers can view their own profile" ON public.advertisers FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: advertiser_transactions Advertisers can view their own transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Advertisers can view their own transactions" ON public.advertiser_transactions FOR SELECT USING ((advertiser_id IN ( SELECT advertisers.id
   FROM public.advertisers
  WHERE (advertisers.user_id = auth.uid()))));


--
-- Name: team_members All authenticated users can view team members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "All authenticated users can view team members" ON public.team_members FOR SELECT TO authenticated USING (true);


--
-- Name: teams All authenticated users can view teams; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "All authenticated users can view teams" ON public.teams FOR SELECT TO authenticated USING (true);


--
-- Name: event_sponsorships Anyone can create event sponsorships; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can create event sponsorships" ON public.event_sponsorships FOR INSERT WITH CHECK (true);


--
-- Name: award_registrations Anyone can create registrations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can create registrations" ON public.award_registrations FOR INSERT WITH CHECK (true);


--
-- Name: award_self_nominations Anyone can create self-nominations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can create self-nominations" ON public.award_self_nominations FOR INSERT WITH CHECK (true);


--
-- Name: award_sponsorships Anyone can create sponsorships; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can create sponsorships" ON public.award_sponsorships FOR INSERT WITH CHECK (true);


--
-- Name: creator_tips Anyone can create tips; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can create tips" ON public.creator_tips FOR INSERT WITH CHECK (true);


--
-- Name: campaign_property_impressions Anyone can insert impressions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can insert impressions" ON public.campaign_property_impressions FOR INSERT WITH CHECK (true);


--
-- Name: link_clicks Anyone can insert link clicks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can insert link clicks" ON public.link_clicks FOR INSERT WITH CHECK (true);


--
-- Name: profile_views Anyone can insert profile views; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can insert profile views" ON public.profile_views FOR INSERT WITH CHECK (true);


--
-- Name: stream_impressions Anyone can insert stream impressions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can insert stream impressions" ON public.stream_impressions FOR INSERT WITH CHECK (true);


--
-- Name: tab_views Anyone can insert tab views; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can insert tab views" ON public.tab_views FOR INSERT WITH CHECK (true);


--
-- Name: live_stream_viewers Anyone can join as a viewer; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can join as a viewer" ON public.live_stream_viewers FOR INSERT WITH CHECK (true);


--
-- Name: integration_metadata Anyone can read integration metadata; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read integration metadata" ON public.integration_metadata FOR SELECT TO authenticated USING (true);


--
-- Name: event_registrations Anyone can register for published events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can register for published events" ON public.event_registrations FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.events
  WHERE ((events.id = event_registrations.event_id) AND (events.is_published = true)))));


--
-- Name: constituent_requests Anyone can submit constituent requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can submit constituent requests" ON public.constituent_requests FOR INSERT WITH CHECK (true);


--
-- Name: ad_cta_clicks Anyone can track CTA clicks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can track CTA clicks" ON public.ad_cta_clicks FOR INSERT WITH CHECK (true);


--
-- Name: my_page_video_impressions Anyone can track impressions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can track impressions" ON public.my_page_video_impressions FOR INSERT WITH CHECK (true);


--
-- Name: stream_impressions Anyone can update own session impressions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can update own session impressions" ON public.stream_impressions FOR UPDATE USING (true);


--
-- Name: signup_slots Anyone can update slots for published sheets (sign up); Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can update slots for published sheets (sign up)" ON public.signup_slots FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.signup_sheets
  WHERE ((signup_sheets.id = signup_slots.sheet_id) AND (signup_sheets.is_published = true)))));


--
-- Name: custom_links Anyone can view active custom links; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view active custom links" ON public.custom_links FOR SELECT USING ((is_active = true));


--
-- Name: meeting_types Anyone can view active meeting types; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view active meeting types" ON public.meeting_types FOR SELECT USING ((is_active = true));


--
-- Name: award_nominees Anyone can view approved nominees of published programs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view approved nominees of published programs" ON public.award_nominees FOR SELECT USING ((((status = 'approved'::public.nominee_status) AND (EXISTS ( SELECT 1
   FROM public.awards_programs
  WHERE ((awards_programs.id = award_nominees.program_id) AND (awards_programs.status <> 'draft'::public.award_program_status))))) OR (EXISTS ( SELECT 1
   FROM public.awards_programs
  WHERE ((awards_programs.id = award_nominees.program_id) AND (awards_programs.user_id = auth.uid()))))));


--
-- Name: blog_categories Anyone can view blog categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view blog categories" ON public.blog_categories FOR SELECT USING (true);


--
-- Name: blog_post_categories Anyone can view blog post categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view blog post categories" ON public.blog_post_categories FOR SELECT USING (true);


--
-- Name: award_categories Anyone can view categories of published programs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view categories of published programs" ON public.award_categories FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.awards_programs
  WHERE ((awards_programs.id = award_categories.program_id) AND ((awards_programs.status <> 'draft'::public.award_program_status) OR (awards_programs.user_id = auth.uid()))))));


--
-- Name: event_sponsorship_packages Anyone can view event sponsorship packages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view event sponsorship packages" ON public.event_sponsorship_packages FOR SELECT USING (true);


--
-- Name: live_stream_viewers Anyone can view live stream viewers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view live stream viewers" ON public.live_stream_viewers FOR SELECT USING (true);


--
-- Name: poll_options Anyone can view options for published polls; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view options for published polls" ON public.poll_options FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.polls
  WHERE ((polls.id = poll_options.poll_id) AND ((polls.is_published = true) OR (polls.user_id = auth.uid()))))));


--
-- Name: award_sponsorship_packages Anyone can view packages for published programs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view packages for published programs" ON public.award_sponsorship_packages FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.awards_programs
  WHERE ((awards_programs.id = award_sponsorship_packages.program_id) AND (awards_programs.status <> 'draft'::public.award_program_status)))));


--
-- Name: event_sponsorships Anyone can view paid event sponsorships; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view paid event sponsorships" ON public.event_sponsorships FOR SELECT USING ((status = 'paid'::text));


--
-- Name: award_sponsorships Anyone can view paid sponsorships; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view paid sponsorships" ON public.award_sponsorships FOR SELECT USING ((status = 'paid'::text));


--
-- Name: blog_posts Anyone can view published blog posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view published blog posts" ON public.blog_posts FOR SELECT USING ((status = 'published'::text));


--
-- Name: award_votes Anyone can view votes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view votes" ON public.award_votes FOR SELECT USING (true);


--
-- Name: poll_votes Anyone can view votes for published polls; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view votes for published polls" ON public.poll_votes FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.polls
  WHERE ((polls.id = poll_votes.poll_id) AND ((polls.is_published = true) OR (polls.user_id = auth.uid()))))));


--
-- Name: award_winners Anyone can view winners of completed programs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view winners of completed programs" ON public.award_winners FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.awards_programs
  WHERE ((awards_programs.id = award_winners.program_id) AND (awards_programs.status = 'completed'::public.award_program_status)))));


--
-- Name: award_votes Anyone can vote; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can vote" ON public.award_votes FOR INSERT WITH CHECK (true);


--
-- Name: award_votes Anyone can vote in open programs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can vote in open programs" ON public.award_votes FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.awards_programs
  WHERE ((awards_programs.id = award_votes.program_id) AND (awards_programs.status = 'voting_open'::public.award_program_status)))));


--
-- Name: poll_votes Anyone can vote on published polls; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can vote on published polls" ON public.poll_votes FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.polls
  WHERE ((polls.id = poll_votes.poll_id) AND (polls.is_published = true)))));


--
-- Name: team_messages Authenticated users can insert their own messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can insert their own messages" ON public.team_messages FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_presence Authenticated users can view all presence; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view all presence" ON public.user_presence FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: team_messages Authenticated users can view all team messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view all team messages" ON public.team_messages FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: ad_creatives Campaign owners can view their creatives; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Campaign owners can view their creatives" ON public.ad_creatives FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.ad_campaigns
  WHERE ((ad_campaigns.id = ad_creatives.campaign_id) AND (ad_campaigns.advertiser_id = auth.uid())))));


--
-- Name: ad_slots Creators can manage their episode ad slots; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Creators can manage their episode ad slots" ON public.ad_slots USING ((EXISTS ( SELECT 1
   FROM (public.episodes e
     JOIN public.podcasts p ON ((e.podcast_id = p.id)))
  WHERE ((e.id = ad_slots.episode_id) AND (p.user_id = auth.uid())))));


--
-- Name: podcast_ad_settings Creators can manage their podcast ad settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Creators can manage their podcast ad settings" ON public.podcast_ad_settings USING ((user_id = auth.uid()));


--
-- Name: social_media_properties Creators can manage their social media properties; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Creators can manage their social media properties" ON public.social_media_properties USING ((auth.uid() = creator_id));


--
-- Name: campaign_properties Creators can update their assigned properties; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Creators can update their assigned properties" ON public.campaign_properties FOR UPDATE USING ((auth.uid() = creator_id)) WITH CHECK ((auth.uid() = creator_id));


--
-- Name: creator_campaign_alerts Creators can view and respond to their alerts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Creators can view and respond to their alerts" ON public.creator_campaign_alerts USING ((auth.uid() = creator_id));


--
-- Name: campaign_properties Creators can view campaigns assigned to them; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Creators can view campaigns assigned to them" ON public.campaign_properties FOR SELECT USING (((auth.uid() = creator_id) OR public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'sales'::public.app_role)));


--
-- Name: audio_ads Creators can view completed ad videos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Creators can view completed ad videos" ON public.audio_ads FOR SELECT USING ((status = ANY (ARRAY['ready'::text, 'completed'::text])));


--
-- Name: stream_impressions Creators can view own stream impressions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Creators can view own stream impressions" ON public.stream_impressions FOR SELECT USING ((auth.uid() = creator_id));


--
-- Name: ad_cta_clicks Creators can view their CTA clicks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Creators can view their CTA clicks" ON public.ad_cta_clicks FOR SELECT USING ((creator_id = auth.uid()));


--
-- Name: creator_earnings Creators can view their own earnings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Creators can view their own earnings" ON public.creator_earnings FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: ad_impressions Creators can view their own impressions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Creators can view their own impressions" ON public.ad_impressions FOR SELECT USING ((creator_id = auth.uid()));


--
-- Name: award_payouts Creators can view their own payouts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Creators can view their own payouts" ON public.award_payouts FOR SELECT USING ((creator_user_id = auth.uid()));


--
-- Name: creator_tips Creators can view their own tips; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Creators can view their own tips" ON public.creator_tips FOR SELECT USING ((auth.uid() = creator_id));


--
-- Name: event_sponsorship_packages Event owners can create sponsorship packages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Event owners can create sponsorship packages" ON public.event_sponsorship_packages FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.events
  WHERE ((events.id = event_sponsorship_packages.event_id) AND (events.user_id = auth.uid())))));


--
-- Name: event_sponsorship_packages Event owners can delete their sponsorship packages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Event owners can delete their sponsorship packages" ON public.event_sponsorship_packages FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.events
  WHERE ((events.id = event_sponsorship_packages.event_id) AND (events.user_id = auth.uid())))));


--
-- Name: event_registrations Event owners can update registrations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Event owners can update registrations" ON public.event_registrations FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.events
  WHERE ((events.id = event_registrations.event_id) AND (events.user_id = auth.uid())))));


--
-- Name: event_sponsorship_packages Event owners can update their sponsorship packages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Event owners can update their sponsorship packages" ON public.event_sponsorship_packages FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.events
  WHERE ((events.id = event_sponsorship_packages.event_id) AND (events.user_id = auth.uid())))));


--
-- Name: event_sponsorships Event owners can view all sponsorships for their events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Event owners can view all sponsorships for their events" ON public.event_sponsorships FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.events
  WHERE ((events.id = event_sponsorships.event_id) AND (events.user_id = auth.uid())))));


--
-- Name: event_registrations Event owners can view registrations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Event owners can view registrations" ON public.event_registrations FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.events
  WHERE ((events.id = event_registrations.event_id) AND (events.user_id = auth.uid())))));


--
-- Name: ad_videos Everyone can view active ad videos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Everyone can view active ad videos" ON public.ad_videos FOR SELECT USING ((is_active = true));


--
-- Name: modules Modules are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Modules are viewable by everyone" ON public.modules FOR SELECT USING ((is_active = true));


--
-- Name: poll_options Poll owners can create options; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Poll owners can create options" ON public.poll_options FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.polls
  WHERE ((polls.id = poll_options.poll_id) AND (polls.user_id = auth.uid())))));


--
-- Name: poll_options Poll owners can delete options; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Poll owners can delete options" ON public.poll_options FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.polls
  WHERE ((polls.id = poll_options.poll_id) AND (polls.user_id = auth.uid())))));


--
-- Name: poll_options Poll owners can update options; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Poll owners can update options" ON public.poll_options FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.polls
  WHERE ((polls.id = poll_options.poll_id) AND (polls.user_id = auth.uid())))));


--
-- Name: advertiser_pricing_tiers Pricing tiers viewable by all authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Pricing tiers viewable by all authenticated users" ON public.advertiser_pricing_tiers FOR SELECT USING ((is_active = true));


--
-- Name: my_page_video_impressions Profile owners can view their impressions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Profile owners can view their impressions" ON public.my_page_video_impressions FOR SELECT USING ((profile_id IN ( SELECT profiles.id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: profiles Profiles are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);


--
-- Name: award_nominees Program owners can manage all nominees; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Program owners can manage all nominees" ON public.award_nominees USING ((EXISTS ( SELECT 1
   FROM public.awards_programs
  WHERE ((awards_programs.id = award_nominees.program_id) AND (awards_programs.user_id = auth.uid())))));


--
-- Name: award_categories Program owners can manage categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Program owners can manage categories" ON public.award_categories USING ((EXISTS ( SELECT 1
   FROM public.awards_programs
  WHERE ((awards_programs.id = award_categories.program_id) AND (awards_programs.user_id = auth.uid())))));


--
-- Name: award_sponsorship_packages Program owners can manage packages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Program owners can manage packages" ON public.award_sponsorship_packages USING ((EXISTS ( SELECT 1
   FROM public.awards_programs
  WHERE ((awards_programs.id = award_sponsorship_packages.program_id) AND (awards_programs.user_id = auth.uid())))));


--
-- Name: award_winners Program owners can manage winners; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Program owners can manage winners" ON public.award_winners USING ((EXISTS ( SELECT 1
   FROM public.awards_programs
  WHERE ((awards_programs.id = award_winners.program_id) AND (awards_programs.user_id = auth.uid())))));


--
-- Name: award_self_nominations Program owners can view all nominations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Program owners can view all nominations" ON public.award_self_nominations FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.awards_programs
  WHERE ((awards_programs.id = award_self_nominations.program_id) AND (awards_programs.user_id = auth.uid())))));


--
-- Name: award_sponsorships Program owners can view all sponsorships; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Program owners can view all sponsorships" ON public.award_sponsorships FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.awards_programs
  WHERE ((awards_programs.id = award_sponsorships.program_id) AND (awards_programs.user_id = auth.uid())))));


--
-- Name: award_votes Program owners can view all votes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Program owners can view all votes" ON public.award_votes FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.awards_programs
  WHERE ((awards_programs.id = award_votes.program_id) AND (awards_programs.user_id = auth.uid())))));


--
-- Name: award_registrations Program owners can view registrations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Program owners can view registrations" ON public.award_registrations FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.awards_programs
  WHERE ((awards_programs.id = award_registrations.program_id) AND (awards_programs.user_id = auth.uid())))));


--
-- Name: social_media_accounts Public can view all social media accounts for search; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view all social media accounts for search" ON public.social_media_accounts FOR SELECT USING (true);


--
-- Name: availability_schedules Public can view availability for booking; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view availability for booking" ON public.availability_schedules FOR SELECT USING (true);


--
-- Name: blocked_times Public can view blocked times; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view blocked times" ON public.blocked_times FOR SELECT USING (true);


--
-- Name: civic_compliance_records Public can view compliance records for public events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view compliance records for public events" ON public.civic_compliance_records FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.civic_events
  WHERE ((civic_events.id = civic_compliance_records.event_id) AND (civic_events.visibility = 'public'::text)))));


--
-- Name: civic_live_sessions Public can view live sessions for public events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view live sessions for public events" ON public.civic_live_sessions FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.civic_events
  WHERE ((civic_events.id = civic_live_sessions.event_id) AND (civic_events.visibility = 'public'::text)))));


--
-- Name: civic_articles Public can view published civic articles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view published civic articles" ON public.civic_articles FOR SELECT USING ((status = 'published'::text));


--
-- Name: civic_events Public can view published civic events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view published civic events" ON public.civic_events FOR SELECT USING (((visibility = 'public'::text) AND (status <> 'cancelled'::text)));


--
-- Name: user_settings Public can view user timezone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view user timezone" ON public.user_settings FOR SELECT USING (true);


--
-- Name: episodes Published episodes are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Published episodes are viewable by everyone" ON public.episodes FOR SELECT USING (((is_published = true) AND (EXISTS ( SELECT 1
   FROM public.podcasts
  WHERE ((podcasts.id = episodes.podcast_id) AND (podcasts.is_published = true))))));


--
-- Name: events Published events are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Published events are viewable by everyone" ON public.events FOR SELECT USING (((is_published = true) OR (auth.uid() = user_id)));


--
-- Name: podcasts Published podcasts are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Published podcasts are viewable by everyone" ON public.podcasts FOR SELECT USING ((is_published = true));


--
-- Name: signup_sheets Published sheets are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Published sheets are viewable by everyone" ON public.signup_sheets FOR SELECT USING (((is_published = true) OR (auth.uid() = user_id)));


--
-- Name: campaign_property_impressions Sales and admins can view impressions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Sales and admins can view impressions" ON public.campaign_property_impressions FOR SELECT USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'sales'::public.app_role)));


--
-- Name: multi_channel_campaigns Sales team can create campaigns; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Sales team can create campaigns" ON public.multi_channel_campaigns FOR INSERT WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) OR (auth.uid() IN ( SELECT sales_team_members.user_id
   FROM public.sales_team_members
  WHERE (sales_team_members.id = multi_channel_campaigns.sales_team_member_id)))));


--
-- Name: ad_videos Sales team can manage ad videos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Sales team can manage ad videos" ON public.ad_videos USING ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['sales'::public.app_role, 'super_admin'::public.app_role]))))));


--
-- Name: campaign_properties Sales team can manage campaign properties; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Sales team can manage campaign properties" ON public.campaign_properties USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'sales'::public.app_role)));


--
-- Name: contacts Sales team can update their assigned leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Sales team can update their assigned leads" ON public.contacts FOR UPDATE TO authenticated USING (((sales_rep_id IN ( SELECT sales_team_members.id
   FROM public.sales_team_members
  WHERE (sales_team_members.user_id = auth.uid()))) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: multi_channel_campaigns Sales team can update their campaigns; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Sales team can update their campaigns" ON public.multi_channel_campaigns FOR UPDATE USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR (auth.uid() IN ( SELECT sales_team_members.user_id
   FROM public.sales_team_members
  WHERE (sales_team_members.id = multi_channel_campaigns.sales_team_member_id)))));


--
-- Name: my_page_video_impressions Sales team can view all impressions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Sales team can view all impressions" ON public.my_page_video_impressions FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['sales'::public.app_role, 'super_admin'::public.app_role]))))));


--
-- Name: social_media_properties Sales team can view social media properties; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Sales team can view social media properties" ON public.social_media_properties FOR SELECT USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'sales'::public.app_role)));


--
-- Name: contacts Sales team can view their assigned leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Sales team can view their assigned leads" ON public.contacts FOR SELECT TO authenticated USING (((sales_rep_id IN ( SELECT sales_team_members.id
   FROM public.sales_team_members
  WHERE (sales_team_members.user_id = auth.uid()))) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: multi_channel_campaigns Sales team can view their campaigns; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Sales team can view their campaigns" ON public.multi_channel_campaigns FOR SELECT USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR (auth.uid() IN ( SELECT sales_team_members.user_id
   FROM public.sales_team_members
  WHERE (sales_team_members.id = multi_channel_campaigns.sales_team_member_id)))));


--
-- Name: sales_commissions Sales team can view their commissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Sales team can view their commissions" ON public.sales_commissions FOR SELECT USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR (auth.uid() IN ( SELECT sales_team_members.user_id
   FROM public.sales_team_members
  WHERE (sales_team_members.id = sales_commissions.sales_team_member_id)))));


--
-- Name: sales_team_members Sales team members can view their own data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Sales team members can view their own data" ON public.sales_team_members FOR SELECT USING (((auth.uid() = user_id) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: signup_slots Sheet owners can create slots; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Sheet owners can create slots" ON public.signup_slots FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.signup_sheets
  WHERE ((signup_sheets.id = signup_slots.sheet_id) AND (signup_sheets.user_id = auth.uid())))));


--
-- Name: signup_slots Sheet owners can delete slots; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Sheet owners can delete slots" ON public.signup_slots FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.signup_sheets
  WHERE ((signup_sheets.id = signup_slots.sheet_id) AND (signup_sheets.user_id = auth.uid())))));


--
-- Name: signup_slots Slots are viewable if sheet is published or user owns it; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Slots are viewable if sheet is published or user owns it" ON public.signup_slots FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.signup_sheets
  WHERE ((signup_sheets.id = signup_slots.sheet_id) AND ((signup_sheets.is_published = true) OR (signup_sheets.user_id = auth.uid()))))));


--
-- Name: social_links Social links are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Social links are viewable by everyone" ON public.social_links FOR SELECT USING (true);


--
-- Name: civic_articles Staff can manage civic articles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can manage civic articles" ON public.civic_articles USING ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::public.app_role, 'staff'::public.app_role]))))));


--
-- Name: constituent_requests Staff can update constituent requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can update constituent requests" ON public.constituent_requests FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::public.app_role, 'staff'::public.app_role]))))));


--
-- Name: constituent_requests Staff can view all constituent requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can view all constituent requests" ON public.constituent_requests FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::public.app_role, 'staff'::public.app_role]))))));


--
-- Name: teams Super admin and admin can manage teams; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Super admin and admin can manage teams" ON public.teams TO authenticated USING ((public.has_role(auth.uid(), 'super_admin'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: user_roles Super admins can manage all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Super admins can manage all roles" ON public.user_roles TO authenticated USING (public.has_role(auth.uid(), 'super_admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'super_admin'::public.app_role));


--
-- Name: financial_assumptions Super admins can manage assumptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Super admins can manage assumptions" ON public.financial_assumptions USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));


--
-- Name: role_permissions Super admins can manage role permissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Super admins can manage role permissions" ON public.role_permissions USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));


--
-- Name: contact_list_members System can add to system lists; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can add to system lists" ON public.contact_list_members FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.contact_lists
  WHERE ((contact_lists.id = contact_list_members.list_id) AND (contact_lists.is_system = true)))));


--
-- Name: contacts System can create contacts for any user; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can create contacts for any user" ON public.contacts FOR INSERT WITH CHECK (true);


--
-- Name: studio_recording_ads System can insert ad tracking; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can insert ad tracking" ON public.studio_recording_ads FOR INSERT WITH CHECK (true);


--
-- Name: ad_call_inquiries System can insert call inquiries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can insert call inquiries" ON public.ad_call_inquiries FOR INSERT WITH CHECK (true);


--
-- Name: conversational_ad_charges System can insert conversational ad charges; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can insert conversational ad charges" ON public.conversational_ad_charges FOR INSERT WITH CHECK (true);


--
-- Name: conversational_ad_usage System can insert conversational ad usage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can insert conversational ad usage" ON public.conversational_ad_usage FOR INSERT WITH CHECK (true);


--
-- Name: email_logs System can insert email logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can insert email logs" ON public.email_logs FOR INSERT WITH CHECK (true);


--
-- Name: ad_impressions System can insert impressions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can insert impressions" ON public.ad_impressions FOR INSERT WITH CHECK (true);


--
-- Name: award_payouts System can insert payouts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can insert payouts" ON public.award_payouts FOR INSERT WITH CHECK (true);


--
-- Name: rate_limit_logs System can insert rate limit logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can insert rate limit logs" ON public.rate_limit_logs FOR INSERT WITH CHECK (true);


--
-- Name: email_reminders_sent System can insert reminder records; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can insert reminder records" ON public.email_reminders_sent FOR INSERT WITH CHECK (true);


--
-- Name: financial_snapshots System can insert snapshots; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can insert snapshots" ON public.financial_snapshots FOR INSERT WITH CHECK (true);


--
-- Name: subscriptions System can insert subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can insert subscriptions" ON public.subscriptions FOR INSERT WITH CHECK (true);


--
-- Name: usage_tracking System can insert usage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can insert usage" ON public.usage_tracking FOR INSERT WITH CHECK (true);


--
-- Name: subscriptions System can update subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can update subscriptions" ON public.subscriptions FOR UPDATE USING (true);


--
-- Name: usage_tracking System can update usage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can update usage" ON public.usage_tracking FOR UPDATE USING (true);


--
-- Name: team_messages Team members can send messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Team members can send messages" ON public.team_messages FOR INSERT WITH CHECK (((team_id IN ( SELECT team_members.team_id
   FROM public.team_members
  WHERE (team_members.user_id = auth.uid()))) AND (user_id = auth.uid())));


--
-- Name: team_messages Team members can view messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Team members can view messages" ON public.team_messages FOR SELECT USING ((team_id IN ( SELECT team_members.team_id
   FROM public.team_members
  WHERE (team_members.user_id = auth.uid()))));


--
-- Name: user_presence Team members can view presence; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Team members can view presence" ON public.user_presence FOR SELECT USING (((team_id IN ( SELECT team_members.team_id
   FROM public.team_members
  WHERE (team_members.user_id = auth.uid()))) OR (team_id IS NULL)));


--
-- Name: team_members Team members can view themselves; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Team members can view themselves" ON public.team_members FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: team_members Team owner can remove members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Team owner can remove members" ON public.team_members FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.teams
  WHERE ((teams.id = team_members.team_id) AND (teams.owner_id = auth.uid())))));


--
-- Name: team_members Team owners can add members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Team owners can add members" ON public.team_members FOR INSERT WITH CHECK ((team_id IN ( SELECT teams.id
   FROM public.teams
  WHERE (teams.owner_id = auth.uid()))));


--
-- Name: team_members Team owners can manage their team members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Team owners can manage their team members" ON public.team_members USING ((team_id IN ( SELECT teams.id
   FROM public.teams
  WHERE (teams.owner_id = auth.uid()))));


--
-- Name: team_members Team owners can remove members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Team owners can remove members" ON public.team_members FOR DELETE USING ((team_id IN ( SELECT teams.id
   FROM public.teams
  WHERE (teams.owner_id = auth.uid()))));


--
-- Name: teams Team owners can update their teams; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Team owners can update their teams" ON public.teams FOR UPDATE USING ((owner_id = auth.uid()));


--
-- Name: team_members Team owners can view members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Team owners can view members" ON public.team_members FOR SELECT USING ((team_id IN ( SELECT teams.id
   FROM public.teams
  WHERE (teams.owner_id = auth.uid()))));


--
-- Name: contact_list_members Users can add contacts to their lists; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can add contacts to their lists" ON public.contact_list_members FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.contact_lists
  WHERE ((contact_lists.id = contact_list_members.list_id) AND (contact_lists.user_id = auth.uid()) AND (contact_lists.is_system = false)))));


--
-- Name: contact_tag_assignments Users can assign tags to their contacts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can assign tags to their contacts" ON public.contact_tag_assignments FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.contacts
  WHERE ((contacts.id = contact_tag_assignments.contact_id) AND (contacts.user_id = auth.uid())))));


--
-- Name: email_events Users can create email events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create email events" ON public.email_events FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: episodes Users can create episodes for their podcasts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create episodes for their podcasts" ON public.episodes FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.podcasts
  WHERE ((podcasts.id = episodes.podcast_id) AND (podcasts.user_id = auth.uid())))));


--
-- Name: meeting_invitations Users can create invitations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create invitations" ON public.meeting_invitations FOR INSERT WITH CHECK ((auth.uid() = inviter_id));


--
-- Name: video_markers Users can create markers on their videos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create markers on their videos" ON public.video_markers FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.media_files
  WHERE ((media_files.id = video_markers.media_file_id) AND (media_files.user_id = auth.uid())))));


--
-- Name: ai_messages Users can create messages in their conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create messages in their conversations" ON public.ai_messages FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.ai_conversations
  WHERE ((ai_conversations.id = ai_messages.conversation_id) AND (ai_conversations.user_id = auth.uid())))));


--
-- Name: media_processing_jobs Users can create processing jobs for their media; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create processing jobs for their media" ON public.media_processing_jobs FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.media_files mf
  WHERE ((mf.id = media_processing_jobs.media_file_id) AND (mf.user_id = auth.uid())))));


--
-- Name: qr_codes Users can create their own QR codes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own QR codes" ON public.qr_codes FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: advertisers Users can create their own advertiser application; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own advertiser application" ON public.advertisers FOR INSERT WITH CHECK ((user_id = auth.uid()));


--
-- Name: availability_schedules Users can create their own availability; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own availability" ON public.availability_schedules FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: blocked_times Users can create their own blocked times; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own blocked times" ON public.blocked_times FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: blog_posts Users can create their own blog posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own blog posts" ON public.blog_posts FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: calendar_connections Users can create their own calendar connections; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own calendar connections" ON public.calendar_connections FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: email_campaigns Users can create their own campaigns; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own campaigns" ON public.email_campaigns FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: contacts Users can create their own contacts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own contacts" ON public.contacts FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: ai_conversations Users can create their own conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own conversations" ON public.ai_conversations FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: events Users can create their own events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own events" ON public.events FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: invoices Users can create their own invoices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own invoices" ON public.invoices FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: contact_lists Users can create their own lists; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own lists" ON public.contact_lists FOR INSERT WITH CHECK (((auth.uid() = user_id) AND (is_system = false)));


--
-- Name: meeting_types Users can create their own meeting types; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own meeting types" ON public.meeting_types FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: module_purchases Users can create their own module purchases; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own module purchases" ON public.module_purchases FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: podcasts Users can create their own podcasts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own podcasts" ON public.podcasts FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: polls Users can create their own polls; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own polls" ON public.polls FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: awards_programs Users can create their own programs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own programs" ON public.awards_programs FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: proposals Users can create their own proposals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own proposals" ON public.proposals FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_settings Users can create their own settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own settings" ON public.user_settings FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: signup_sheets Users can create their own sheets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own sheets" ON public.signup_sheets FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: studio_recordings Users can create their own studio recordings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own studio recordings" ON public.studio_recordings FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: studio_sessions Users can create their own studio sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own studio sessions" ON public.studio_sessions FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: studio_templates Users can create their own studio templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own studio templates" ON public.studio_templates FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: contact_tags Users can create their own tags; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own tags" ON public.contact_tags FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: tasks Users can create their own tasks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own tasks" ON public.tasks FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: teams Users can create their own teams; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own teams" ON public.teams FOR INSERT WITH CHECK ((owner_id = auth.uid()));


--
-- Name: client_tickets Users can create their own tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own tickets" ON public.client_tickets FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: zoom_connections Users can create their own zoom connections; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own zoom connections" ON public.zoom_connections FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: media_versions Users can create versions for their media; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create versions for their media" ON public.media_versions FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.media_files mf
  WHERE ((mf.id = media_versions.original_media_id) AND (mf.user_id = auth.uid())))));


--
-- Name: studio_guests Users can delete guests for their templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete guests for their templates" ON public.studio_guests FOR DELETE USING ((studio_session_id IN ( SELECT studio_templates.id
   FROM public.studio_templates
  WHERE (studio_templates.user_id = auth.uid()))));


--
-- Name: qr_codes Users can delete their own QR codes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own QR codes" ON public.qr_codes FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: availability_schedules Users can delete their own availability; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own availability" ON public.availability_schedules FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: blocked_times Users can delete their own blocked times; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own blocked times" ON public.blocked_times FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: blog_posts Users can delete their own blog posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own blog posts" ON public.blog_posts FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: calendar_connections Users can delete their own calendar connections; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own calendar connections" ON public.calendar_connections FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: email_campaigns Users can delete their own campaigns; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own campaigns" ON public.email_campaigns FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: contacts Users can delete their own contacts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own contacts" ON public.contacts FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: ai_conversations Users can delete their own conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own conversations" ON public.ai_conversations FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: influencehub_creators Users can delete their own creators; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own creators" ON public.influencehub_creators FOR DELETE USING ((auth.uid() = agency_user_id));


--
-- Name: contact_lists Users can delete their own custom lists; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own custom lists" ON public.contact_lists FOR DELETE USING (((auth.uid() = user_id) AND (is_system = false)));


--
-- Name: episodes Users can delete their own episodes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own episodes" ON public.episodes FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.podcasts
  WHERE ((podcasts.id = episodes.podcast_id) AND (podcasts.user_id = auth.uid())))));


--
-- Name: events Users can delete their own events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own events" ON public.events FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: invoices Users can delete their own invoices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own invoices" ON public.invoices FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: video_markers Users can delete their own markers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own markers" ON public.video_markers FOR DELETE USING (((created_by = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.media_files
  WHERE ((media_files.id = video_markers.media_file_id) AND (media_files.user_id = auth.uid()))))));


--
-- Name: media_files Users can delete their own media files; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own media files" ON public.media_files FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: meeting_types Users can delete their own meeting types; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own meeting types" ON public.meeting_types FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: meetings Users can delete their own meetings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own meetings" ON public.meetings FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: team_messages Users can delete their own messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own messages" ON public.team_messages FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: microsoft_connections Users can delete their own microsoft connections; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own microsoft connections" ON public.microsoft_connections FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: podcasts Users can delete their own podcasts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own podcasts" ON public.podcasts FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: polls Users can delete their own polls; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own polls" ON public.polls FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: influencehub_posts Users can delete their own posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own posts" ON public.influencehub_posts FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: saved_proformas Users can delete their own proformas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own proformas" ON public.saved_proformas FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: awards_programs Users can delete their own programs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own programs" ON public.awards_programs FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: proposals Users can delete their own proposals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own proposals" ON public.proposals FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: saved_proformas Users can delete their own saved proformas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own saved proformas" ON public.saved_proformas FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: signup_sheets Users can delete their own sheets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own sheets" ON public.signup_sheets FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: social_accounts Users can delete their own social accounts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own social accounts" ON public.social_accounts FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: social_media_accounts Users can delete their own social accounts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own social accounts" ON public.social_media_accounts FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: studio_recordings Users can delete their own studio recordings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own studio recordings" ON public.studio_recordings FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: studio_sessions Users can delete their own studio sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own studio sessions" ON public.studio_sessions FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: studio_templates Users can delete their own studio templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own studio templates" ON public.studio_templates FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: contact_tags Users can delete their own tags; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own tags" ON public.contact_tags FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: tasks Users can delete their own tasks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own tasks" ON public.tasks FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: client_tickets Users can delete their own tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own tickets" ON public.client_tickets FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: zoom_connections Users can delete their own zoom connections; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own zoom connections" ON public.zoom_connections FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: studio_guests Users can insert guests for their templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert guests for their templates" ON public.studio_guests FOR INSERT WITH CHECK ((studio_session_id IN ( SELECT studio_templates.id
   FROM public.studio_templates
  WHERE (studio_templates.user_id = auth.uid()))));


--
-- Name: team_messages Users can insert team chat messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert team chat messages" ON public.team_messages FOR INSERT TO authenticated WITH CHECK ((((chat_type = 'team_chat'::public.chat_type) AND (EXISTS ( SELECT 1
   FROM public.team_members
  WHERE ((team_members.team_id = team_messages.team_id) AND (team_members.user_id = auth.uid()))))) OR ((chat_type = 'admin_internal'::public.chat_type) AND (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.account_type = 'seeksy_admin'::public.account_type))))) OR ((chat_type = 'support_chat'::public.chat_type) AND ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.account_type = 'seeksy_admin'::public.account_type)))) OR (EXISTS ( SELECT 1
   FROM public.teams
  WHERE ((teams.id = team_messages.team_id) AND (teams.owner_id = auth.uid()))))))));


--
-- Name: activity_logs Users can insert their own activity logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own activity logs" ON public.activity_logs FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: influencehub_creators Users can insert their own creators; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own creators" ON public.influencehub_creators FOR INSERT WITH CHECK ((auth.uid() = agency_user_id));


--
-- Name: media_files Users can insert their own media files; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own media files" ON public.media_files FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: microsoft_connections Users can insert their own microsoft connections; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own microsoft connections" ON public.microsoft_connections FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: influencehub_posts Users can insert their own posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own posts" ON public.influencehub_posts FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_preferences Users can insert their own preferences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own preferences" ON public.user_preferences FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Users can insert their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = id));


--
-- Name: saved_proformas Users can insert their own proformas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own proformas" ON public.saved_proformas FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: saved_proformas Users can insert their own saved proformas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own saved proformas" ON public.saved_proformas FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: social_accounts Users can insert their own social accounts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own social accounts" ON public.social_accounts FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: social_media_accounts Users can insert their own social accounts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own social accounts" ON public.social_media_accounts FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: team_members Users can leave teams; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can leave teams" ON public.team_members FOR DELETE USING ((user_id = auth.uid()));


--
-- Name: media_ad_slots Users can manage ad slots for their media; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage ad slots for their media" ON public.media_ad_slots USING ((EXISTS ( SELECT 1
   FROM public.media_files mf
  WHERE ((mf.id = media_ad_slots.media_file_id) AND (mf.user_id = auth.uid())))));


--
-- Name: blog_post_categories Users can manage categories for their own posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage categories for their own posts" ON public.blog_post_categories USING ((EXISTS ( SELECT 1
   FROM public.blog_posts
  WHERE ((blog_posts.id = blog_post_categories.post_id) AND (blog_posts.user_id = auth.uid())))));


--
-- Name: civic_compliance_records Users can manage compliance for their events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage compliance for their events" ON public.civic_compliance_records USING ((EXISTS ( SELECT 1
   FROM public.civic_events
  WHERE ((civic_events.id = civic_compliance_records.event_id) AND (civic_events.user_id = auth.uid())))));


--
-- Name: podcast_campaign_selections Users can manage their own campaign selections; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage their own campaign selections" ON public.podcast_campaign_selections USING ((podcast_id IN ( SELECT podcasts.id
   FROM public.podcasts
  WHERE (podcasts.user_id = auth.uid()))));


--
-- Name: civic_events Users can manage their own civic events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage their own civic events" ON public.civic_events USING ((auth.uid() = user_id));


--
-- Name: custom_links Users can manage their own custom links; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage their own custom links" ON public.custom_links USING ((profile_id IN ( SELECT profiles.id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: civic_live_sessions Users can manage their own live sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage their own live sessions" ON public.civic_live_sessions USING ((EXISTS ( SELECT 1
   FROM public.civic_events
  WHERE ((civic_events.id = civic_live_sessions.event_id) AND (civic_events.user_id = auth.uid())))));


--
-- Name: profile_section_order Users can manage their own section order; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage their own section order" ON public.profile_section_order USING ((profile_id IN ( SELECT profiles.id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: custom_link_sections Users can manage their own sections; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage their own sections" ON public.custom_link_sections USING ((profile_id IN ( SELECT profiles.id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: social_links Users can manage their own social links; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage their own social links" ON public.social_links USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = social_links.profile_id) AND (profiles.id = auth.uid())))));


--
-- Name: contact_list_members Users can remove contacts from their lists; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can remove contacts from their lists" ON public.contact_list_members FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.contact_lists
  WHERE ((contact_lists.id = contact_list_members.list_id) AND (contact_lists.user_id = auth.uid()) AND (contact_lists.is_system = false)))));


--
-- Name: contact_tag_assignments Users can remove tags from their contacts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can remove tags from their contacts" ON public.contact_tag_assignments FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.contacts
  WHERE ((contacts.id = contact_tag_assignments.contact_id) AND (contacts.user_id = auth.uid())))));


--
-- Name: award_nominees Users can submit nominees to open programs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can submit nominees to open programs" ON public.award_nominees FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.awards_programs
  WHERE ((awards_programs.id = award_nominees.program_id) AND (awards_programs.allow_public_nominations = true) AND (awards_programs.status = 'nominations_open'::public.award_program_status)))));


--
-- Name: studio_guests Users can update guests for their templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update guests for their templates" ON public.studio_guests FOR UPDATE USING ((studio_session_id IN ( SELECT studio_templates.id
   FROM public.studio_templates
  WHERE (studio_templates.user_id = auth.uid()))));


--
-- Name: contact_lists Users can update their lists and admins can update system; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their lists and admins can update system" ON public.contact_lists FOR UPDATE USING ((((auth.uid() = user_id) AND (is_system = false)) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: media_versions Users can update their media versions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their media versions" ON public.media_versions FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.media_files mf
  WHERE ((mf.id = media_versions.original_media_id) AND (mf.user_id = auth.uid())))));


--
-- Name: qr_codes Users can update their own QR codes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own QR codes" ON public.qr_codes FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: availability_schedules Users can update their own availability; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own availability" ON public.availability_schedules FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: blocked_times Users can update their own blocked times; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own blocked times" ON public.blocked_times FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: blog_posts Users can update their own blog posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own blog posts" ON public.blog_posts FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: calendar_connections Users can update their own calendar connections; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own calendar connections" ON public.calendar_connections FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: email_campaigns Users can update their own campaigns; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own campaigns" ON public.email_campaigns FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: contacts Users can update their own contacts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own contacts" ON public.contacts FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: ai_conversations Users can update their own conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own conversations" ON public.ai_conversations FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: influencehub_creators Users can update their own creators; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own creators" ON public.influencehub_creators FOR UPDATE USING ((auth.uid() = agency_user_id));


--
-- Name: episodes Users can update their own episodes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own episodes" ON public.episodes FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.podcasts
  WHERE ((podcasts.id = episodes.podcast_id) AND (podcasts.user_id = auth.uid())))));


--
-- Name: events Users can update their own events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own events" ON public.events FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: meeting_invitations Users can update their own invitations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own invitations" ON public.meeting_invitations FOR UPDATE USING ((auth.uid() = inviter_id));


--
-- Name: invoices Users can update their own invoices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own invoices" ON public.invoices FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: video_markers Users can update their own markers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own markers" ON public.video_markers FOR UPDATE USING (((created_by = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.media_files
  WHERE ((media_files.id = video_markers.media_file_id) AND (media_files.user_id = auth.uid()))))));


--
-- Name: media_files Users can update their own media files; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own media files" ON public.media_files FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: meeting_types Users can update their own meeting types; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own meeting types" ON public.meeting_types FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: meetings Users can update their own meetings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own meetings" ON public.meetings FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: team_messages Users can update their own messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own messages" ON public.team_messages FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: microsoft_connections Users can update their own microsoft connections; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own microsoft connections" ON public.microsoft_connections FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: podcasts Users can update their own podcasts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own podcasts" ON public.podcasts FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: polls Users can update their own polls; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own polls" ON public.polls FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: influencehub_posts Users can update their own posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own posts" ON public.influencehub_posts FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: user_preferences Users can update their own preferences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own preferences" ON public.user_preferences FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: user_presence Users can update their own presence; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own presence" ON public.user_presence FOR INSERT WITH CHECK ((user_id = auth.uid()));


--
-- Name: user_presence Users can update their own presence status; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own presence status" ON public.user_presence FOR UPDATE USING ((user_id = auth.uid()));


--
-- Name: media_processing_jobs Users can update their own processing jobs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own processing jobs" ON public.media_processing_jobs FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.media_files mf
  WHERE ((mf.id = media_processing_jobs.media_file_id) AND (mf.user_id = auth.uid())))));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: saved_proformas Users can update their own proformas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own proformas" ON public.saved_proformas FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: awards_programs Users can update their own programs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own programs" ON public.awards_programs FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: proposals Users can update their own proposals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own proposals" ON public.proposals FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: saved_proformas Users can update their own saved proformas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own saved proformas" ON public.saved_proformas FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: user_settings Users can update their own settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own settings" ON public.user_settings FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: signup_sheets Users can update their own sheets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own sheets" ON public.signup_sheets FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: social_accounts Users can update their own social accounts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own social accounts" ON public.social_accounts FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: social_media_accounts Users can update their own social accounts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own social accounts" ON public.social_media_accounts FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: studio_recordings Users can update their own studio recordings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own studio recordings" ON public.studio_recordings FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: studio_sessions Users can update their own studio sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own studio sessions" ON public.studio_sessions FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: studio_templates Users can update their own studio templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own studio templates" ON public.studio_templates FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: contact_tags Users can update their own tags; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own tags" ON public.contact_tags FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: tasks Users can update their own tasks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own tasks" ON public.tasks FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: teams Users can update their own teams; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own teams" ON public.teams FOR UPDATE USING ((owner_id = auth.uid()));


--
-- Name: client_tickets Users can update their own tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own tickets" ON public.client_tickets FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: zoom_connections Users can update their own zoom connections; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own zoom connections" ON public.zoom_connections FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: studio_recording_ads Users can view ads in their recordings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view ads in their recordings" ON public.studio_recording_ads FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.studio_recordings
  WHERE ((studio_recordings.id = studio_recording_ads.recording_id) AND (studio_recordings.user_id = auth.uid())))));


--
-- Name: studio_guests Users can view guests for their templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view guests for their templates" ON public.studio_guests FOR SELECT USING ((studio_session_id IN ( SELECT studio_templates.id
   FROM public.studio_templates
  WHERE (studio_templates.user_id = auth.uid()))));


--
-- Name: ai_messages Users can view messages in their conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view messages in their conversations" ON public.ai_messages FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.ai_conversations
  WHERE ((ai_conversations.id = ai_messages.conversation_id) AND (ai_conversations.user_id = auth.uid())))));


--
-- Name: polls Users can view published polls or their own polls; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view published polls or their own polls" ON public.polls FOR SELECT USING (((is_published = true) OR (auth.uid() = user_id)));


--
-- Name: awards_programs Users can view published programs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view published programs" ON public.awards_programs FOR SELECT USING (((status <> 'draft'::public.award_program_status) OR (user_id = auth.uid())));


--
-- Name: contact_tag_assignments Users can view tag assignments for their contacts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view tag assignments for their contacts" ON public.contact_tag_assignments FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.contacts
  WHERE ((contacts.id = contact_tag_assignments.contact_id) AND (contacts.user_id = auth.uid())))));


--
-- Name: team_messages Users can view team chat messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view team chat messages" ON public.team_messages FOR SELECT TO authenticated USING ((((chat_type = 'team_chat'::public.chat_type) AND (EXISTS ( SELECT 1
   FROM public.team_members
  WHERE ((team_members.team_id = team_messages.team_id) AND (team_members.user_id = auth.uid()))))) OR ((chat_type = 'admin_internal'::public.chat_type) AND (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.account_type = 'seeksy_admin'::public.account_type))))) OR ((chat_type = 'support_chat'::public.chat_type) AND ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.account_type = 'seeksy_admin'::public.account_type)))) OR (EXISTS ( SELECT 1
   FROM public.teams
  WHERE ((teams.id = team_messages.team_id) AND (teams.owner_id = auth.uid()))))))));


--
-- Name: team_members Users can view team members of their teams; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view team members of their teams" ON public.team_members FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.teams
  WHERE ((teams.id = team_members.team_id) AND ((teams.owner_id = auth.uid()) OR (teams.id IN ( SELECT team_members_1.team_id
           FROM public.team_members team_members_1
          WHERE (team_members_1.user_id = auth.uid()))))))));


--
-- Name: teams Users can view teams they own or are members of; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view teams they own or are members of" ON public.teams FOR SELECT USING (((owner_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.team_members
  WHERE ((team_members.team_id = teams.id) AND (team_members.user_id = auth.uid()))))));


--
-- Name: contact_list_members Users can view their list members and admins can view all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their list members and admins can view all" ON public.contact_list_members FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.contact_lists
  WHERE ((contact_lists.id = contact_list_members.list_id) AND (((contact_lists.user_id = auth.uid()) AND (contact_lists.is_system = false)) OR public.has_role(auth.uid(), 'admin'::public.app_role))))));


--
-- Name: contact_lists Users can view their lists and admins can view all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their lists and admins can view all" ON public.contact_lists FOR SELECT USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR ((auth.uid() = user_id) AND (is_system = false)) OR ((auth.uid() = user_id) AND (is_system = true) AND (name <> 'Creators'::text))));


--
-- Name: media_versions Users can view their media versions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their media versions" ON public.media_versions FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.media_files mf
  WHERE ((mf.id = media_versions.original_media_id) AND (mf.user_id = auth.uid())))));


--
-- Name: qr_codes Users can view their own QR codes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own QR codes" ON public.qr_codes FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: activity_logs Users can view their own activity logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own activity logs" ON public.activity_logs FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: availability_schedules Users can view their own availability; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own availability" ON public.availability_schedules FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: blocked_times Users can view their own blocked times; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own blocked times" ON public.blocked_times FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: blog_posts Users can view their own blog posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own blog posts" ON public.blog_posts FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: calendar_connections Users can view their own calendar connections; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own calendar connections" ON public.calendar_connections FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: podcast_campaign_selections Users can view their own campaign selections; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own campaign selections" ON public.podcast_campaign_selections FOR SELECT USING ((podcast_id IN ( SELECT podcasts.id
   FROM public.podcasts
  WHERE (podcasts.user_id = auth.uid()))));


--
-- Name: email_campaigns Users can view their own campaigns; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own campaigns" ON public.email_campaigns FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: contacts Users can view their own contacts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own contacts" ON public.contacts FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: ai_conversations Users can view their own conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own conversations" ON public.ai_conversations FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: influencehub_creators Users can view their own creators; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own creators" ON public.influencehub_creators FOR SELECT USING (((auth.uid() = agency_user_id) OR (auth.uid() = creator_user_id)));


--
-- Name: custom_links Users can view their own custom links; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own custom links" ON public.custom_links FOR SELECT USING ((profile_id IN ( SELECT profiles.id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: email_events Users can view their own email events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own email events" ON public.email_events FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: email_logs Users can view their own email logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own email logs" ON public.email_logs FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: episodes Users can view their own episodes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own episodes" ON public.episodes FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.podcasts
  WHERE ((podcasts.id = episodes.podcast_id) AND (podcasts.user_id = auth.uid())))));


--
-- Name: meeting_invitations Users can view their own invitations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own invitations" ON public.meeting_invitations FOR SELECT USING ((auth.uid() = inviter_id));


--
-- Name: invoices Users can view their own invoices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own invoices" ON public.invoices FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: link_clicks Users can view their own link analytics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own link analytics" ON public.link_clicks FOR SELECT USING ((profile_id IN ( SELECT profiles.id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: media_files Users can view their own media files; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own media files" ON public.media_files FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: meeting_types Users can view their own meeting types; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own meeting types" ON public.meeting_types FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: meetings Users can view their own meetings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own meetings" ON public.meetings FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: microsoft_connections Users can view their own microsoft connections; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own microsoft connections" ON public.microsoft_connections FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: module_purchases Users can view their own module purchases; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own module purchases" ON public.module_purchases FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_modules Users can view their own modules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own modules" ON public.user_modules FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: award_self_nominations Users can view their own nominations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own nominations" ON public.award_self_nominations FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: podcasts Users can view their own podcasts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own podcasts" ON public.podcasts FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: influencehub_posts Users can view their own posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own posts" ON public.influencehub_posts FOR SELECT USING (((auth.uid() = user_id) OR (EXISTS ( SELECT 1
   FROM public.influencehub_creators
  WHERE ((influencehub_creators.id = influencehub_posts.creator_id) AND ((influencehub_creators.agency_user_id = auth.uid()) OR (influencehub_creators.creator_user_id = auth.uid())))))));


--
-- Name: user_preferences Users can view their own preferences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own preferences" ON public.user_preferences FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: media_processing_jobs Users can view their own processing jobs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own processing jobs" ON public.media_processing_jobs FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.media_files mf
  WHERE ((mf.id = media_processing_jobs.media_file_id) AND (mf.user_id = auth.uid())))));


--
-- Name: profile_views Users can view their own profile analytics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own profile analytics" ON public.profile_views FOR SELECT USING ((profile_id IN ( SELECT profiles.id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: saved_proformas Users can view their own proformas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own proformas" ON public.saved_proformas FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: proposals Users can view their own proposals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own proposals" ON public.proposals FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_roles Users can view their own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT TO authenticated USING ((user_id = auth.uid()));


--
-- Name: saved_proformas Users can view their own saved proformas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own saved proformas" ON public.saved_proformas FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: profile_section_order Users can view their own section order; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own section order" ON public.profile_section_order FOR SELECT USING ((profile_id IN ( SELECT profiles.id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: custom_link_sections Users can view their own sections; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own sections" ON public.custom_link_sections FOR SELECT USING ((profile_id IN ( SELECT profiles.id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: user_settings Users can view their own settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own settings" ON public.user_settings FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: social_accounts Users can view their own social accounts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own social accounts" ON public.social_accounts FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: social_media_accounts Users can view their own social accounts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own social accounts" ON public.social_media_accounts FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: studio_recordings Users can view their own studio recordings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own studio recordings" ON public.studio_recordings FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: studio_sessions Users can view their own studio sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own studio sessions" ON public.studio_sessions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: studio_templates Users can view their own studio templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own studio templates" ON public.studio_templates FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: subscriptions Users can view their own subscription; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own subscription" ON public.subscriptions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: tab_views Users can view their own tab analytics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own tab analytics" ON public.tab_views FOR SELECT USING ((profile_id IN ( SELECT profiles.id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: contact_tags Users can view their own tags; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own tags" ON public.contact_tags FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: tasks Users can view their own tasks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own tasks" ON public.tasks FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: teams Users can view their own teams; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own teams" ON public.teams FOR SELECT USING ((owner_id = auth.uid()));


--
-- Name: client_tickets Users can view their own tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own tickets" ON public.client_tickets FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: usage_tracking Users can view their own usage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own usage" ON public.usage_tracking FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: video_markers Users can view their own video markers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own video markers" ON public.video_markers FOR SELECT USING (((created_by = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.media_files
  WHERE ((media_files.id = video_markers.media_file_id) AND (media_files.user_id = auth.uid()))))));


--
-- Name: zoom_connections Users can view their own zoom connections; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own zoom connections" ON public.zoom_connections FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: email_reminders_sent Users can view their reminders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their reminders" ON public.email_reminders_sent FOR SELECT USING (((EXISTS ( SELECT 1
   FROM public.events
  WHERE ((events.id = email_reminders_sent.related_id) AND (events.user_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM public.meetings
  WHERE ((meetings.id = email_reminders_sent.related_id) AND (meetings.user_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM public.signup_sheets
  WHERE ((signup_sheets.id = email_reminders_sent.related_id) AND (signup_sheets.user_id = auth.uid()))))));


--
-- Name: live_stream_viewers Viewers can leave; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Viewers can leave" ON public.live_stream_viewers FOR DELETE USING (true);


--
-- Name: live_stream_viewers Viewers can update their own session; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Viewers can update their own session" ON public.live_stream_viewers FOR UPDATE USING (true);


--
-- Name: poll_votes Voters can delete their own votes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Voters can delete their own votes" ON public.poll_votes FOR DELETE USING ((voter_email = (auth.jwt() ->> 'email'::text)));


--
-- Name: activity_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: ad_call_inquiries; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ad_call_inquiries ENABLE ROW LEVEL SECURITY;

--
-- Name: ad_campaigns; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;

--
-- Name: ad_creatives; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ad_creatives ENABLE ROW LEVEL SECURITY;

--
-- Name: ad_cta_clicks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ad_cta_clicks ENABLE ROW LEVEL SECURITY;

--
-- Name: ad_impressions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ad_impressions ENABLE ROW LEVEL SECURITY;

--
-- Name: ad_slots; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ad_slots ENABLE ROW LEVEL SECURITY;

--
-- Name: ad_videos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ad_videos ENABLE ROW LEVEL SECURITY;

--
-- Name: advertiser_pricing_tiers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.advertiser_pricing_tiers ENABLE ROW LEVEL SECURITY;

--
-- Name: advertiser_team_members; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.advertiser_team_members ENABLE ROW LEVEL SECURITY;

--
-- Name: advertiser_transactions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.advertiser_transactions ENABLE ROW LEVEL SECURITY;

--
-- Name: advertisers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.advertisers ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_conversations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: audio_ads; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audio_ads ENABLE ROW LEVEL SECURITY;

--
-- Name: availability_schedules; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.availability_schedules ENABLE ROW LEVEL SECURITY;

--
-- Name: award_categories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.award_categories ENABLE ROW LEVEL SECURITY;

--
-- Name: award_nominees; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.award_nominees ENABLE ROW LEVEL SECURITY;

--
-- Name: award_payouts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.award_payouts ENABLE ROW LEVEL SECURITY;

--
-- Name: award_registrations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.award_registrations ENABLE ROW LEVEL SECURITY;

--
-- Name: award_self_nominations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.award_self_nominations ENABLE ROW LEVEL SECURITY;

--
-- Name: award_sponsorship_packages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.award_sponsorship_packages ENABLE ROW LEVEL SECURITY;

--
-- Name: award_sponsorships; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.award_sponsorships ENABLE ROW LEVEL SECURITY;

--
-- Name: award_votes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.award_votes ENABLE ROW LEVEL SECURITY;

--
-- Name: award_winners; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.award_winners ENABLE ROW LEVEL SECURITY;

--
-- Name: awards_programs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.awards_programs ENABLE ROW LEVEL SECURITY;

--
-- Name: blocked_times; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.blocked_times ENABLE ROW LEVEL SECURITY;

--
-- Name: blog_categories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;

--
-- Name: blog_post_categories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.blog_post_categories ENABLE ROW LEVEL SECURITY;

--
-- Name: blog_posts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

--
-- Name: calendar_connections; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.calendar_connections ENABLE ROW LEVEL SECURITY;

--
-- Name: campaign_properties; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.campaign_properties ENABLE ROW LEVEL SECURITY;

--
-- Name: campaign_property_impressions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.campaign_property_impressions ENABLE ROW LEVEL SECURITY;

--
-- Name: civic_articles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.civic_articles ENABLE ROW LEVEL SECURITY;

--
-- Name: civic_compliance_records; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.civic_compliance_records ENABLE ROW LEVEL SECURITY;

--
-- Name: civic_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.civic_events ENABLE ROW LEVEL SECURITY;

--
-- Name: civic_live_sessions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.civic_live_sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: client_tickets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.client_tickets ENABLE ROW LEVEL SECURITY;

--
-- Name: constituent_requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.constituent_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: contact_list_members; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.contact_list_members ENABLE ROW LEVEL SECURITY;

--
-- Name: contact_lists; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.contact_lists ENABLE ROW LEVEL SECURITY;

--
-- Name: contact_tag_assignments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.contact_tag_assignments ENABLE ROW LEVEL SECURITY;

--
-- Name: contact_tags; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.contact_tags ENABLE ROW LEVEL SECURITY;

--
-- Name: contacts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

--
-- Name: conversational_ad_charges; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.conversational_ad_charges ENABLE ROW LEVEL SECURITY;

--
-- Name: conversational_ad_usage; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.conversational_ad_usage ENABLE ROW LEVEL SECURITY;

--
-- Name: creator_campaign_alerts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.creator_campaign_alerts ENABLE ROW LEVEL SECURITY;

--
-- Name: creator_earnings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.creator_earnings ENABLE ROW LEVEL SECURITY;

--
-- Name: creator_tips; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.creator_tips ENABLE ROW LEVEL SECURITY;

--
-- Name: custom_link_sections; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.custom_link_sections ENABLE ROW LEVEL SECURITY;

--
-- Name: custom_links; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.custom_links ENABLE ROW LEVEL SECURITY;

--
-- Name: digital_ads; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.digital_ads ENABLE ROW LEVEL SECURITY;

--
-- Name: email_campaigns; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;

--
-- Name: email_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;

--
-- Name: email_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: email_reminders_sent; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.email_reminders_sent ENABLE ROW LEVEL SECURITY;

--
-- Name: episodes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;

--
-- Name: event_registrations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

--
-- Name: event_sponsorship_packages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.event_sponsorship_packages ENABLE ROW LEVEL SECURITY;

--
-- Name: event_sponsorships; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.event_sponsorships ENABLE ROW LEVEL SECURITY;

--
-- Name: events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

--
-- Name: financial_assumptions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.financial_assumptions ENABLE ROW LEVEL SECURITY;

--
-- Name: financial_snapshots; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.financial_snapshots ENABLE ROW LEVEL SECURITY;

--
-- Name: influencehub_creators; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.influencehub_creators ENABLE ROW LEVEL SECURITY;

--
-- Name: influencehub_posts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.influencehub_posts ENABLE ROW LEVEL SECURITY;

--
-- Name: integration_metadata; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.integration_metadata ENABLE ROW LEVEL SECURITY;

--
-- Name: investor_talking_points; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.investor_talking_points ENABLE ROW LEVEL SECURITY;

--
-- Name: invoices; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

--
-- Name: link_clicks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.link_clicks ENABLE ROW LEVEL SECURITY;

--
-- Name: live_stream_viewers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.live_stream_viewers ENABLE ROW LEVEL SECURITY;

--
-- Name: media_ad_slots; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.media_ad_slots ENABLE ROW LEVEL SECURITY;

--
-- Name: media_files; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.media_files ENABLE ROW LEVEL SECURITY;

--
-- Name: media_processing_jobs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.media_processing_jobs ENABLE ROW LEVEL SECURITY;

--
-- Name: media_versions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.media_versions ENABLE ROW LEVEL SECURITY;

--
-- Name: meeting_invitations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.meeting_invitations ENABLE ROW LEVEL SECURITY;

--
-- Name: meeting_types; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.meeting_types ENABLE ROW LEVEL SECURITY;

--
-- Name: meetings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

--
-- Name: meetings meetings_public_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY meetings_public_insert ON public.meetings FOR INSERT TO authenticated, anon WITH CHECK (true);


--
-- Name: microsoft_connections; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.microsoft_connections ENABLE ROW LEVEL SECURITY;

--
-- Name: module_purchases; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.module_purchases ENABLE ROW LEVEL SECURITY;

--
-- Name: modules; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

--
-- Name: multi_channel_campaigns; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.multi_channel_campaigns ENABLE ROW LEVEL SECURITY;

--
-- Name: my_page_video_impressions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.my_page_video_impressions ENABLE ROW LEVEL SECURITY;

--
-- Name: podcast_ad_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.podcast_ad_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: podcast_campaign_selections; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.podcast_campaign_selections ENABLE ROW LEVEL SECURITY;

--
-- Name: podcasts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.podcasts ENABLE ROW LEVEL SECURITY;

--
-- Name: poll_options; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;

--
-- Name: poll_votes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

--
-- Name: polls; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;

--
-- Name: profile_section_order; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profile_section_order ENABLE ROW LEVEL SECURITY;

--
-- Name: profile_views; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: proposals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

--
-- Name: qr_codes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;

--
-- Name: rate_limit_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.rate_limit_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: role_permissions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

--
-- Name: sales_commissions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sales_commissions ENABLE ROW LEVEL SECURITY;

--
-- Name: sales_team_members; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sales_team_members ENABLE ROW LEVEL SECURITY;

--
-- Name: saved_proformas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.saved_proformas ENABLE ROW LEVEL SECURITY;

--
-- Name: signup_sheets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.signup_sheets ENABLE ROW LEVEL SECURITY;

--
-- Name: signup_slots; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.signup_slots ENABLE ROW LEVEL SECURITY;

--
-- Name: social_accounts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;

--
-- Name: social_links; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;

--
-- Name: social_media_accounts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.social_media_accounts ENABLE ROW LEVEL SECURITY;

--
-- Name: social_media_properties; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.social_media_properties ENABLE ROW LEVEL SECURITY;

--
-- Name: stream_impressions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.stream_impressions ENABLE ROW LEVEL SECURITY;

--
-- Name: studio_guests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.studio_guests ENABLE ROW LEVEL SECURITY;

--
-- Name: studio_recording_ads; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.studio_recording_ads ENABLE ROW LEVEL SECURITY;

--
-- Name: studio_recordings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.studio_recordings ENABLE ROW LEVEL SECURITY;

--
-- Name: studio_sessions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.studio_sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: studio_templates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.studio_templates ENABLE ROW LEVEL SECURITY;

--
-- Name: subscriptions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

--
-- Name: support_chat_participants; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.support_chat_participants ENABLE ROW LEVEL SECURITY;

--
-- Name: tab_views; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tab_views ENABLE ROW LEVEL SECURITY;

--
-- Name: tasks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

--
-- Name: team_members; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

--
-- Name: team_messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.team_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: teams; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

--
-- Name: usage_tracking; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;

--
-- Name: user_modules; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_modules ENABLE ROW LEVEL SECURITY;

--
-- Name: user_preferences; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

--
-- Name: user_presence; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: user_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: video_markers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.video_markers ENABLE ROW LEVEL SECURITY;

--
-- Name: zoom_connections; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.zoom_connections ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


