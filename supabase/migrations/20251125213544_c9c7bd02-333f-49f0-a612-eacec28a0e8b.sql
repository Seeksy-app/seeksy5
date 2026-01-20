-- Create credit packages table
CREATE TABLE IF NOT EXISTS public.credit_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  credits INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  stripe_price_id TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create user credits table
CREATE TABLE IF NOT EXISTS public.user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0,
  total_earned INTEGER DEFAULT 0,
  total_spent INTEGER DEFAULT 0,
  total_purchased INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Create credit transactions table
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL, -- 'purchase', 'spend', 'reward', 'spin_wheel'
  activity_type TEXT, -- 'meeting', 'video_upload', 'ai_studio', 'create_studio', etc.
  description TEXT,
  balance_after INTEGER NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create spin wheel eligibility table
CREATE TABLE IF NOT EXISTS public.spin_wheel_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credits_spent_threshold INTEGER NOT NULL,
  credits_won INTEGER NOT NULL,
  spun_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.credit_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spin_wheel_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for credit_packages (public read)
CREATE POLICY "Anyone can view active credit packages"
  ON public.credit_packages FOR SELECT
  USING (is_active = true);

-- RLS Policies for user_credits
CREATE POLICY "Users can view their own credits"
  ON public.user_credits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own credits"
  ON public.user_credits FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own credits"
  ON public.user_credits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for credit_transactions
CREATE POLICY "Users can view their own transactions"
  ON public.credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions"
  ON public.credit_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for spin_wheel_history
CREATE POLICY "Users can view their own spin history"
  ON public.spin_wheel_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own spin history"
  ON public.spin_wheel_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Insert default credit packages
INSERT INTO public.credit_packages (name, credits, price, display_order) VALUES
  ('Starter Pack', 10, 9.99, 1),
  ('Creator Pack', 25, 19.99, 2),
  ('Pro Pack', 50, 34.99, 3),
  ('Power User', 100, 59.99, 4),
  ('Ultimate Bundle', 250, 129.99, 5)
ON CONFLICT DO NOTHING;

-- Function to initialize user credits
CREATE OR REPLACE FUNCTION public.initialize_user_credits()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_credits (user_id, balance)
  VALUES (NEW.id, 5) -- Give 5 free credits to start
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to initialize credits for new users
DROP TRIGGER IF EXISTS on_auth_user_created_credits ON auth.users;
CREATE TRIGGER on_auth_user_created_credits
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.initialize_user_credits();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON public.credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON public.credit_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_spin_wheel_history_user_id ON public.spin_wheel_history(user_id);