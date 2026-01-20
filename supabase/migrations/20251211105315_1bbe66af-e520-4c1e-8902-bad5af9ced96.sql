
-- Board member activity tracking
CREATE TABLE public.board_member_activity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL, -- 'login', 'video_watch', 'share', 'page_view'
  activity_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.board_member_activity ENABLE ROW LEVEL SECURITY;

-- Super admins can view all activity
CREATE POLICY "Super admins can view board activity"
ON public.board_member_activity
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('super_admin', 'platform_owner')
  )
);

-- Board members can insert their own activity
CREATE POLICY "Board members can log their own activity"
ON public.board_member_activity
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create indexes for efficient querying
CREATE INDEX idx_board_activity_user_id ON public.board_member_activity(user_id);
CREATE INDEX idx_board_activity_type ON public.board_member_activity(activity_type);
CREATE INDEX idx_board_activity_created_at ON public.board_member_activity(created_at DESC);
