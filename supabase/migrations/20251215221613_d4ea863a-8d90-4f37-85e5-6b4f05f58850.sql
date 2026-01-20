-- Create storage bucket for meeting recordings
INSERT INTO storage.buckets (id, name, public)
VALUES ('meeting-recordings', 'meeting-recordings', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for meeting recordings bucket
CREATE POLICY "Authenticated users can upload recordings"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'meeting-recordings');

CREATE POLICY "Authenticated users can read recordings"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'meeting-recordings');

-- Add AI notes columns to board_meeting_notes
ALTER TABLE public.board_meeting_notes
ADD COLUMN IF NOT EXISTS audio_file_url TEXT,
ADD COLUMN IF NOT EXISTS ai_notes_status TEXT DEFAULT 'none',
ADD COLUMN IF NOT EXISTS ai_summary_draft TEXT,
ADD COLUMN IF NOT EXISTS ai_decisions_draft JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS ai_action_items_draft JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS ai_agenda_recap_draft JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS ai_risks_draft TEXT,
ADD COLUMN IF NOT EXISTS ai_next_meeting_prep_draft TEXT,
ADD COLUMN IF NOT EXISTS ai_notes_published BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ai_notes_generated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS ai_notes_published_at TIMESTAMPTZ;