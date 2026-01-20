-- Create seo_ai_suggestions table for AI-generated SEO suggestions from GBP data
CREATE TABLE public.seo_ai_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  seo_page_id UUID NOT NULL REFERENCES public.seo_pages(id) ON DELETE CASCADE,
  gbp_location_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  model TEXT NOT NULL,
  tone TEXT NOT NULL DEFAULT 'Local',
  include_reviews BOOLEAN NOT NULL DEFAULT true,
  include_faq BOOLEAN NOT NULL DEFAULT true,
  input_snapshot JSONB,
  output_json JSONB,
  applied_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ
);

-- Create indexes for performance
CREATE INDEX seo_ai_suggestions_seo_page_id_idx ON public.seo_ai_suggestions(seo_page_id);
CREATE INDEX seo_ai_suggestions_gbp_location_id_idx ON public.seo_ai_suggestions(gbp_location_id);
CREATE INDEX seo_ai_suggestions_created_at_idx ON public.seo_ai_suggestions(created_at DESC);

-- Enable RLS
ALTER TABLE public.seo_ai_suggestions ENABLE ROW LEVEL SECURITY;

-- Admin-only policies (same pattern as other admin tables)
CREATE POLICY "Admin can view seo_ai_suggestions"
ON public.seo_ai_suggestions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Admin can insert seo_ai_suggestions"
ON public.seo_ai_suggestions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Admin can update seo_ai_suggestions"
ON public.seo_ai_suggestions
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Admin can delete seo_ai_suggestions"
ON public.seo_ai_suggestions
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);