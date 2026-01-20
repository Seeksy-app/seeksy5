-- Digital Products Tables

-- Products table
CREATE TABLE public.digital_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  product_type TEXT NOT NULL DEFAULT 'digital', -- 'digital', 'template', 'ebook', 'music', 'video', 'software', 'other'
  file_url TEXT, -- Supabase Storage URL
  file_name TEXT,
  file_size_bytes BIGINT,
  file_type TEXT,
  thumbnail_url TEXT,
  preview_url TEXT, -- For previewing before purchase
  is_active BOOLEAN DEFAULT true,
  download_limit INTEGER, -- NULL = unlimited
  stripe_product_id TEXT,
  stripe_price_id TEXT,
  total_sales INTEGER DEFAULT 0,
  total_revenue DECIMAL(10,2) DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Purchases table
CREATE TABLE public.digital_product_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.digital_products(id) ON DELETE CASCADE,
  buyer_user_id UUID, -- NULL if purchased by non-user
  buyer_email TEXT NOT NULL,
  buyer_name TEXT,
  purchase_amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  stripe_payment_intent_id TEXT,
  stripe_customer_id TEXT,
  download_count INTEGER DEFAULT 0,
  download_limit INTEGER, -- Copy from product at time of purchase
  last_downloaded_at TIMESTAMPTZ,
  purchased_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ, -- Optional expiration for time-limited access
  status TEXT DEFAULT 'completed', -- 'pending', 'completed', 'refunded', 'expired'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.digital_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_product_purchases ENABLE ROW LEVEL SECURITY;

-- Digital Products Policies
CREATE POLICY "Users can view their own products"
  ON public.digital_products FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own products"
  ON public.digital_products FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own products"
  ON public.digital_products FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own products"
  ON public.digital_products FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view active products on public pages"
  ON public.digital_products FOR SELECT
  USING (is_active = true);

-- Purchase Policies
CREATE POLICY "Users can view their own purchases"
  ON public.digital_product_purchases FOR SELECT
  USING (auth.uid() = buyer_user_id OR buyer_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Product owners can view their sales"
  ON public.digital_product_purchases FOR SELECT
  USING (
    product_id IN (
      SELECT id FROM public.digital_products WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert purchases"
  ON public.digital_product_purchases FOR INSERT
  WITH CHECK (true);

-- Indexes
CREATE INDEX idx_digital_products_user_id ON public.digital_products(user_id);
CREATE INDEX idx_digital_products_active ON public.digital_products(is_active);
CREATE INDEX idx_digital_purchases_product_id ON public.digital_product_purchases(product_id);
CREATE INDEX idx_digital_purchases_buyer_user_id ON public.digital_product_purchases(buyer_user_id);
CREATE INDEX idx_digital_purchases_buyer_email ON public.digital_product_purchases(buyer_email);

-- Trigger to update updated_at
CREATE TRIGGER update_digital_products_updated_at
  BEFORE UPDATE ON public.digital_products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to increment product sales
CREATE OR REPLACE FUNCTION public.increment_product_sales()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'completed' THEN
    UPDATE public.digital_products
    SET 
      total_sales = total_sales + 1,
      total_revenue = total_revenue + NEW.purchase_amount
    WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_increment_product_sales
  AFTER INSERT ON public.digital_product_purchases
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_product_sales();