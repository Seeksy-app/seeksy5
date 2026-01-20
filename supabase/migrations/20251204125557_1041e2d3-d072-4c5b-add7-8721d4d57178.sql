-- CEO Operating Plan table
CREATE TABLE public.ceo_plan (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'CEO Operating Plan',
  body_html TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ceo_plan ENABLE ROW LEVEL SECURITY;

-- Only admin/board_member can read
CREATE POLICY "CEO Plan readable by admin and board members"
ON public.ceo_plan FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'super_admin', 'board_member')
  )
);

-- Only admin can update
CREATE POLICY "CEO Plan updatable by admin"
ON public.ceo_plan FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "CEO Plan insertable by admin"
ON public.ceo_plan FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'super_admin')
  )
);

-- R&D Intelligence Documents table
CREATE TABLE public.rd_intel_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  source TEXT NOT NULL,
  url TEXT,
  publish_date TIMESTAMP WITH TIME ZONE,
  type TEXT NOT NULL CHECK (type IN ('blog', 'podcast', 'pdf')),
  summary TEXT,
  insights_json JSONB DEFAULT '[]'::jsonb,
  category_tags TEXT[] DEFAULT '{}',
  full_text TEXT,
  use_in_gtm_insights BOOLEAN DEFAULT false,
  use_in_board_insights BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rd_intel_documents ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "Admin full access to rd_intel_documents"
ON public.rd_intel_documents FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'super_admin')
  )
);

-- Board members can read only flagged documents
CREATE POLICY "Board members can read flagged rd_intel_documents"
ON public.rd_intel_documents FOR SELECT
USING (
  use_in_board_insights = true AND
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'board_member'
  )
);

-- Create indexes
CREATE INDEX idx_rd_intel_documents_type ON public.rd_intel_documents(type);
CREATE INDEX idx_rd_intel_documents_board ON public.rd_intel_documents(use_in_board_insights) WHERE use_in_board_insights = true;
CREATE INDEX idx_rd_intel_documents_gtm ON public.rd_intel_documents(use_in_gtm_insights) WHERE use_in_gtm_insights = true;