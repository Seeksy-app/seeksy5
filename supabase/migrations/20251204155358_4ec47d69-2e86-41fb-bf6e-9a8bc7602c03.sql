-- Fix RLS policies for meetings to avoid recursion

-- Drop existing problematic policies on meetings
DROP POLICY IF EXISTS "meetings_select_policy" ON public.meetings;
DROP POLICY IF EXISTS "meetings_insert_policy" ON public.meetings;
DROP POLICY IF EXISTS "meetings_update_policy" ON public.meetings;
DROP POLICY IF EXISTS "meetings_delete_policy" ON public.meetings;
DROP POLICY IF EXISTS "meetings_public_insert" ON public.meetings;

-- Drop existing problematic policies on meeting_attendees
DROP POLICY IF EXISTS "Users can view attendees for their meetings" ON public.meeting_attendees;
DROP POLICY IF EXISTS "Users can insert attendees for their meetings" ON public.meeting_attendees;
DROP POLICY IF EXISTS "Users can update attendees for their meetings" ON public.meeting_attendees;
DROP POLICY IF EXISTS "Users can delete attendees for their meetings" ON public.meeting_attendees;
DROP POLICY IF EXISTS "Allow RSVP access via token" ON public.meeting_attendees;
DROP POLICY IF EXISTS "Allow public RSVP view via token" ON public.meeting_attendees;

-- Create security definer function to check if user is meeting host
CREATE OR REPLACE FUNCTION public.is_meeting_host(_user_id uuid, _meeting_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.meetings
    WHERE id = _meeting_id
      AND user_id = _user_id
  )
$$;

-- Create security definer function to get user's meeting IDs (as host)
CREATE OR REPLACE FUNCTION public.get_user_hosted_meeting_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.meetings WHERE user_id = _user_id
$$;

-- NEW MEETINGS POLICIES (no recursion)

-- Users can view meetings they host
CREATE POLICY "meetings_select_host" ON public.meetings
FOR SELECT
USING (user_id = auth.uid());

-- Users can view meetings they attend (via email match)
CREATE POLICY "meetings_select_attendee" ON public.meetings
FOR SELECT
USING (
  id IN (
    SELECT meeting_id FROM public.meeting_attendees 
    WHERE LOWER(attendee_email) = LOWER((SELECT email FROM auth.users WHERE id = auth.uid()))
  )
);

-- Users can create meetings where they are the host
CREATE POLICY "meetings_insert_host" ON public.meetings
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Allow public meeting creation (for booking flows)
CREATE POLICY "meetings_insert_public" ON public.meetings
FOR INSERT TO anon, authenticated
WITH CHECK (true);

-- Users can update only their own meetings
CREATE POLICY "meetings_update_host" ON public.meetings
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Users can delete only their own meetings
CREATE POLICY "meetings_delete_host" ON public.meetings
FOR DELETE
USING (user_id = auth.uid());

-- NEW MEETING_ATTENDEES POLICIES (using security definer function to avoid recursion)

-- Users can view attendees for meetings they host (using security definer)
CREATE POLICY "attendees_select_host" ON public.meeting_attendees
FOR SELECT
USING (public.is_meeting_host(auth.uid(), meeting_id));

-- Users can view their own attendee records
CREATE POLICY "attendees_select_self" ON public.meeting_attendees
FOR SELECT
USING (LOWER(attendee_email) = LOWER((SELECT email FROM auth.users WHERE id = auth.uid())));

-- Allow public view with RSVP token
CREATE POLICY "attendees_select_token" ON public.meeting_attendees
FOR SELECT TO anon, authenticated
USING (rsvp_token IS NOT NULL);

-- Host can insert attendees for their meetings
CREATE POLICY "attendees_insert_host" ON public.meeting_attendees
FOR INSERT
WITH CHECK (public.is_meeting_host(auth.uid(), meeting_id));

-- Allow public insert (for booking flows)
CREATE POLICY "attendees_insert_public" ON public.meeting_attendees
FOR INSERT TO anon, authenticated
WITH CHECK (true);

-- Host can update attendees
CREATE POLICY "attendees_update_host" ON public.meeting_attendees
FOR UPDATE
USING (public.is_meeting_host(auth.uid(), meeting_id));

-- Allow RSVP updates via token
CREATE POLICY "attendees_update_token" ON public.meeting_attendees
FOR UPDATE TO anon, authenticated
USING (rsvp_token IS NOT NULL)
WITH CHECK (rsvp_token IS NOT NULL);

-- Host can delete attendees
CREATE POLICY "attendees_delete_host" ON public.meeting_attendees
FOR DELETE
USING (public.is_meeting_host(auth.uid(), meeting_id));

-- Add meeting_studio_preference to user_preferences if not exists
ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS meeting_studio_preference TEXT DEFAULT 'simple';

-- Add agenda, notes columns to meetings if not exists  
ALTER TABLE public.meetings
ADD COLUMN IF NOT EXISTS agenda TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS chat_enabled BOOLEAN DEFAULT true;

-- Create meeting_files table for attachments
CREATE TABLE IF NOT EXISTS public.meeting_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on meeting_files
ALTER TABLE public.meeting_files ENABLE ROW LEVEL SECURITY;

-- Meeting files policies
CREATE POLICY "meeting_files_select" ON public.meeting_files
FOR SELECT USING (public.is_meeting_host(auth.uid(), meeting_id));

CREATE POLICY "meeting_files_insert" ON public.meeting_files
FOR INSERT WITH CHECK (public.is_meeting_host(auth.uid(), meeting_id));

CREATE POLICY "meeting_files_delete" ON public.meeting_files
FOR DELETE USING (public.is_meeting_host(auth.uid(), meeting_id));

-- Create meeting_chat table
CREATE TABLE IF NOT EXISTS public.meeting_chat (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  sender_email TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on meeting_chat
ALTER TABLE public.meeting_chat ENABLE ROW LEVEL SECURITY;

-- Chat policies - anyone in meeting can view/insert
CREATE POLICY "chat_select" ON public.meeting_chat
FOR SELECT USING (public.is_meeting_host(auth.uid(), meeting_id) OR true);

CREATE POLICY "chat_insert" ON public.meeting_chat
FOR INSERT WITH CHECK (true);

-- Enable realtime for meeting_chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.meeting_chat;