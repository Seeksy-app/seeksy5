-- Add sources jsonb column for article sources
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS sources jsonb DEFAULT '[]'::jsonb;

-- Add subscription gating flag (default true = gated)
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS is_subscription_gated boolean DEFAULT true;

-- Add generation_batch_id for debugging
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS generation_batch_id uuid;