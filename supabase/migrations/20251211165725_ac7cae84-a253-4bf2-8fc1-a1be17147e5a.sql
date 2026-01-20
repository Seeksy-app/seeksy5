
-- Create partners table (Claims Providers, Campaign Clients, etc.)
CREATE TABLE public.partners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL DEFAULT 'lead_buyer', -- lead_buyer, managed_service, hybrid
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  logo_url TEXT,
  brand_color TEXT DEFAULT '#003A9E',
  product_source TEXT[], -- Array of: 'veteran', 'campaign', 'seeksy'
  billing_model TEXT DEFAULT 'per_lead', -- per_lead, subscription, hybrid
  per_lead_rate NUMERIC(10,2) DEFAULT 0,
  subscription_rate NUMERIC(10,2) DEFAULT 0,
  status TEXT DEFAULT 'active',
  portal_enabled BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create partner_users table for portal login
CREATE TABLE public.partner_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  email TEXT NOT NULL,
  role TEXT DEFAULT 'viewer', -- admin, viewer
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create partner_lead_assignments table
CREATE TABLE public.partner_lead_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  lead_source TEXT NOT NULL, -- 'veteran_leads', 'contacts', 'campaign_candidates'
  lead_id UUID NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  assigned_by UUID,
  status TEXT DEFAULT 'new', -- new, contacted, qualified, converted, rejected
  conversion_value NUMERIC(10,2),
  notes TEXT,
  partner_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create partner_billing table
CREATE TABLE public.partner_billing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  billing_type TEXT NOT NULL, -- 'lead_fee', 'subscription', 'adjustment'
  amount NUMERIC(10,2) NOT NULL,
  description TEXT,
  lead_assignment_id UUID REFERENCES public.partner_lead_assignments(id),
  billing_period_start DATE,
  billing_period_end DATE,
  status TEXT DEFAULT 'pending', -- pending, invoiced, paid
  invoiced_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_lead_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_billing ENABLE ROW LEVEL SECURITY;

-- Admin policies (admins can see all)
CREATE POLICY "Admins can manage partners" ON public.partners
  FOR ALL USING (public.is_adm());

CREATE POLICY "Admins can manage partner users" ON public.partner_users
  FOR ALL USING (public.is_adm());

CREATE POLICY "Admins can manage lead assignments" ON public.partner_lead_assignments
  FOR ALL USING (public.is_adm());

CREATE POLICY "Admins can manage partner billing" ON public.partner_billing
  FOR ALL USING (public.is_adm());

-- Partner user policies (partners see their own data)
CREATE POLICY "Partner users can view their partner" ON public.partners
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.partner_users pu 
      WHERE pu.partner_id = partners.id 
      AND pu.user_id = auth.uid()
    )
  );

CREATE POLICY "Partner users can view their assignments" ON public.partner_lead_assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.partner_users pu 
      WHERE pu.partner_id = partner_lead_assignments.partner_id 
      AND pu.user_id = auth.uid()
    )
  );

CREATE POLICY "Partner users can update their assignments" ON public.partner_lead_assignments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.partner_users pu 
      WHERE pu.partner_id = partner_lead_assignments.partner_id 
      AND pu.user_id = auth.uid()
    )
  );

CREATE POLICY "Partner users can view their billing" ON public.partner_billing
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.partner_users pu 
      WHERE pu.partner_id = partner_billing.partner_id 
      AND pu.user_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX idx_partners_slug ON public.partners(slug);
CREATE INDEX idx_partners_status ON public.partners(status);
CREATE INDEX idx_partner_users_partner_id ON public.partner_users(partner_id);
CREATE INDEX idx_partner_users_user_id ON public.partner_users(user_id);
CREATE INDEX idx_partner_lead_assignments_partner_id ON public.partner_lead_assignments(partner_id);
CREATE INDEX idx_partner_lead_assignments_lead_source ON public.partner_lead_assignments(lead_source);
CREATE INDEX idx_partner_lead_assignments_status ON public.partner_lead_assignments(status);
CREATE INDEX idx_partner_billing_partner_id ON public.partner_billing(partner_id);
CREATE INDEX idx_partner_billing_status ON public.partner_billing(status);
