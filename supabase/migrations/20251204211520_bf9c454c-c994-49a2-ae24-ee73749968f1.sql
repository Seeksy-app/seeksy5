-- Help Desk Module Schema
-- ticket_messages (threaded conversations)
CREATE TABLE IF NOT EXISTS public.ticket_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id),
  sender_type TEXT NOT NULL DEFAULT 'customer' CHECK (sender_type IN ('customer', 'agent', 'system', 'ai')),
  content TEXT NOT NULL,
  is_internal_note BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ticket_tags
CREATE TABLE IF NOT EXISTS public.ticket_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ticket_tag_assignments (many-to-many)
CREATE TABLE IF NOT EXISTS public.ticket_tag_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.ticket_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(ticket_id, tag_id)
);

-- ticket_attachments
CREATE TABLE IF NOT EXISTS public.ticket_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE,
  message_id UUID REFERENCES public.ticket_messages(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ticket_audit_log
CREATE TABLE IF NOT EXISTS public.ticket_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ticket_automations
CREATE TABLE IF NOT EXISTS public.ticket_automations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('ticket_created', 'ticket_updated', 'sla_breach', 'time_based')),
  conditions JSONB DEFAULT '{}',
  actions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ticket_templates (macros)
CREATE TABLE IF NOT EXISTS public.ticket_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  subject TEXT,
  content TEXT NOT NULL,
  shortcut_key TEXT,
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ticket_sla_policies
CREATE TABLE IF NOT EXISTS public.ticket_sla_policies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  priority TEXT NOT NULL,
  first_response_hours INTEGER NOT NULL,
  resolution_hours INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add SLA and metadata columns to tickets
ALTER TABLE public.tickets 
ADD COLUMN IF NOT EXISTS sla_policy_id UUID REFERENCES public.ticket_sla_policies(id),
ADD COLUMN IF NOT EXISTS first_response_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS sla_breach_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS channel TEXT DEFAULT 'web',
ADD COLUMN IF NOT EXISTS device_info JSONB,
ADD COLUMN IF NOT EXISTS browser_info JSONB,
ADD COLUMN IF NOT EXISTS ai_summary TEXT,
ADD COLUMN IF NOT EXISTS requester_email TEXT,
ADD COLUMN IF NOT EXISTS requester_name TEXT;

-- Enable RLS
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_tag_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_sla_policies ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admins
CREATE POLICY "Admins can manage ticket_messages" ON public.ticket_messages FOR ALL USING (user_has_any_role(auth.uid(), ARRAY['admin', 'super_admin']));
CREATE POLICY "Admins can manage ticket_tags" ON public.ticket_tags FOR ALL USING (user_has_any_role(auth.uid(), ARRAY['admin', 'super_admin']));
CREATE POLICY "Admins can manage ticket_tag_assignments" ON public.ticket_tag_assignments FOR ALL USING (user_has_any_role(auth.uid(), ARRAY['admin', 'super_admin']));
CREATE POLICY "Admins can manage ticket_attachments" ON public.ticket_attachments FOR ALL USING (user_has_any_role(auth.uid(), ARRAY['admin', 'super_admin']));
CREATE POLICY "Admins can view ticket_audit_log" ON public.ticket_audit_log FOR SELECT USING (user_has_any_role(auth.uid(), ARRAY['admin', 'super_admin']));
CREATE POLICY "Admins can manage ticket_automations" ON public.ticket_automations FOR ALL USING (user_has_any_role(auth.uid(), ARRAY['admin', 'super_admin']));
CREATE POLICY "Admins can manage ticket_templates" ON public.ticket_templates FOR ALL USING (user_has_any_role(auth.uid(), ARRAY['admin', 'super_admin']));
CREATE POLICY "Admins can manage ticket_sla_policies" ON public.ticket_sla_policies FOR ALL USING (user_has_any_role(auth.uid(), ARRAY['admin', 'super_admin']));

