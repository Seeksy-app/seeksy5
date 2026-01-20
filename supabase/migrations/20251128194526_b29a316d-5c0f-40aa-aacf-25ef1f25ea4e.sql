-- Create ad_inventory_units table for sellable ad placements
CREATE TABLE IF NOT EXISTS public.ad_inventory_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('podcast', 'livestream', 'event', 'creator_page', 'newsletter', 'other')),
  placement TEXT NOT NULL CHECK (placement IN ('pre', 'mid', 'post', 'display', 'sponsored_segment', 'sponsorship_package')),
  target_cpm NUMERIC NOT NULL DEFAULT 25.00,
  floor_cpm NUMERIC NOT NULL DEFAULT 15.00,
  ceiling_cpm NUMERIC NOT NULL DEFAULT 50.00,
  expected_monthly_impressions NUMERIC NOT NULL DEFAULT 0,
  seasonality_factor NUMERIC NOT NULL DEFAULT 1.0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create ad_rate_cards table for quarterly CPM recommendations
CREATE TABLE IF NOT EXISTS public.ad_rate_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_unit_id UUID NOT NULL REFERENCES public.ad_inventory_units(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  quarter INTEGER NOT NULL CHECK (quarter BETWEEN 1 AND 4),
  scenario_slug TEXT NOT NULL CHECK (scenario_slug IN ('base', 'conservative', 'aggressive')),
  recommended_cpm NUMERIC NOT NULL,
  bulk_discount_cpm NUMERIC,
  min_commit_impressions NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(inventory_unit_id, year, quarter, scenario_slug)
);

-- Enable RLS
ALTER TABLE public.ad_inventory_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_rate_cards ENABLE ROW LEVEL SECURITY;

-- Admin-only policies for ad_inventory_units
CREATE POLICY "Admins can view ad_inventory_units"
  ON public.ad_inventory_units
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can insert ad_inventory_units"
  ON public.ad_inventory_units
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update ad_inventory_units"
  ON public.ad_inventory_units
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can delete ad_inventory_units"
  ON public.ad_inventory_units
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin')
    )
  );

-- Admin-only policies for ad_rate_cards
CREATE POLICY "Admins can view ad_rate_cards"
  ON public.ad_rate_cards
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can insert ad_rate_cards"
  ON public.ad_rate_cards
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update ad_rate_cards"
  ON public.ad_rate_cards
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can delete ad_rate_cards"
  ON public.ad_rate_cards
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin')
    )
  );

-- Trigger for updated_at on ad_inventory_units
CREATE TRIGGER update_ad_inventory_units_updated_at
  BEFORE UPDATE ON public.ad_inventory_units
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updated_at on ad_rate_cards
CREATE TRIGGER update_ad_rate_cards_updated_at
  BEFORE UPDATE ON public.ad_rate_cards
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default inventory units
INSERT INTO public.ad_inventory_units (name, slug, type, placement, target_cpm, floor_cpm, ceiling_cpm, expected_monthly_impressions) VALUES
  ('Podcast Midroll', 'podcast-midroll', 'podcast', 'mid', 25.00, 18.00, 40.00, 50000),
  ('Podcast Pre-roll', 'podcast-preroll', 'podcast', 'pre', 20.00, 15.00, 35.00, 75000),
  ('Podcast Post-roll', 'podcast-postroll', 'podcast', 'post', 15.00, 10.00, 25.00, 60000),
  ('Livestream Sponsorship', 'livestream-sponsorship', 'livestream', 'sponsorship_package', 35.00, 25.00, 60.00, 25000),
  ('Livestream Mid-break', 'livestream-mid-break', 'livestream', 'mid', 30.00, 22.00, 50.00, 35000),
  ('Event Sponsorship', 'event-sponsorship', 'event', 'sponsorship_package', 45.00, 30.00, 80.00, 15000),
  ('Creator Page Display', 'creator-page-display', 'creator_page', 'display', 18.00, 12.00, 30.00, 100000),
  ('Newsletter Sponsored', 'newsletter-sponsored', 'newsletter', 'sponsored_segment', 22.00, 16.00, 38.00, 40000)
ON CONFLICT (slug) DO NOTHING;