-- Create video pages table for gated collections
CREATE TABLE public.video_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  is_private BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create video page access allowlist
CREATE TABLE public.video_page_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID NOT NULL REFERENCES public.video_pages(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(page_id, email)
);

-- Create video page to videos junction
CREATE TABLE public.video_page_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID NOT NULL REFERENCES public.video_pages(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES public.demo_videos(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(page_id, video_id)
);

-- Enable RLS
ALTER TABLE public.video_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_page_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_page_videos ENABLE ROW LEVEL SECURITY;

-- Public read for video_pages (needed for public access)
CREATE POLICY "Anyone can view video pages" ON public.video_pages
  FOR SELECT USING (true);

-- Public read for video_page_access (needed for email validation)
CREATE POLICY "Anyone can check access" ON public.video_page_access
  FOR SELECT USING (true);

-- Public read for video_page_videos
CREATE POLICY "Anyone can view page videos" ON public.video_page_videos
  FOR SELECT USING (true);

-- Admin write policies
CREATE POLICY "Admins can manage video pages" ON public.video_pages
  FOR ALL USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can manage access" ON public.video_page_access
  FOR ALL USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can manage page videos" ON public.video_page_videos
  FOR ALL USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- Seed alchify page
INSERT INTO public.video_pages (slug, title, description, is_private)
VALUES ('alchify', 'Alchify Demo Videos', 'Private demo videos for Alchify partners', true);

-- Updated at trigger
CREATE TRIGGER update_video_pages_updated_at
  BEFORE UPDATE ON public.video_pages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();