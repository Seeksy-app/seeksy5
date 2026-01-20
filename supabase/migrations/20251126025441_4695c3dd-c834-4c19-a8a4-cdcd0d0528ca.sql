-- Create table for meeting transcripts and AI-generated content
CREATE TABLE IF NOT EXISTS public.meeting_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  transcript TEXT,
  summary TEXT,
  key_takeaways TEXT[],
  action_items JSONB DEFAULT '[]'::jsonb,
  decisions TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.meeting_intelligence ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view intelligence for their own meetings
CREATE POLICY "Users can view their meeting intelligence"
  ON public.meeting_intelligence
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.meetings
      WHERE meetings.id = meeting_intelligence.meeting_id
      AND meetings.user_id = auth.uid()
    )
  );

-- Policy: Users can insert intelligence for their own meetings
CREATE POLICY "Users can insert their meeting intelligence"
  ON public.meeting_intelligence
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.meetings
      WHERE meetings.id = meeting_intelligence.meeting_id
      AND meetings.user_id = auth.uid()
    )
  );

-- Policy: Users can update intelligence for their own meetings
CREATE POLICY "Users can update their meeting intelligence"
  ON public.meeting_intelligence
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.meetings
      WHERE meetings.id = meeting_intelligence.meeting_id
      AND meetings.user_id = auth.uid()
    )
  );

-- Create index for faster lookups
CREATE INDEX idx_meeting_intelligence_meeting_id ON public.meeting_intelligence(meeting_id);

-- Create trigger for updated_at
CREATE TRIGGER update_meeting_intelligence_updated_at
  BEFORE UPDATE ON public.meeting_intelligence
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add AI notes visibility preference to meetings table
ALTER TABLE public.meetings
ADD COLUMN IF NOT EXISTS show_ai_notes BOOLEAN DEFAULT true;

-- Add recording URL to meetings table
ALTER TABLE public.meetings
ADD COLUMN IF NOT EXISTS recording_url TEXT;