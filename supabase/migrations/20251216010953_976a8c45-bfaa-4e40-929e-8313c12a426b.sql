-- Add load sharing feature for agents to share loads with other agents for editing
-- Creates a junction table to track which agents have edit access to which loads

CREATE TABLE IF NOT EXISTS public.trucking_load_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  load_id uuid REFERENCES public.trucking_loads(id) ON DELETE CASCADE NOT NULL,
  shared_with_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  shared_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  can_edit boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(load_id, shared_with_user_id)
);

-- Enable RLS
ALTER TABLE public.trucking_load_shares ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view shares for loads they own or are shared with
CREATE POLICY "trucking_load_shares_select" 
ON public.trucking_load_shares 
FOR SELECT 
TO authenticated
USING (
  shared_with_user_id = auth.uid() 
  OR shared_by_user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.trucking_loads 
    WHERE id = load_id AND owner_id = auth.uid()
  )
);

-- Policy: Load owners can create shares
CREATE POLICY "trucking_load_shares_insert" 
ON public.trucking_load_shares 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.trucking_loads 
    WHERE id = load_id AND owner_id = auth.uid()
  )
);

-- Policy: Load owners can delete shares
CREATE POLICY "trucking_load_shares_delete" 
ON public.trucking_load_shares 
FOR DELETE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.trucking_loads 
    WHERE id = load_id AND owner_id = auth.uid()
  )
);

-- Update trucking_loads RLS policy to allow shared users to update
DROP POLICY IF EXISTS "trucking_loads_update_all" ON public.trucking_loads;

CREATE POLICY "trucking_loads_update_own_or_shared" 
ON public.trucking_loads 
FOR UPDATE 
TO authenticated
USING (
  owner_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.trucking_load_shares 
    WHERE load_id = id 
    AND shared_with_user_id = auth.uid() 
    AND can_edit = true
  )
);

-- Update trucking_loads select policy to include shared loads
DROP POLICY IF EXISTS "trucking_loads_select_own" ON public.trucking_loads;

CREATE POLICY "trucking_loads_select_own_or_shared" 
ON public.trucking_loads 
FOR SELECT 
TO authenticated
USING (
  owner_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.trucking_load_shares 
    WHERE load_id = id 
    AND shared_with_user_id = auth.uid()
  )
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_trucking_load_shares_shared_with ON public.trucking_load_shares(shared_with_user_id);
CREATE INDEX IF NOT EXISTS idx_trucking_load_shares_load_id ON public.trucking_load_shares(load_id);