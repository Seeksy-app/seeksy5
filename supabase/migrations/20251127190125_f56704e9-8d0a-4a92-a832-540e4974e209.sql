-- Fix RLS policies for creator_voice_profiles
-- Remove duplicate/conflicting INSERT policy with public role
DROP POLICY IF EXISTS "Users can create their own voice profiles" ON public.creator_voice_profiles;

-- Ensure the authenticated role policies are correct
-- The remaining INSERT policy "Users can insert their own voice profiles" should work correctly