-- =====================================================
-- FORM-FIRST E-SIGNATURE V1
-- =====================================================

-- 1) Form templates
CREATE TABLE IF NOT EXISTS public.form_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  name text NOT NULL,
  description text,
  docx_template_url text NOT NULL,
  schema_json jsonb NOT NULL,
  signer_config_json jsonb NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_form_templates_tenant ON public.form_templates(tenant_id);

-- 2) Document instances (hub)
CREATE TABLE IF NOT EXISTS public.doc_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  form_template_id uuid NOT NULL REFERENCES public.form_templates(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','collecting','ready_to_sign','signing','completed','void')),
  submission_json jsonb,
  merged_docx_url text,
  preview_pdf_url text,
  final_pdf_url text,
  audit_json jsonb,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_doc_instances_tenant ON public.doc_instances(tenant_id);
CREATE INDEX IF NOT EXISTS idx_doc_instances_template ON public.doc_instances(form_template_id);

-- 3) Doc signers
CREATE TABLE IF NOT EXISTS public.doc_signers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_instance_id uuid NOT NULL REFERENCES public.doc_instances(id) ON DELETE CASCADE,
  role text NOT NULL,
  name text,
  email text NOT NULL,
  signing_order int NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','viewed','signed')),
  signed_at timestamptz,
  signature_image_url text,
  signature_type text DEFAULT 'drawn' CHECK (signature_type IN ('drawn','typed')),
  ip_hash text,
  access_token text UNIQUE,
  token_expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_doc_signers_instance ON public.doc_signers(doc_instance_id);
CREATE INDEX IF NOT EXISTS idx_doc_signers_email ON public.doc_signers(email);
CREATE INDEX IF NOT EXISTS idx_doc_signers_token ON public.doc_signers(access_token);

-- 4) Updated_at triggers
DROP TRIGGER IF EXISTS trg_form_templates_updated_at ON public.form_templates;
CREATE TRIGGER trg_form_templates_updated_at BEFORE UPDATE ON public.form_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_doc_instances_updated_at ON public.doc_instances;
CREATE TRIGGER trg_doc_instances_updated_at BEFORE UPDATE ON public.doc_instances
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_doc_signers_updated_at ON public.doc_signers;
CREATE TRIGGER trg_doc_signers_updated_at BEFORE UPDATE ON public.doc_signers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- RLS
-- =====================================================
ALTER TABLE public.form_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doc_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doc_signers ENABLE ROW LEVEL SECURITY;

-- form_templates
DROP POLICY IF EXISTS "tenant_view_form_templates" ON public.form_templates;
DROP POLICY IF EXISTS "tenant_edit_form_templates" ON public.form_templates;
CREATE POLICY "tenant_view_form_templates" ON public.form_templates
FOR SELECT USING (has_tenant_role(tenant_id, 'viewer'));
CREATE POLICY "tenant_edit_form_templates" ON public.form_templates
FOR ALL USING (has_tenant_role(tenant_id, 'editor'));

-- doc_instances
DROP POLICY IF EXISTS "tenant_view_doc_instances" ON public.doc_instances;
DROP POLICY IF EXISTS "tenant_edit_doc_instances" ON public.doc_instances;
CREATE POLICY "tenant_view_doc_instances" ON public.doc_instances
FOR SELECT USING (has_tenant_role(tenant_id, 'viewer'));
CREATE POLICY "tenant_edit_doc_instances" ON public.doc_instances
FOR ALL USING (has_tenant_role(tenant_id, 'editor'));

-- doc_signers: tenant access via join to doc_instances
DROP POLICY IF EXISTS "tenant_view_doc_signers" ON public.doc_signers;
DROP POLICY IF EXISTS "tenant_edit_doc_signers" ON public.doc_signers;
CREATE POLICY "tenant_view_doc_signers" ON public.doc_signers
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.doc_instances di
    WHERE di.id = doc_instance_id
    AND has_tenant_role(di.tenant_id, 'viewer')
  )
);
CREATE POLICY "tenant_edit_doc_signers" ON public.doc_signers
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.doc_instances di
    WHERE di.id = doc_instance_id
    AND has_tenant_role(di.tenant_id, 'editor')
  )
);