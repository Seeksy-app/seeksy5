
-- Create campaign_email_messages table
CREATE TABLE public.campaign_email_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  campaign_id UUID REFERENCES public.campaign_candidates(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  recipient_list JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'draft',
  sent_at TIMESTAMP WITH TIME ZONE,
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create campaign_sms_messages table
CREATE TABLE public.campaign_sms_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  campaign_id UUID REFERENCES public.campaign_candidates(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  recipient_list JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'draft',
  sent_at TIMESTAMP WITH TIME ZONE,
  delivery_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create campaign_livestream_sessions table
CREATE TABLE public.campaign_livestream_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  campaign_id UUID REFERENCES public.campaign_candidates(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  stream_key TEXT,
  playback_url TEXT,
  status TEXT DEFAULT 'scheduled',
  scheduled_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  viewer_count INTEGER DEFAULT 0,
  replay_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create campaign_donations table
CREATE TABLE public.campaign_donations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  campaign_id UUID REFERENCES public.campaign_candidates(id) ON DELETE CASCADE,
  donor_name TEXT,
  donor_email TEXT,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  is_recurring BOOLEAN DEFAULT false,
  stripe_payment_intent_id TEXT,
  status TEXT DEFAULT 'pending',
  donated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.campaign_email_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_sms_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_livestream_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_donations ENABLE ROW LEVEL SECURITY;

-- RLS policies for campaign_email_messages
CREATE POLICY "Users can view their own email messages" ON public.campaign_email_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own email messages" ON public.campaign_email_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own email messages" ON public.campaign_email_messages FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own email messages" ON public.campaign_email_messages FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for campaign_sms_messages
CREATE POLICY "Users can view their own sms messages" ON public.campaign_sms_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own sms messages" ON public.campaign_sms_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own sms messages" ON public.campaign_sms_messages FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own sms messages" ON public.campaign_sms_messages FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for campaign_livestream_sessions
CREATE POLICY "Users can view their own livestream sessions" ON public.campaign_livestream_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own livestream sessions" ON public.campaign_livestream_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own livestream sessions" ON public.campaign_livestream_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own livestream sessions" ON public.campaign_livestream_sessions FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for campaign_donations
CREATE POLICY "Users can view their own donations" ON public.campaign_donations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own donations" ON public.campaign_donations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own donations" ON public.campaign_donations FOR UPDATE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_campaign_email_messages_user_id ON public.campaign_email_messages(user_id);
CREATE INDEX idx_campaign_email_messages_campaign_id ON public.campaign_email_messages(campaign_id);
CREATE INDEX idx_campaign_sms_messages_user_id ON public.campaign_sms_messages(user_id);
CREATE INDEX idx_campaign_sms_messages_campaign_id ON public.campaign_sms_messages(campaign_id);
CREATE INDEX idx_campaign_livestream_sessions_user_id ON public.campaign_livestream_sessions(user_id);
CREATE INDEX idx_campaign_livestream_sessions_campaign_id ON public.campaign_livestream_sessions(campaign_id);
CREATE INDEX idx_campaign_donations_user_id ON public.campaign_donations(user_id);
CREATE INDEX idx_campaign_donations_campaign_id ON public.campaign_donations(campaign_id);
