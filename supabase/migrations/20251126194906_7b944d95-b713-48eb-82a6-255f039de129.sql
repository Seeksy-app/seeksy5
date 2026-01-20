-- Create table for app audio descriptions
CREATE TABLE public.app_audio_descriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id TEXT NOT NULL UNIQUE,
  app_name TEXT NOT NULL,
  script TEXT NOT NULL,
  audio_url TEXT,
  voice_id TEXT DEFAULT 'cgSgspJ2msm6clMCkdW9',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_audio_descriptions ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read audio descriptions
CREATE POLICY "Anyone can view app audio descriptions"
  ON public.app_audio_descriptions
  FOR SELECT
  USING (true);

-- Only admins can manage audio descriptions
CREATE POLICY "Admins can manage app audio descriptions"
  ON public.app_audio_descriptions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_app_audio_descriptions_updated_at
  BEFORE UPDATE ON public.app_audio_descriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default scripts for all apps
INSERT INTO public.app_audio_descriptions (app_id, app_name, script) VALUES
  ('dashboard', 'Dashboard', 'Your command center. View analytics, track activities, and manage your entire Seeksy workspace from one powerful dashboard.'),
  ('my-page', 'My Page', 'Your personal landing page. Share your bio, links, and content with the world. It''s your digital business card, all in one place.'),
  ('bio', 'Bio', 'Create stunning bio pages that showcase who you are. Add links, social profiles, and make it uniquely yours.'),
  ('meetings', 'Meetings', 'Schedule and manage meetings effortlessly. Set your availability, send invitations, and never miss an important conversation.'),
  ('events', 'Events', 'Host amazing events. Create, promote, and manage registrations all in one place. Perfect for workshops, webinars, and gatherings.'),
  ('signups', 'Sign-ups', 'Coordinate volunteers and participants with beautiful sign-up sheets. Perfect for events, projects, and team activities.'),
  ('polls', 'Polls', 'Engage your audience with interactive polls. Get instant feedback and make data-driven decisions.'),
  ('forms', 'Forms', 'Capture leads and gather information with custom forms. Perfect for sales teams and field staff.'),
  ('media', 'Media', 'Your complete media suite. Record in studio, manage your library, and create clips. Everything you need for content creation.'),
  ('podcasts', 'Podcasts', 'Launch and grow your podcast. Host episodes, generate RSS feeds, and distribute to all major platforms.'),
  ('clips', 'Generate Clips', 'Transform long videos into viral short clips. AI-powered editing makes it fast and easy.'),
  ('post-production', 'Post Production Studio', 'Professional video editing powered by AI. Add B-roll, lower thirds, remove filler words, and more.'),
  ('marketing', 'Marketing', 'Run email campaigns, create sequences, and engage your audience. Everything you need for marketing success.'),
  ('contacts', 'Contacts', 'Your CRM hub. Manage contacts, track leads, and build meaningful relationships with your audience.'),
  ('pm', 'Project Management', 'Manage clients, track tickets, and send proposals. Perfect for service businesses and freelancers.'),
  ('ai-assistant', 'AI Assistant', 'Your personal AI helper. Get instant answers, automate tasks, and work smarter across Seeksy.'),
  ('apps', 'Apps', 'Discover and activate powerful tools. Customize your Seeksy experience with apps that match your workflow.');
