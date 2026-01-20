-- Create subscriber_lists table
CREATE TABLE public.subscriber_lists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create subscriber_list_members junction table
CREATE TABLE public.subscriber_list_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subscriber_id UUID NOT NULL REFERENCES public.newsletter_subscribers(id) ON DELETE CASCADE,
  list_id UUID NOT NULL REFERENCES public.subscriber_lists(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(subscriber_id, list_id)
);

-- Enable RLS
ALTER TABLE public.subscriber_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriber_list_members ENABLE ROW LEVEL SECURITY;

-- RLS policies for subscriber_lists (admin access)
CREATE POLICY "Admins can manage subscriber lists"
ON public.subscriber_lists
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'super_admin', 'platform_owner')
  )
);

-- RLS policies for subscriber_list_members (admin access)
CREATE POLICY "Admins can manage list members"
ON public.subscriber_list_members
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'super_admin', 'platform_owner')
  )
);

-- Allow public insert for subscription flow (edge function will handle)
CREATE POLICY "Allow public insert for subscriptions"
ON public.subscriber_list_members
FOR INSERT
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_subscriber_list_members_subscriber ON public.subscriber_list_members(subscriber_id);
CREATE INDEX idx_subscriber_list_members_list ON public.subscriber_list_members(list_id);
CREATE INDEX idx_subscriber_lists_slug ON public.subscriber_lists(slug);

-- Seed default lists
INSERT INTO public.subscriber_lists (name, slug) VALUES
  ('Blog Newsletter', 'blog_newsletter'),
  ('General Newsletter', 'general_newsletter'),
  ('Creators', 'creators'),
  ('Admins', 'admins'),
  ('Board Members', 'board_members');