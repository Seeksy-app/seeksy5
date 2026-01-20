-- Add fields to rss_migrations table for the comprehensive migration wizard
ALTER TABLE public.rss_migrations
ADD COLUMN IF NOT EXISTS host_type TEXT CHECK (host_type IN ('seeksy_managed', 'third_party', 'self_hosted')),
ADD COLUMN IF NOT EXISTS third_party_platform TEXT,
ADD COLUMN IF NOT EXISTS migration_step TEXT DEFAULT 'input_urls' CHECK (migration_step IN ('input_urls', 'host_detection', 'redirect_setup', 'verification', 'complete')),
ADD COLUMN IF NOT EXISTS redirect_status TEXT DEFAULT 'pending' CHECK (redirect_status IN ('pending', 'active', 'failed', 'not_configured')),
ADD COLUMN IF NOT EXISTS redirect_verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_check_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS user_notes TEXT;

-- Create table for platform-specific redirect instructions
CREATE TABLE IF NOT EXISTS public.rss_redirect_instructions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_name TEXT NOT NULL UNIQUE,
  platform_display_name TEXT NOT NULL,
  instructions TEXT NOT NULL,
  help_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on redirect instructions
ALTER TABLE public.rss_redirect_instructions ENABLE ROW LEVEL SECURITY;

-- Anyone can read instructions
CREATE POLICY "Anyone can read redirect instructions"
ON public.rss_redirect_instructions
FOR SELECT
USING (true);

-- Insert common podcast host instructions
INSERT INTO public.rss_redirect_instructions (platform_name, platform_display_name, instructions, help_url) VALUES
('anchor', 'Anchor / Spotify for Podcasters', 'Go to Settings → Distribution → Redirect feed. Enter your new Seeksy RSS feed URL and save.', 'https://support.spotify.com/us/podcasters/article/redirect-your-rss-feed/'),
('libsyn', 'Libsyn', 'Log into Libsyn → Destinations → Advanced → Feed Redirect. Enter your new Seeksy RSS URL and click Save.', 'https://support.libsyn.com/kb/how-do-i-redirect-my-rss-feed/'),
('buzzsprout', 'Buzzsprout', 'Go to Settings → Redirect Feed. Enter your new Seeksy RSS feed URL and click Save Redirect.', 'https://www.buzzsprout.com/help/67-redirecting-your-podcast-feed'),
('podbean', 'Podbean', 'Go to Settings → Advanced → Feed Redirect. Enter your new RSS URL and save.', 'https://help.podbean.com/support/solutions/articles/25000008131-how-to-redirect-your-rss-feed'),
('simplecast', 'Simplecast', 'Go to Settings → Distribution → Redirect RSS Feed. Enter your new feed URL and confirm.', 'https://help.simplecast.com/en/articles/2779031-how-to-redirect-your-rss-feed'),
('transistor', 'Transistor', 'Go to Settings → Private Feed → Redirect to a new RSS feed. Enter your new Seeksy URL.', 'https://support.transistor.fm/en/articles/1739885-how-to-redirect-your-rss-feed'),
('spreaker', 'Spreaker', 'Go to Settings → Distribution → Feed Redirect. Enter your new RSS URL.', 'https://help.spreaker.com/hc/en-us/articles/360000862153-How-to-redirect-your-RSS-feed'),
('captivate', 'Captivate', 'Go to Distribution → Migrate Your Show. Follow the redirect wizard with your new Seeksy URL.', 'https://support.captivate.fm/en/articles/3484978-moving-your-podcast-to-captivate'),
('blubrry', 'Blubrry', 'In your WordPress dashboard with PowerPress, go to PowerPress → Migrate & Redirects. Set up 301 redirect to your new Seeksy feed.', 'https://create.blubrry.com/resources/podcast-media-download-statistics/advanced-statistics-BluBrry-redirect/'),
('soundcloud', 'SoundCloud', 'Go to Settings → RSS Feed → Redirect Feed. Enter your new Seeksy RSS URL.', NULL),
('megaphone', 'Megaphone (Spotify)', 'Contact Megaphone support to set up feed redirect to your new Seeksy RSS URL.', 'https://help.megaphone.fm/'),
('acast', 'Acast', 'Go to Settings → Feed Settings → Redirect Feed. Enter your new Seeksy feed URL.', 'https://help.acast.com/'),
('other', 'Other / Unknown Host', 'Contact your current podcast hosting provider''s support team and ask them to set up a 301 redirect from your old RSS feed URL to your new Seeksy RSS feed URL.', NULL)
ON CONFLICT (platform_name) DO NOTHING;