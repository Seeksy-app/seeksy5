-- Create table for creator Shopify connections
CREATE TABLE IF NOT EXISTS public.creator_shopify_stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_domain TEXT NOT NULL, -- e.g., "mystore.myshopify.com"
  storefront_access_token TEXT NOT NULL, -- Shopify Storefront API token
  admin_access_token TEXT, -- Optional: for admin API access
  is_active BOOLEAN DEFAULT true,
  store_name TEXT,
  store_email TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.creator_shopify_stores ENABLE ROW LEVEL SECURITY;

-- Policies: Creators can manage their own store connection
CREATE POLICY "Users can view their own Shopify store"
  ON public.creator_shopify_stores
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own Shopify store"
  ON public.creator_shopify_stores
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Shopify store"
  ON public.creator_shopify_stores
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Shopify store"
  ON public.creator_shopify_stores
  FOR DELETE
  USING (auth.uid() = user_id);

-- Update timestamp trigger
CREATE TRIGGER update_creator_shopify_stores_updated_at
  BEFORE UPDATE ON public.creator_shopify_stores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();