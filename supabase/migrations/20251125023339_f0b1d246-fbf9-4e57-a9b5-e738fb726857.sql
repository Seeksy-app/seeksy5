-- Add dismissed_dependency_warnings column to user_preferences
ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS dismissed_dependency_warnings TEXT[] DEFAULT '{}'::TEXT[];