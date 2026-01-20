-- Create ai_jobs table for tracking all AI operations
CREATE TABLE IF NOT EXISTS ai_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_media_id UUID REFERENCES media_files(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL CHECK (job_type IN ('full_enhancement', 'ai_camera_focus', 'cleanup', 'clips_generation', 'transcript', 'analysis')),
  engine TEXT NOT NULL DEFAULT 'lovable_ai' CHECK (engine IN ('lovable_ai', 'openai', 'gemini', 'internal')),
  params JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  processing_time_seconds NUMERIC
);

-- Create ai_edited_assets table for storing AI-processed outputs
CREATE TABLE IF NOT EXISTS ai_edited_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_media_id UUID NOT NULL REFERENCES media_files(id) ON DELETE CASCADE,
  ai_job_id UUID NOT NULL REFERENCES ai_jobs(id) ON DELETE CASCADE,
  output_type TEXT NOT NULL CHECK (output_type IN ('video', 'audio', 'clip', 'short', 'enhanced')),
  storage_path TEXT NOT NULL,
  duration_seconds NUMERIC,
  thumbnail_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create clips table for AI-generated clips
CREATE TABLE IF NOT EXISTS clips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_media_id UUID NOT NULL REFERENCES media_files(id) ON DELETE CASCADE,
  ai_job_id UUID REFERENCES ai_jobs(id) ON DELETE SET NULL,
  start_seconds NUMERIC NOT NULL,
  end_seconds NUMERIC NOT NULL,
  duration_seconds NUMERIC GENERATED ALWAYS AS (end_seconds - start_seconds) STORED,
  storage_path TEXT,
  title TEXT,
  suggested_caption TEXT,
  virality_score INTEGER CHECK (virality_score >= 0 AND virality_score <= 100),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'ready', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create ai_edit_events table for tracking individual edit operations
CREATE TABLE IF NOT EXISTS ai_edit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ai_job_id UUID NOT NULL REFERENCES ai_jobs(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('camera_switch', 'trim', 'zoom', 'color_grade', 'audio_enhance', 'stabilize', 'denoise')),
  timestamp_seconds NUMERIC,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS Policies for ai_jobs
ALTER TABLE ai_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own AI jobs"
  ON ai_jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own AI jobs"
  ON ai_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all AI jobs"
  ON ai_jobs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- RLS Policies for ai_edited_assets
ALTER TABLE ai_edited_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own AI edited assets"
  ON ai_edited_assets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM media_files
      WHERE media_files.id = ai_edited_assets.source_media_id
      AND media_files.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own AI edited assets"
  ON ai_edited_assets FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM media_files
      WHERE media_files.id = ai_edited_assets.source_media_id
      AND media_files.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all AI edited assets"
  ON ai_edited_assets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- RLS Policies for clips
ALTER TABLE clips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own clips"
  ON clips FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own clips"
  ON clips FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clips"
  ON clips FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all clips"
  ON clips FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- RLS Policies for ai_edit_events
ALTER TABLE ai_edit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view edit events for their jobs"
  ON ai_edit_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ai_jobs
      WHERE ai_jobs.id = ai_edit_events.ai_job_id
      AND ai_jobs.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all edit events"
  ON ai_edit_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Create indexes for performance
CREATE INDEX idx_ai_jobs_user_id ON ai_jobs(user_id);
CREATE INDEX idx_ai_jobs_source_media_id ON ai_jobs(source_media_id);
CREATE INDEX idx_ai_jobs_status ON ai_jobs(status);
CREATE INDEX idx_ai_edited_assets_source_media_id ON ai_edited_assets(source_media_id);
CREATE INDEX idx_ai_edited_assets_ai_job_id ON ai_edited_assets(ai_job_id);
CREATE INDEX idx_clips_user_id ON clips(user_id);
CREATE INDEX idx_clips_source_media_id ON clips(source_media_id);
CREATE INDEX idx_clips_status ON clips(status);
CREATE INDEX idx_ai_edit_events_ai_job_id ON ai_edit_events(ai_job_id);