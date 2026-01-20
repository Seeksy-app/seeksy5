-- Add slug field to meeting_types if not exists
ALTER TABLE meeting_types ADD COLUMN IF NOT EXISTS slug TEXT;

-- Create unique index on slug
CREATE UNIQUE INDEX IF NOT EXISTS meeting_types_slug_unique ON meeting_types(slug) WHERE slug IS NOT NULL;

-- Create meeting_bookings table for guest bookings
CREATE TABLE IF NOT EXISTS meeting_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_type_id UUID NOT NULL REFERENCES meeting_types(id) ON DELETE CASCADE,
  host_user_id UUID NOT NULL,
  guest_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  guest_notes TEXT,
  start_time_utc TIMESTAMPTZ NOT NULL,
  end_time_utc TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'canceled', 'completed', 'no_show')),
  location_details TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  canceled_at TIMESTAMPTZ,
  cancel_reason TEXT
);

-- Create connected_calendars table for future OAuth integration
CREATE TABLE IF NOT EXISTS connected_calendars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  provider TEXT NOT NULL DEFAULT 'google' CHECK (provider IN ('google', 'outlook', 'apple')),
  email TEXT NOT NULL,
  is_connected BOOLEAN DEFAULT true,
  access_token TEXT,
  refresh_token TEXT,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, provider, email)
);

-- Create meeting_availability table for weekly recurring availability
CREATE TABLE IF NOT EXISTS meeting_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  meeting_type_id UUID REFERENCES meeting_types(id) ON DELETE CASCADE,
  weekday INT NOT NULL CHECK (weekday >= 0 AND weekday <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE meeting_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE connected_calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_availability ENABLE ROW LEVEL SECURITY;

-- RLS Policies for meeting_bookings
CREATE POLICY "Hosts can view their bookings"
  ON meeting_bookings FOR SELECT
  USING (host_user_id = auth.uid());

CREATE POLICY "Anyone can create bookings (public booking)"
  ON meeting_bookings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Hosts can update their bookings"
  ON meeting_bookings FOR UPDATE
  USING (host_user_id = auth.uid());

CREATE POLICY "Admins can view all bookings"
  ON meeting_bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- RLS Policies for connected_calendars
CREATE POLICY "Users can manage their own calendars"
  ON connected_calendars FOR ALL
  USING (user_id = auth.uid());

-- RLS Policies for meeting_availability
CREATE POLICY "Users can manage their own availability"
  ON meeting_availability FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Public can read availability for booking"
  ON meeting_availability FOR SELECT
  USING (is_active = true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_meeting_bookings_host ON meeting_bookings(host_user_id);
CREATE INDEX IF NOT EXISTS idx_meeting_bookings_start_time ON meeting_bookings(start_time_utc);
CREATE INDEX IF NOT EXISTS idx_meeting_bookings_status ON meeting_bookings(status);
CREATE INDEX IF NOT EXISTS idx_meeting_availability_user ON meeting_availability(user_id);
CREATE INDEX IF NOT EXISTS idx_meeting_availability_type ON meeting_availability(meeting_type_id);

-- Function to generate slug from meeting type name
CREATE OR REPLACE FUNCTION generate_meeting_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  new_slug TEXT;
  counter INT := 0;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    -- Generate base slug from name
    base_slug := lower(regexp_replace(NEW.name, '[^a-zA-Z0-9]+', '-', 'g'));
    base_slug := trim(both '-' from base_slug);
    new_slug := base_slug;
    
    -- Check for uniqueness and append counter if needed
    WHILE EXISTS (SELECT 1 FROM meeting_types WHERE slug = new_slug AND id != NEW.id) LOOP
      counter := counter + 1;
      new_slug := base_slug || '-' || counter;
    END LOOP;
    
    NEW.slug := new_slug;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate slug
DROP TRIGGER IF EXISTS meeting_type_slug_trigger ON meeting_types;
CREATE TRIGGER meeting_type_slug_trigger
BEFORE INSERT OR UPDATE ON meeting_types
FOR EACH ROW
EXECUTE FUNCTION generate_meeting_slug();

-- Update existing meeting types with slugs
UPDATE meeting_types SET slug = NULL WHERE slug IS NULL;