-- ===========================================
-- MangoBite Market — Migration 016
-- ===========================================
-- Return & Refund Request System

CREATE TABLE IF NOT EXISTS public.return_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'refunded')),
  admin_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_return_requests_user ON public.return_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_return_requests_order ON public.return_requests(order_id);

ALTER TABLE public.return_requests ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own return requests
CREATE POLICY "Users can view own return requests"
  ON public.return_requests FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to create return requests
CREATE POLICY "Users can create return requests"
  ON public.return_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow admins full access
CREATE POLICY "Admins can manage return requests"
  ON public.return_requests FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Updated_at trigger
DROP TRIGGER IF EXISTS set_updated_at ON public.return_requests;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.return_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
