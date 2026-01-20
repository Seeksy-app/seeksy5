-- Add credit_goal column to user_credits table
ALTER TABLE public.user_credits 
ADD COLUMN IF NOT EXISTS credit_goal INTEGER DEFAULT 100;

-- Update existing records to have a default goal
UPDATE public.user_credits 
SET credit_goal = 100 
WHERE credit_goal IS NULL;