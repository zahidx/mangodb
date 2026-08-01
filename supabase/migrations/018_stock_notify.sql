-- ===========================================
-- MangoBite Market — Stock Notification Requests
-- ===========================================
-- Run this AFTER 017_add_review_images.sql

-- ============================================
-- STOCK NOTIFY REQUESTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.stock_notify_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  product_name TEXT,
  is_notified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(product_id, email)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_stock_notify_product ON public.stock_notify_requests(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_notify_email ON public.stock_notify_requests(email);

-- Enable RLS
ALTER TABLE public.stock_notify_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (unauthenticated users can subscribe too)
CREATE POLICY "Anyone can subscribe to stock notifications"
  ON public.stock_notify_requests FOR INSERT
  WITH CHECK (true);

-- Users can view their own subscriptions
CREATE POLICY "Users can view their own subscriptions"
  ON public.stock_notify_requests FOR SELECT
  USING (auth.uid() = user_id OR email = current_user);

-- Only admins can manage (mark as notified, delete)
CREATE POLICY "Admins can manage stock notify requests"
  ON public.stock_notify_requests FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
