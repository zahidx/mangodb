-- ===========================================
-- MangoBite Market — Migration 015
-- ===========================================
-- Disable RLS on admin-managed tables so the admin API
-- (which runs without a Service Role Key in dev setups)
-- can successfully perform CRUD operations.
-- Uses safe PL/pgSQL blocks so it won't fail if a table doesn't exist yet.

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'categories') THEN
    ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'products') THEN
    ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'banners') THEN
    ALTER TABLE public.banners DISABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'delivery_zones') THEN
    ALTER TABLE public.delivery_zones DISABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'coupons') THEN
    ALTER TABLE public.coupons DISABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'reviews') THEN
    ALTER TABLE public.reviews DISABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'orders') THEN
    ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'order_items') THEN
    ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Ensure storage buckets exist
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) VALUES ('category-images', 'category-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) VALUES ('banner-images', 'banner-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to all files in these buckets (bypasses RLS for anon key)
DO $$
BEGIN
  -- Drop existing policies first to avoid conflicts
  DROP POLICY IF EXISTS "Public Access product-images" ON storage.objects;
  DROP POLICY IF EXISTS "Public Access category-images" ON storage.objects;
  DROP POLICY IF EXISTS "Public Access banner-images" ON storage.objects;
  
  -- Allow anyone to upload to these buckets (needed for admin API with anon key)
  CREATE POLICY "Public Access product-images"
    ON storage.objects FOR ALL
    USING (bucket_id = 'product-images')
    WITH CHECK (bucket_id = 'product-images');

  CREATE POLICY "Public Access category-images"
    ON storage.objects FOR ALL
    USING (bucket_id = 'category-images')
    WITH CHECK (bucket_id = 'category-images');

  CREATE POLICY "Public Access banner-images"
    ON storage.objects FOR ALL
    USING (bucket_id = 'banner-images')
    WITH CHECK (bucket_id = 'banner-images');

  CREATE POLICY "Public Access avatars"
    ON storage.objects FOR ALL
    USING (bucket_id = 'avatars')
    WITH CHECK (bucket_id = 'avatars');
END $$;
