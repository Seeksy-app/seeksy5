-- ============================================
-- PHASE 1: EVENTS MODULE EXPANSION
-- ============================================

-- 1. Add new columns to existing events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS event_type TEXT DEFAULT 'live' CHECK (event_type IN ('live', 'virtual', 'hybrid')),
ADD COLUMN IF NOT EXISTS pricing_mode TEXT DEFAULT 'free' CHECK (pricing_mode IN ('free', 'ticketed', 'donation', 'invite_only')),
ADD COLUMN IF NOT EXISTS access_control JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS venue_address TEXT,
ADD COLUMN IF NOT EXISTS venue_city TEXT,
ADD COLUMN IF NOT EXISTS venue_state TEXT,
ADD COLUMN IF NOT EXISTS venue_country TEXT,
ADD COLUMN IF NOT EXISTS venue_zip TEXT,
ADD COLUMN IF NOT EXISTS virtual_url TEXT,
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/New_York',
ADD COLUMN IF NOT EXISTS end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS registration_deadline TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS max_registrations INTEGER,
ADD COLUMN IF NOT EXISTS registration_open BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS require_approval BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS confirmation_email_template TEXT,
ADD COLUMN IF NOT EXISTS reminder_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- 2. Create event_ticket_tiers table
CREATE TABLE IF NOT EXISTS public.event_ticket_tiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  quantity_available INTEGER,
  quantity_sold INTEGER DEFAULT 0,
  max_per_order INTEGER DEFAULT 10,
  sale_start TIMESTAMP WITH TIME ZONE,
  sale_end TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  tier_order INTEGER DEFAULT 0,
  benefits JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Create event_tickets table (individual tickets purchased)
CREATE TABLE IF NOT EXISTS public.event_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  tier_id UUID REFERENCES public.event_ticket_tiers(id) ON DELETE SET NULL,
  registration_id UUID REFERENCES public.event_registrations(id) ON DELETE CASCADE,
  attendee_name TEXT NOT NULL,
  attendee_email TEXT NOT NULL,
  ticket_number TEXT UNIQUE NOT NULL,
  qr_code TEXT,
  check_in_code TEXT UNIQUE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'refunded', 'checked_in')),
  checked_in_at TIMESTAMP WITH TIME ZONE,
  checked_in_by UUID,
  amount_paid DECIMAL(10,2) DEFAULT 0,
  discount_code TEXT,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Create event_discount_codes table
CREATE TABLE IF NOT EXISTS public.event_discount_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  discount_type TEXT DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL,
  max_uses INTEGER,
  times_used INTEGER DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE,
  valid_until TIMESTAMP WITH TIME ZONE,
  applicable_tiers UUID[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(event_id, code)
);

-- 5. Create event_sessions table (agenda/schedule)
CREATE TABLE IF NOT EXISTS public.event_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  room TEXT,
  virtual_url TEXT,
  capacity INTEGER,
  session_type TEXT DEFAULT 'session' CHECK (session_type IN ('session', 'break', 'keynote', 'workshop', 'networking', 'other')),
  track TEXT,
  is_published BOOLEAN DEFAULT true,
  session_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. Create event_speakers table
CREATE TABLE IF NOT EXISTS public.event_speakers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  title TEXT,
  company TEXT,
  bio TEXT,
  photo_url TEXT,
  email TEXT,
  social_links JSONB DEFAULT '{}',
  is_featured BOOLEAN DEFAULT false,
  speaker_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 7. Create event_session_speakers junction table
CREATE TABLE IF NOT EXISTS public.event_session_speakers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.event_sessions(id) ON DELETE CASCADE,
  speaker_id UUID NOT NULL REFERENCES public.event_speakers(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'speaker',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(session_id, speaker_id)
);

-- 8. Create attendee_session_bookings table (personal agenda)
CREATE TABLE IF NOT EXISTS public.attendee_session_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.event_sessions(id) ON DELETE CASCADE,
  ticket_id UUID NOT NULL REFERENCES public.event_tickets(id) ON DELETE CASCADE,
  user_id UUID,
  booked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(session_id, ticket_id)
);

-- 9. Create event_check_ins table (detailed check-in log)
CREATE TABLE IF NOT EXISTS public.event_check_ins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  ticket_id UUID NOT NULL REFERENCES public.event_tickets(id) ON DELETE CASCADE,
  checked_in_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  checked_in_by UUID,
  check_in_method TEXT DEFAULT 'manual' CHECK (check_in_method IN ('manual', 'qr_scan', 'code_entry')),
  location TEXT,
  notes TEXT,
  device_info JSONB DEFAULT '{}'
);

-- 10. Create event_analytics table (aggregated stats)
CREATE TABLE IF NOT EXISTS public.event_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  page_views INTEGER DEFAULT 0,
  registrations INTEGER DEFAULT 0,
  tickets_sold INTEGER DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0,
  check_ins INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(event_id, date)
);

-- Enable RLS on all new tables
ALTER TABLE public.event_ticket_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_speakers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_session_speakers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendee_session_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for event_ticket_tiers
CREATE POLICY "Event owners can manage ticket tiers" ON public.event_ticket_tiers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.events WHERE events.id = event_ticket_tiers.event_id AND events.user_id = auth.uid())
  );

