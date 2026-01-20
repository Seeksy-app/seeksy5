-- Clients/Customers table
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_name TEXT,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  address TEXT,
  website TEXT,
  notes TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tickets/Support system
CREATE TABLE IF NOT EXISTS public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  ticket_number TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'open',
  priority TEXT DEFAULT 'medium',
  category TEXT,
  assigned_to UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

-- Ticket comments/conversations
CREATE TABLE IF NOT EXISTS public.ticket_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  comment_text TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Document templates for e-signatures
CREATE TABLE IF NOT EXISTS public.document_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  template_name TEXT NOT NULL,
  document_content TEXT NOT NULL,
  signature_fields JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Documents sent for signature
CREATE TABLE IF NOT EXISTS public.signature_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  template_id UUID REFERENCES public.document_templates(id) ON DELETE SET NULL,
  ticket_id UUID REFERENCES public.tickets(id) ON DELETE SET NULL,
  document_title TEXT NOT NULL,
  document_content TEXT NOT NULL,
  signature_data JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'pending',
  sent_at TIMESTAMPTZ DEFAULT now(),
  signed_at TIMESTAMPTZ,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  access_token TEXT NOT NULL UNIQUE,
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Podcast directory submission tracking
CREATE TABLE IF NOT EXISTS public.podcast_directories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  podcast_id UUID REFERENCES public.podcasts(id) ON DELETE CASCADE NOT NULL,
  directory_name TEXT NOT NULL,
  directory_url TEXT,
  status TEXT DEFAULT 'not_submitted',
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  directory_specific_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(podcast_id, directory_name)
);

-- RSS feed migration tracking
CREATE TABLE IF NOT EXISTS public.rss_migrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  podcast_id UUID REFERENCES public.podcasts(id) ON DELETE CASCADE NOT NULL,
  old_rss_url TEXT NOT NULL,
  new_rss_url TEXT NOT NULL,
  redirect_setup BOOLEAN DEFAULT false,
  redirect_verified_at TIMESTAMPTZ,
  migration_status TEXT DEFAULT 'pending',
  migration_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signature_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.podcast_directories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rss_migrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for clients
CREATE POLICY "Users can manage their own clients"
ON public.clients FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- RLS Policies for tickets
CREATE POLICY "Users can manage their own tickets"
ON public.tickets FOR ALL
TO authenticated
USING (user_id = auth.uid() OR assigned_to = auth.uid())
WITH CHECK (user_id = auth.uid() OR assigned_to = auth.uid());

-- RLS Policies for ticket comments
CREATE POLICY "Users can view comments on their tickets"
ON public.ticket_comments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tickets t
    WHERE t.id = ticket_id AND (t.user_id = auth.uid() OR t.assigned_to = auth.uid())
  )
);

CREATE POLICY "Users can add comments to their tickets"
ON public.ticket_comments FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tickets t
    WHERE t.id = ticket_id AND (t.user_id = auth.uid() OR t.assigned_to = auth.uid())
  )
);

-- RLS Policies for document templates
CREATE POLICY "Users can manage their own templates"
ON public.document_templates FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- RLS Policies for signature documents
CREATE POLICY "Users can manage their own signature documents"
ON public.signature_documents FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Public access for signing documents (using access token)
CREATE POLICY "Anyone with token can view signature document"
ON public.signature_documents FOR SELECT
TO public
USING (true);

-- RLS Policies for podcast directories
CREATE POLICY "Users can manage their podcast directories"
ON public.podcast_directories FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.podcasts p
    WHERE p.id = podcast_id AND p.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.podcasts p
    WHERE p.id = podcast_id AND p.user_id = auth.uid()
  )
);

-- RLS Policies for RSS migrations
CREATE POLICY "Users can manage their RSS migrations"
ON public.rss_migrations FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.podcasts p
    WHERE p.id = podcast_id AND p.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.podcasts p
    WHERE p.id = podcast_id AND p.user_id = auth.uid()
  )
);

-- Triggers for updated_at
CREATE TRIGGER update_clients_updated_at
BEFORE UPDATE ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at
BEFORE UPDATE ON public.tickets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_document_templates_updated_at
BEFORE UPDATE ON public.document_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_podcast_directories_updated_at
BEFORE UPDATE ON public.podcast_directories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate unique ticket numbers
CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_number TEXT;
  counter INT := 1;
BEGIN
  LOOP
    new_number := 'TKT-' || LPAD(counter::TEXT, 6, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.tickets WHERE ticket_number = new_number);
    counter := counter + 1;
  END LOOP;
  RETURN new_number;
END;
$$;

-- Trigger to auto-generate ticket numbers
CREATE OR REPLACE FUNCTION public.set_ticket_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
    NEW.ticket_number := public.generate_ticket_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER auto_ticket_number
BEFORE INSERT ON public.tickets
FOR EACH ROW
EXECUTE FUNCTION public.set_ticket_number();