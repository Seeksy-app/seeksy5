-- Add role column to email_signatures for Admin vs Creator distinction
ALTER TABLE public.email_signatures 
ADD COLUMN IF NOT EXISTS role text DEFAULT 'creator';

-- Create index for role-based queries
CREATE INDEX IF NOT EXISTS idx_email_signatures_role ON public.email_signatures(role);

-- Update existing signatures to be 'creator' role (already default, but explicit)
UPDATE public.email_signatures SET role = 'creator' WHERE role IS NULL;

-- Add check constraint for valid roles
ALTER TABLE public.email_signatures
ADD CONSTRAINT email_signatures_role_check 
CHECK (role IN ('creator', 'admin'));