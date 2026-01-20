-- Podcast Agent Conversations (chat history)
CREATE TABLE public.podcast_agent_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  episode_id UUID REFERENCES public.episodes(id) ON DELETE SET NULL,
  podcast_id UUID REFERENCES public.podcasts(id) ON DELETE SET NULL,
  title TEXT NOT NULL DEFAULT 'New Conversation',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Agent Messages
CREATE TABLE public.podcast_agent_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.podcast_agent_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  action_type TEXT, -- 'outreach', 'research', 'outline', 'task', 'follow_up'
  action_data JSONB,
  action_status TEXT DEFAULT 'pending' CHECK (action_status IN ('pending', 'approved', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Episode Workspaces (central hub for episode prep)
CREATE TABLE public.podcast_episode_workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  episode_id UUID REFERENCES public.episodes(id) ON DELETE SET NULL,
  podcast_id UUID REFERENCES public.podcasts(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  topic TEXT,
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'outreach', 'confirmed', 'prep_complete', 'recorded', 'published')),
  guest_invited BOOLEAN DEFAULT false,
  research_complete BOOLEAN DEFAULT false,
  outline_complete BOOLEAN DEFAULT false,
  recording_scheduled BOOLEAN DEFAULT false,
  scheduled_date TIMESTAMPTZ,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Guest Research (AI-generated research for guests)
CREATE TABLE public.podcast_guest_research (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.podcast_episode_workspaces(id) ON DELETE CASCADE,
  guest_contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  guest_name TEXT NOT NULL,
  guest_title TEXT,
  guest_company TEXT,
  guest_bio TEXT,
  guest_linkedin TEXT,
  guest_website TEXT,
  background_summary TEXT,
  suggested_questions JSONB DEFAULT '[]',
  talking_points JSONB DEFAULT '[]',
  topic_breakdowns JSONB DEFAULT '[]',
  potential_soundbites JSONB DEFAULT '[]',
  research_sources JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Episode Outlines
CREATE TABLE public.podcast_episode_outlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.podcast_episode_workspaces(id) ON DELETE CASCADE,
  title_suggestions JSONB DEFAULT '[]',
  intro_script TEXT,
  outro_script TEXT,
  sections JSONB DEFAULT '[]', -- array of {title, summary, duration_minutes, talking_points}
  guest_bio_paragraph TEXT,
  cta_recommendations JSONB DEFAULT '[]',
  estimated_duration_minutes INTEGER,
  sponsor_slots JSONB DEFAULT '[]',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'in_use')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Guest Outreach Log
CREATE TABLE public.podcast_guest_outreach (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.podcast_episode_workspaces(id) ON DELETE CASCADE,
  guest_contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  guest_email TEXT NOT NULL,
  guest_name TEXT NOT NULL,
  email_subject TEXT NOT NULL,
  email_body TEXT NOT NULL,
  meeting_link TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'opened', 'replied', 'confirmed', 'declined', 'no_response')),
  sent_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  follow_up_count INTEGER DEFAULT 0,
  last_follow_up_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Agent Generated Tasks
CREATE TABLE public.podcast_agent_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.podcast_episode_workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT NOT NULL, -- 'guest_request', 'sponsor', 'reminder', 'prep', 'follow_up'
  due_date TIMESTAMPTZ,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  linked_task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.podcast_agent_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.podcast_agent_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.podcast_episode_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.podcast_guest_research ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.podcast_episode_outlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.podcast_guest_outreach ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.podcast_agent_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
CREATE POLICY "Users can manage own conversations" ON public.podcast_agent_conversations
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for messages
CREATE POLICY "Users can manage messages in own conversations" ON public.podcast_agent_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.podcast_agent_conversations c 
      WHERE c.id = conversation_id AND c.user_id = auth.uid()
    )
  );

-- RLS Policies for workspaces
CREATE POLICY "Users can manage own workspaces" ON public.podcast_episode_workspaces
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for research
CREATE POLICY "Users can manage research in own workspaces" ON public.podcast_guest_research
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.podcast_episode_workspaces w 
      WHERE w.id = workspace_id AND w.user_id = auth.uid()
    )
  );

-- RLS Policies for outlines
CREATE POLICY "Users can manage outlines in own workspaces" ON public.podcast_episode_outlines
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.podcast_episode_workspaces w 
      WHERE w.id = workspace_id AND w.user_id = auth.uid()
    )
  );

-- RLS Policies for outreach
CREATE POLICY "Users can manage outreach in own workspaces" ON public.podcast_guest_outreach
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.podcast_episode_workspaces w 
      WHERE w.id = workspace_id AND w.user_id = auth.uid()
    )
  );

-- RLS Policies for agent tasks
CREATE POLICY "Users can manage own agent tasks" ON public.podcast_agent_tasks
  FOR ALL USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_agent_conversations_user ON public.podcast_agent_conversations(user_id);
CREATE INDEX idx_agent_messages_conversation ON public.podcast_agent_messages(conversation_id);
CREATE INDEX idx_episode_workspaces_user ON public.podcast_episode_workspaces(user_id);
CREATE INDEX idx_guest_research_workspace ON public.podcast_guest_research(workspace_id);
CREATE INDEX idx_episode_outlines_workspace ON public.podcast_episode_outlines(workspace_id);
CREATE INDEX idx_guest_outreach_workspace ON public.podcast_guest_outreach(workspace_id);
CREATE INDEX idx_agent_tasks_workspace ON public.podcast_agent_tasks(workspace_id);

-- Update triggers
CREATE TRIGGER update_podcast_agent_conversations_updated_at
  BEFORE UPDATE ON public.podcast_agent_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_podcast_episode_workspaces_updated_at
  BEFORE UPDATE ON public.podcast_episode_workspaces
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_podcast_guest_research_updated_at
  BEFORE UPDATE ON public.podcast_guest_research
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_podcast_episode_outlines_updated_at
  BEFORE UPDATE ON public.podcast_episode_outlines
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_podcast_guest_outreach_updated_at
  BEFORE UPDATE ON public.podcast_guest_outreach
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_podcast_agent_tasks_updated_at
  BEFORE UPDATE ON public.podcast_agent_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();