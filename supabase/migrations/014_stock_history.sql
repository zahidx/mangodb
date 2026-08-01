-- ===========================================
-- MangoBite Market — Migration 014
-- ===========================================
-- Add Stock History table for inventory tracking

CREATE TABLE IF NOT EXISTS public.stock_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  previous_stock INTEGER NOT NULL DEFAULT 0,
  new_stock INTEGER NOT NULL DEFAULT 0,
  change_amount INTEGER NOT NULL DEFAULT 0,
  reason TEXT DEFAULT 'manual_adjustment',
  changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_history_product ON public.stock_history(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_history_created ON public.stock_history(created_at DESC);

ALTER TABLE public.stock_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view stock history"
  ON public.stock_history FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can insert stock history"
  ON public.stock_history FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
