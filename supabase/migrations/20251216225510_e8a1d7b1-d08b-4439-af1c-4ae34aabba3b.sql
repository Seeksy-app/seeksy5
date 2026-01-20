
-- Create board_notifications table that the trigger expects
CREATE TABLE IF NOT EXISTS public.board_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  related_entity_id UUID,
  related_entity_type TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.board_notifications ENABLE ROW LEVEL SECURITY;

-- Allow board members to read notifications
CREATE POLICY "Board members can view notifications" 
ON public.board_notifications 
FOR SELECT 
USING (true);
