-- ===========================================
-- MangoDB Market — Loyalty & Rewards Program
-- ===========================================
-- Run this AFTER 020_abandoned_carts.sql

-- ============================================
-- 1. LOYALTY POINTS TABLE
-- Each user has one row tracking their total points and lifetime earnings.
-- ============================================
CREATE TABLE IF NOT EXISTS public.loyalty_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  points INTEGER NOT NULL DEFAULT 0 CHECK (points >= 0),
  lifetime_earned INTEGER NOT NULL DEFAULT 0,
  tier TEXT NOT NULL DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 2. LOYALTY TRANSACTIONS TABLE
-- Every points earn/spend is logged here for audit.
-- ============================================
CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,           -- Positive = earned, Negative = spent
  transaction_type TEXT NOT NULL CHECK (transaction_type IN (
    'earned_order', 'earned_signup', 'earned_referral', 'earned_review',
    'spent_redemption', 'spent_expired', 'admin_adjustment'
  )),
  description TEXT,
  reference_id TEXT,                  -- Order ID or related entity
  balance_after INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_loyalty_points_user ON public.loyalty_points(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_user ON public.loyalty_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_type ON public.loyalty_transactions(transaction_type);

-- Enable RLS
ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own points
CREATE POLICY "Users can view own points"
  ON public.loyalty_points FOR SELECT
  USING (auth.uid() = user_id);

-- Users can view own transactions
CREATE POLICY "Users can view own transactions"
  ON public.loyalty_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Only the system (service role) can insert/update points
-- Admins can manage all loyalty data
CREATE POLICY "Admins can manage loyalty points"
  ON public.loyalty_points FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can manage loyalty transactions"
  ON public.loyalty_transactions FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Updated_at trigger
DROP TRIGGER IF EXISTS set_updated_at ON public.loyalty_points;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.loyalty_points
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- 3. TIER BENEFITS (application-level, referenced in code)
-- bronze:   0-499 pts   → No bonus
-- silver:   500-1999    → 5% points bonus, free delivery on orders > 500
-- gold:     2000-4999   → 10% points bonus, free delivery, exclusive offers
-- platinum: 5000+       → 15% points bonus, free delivery, priority support, early access
-- ============================================

-- Conversion rate: ৳1 = 1 point earned per ৳100 spent
-- Redemption: 100 points = ৳10 discount
