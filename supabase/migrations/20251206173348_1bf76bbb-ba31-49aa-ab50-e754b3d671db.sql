-- Create AI Knowledge Base table for RAG
CREATE TABLE IF NOT EXISTS public.ai_knowledge_base (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_knowledge_base ENABLE ROW LEVEL SECURITY;

-- Allow read access for authenticated users (AI assistant needs to read)
CREATE POLICY "Anyone can read active knowledge base entries" 
ON public.ai_knowledge_base 
FOR SELECT 
USING (is_active = true);

-- Only admins can manage knowledge base
CREATE POLICY "Admins can manage knowledge base" 
ON public.ai_knowledge_base 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- Create index for faster category/tag searches
CREATE INDEX idx_ai_knowledge_base_category ON public.ai_knowledge_base(category);
CREATE INDEX idx_ai_knowledge_base_tags ON public.ai_knowledge_base USING GIN(tags);

-- Seed initial Seeksy knowledge base entries
INSERT INTO public.ai_knowledge_base (title, content, category, tags, priority) VALUES

-- Core Platform
('What is Seeksy', 'Seeksy is an all-in-one creator platform for podcasters, influencers, speakers, and agencies. It combines studio recording, podcast hosting, AI clips generation, CRM, events & ticketing, meetings scheduling, email/SMS marketing, awards programs, and monetization tools. Seeksy helps creators build, grow, and monetize their audience with professional tools.', 'platform', ARRAY['overview', 'intro', 'what is'], 100),

('Seeksy Workspaces', 'Workspaces in Seeksy allow users to organize their modules and projects. Each workspace acts as a container with its own set of activated modules. Users can create multiple workspaces for different projects (e.g., "My Podcast", "Client Work", "Personal Brand"). The Module Center (App Store) lets users add modules to their workspace. Modules can be primary (main sidebar items) or associated (grouped under primary modules).', 'platform', ARRAY['workspaces', 'modules', 'organization'], 90),

-- Creator Studio
('Creator Studio Overview', 'The Creator Studio is Seeksy''s professional recording and production suite. It includes: video/audio recording with guest invites, AI-powered post-production (noise reduction, filler word removal), automatic transcription, AI clips generation for social media, media library for all recordings. Access via /studio. The studio supports solo recording, interviews with guests, and live streaming to your My Page.', 'studio', ARRAY['studio', 'recording', 'video', 'audio'], 95),

('AI Post-Production', 'AI Post-Production enhances your recordings automatically. Features include: noise reduction, filler word removal (um, uh, like), silence trimming, audio normalization, and AI-powered chaptering. After recording, select your media and run AI enhancement. Results appear in your Media Library. Access via /studio/ai-post-production.', 'studio', ARRAY['ai', 'post-production', 'editing', 'enhance'], 85),

('AI Clips Generation', 'The AI Clips feature automatically identifies the best moments from your videos and creates short-form clips for social media. It analyzes for: hooks (engaging openers), value (key insights), flow (smooth segments), and trend potential. Each clip gets a virality score. Clips are rendered with captions and can be exported in multiple aspect ratios (9:16, 1:1, 16:9, 4:5). Access via /clips.', 'studio', ARRAY['clips', 'shorts', 'social media', 'ai'], 90),

('Media Library', 'The Media Library stores all your recordings, uploads, and generated clips. Organize with folders, search by title/tags, and view AI-generated metadata like chapters and transcripts. From here you can: run AI post-production, generate clips, view analytics, and export to social platforms. Access via /studio/media.', 'studio', ARRAY['media', 'library', 'files', 'storage'], 80),

-- Podcasts
('Podcast Hosting', 'Seeksy provides full podcast hosting with RSS feed generation for distribution to Apple Podcasts, Spotify, and other platforms. Create a podcast, add episodes (upload or record in Studio), and publish. Episodes can include show notes, transcripts, and ad markers. Each podcast gets a unique RSS feed URL for directory submission. Access via /podcasts.', 'podcasts', ARRAY['podcast', 'rss', 'hosting', 'episodes'], 90),

('Episode Creation', 'Create episodes by: 1) Recording in Studio and sending to your podcast, 2) Uploading existing audio/video files, or 3) Selecting from your Media Library. Each episode includes title, description, show notes, transcript, publish date, and season/episode numbers. Episodes can be drafts or published. Access via your podcast page → Create Episode.', 'podcasts', ARRAY['episodes', 'create', 'publish'], 85),

-- Meetings & Scheduling
('Meetings & Scheduling', 'The Meetings module (powered by Mia) lets you create meeting types (consultations, interviews, demos), set availability, and share booking links. Attendees book directly on your calendar with automatic confirmations via email/SMS. Meetings can be virtual (Zoom, Daily) or in-person. Integration with Google Calendar syncs your availability. Access via /meetings.', 'meetings', ARRAY['meetings', 'scheduling', 'mia', 'booking', 'calendar'], 90),

('Meeting Types', 'Meeting types define your available booking options. Examples: "30-min Consultation", "1-hour Strategy Session", "Podcast Guest Interview". Configure: duration, buffer time, availability windows, location (virtual/in-person), questions for attendees, and confirmation messages. Create at /meetings/types/create.', 'meetings', ARRAY['meeting types', 'booking links', 'availability'], 85),

-- CRM & Contacts
('CRM & Contacts', 'Seeksy''s CRM manages all your contacts, leads, and audience. Contacts are automatically created when someone books a meeting, registers for an event, or subscribes. Organize with segments, tags, and custom fields. Track lead status and pipeline stages. Export contacts or import via CSV. Access via /audience or /crm.', 'crm', ARRAY['crm', 'contacts', 'leads', 'audience'], 85),

-- Events & Ticketing
('Events & Ticketing', 'Create and manage events with Seeksy''s event system. Supports: live, virtual, and hybrid events; free, ticketed, or donation-based pricing; multiple ticket tiers; custom registration forms; QR code check-in; session schedules. Integrates with your CRM to track attendees. Access via /events.', 'events', ARRAY['events', 'ticketing', 'registration'], 85),

-- Marketing
('Email & SMS Marketing', 'Send email campaigns and SMS messages to your contacts and segments. Use templates or create custom designs. Track opens, clicks, and conversions. Automations can trigger messages based on events (new signup, abandoned booking, etc.). Access emails at /email/inbox, campaigns at /marketing/campaigns.', 'marketing', ARRAY['email', 'sms', 'campaigns', 'marketing', 'automation'], 85),

('Newsletters', 'Build and send newsletters to your subscribers. Drag-and-drop builder, blog post embedding, subscriber management with import/export. Schedule sends and track engagement. Access via /newsletters.', 'marketing', ARRAY['newsletter', 'subscribers', 'blog'], 80),

-- Awards & Programs
('Awards Programs', 'Create and manage awards programs with nominations, voting, and judging. Features: public nomination forms, judge assignments, scoring rubrics, voting sessions (public or VIP), category management, and ceremony tools. Track sponsorships and automate winner notifications. Access via /awards.', 'awards', ARRAY['awards', 'nominations', 'voting', 'judges'], 80),

-- Identity & Verification
('Voice & Face Verification', 'Seeksy''s Identity system lets creators verify their voice and face for authenticity. Voice verification creates a unique voice fingerprint; face verification uses AI to generate a face hash. Both are certified on the Polygon blockchain, creating an immutable proof of identity. This protects against deepfakes and unauthorized use. Access via /identity.', 'identity', ARRAY['identity', 'verification', 'voice', 'face', 'blockchain'], 85),

-- Monetization
('Monetization & Ads', 'Seeksy helps creators monetize through: ad revenue sharing on podcasts, paid events/tickets, digital products, paid consultations, sponsorship deals. The Monetization Hub tracks your earnings across all streams. Advertisers can book ad slots in your content. Access via /monetization.', 'monetization', ARRAY['monetization', 'ads', 'revenue', 'earnings'], 85),

-- My Page
('My Page / Creator Profile', 'My Page is your public creator profile at seeksy.io/[username]. Customize sections: bio, featured content, videos, podcasts, events, booking links, social links, and more. Visitors can book meetings, register for events, and explore your content. Edit at /profile/edit.', 'my-page', ARRAY['my page', 'profile', 'public', 'portfolio'], 85),

-- Navigation & Help
('Finding Features', 'Key navigation: My Day (dashboard) → /my-day, Studio → /studio, Podcasts → /podcasts, Meetings → /meetings, Events → /events, CRM/Contacts → /audience, Marketing → /email/inbox, Awards → /awards, Identity → /identity, Settings → /settings. Use the Module Center (+ button in sidebar) to add new modules to your workspace.', 'navigation', ARRAY['navigation', 'find', 'where', 'how to'], 90),

('Getting Help', 'For support: 1) Ask the AI Agent (me!) for quick answers, 2) Visit Help Center at /help, 3) Contact support via the chat widget or /contact, 4) Create a support ticket by telling me "I need help" with your issue. We respond within 24 hours.', 'support', ARRAY['help', 'support', 'contact', 'ticket'], 80)

ON CONFLICT DO NOTHING;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_ai_knowledge_base_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_ai_knowledge_base_timestamp
  BEFORE UPDATE ON public.ai_knowledge_base
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ai_knowledge_base_updated_at();