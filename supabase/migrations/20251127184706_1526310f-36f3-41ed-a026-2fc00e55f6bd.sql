-- Enable RLS on creator_voice_profiles if not already enabled
ALTER TABLE public.creator_voice_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own voice profiles" ON public.creator_voice_profiles;
DROP POLICY IF EXISTS "Users can insert their own voice profiles" ON public.creator_voice_profiles;
DROP POLICY IF EXISTS "Users can update their own voice profiles" ON public.creator_voice_profiles;
DROP POLICY IF EXISTS "Users can delete their own voice profiles" ON public.creator_voice_profiles;

-- Allow users to view their own voice profiles
CREATE POLICY "Users can view their own voice profiles"
ON public.creator_voice_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to insert their own voice profiles
CREATE POLICY "Users can insert their own voice profiles"
ON public.creator_voice_profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own voice profiles
CREATE POLICY "Users can update their own voice profiles"
ON public.creator_voice_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to delete their own voice profiles
CREATE POLICY "Users can delete their own voice profiles"
ON public.creator_voice_profiles
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);