CREATE POLICY "Public can view active ticket tiers" ON public.event_ticket_tiers
  FOR SELECT USING (is_active = true);

-- RLS Policies for event_tickets
CREATE POLICY "Event owners can view all tickets" ON public.event_tickets
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.events WHERE events.id = event_tickets.event_id AND events.user_id = auth.uid())
  );

CREATE POLICY "Ticket holders can view their own tickets" ON public.event_tickets
  FOR SELECT USING (
    attendee_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY "Event owners can manage tickets" ON public.event_tickets
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.events WHERE events.id = event_tickets.event_id AND events.user_id = auth.uid())
  );

-- RLS Policies for event_discount_codes
CREATE POLICY "Event owners can manage discount codes" ON public.event_discount_codes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.events WHERE events.id = event_discount_codes.event_id AND events.user_id = auth.uid())
  );

-- RLS Policies for event_sessions
CREATE POLICY "Event owners can manage sessions" ON public.event_sessions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.events WHERE events.id = event_sessions.event_id AND events.user_id = auth.uid())
  );

CREATE POLICY "Public can view published sessions" ON public.event_sessions
  FOR SELECT USING (is_published = true);

-- RLS Policies for event_speakers
CREATE POLICY "Event owners can manage speakers" ON public.event_speakers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.events WHERE events.id = event_speakers.event_id AND events.user_id = auth.uid())
  );

CREATE POLICY "Public can view speakers" ON public.event_speakers
  FOR SELECT USING (true);

-- RLS Policies for event_session_speakers
CREATE POLICY "Event owners can manage session speakers" ON public.event_session_speakers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.event_sessions es
      JOIN public.events e ON e.id = es.event_id
      WHERE es.id = event_session_speakers.session_id AND e.user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view session speakers" ON public.event_session_speakers
  FOR SELECT USING (true);

-- RLS Policies for attendee_session_bookings
CREATE POLICY "Users can manage their own session bookings" ON public.attendee_session_bookings
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Event owners can view all session bookings" ON public.attendee_session_bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.event_sessions es
      JOIN public.events e ON e.id = es.event_id
      WHERE es.id = attendee_session_bookings.session_id AND e.user_id = auth.uid()
    )
  );

-- RLS Policies for event_check_ins
CREATE POLICY "Event owners can manage check-ins" ON public.event_check_ins
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.events WHERE events.id = event_check_ins.event_id AND events.user_id = auth.uid())
  );

-- RLS Policies for event_analytics
CREATE POLICY "Event owners can view analytics" ON public.event_analytics
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.events WHERE events.id = event_analytics.event_id AND events.user_id = auth.uid())
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_ticket_tiers_event ON public.event_ticket_tiers(event_id);
CREATE INDEX IF NOT EXISTS idx_event_tickets_event ON public.event_tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_event_tickets_email ON public.event_tickets(attendee_email);
CREATE INDEX IF NOT EXISTS idx_event_tickets_number ON public.event_tickets(ticket_number);
CREATE INDEX IF NOT EXISTS idx_event_tickets_check_in_code ON public.event_tickets(check_in_code);
CREATE INDEX IF NOT EXISTS idx_event_sessions_event ON public.event_sessions(event_id);
CREATE INDEX IF NOT EXISTS idx_event_speakers_event ON public.event_speakers(event_id);
CREATE INDEX IF NOT EXISTS idx_event_check_ins_event ON public.event_check_ins(event_id);
CREATE INDEX IF NOT EXISTS idx_event_analytics_event_date ON public.event_analytics(event_id, date);
CREATE INDEX IF NOT EXISTS idx_events_slug ON public.events(slug);

-- Create function to generate unique ticket number
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create function to generate check-in code
CREATE OR REPLACE FUNCTION generate_check_in_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := '0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate ticket number and check-in code
CREATE OR REPLACE FUNCTION set_ticket_codes()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ticket_number IS NULL THEN
    NEW.ticket_number := generate_ticket_number();
  END IF;
  IF NEW.check_in_code IS NULL THEN
    NEW.check_in_code := generate_check_in_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_ticket_codes ON public.event_tickets;
CREATE TRIGGER trigger_set_ticket_codes
  BEFORE INSERT ON public.event_tickets
  FOR EACH ROW
  EXECUTE FUNCTION set_ticket_codes();

-- Update trigger for updated_at columns
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_event_ticket_tiers_modtime ON public.event_ticket_tiers;
CREATE TRIGGER update_event_ticket_tiers_modtime
  BEFORE UPDATE ON public.event_ticket_tiers
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();

DROP TRIGGER IF EXISTS update_event_tickets_modtime ON public.event_tickets;
CREATE TRIGGER update_event_tickets_modtime
  BEFORE UPDATE ON public.event_tickets
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();

DROP TRIGGER IF EXISTS update_event_sessions_modtime ON public.event_sessions;
CREATE TRIGGER update_event_sessions_modtime
  BEFORE UPDATE ON public.event_sessions
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();

DROP TRIGGER IF EXISTS update_event_speakers_modtime ON public.event_speakers;
CREATE TRIGGER update_event_speakers_modtime
  BEFORE UPDATE ON public.event_speakers
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();