-- Insert audit log on ticket changes
CREATE OR REPLACE FUNCTION public.log_ticket_audit()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.ticket_audit_log (ticket_id, user_id, action, old_value, new_value)
  VALUES (
    COALESCE(NEW.id, OLD.id),
    auth.uid(),
    TG_OP,
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS ticket_audit_trigger ON public.tickets;
CREATE TRIGGER ticket_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.tickets
FOR EACH ROW EXECUTE FUNCTION public.log_ticket_audit();

-- Insert default SLA policies
INSERT INTO public.ticket_sla_policies (name, priority, first_response_hours, resolution_hours) VALUES
  ('Urgent SLA', 'urgent', 1, 4),
  ('High SLA', 'high', 4, 24),
  ('Medium SLA', 'medium', 8, 48),
  ('Low SLA', 'low', 24, 72)
ON CONFLICT DO NOTHING;

-- Insert default tags
INSERT INTO public.ticket_tags (name, color) VALUES
  ('Bug', '#ef4444'),
  ('Feature Request', '#3b82f6'),
  ('Billing', '#f59e0b'),
  ('Account', '#8b5cf6'),
  ('Technical', '#06b6d4'),
  ('General', '#6b7280')
ON CONFLICT (name) DO NOTHING;

-- Insert sample tickets for demo
INSERT INTO public.tickets (user_id, ticket_number, title, description, status, priority, category, source, channel, requester_email, requester_name)
SELECT 
  (SELECT id FROM auth.users LIMIT 1),
  'TKT-' || LPAD((ROW_NUMBER() OVER())::TEXT, 6, '0'),
  title,
  description,
  status,
  priority,
  category,
  'manual',
  'web',
  email,
  name
FROM (VALUES
  ('Cannot access my dashboard', 'I''m getting a 403 error when trying to access my creator dashboard. This started happening after the latest update.', 'open', 'high', 'Technical', 'john.doe@example.com', 'John Doe'),
  ('Billing question about subscription', 'I was charged twice for my monthly subscription. Can you please look into this and issue a refund?', 'in_progress', 'medium', 'Billing', 'jane.smith@example.com', 'Jane Smith'),
  ('Feature request: Dark mode', 'Would love to see a dark mode option for the entire platform. It would be easier on the eyes.', 'open', 'low', 'Feature Request', 'bob.wilson@example.com', 'Bob Wilson'),
  ('Podcast upload failing', 'Every time I try to upload my podcast episode, it fails at 95%. The file is 45MB MP3.', 'open', 'urgent', 'Technical', 'sarah.jones@example.com', 'Sarah Jones'),
  ('Need help with AI clips', 'How do I generate AI clips from my recordings? I can''t find the option in the studio.', 'resolved', 'medium', 'General', 'mike.brown@example.com', 'Mike Brown')
) AS t(title, description, status, priority, category, email, name)
WHERE NOT EXISTS (SELECT 1 FROM public.tickets WHERE ticket_number LIKE 'TKT-00000%' LIMIT 1);

-- Insert default templates
INSERT INTO public.ticket_templates (name, category, subject, content, shortcut_key) VALUES
  ('Greeting', 'General', NULL, 'Hi {{customer_name}},\n\nThank you for reaching out to Seeksy support. I''d be happy to help you with this.\n\n', 'G'),
  ('Closing - Resolved', 'General', NULL, 'I''m glad we could resolve this for you! If you have any other questions, feel free to reach out.\n\nBest regards,\nSeeksy Support', 'C'),
  ('Need More Info', 'General', NULL, 'To help you better, could you please provide the following information:\n\n1. \n2. \n3. \n\nThis will help us investigate and resolve your issue faster.', 'I'),
  ('Escalation Notice', 'Internal', NULL, '[INTERNAL] This ticket has been escalated to the engineering team for further investigation.', 'E'),
  ('Billing Refund', 'Billing', NULL, 'I''ve processed a refund for your account. You should see it reflected in your account within 5-7 business days.\n\nIs there anything else I can help you with?', 'R')
ON CONFLICT DO NOTHING;