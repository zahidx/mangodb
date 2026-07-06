-- ===========================================
-- MangoDB Market — Abandoned Cart Recovery
-- ===========================================
-- Run this AFTER 019_product_variants.sql

-- ============================================
-- ABANDONED CARTS TABLE
-- Tracks guest users who added items but didn't check out.
-- For logged-in users, the cart_items table is used directly.
-- ============================================
CREATE TABLE IF NOT EXISTS public.abandoned_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  cart_snapshot JSONB,            -- Snapshot of cart items at time of abandonment
  item_count INTEGER DEFAULT 0,
  cart_total DECIMAL(10,2) DEFAULT 0,
  recovered BOOLEAN NOT NULL DEFAULT false,
  recovered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_email ON public.abandoned_carts(email);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_recovered ON public.abandoned_carts(recovered);

-- Enable RLS
ALTER TABLE public.abandoned_carts ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (for guest tracking)
CREATE POLICY "Anyone can insert abandoned cart records"
  ON public.abandoned_carts FOR INSERT
  WITH CHECK (true);

-- Users can view their own abandoned cart records
CREATE POLICY "Users can view own abandoned carts"
  ON public.abandoned_carts FOR SELECT
  USING (auth.uid() = user_id OR email = current_user);

-- Admins can manage abandoned carts
CREATE POLICY "Admins can manage abandoned carts"
  ON public.abandoned_carts FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
