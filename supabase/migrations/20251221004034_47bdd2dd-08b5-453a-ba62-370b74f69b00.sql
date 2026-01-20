-- Create gbp_seo_links table for linking GBP locations to SEO pages
CREATE TABLE public.gbp_seo_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gbp_location_id UUID NOT NULL REFERENCES public.gbp_locations(id) ON DELETE CASCADE,
  seo_page_id UUID NOT NULL REFERENCES public.seo_pages(id) ON DELETE CASCADE,
  link_type TEXT NOT NULL DEFAULT 'primary' CHECK (link_type IN ('primary', 'secondary')),
  sync_status TEXT NOT NULL DEFAULT 'linked' CHECK (sync_status IN ('linked', 'warning', 'out_of_sync')),
  last_checked_at TIMESTAMPTZ,
  drift_details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(gbp_location_id, seo_page_id)
);

-- Enable RLS
ALTER TABLE public.gbp_seo_links ENABLE ROW LEVEL SECURITY;

-- Admin-only policies using user_roles table
CREATE POLICY "Admin can read gbp_seo_links"
ON public.gbp_seo_links
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Admin can insert gbp_seo_links"
ON public.gbp_seo_links
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Admin can update gbp_seo_links"
ON public.gbp_seo_links
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Admin can delete gbp_seo_links"
ON public.gbp_seo_links
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'super_admin')
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_gbp_seo_links_updated_at
BEFORE UPDATE ON public.gbp_seo_links
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for lookups
CREATE INDEX idx_gbp_seo_links_gbp_location ON public.gbp_seo_links(gbp_location_id);
CREATE INDEX idx_gbp_seo_links_seo_page ON public.gbp_seo_links(seo_page_id);
CREATE INDEX idx_gbp_seo_links_sync_status ON public.gbp_seo_links(sync_status);