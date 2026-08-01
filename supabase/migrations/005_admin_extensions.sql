-- ===========================================
-- MangoBite Market — Admin Dashboard Extensions
-- ===========================================
-- Run this AFTER 004_wishlist_coupons.sql

-- ============================================
-- 1. DELIVERY ZONES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.delivery_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area_name TEXT NOT NULL,
  division TEXT NOT NULL,
  delivery_charge DECIMAL(10,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  estimated_days INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_delivery_zones_division ON public.delivery_zones(division);

ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Delivery zones are viewable by everyone"
  ON public.delivery_zones FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert delivery zones"
  ON public.delivery_zones FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update delivery zones"
  ON public.delivery_zones FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete delivery zones"
  ON public.delivery_zones FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- 2. BANNERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT,
  position TEXT NOT NULL DEFAULT 'hero' CHECK (position IN ('hero', 'promo', 'offer')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Banners are viewable by everyone"
  ON public.banners FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert banners"
  ON public.banners FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update banners"
  ON public.banners FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete banners"
  ON public.banners FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Updated_at trigger for banners
DROP TRIGGER IF EXISTS set_updated_at ON public.banners;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.banners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- 3. SITE SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_site_settings_key ON public.site_settings(key);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Site settings are viewable by everyone"
  ON public.site_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert site settings"
  ON public.site_settings FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update site settings"
  ON public.site_settings FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- 4. ACTIVITY LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_admin ON public.activity_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON public.activity_logs(created_at DESC);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view activity logs"
  ON public.activity_logs FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can insert activity logs"
  ON public.activity_logs FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- 5. COLUMN ADDITIONS TO EXISTING TABLES
-- ============================================

-- Add approval flag to reviews
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS is_approved BOOLEAN NOT NULL DEFAULT true;

-- Add blocked flag to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN NOT NULL DEFAULT false;

-- Add tags to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- ============================================
-- 6. STORAGE BUCKET FOR BANNERS
-- ============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('banner-images', 'banner-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Banner images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'banner-images');

CREATE POLICY "Admins can upload banner images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'banner-images'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update banner images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'banner-images'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete banner images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'banner-images'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- 7. SEED DEFAULT SITE SETTINGS
-- ============================================
INSERT INTO public.site_settings (key, value) VALUES
  ('store_name', '"MangoBite — Fresh Mangoes Marketplace"'),
  ('store_tagline', '"Rajshahi''s Premium Harvest, Delivered Fresh"'),
  ('contact_email', '"hello@mangobite.com"'),
  ('contact_phone', '"+880 1754-309016"'),
  ('store_address', '"Kansat, Chapainawabganj, Rajshahi Division, Bangladesh"'),
  ('default_delivery_charge', '120'),
  ('free_delivery_threshold', '2000'),
  ('cod_enabled', 'true'),
  ('social_facebook', '"https://facebook.com/mangobite"'),
  ('social_instagram', '"https://instagram.com/mangobite"')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- 8. SEED DEFAULT DELIVERY ZONES
-- ============================================
INSERT INTO public.delivery_zones (area_name, division, delivery_charge, estimated_days, is_active) VALUES
  ('Dhaka City', 'Dhaka', 80.00, 1, true),
  ('Dhaka Suburbs', 'Dhaka', 120.00, 2, true),
  ('Rajshahi City', 'Rajshahi', 60.00, 1, true),
  ('Chapainawabganj', 'Rajshahi', 40.00, 1, true),
  ('Chattogram City', 'Chattogram', 150.00, 3, true),
  ('Khulna City', 'Khulna', 130.00, 2, true),
  ('Sylhet City', 'Sylhet', 160.00, 3, true),
  ('Rangpur City', 'Rangpur', 100.00, 2, true),
  ('Barishal City', 'Barishal', 140.00, 3, true),
  ('Mymensingh City', 'Mymensingh', 120.00, 2, true)
ON CONFLICT DO NOTHING;
