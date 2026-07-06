-- ===========================================
-- MangoDB Market — Product Variants
-- ===========================================
-- Run this AFTER 018_stock_notify.sql

-- ============================================
-- PRODUCT VARIANTS TABLE
-- Each product can have multiple variants (e.g., 1kg, 5kg, 10kg boxes)
-- with independent pricing, stock, and SKU tracking.
-- ============================================
CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  label TEXT NOT NULL,                       -- e.g. "1kg", "5kg", "10kg"
  sku TEXT NOT NULL UNIQUE,                  -- e.g. "HIMSAGAR-1KG", "HIMSAGAR-10KG"
  price DECIMAL(10,2) NOT NULL DEFAULT 0,    -- Actual price for this variant
  sale_price DECIMAL(10,2),                  -- Sale price for this variant (if any)
  stock INTEGER NOT NULL DEFAULT 0,
  weight_kg DECIMAL(5,2),                    -- Weight in kg for reference (e.g. 1, 5, 10)
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,     -- Display order
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON public.product_variants(sku);

-- Enable RLS
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- Everyone can read active variants
CREATE POLICY "Anyone can view active variants"
  ON public.product_variants FOR SELECT
  USING (is_active = true);

-- Admins can manage variants
CREATE POLICY "Admins can insert variants"
  ON public.product_variants FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update variants"
  ON public.product_variants FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete variants"
  ON public.product_variants FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Updated_at trigger
DROP TRIGGER IF EXISTS set_updated_at ON public.product_variants;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.product_variants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- SEED VARIANTS for existing products
-- Maps the metadata weight_options to actual variant rows
-- ============================================
-- Himsagar: 5kg @ 550, 10kg @ 999
INSERT INTO public.product_variants (product_id, label, sku, price, sale_price, stock, weight_kg, sort_order)
SELECT id, '5kg', slug || '-5KG', 550.00, NULL, 75, 5, 1
FROM public.products WHERE slug = 'himsagar-mangoes' AND NOT EXISTS (
  SELECT 1 FROM public.product_variants WHERE product_id = (SELECT id FROM public.products WHERE slug = 'himsagar-mangoes') AND label = '5kg'
);

INSERT INTO public.product_variants (product_id, label, sku, price, sale_price, stock, weight_kg, sort_order)
SELECT id, '10kg', slug || '-10KG', 999.00, NULL, 150, 10, 2
FROM public.products WHERE slug = 'himsagar-mangoes' AND NOT EXISTS (
  SELECT 1 FROM public.product_variants WHERE product_id = (SELECT id FROM public.products WHERE slug = 'himsagar-mangoes') AND label = '10kg'
);

-- Haribhanga: 5kg @ 770, 10kg @ 1400
INSERT INTO public.product_variants (product_id, label, sku, price, sale_price, stock, weight_kg, sort_order)
SELECT id, '5kg', slug || '-5KG', 770.00, NULL, 60, 5, 1
FROM public.products WHERE slug = 'haribhanga-mangoes' AND NOT EXISTS (
  SELECT 1 FROM public.product_variants WHERE product_id = (SELECT id FROM public.products WHERE slug = 'haribhanga-mangoes') AND label = '5kg'
);

INSERT INTO public.product_variants (product_id, label, sku, price, sale_price, stock, weight_kg, sort_order)
SELECT id, '10kg', slug || '-10KG', 1400.00, NULL, 120, 10, 2
FROM public.products WHERE slug = 'haribhanga-mangoes' AND NOT EXISTS (
  SELECT 1 FROM public.product_variants WHERE product_id = (SELECT id FROM public.products WHERE slug = 'haribhanga-mangoes') AND label = '10kg'
);

-- Lengra: 5kg @ 525, 10kg @ 950
INSERT INTO public.product_variants (product_id, label, sku, price, sale_price, stock, weight_kg, sort_order)
SELECT id, '5kg', slug || '-5KG', 525.00, NULL, 100, 5, 1
FROM public.products WHERE slug = 'lengra-mangoes' AND NOT EXISTS (
  SELECT 1 FROM public.product_variants WHERE product_id = (SELECT id FROM public.products WHERE slug = 'lengra-mangoes') AND label = '5kg'
);

INSERT INTO public.product_variants (product_id, label, sku, price, sale_price, stock, weight_kg, sort_order)
SELECT id, '10kg', slug || '-10KG', 950.00, NULL, 200, 10, 2
FROM public.products WHERE slug = 'lengra-mangoes' AND NOT EXISTS (
  SELECT 1 FROM public.product_variants WHERE product_id = (SELECT id FROM public.products WHERE slug = 'lengra-mangoes') AND label = '10kg'
);

-- Amrapali: 5kg @ 630, 10kg @ 1150
INSERT INTO public.product_variants (product_id, label, sku, price, sale_price, stock, weight_kg, sort_order)
SELECT id, '5kg', slug || '-5KG', 630.00, NULL, 90, 5, 1
FROM public.products WHERE slug = 'amrapali-mangoes' AND NOT EXISTS (
  SELECT 1 FROM public.product_variants WHERE product_id = (SELECT id FROM public.products WHERE slug = 'amrapali-mangoes') AND label = '5kg'
);

INSERT INTO public.product_variants (product_id, label, sku, price, sale_price, stock, weight_kg, sort_order)
SELECT id, '10kg', slug || '-10KG', 1150.00, NULL, 180, 10, 2
FROM public.products WHERE slug = 'amrapali-mangoes' AND NOT EXISTS (
  SELECT 1 FROM public.product_variants WHERE product_id = (SELECT id FROM public.products WHERE slug = 'amrapali-mangoes') AND label = '10kg'
);

-- Aamsotto: 1kg @ 550, 2kg @ 600
INSERT INTO public.product_variants (product_id, label, sku, price, sale_price, stock, weight_kg, sort_order)
SELECT id, '1kg', slug || '-1KG', 550.00, NULL, 150, 1, 1
FROM public.products WHERE slug = 'rajshahi-aamsotto' AND NOT EXISTS (
  SELECT 1 FROM public.product_variants WHERE product_id = (SELECT id FROM public.products WHERE slug = 'rajshahi-aamsotto') AND label = '1kg'
);

INSERT INTO public.product_variants (product_id, label, sku, price, sale_price, stock, weight_kg, sort_order)
SELECT id, '2kg', slug || '-2KG', 600.00, NULL, 300, 2, 2
FROM public.products WHERE slug = 'rajshahi-aamsotto' AND NOT EXISTS (
  SELECT 1 FROM public.product_variants WHERE product_id = (SELECT id FROM public.products WHERE slug = 'rajshahi-aamsotto') AND label = '2kg'
);

-- Pulp: 1L @ 399
INSERT INTO public.product_variants (product_id, label, sku, price, sale_price, stock, weight_kg, sort_order)
SELECT id, '1L', slug || '-1L', 399.00, NULL, 250, 1, 1
FROM public.products WHERE slug = 'himsagar-pulp-1l' AND NOT EXISTS (
  SELECT 1 FROM public.product_variants WHERE product_id = (SELECT id FROM public.products WHERE slug = 'himsagar-pulp-1l') AND label = '1L'
);

-- Gift Basket: 15kg @ 2200
INSERT INTO public.product_variants (product_id, label, sku, price, sale_price, stock, weight_kg, sort_order)
SELECT id, '15kg', slug || '-15KG', 2200.00, NULL, 50, 15, 1
FROM public.products WHERE slug = 'corporate-gift-basket' AND NOT EXISTS (
  SELECT 1 FROM public.product_variants WHERE product_id = (SELECT id FROM public.products WHERE slug = 'corporate-gift-basket') AND label = '15kg'
);

-- Gopalbhog: 5kg @ 550, 10kg @ 1000
INSERT INTO public.product_variants (product_id, label, sku, price, sale_price, stock, weight_kg, sort_order)
SELECT id, '5kg', slug || '-5KG', 550.00, NULL, 45, 5, 1
FROM public.products WHERE slug = 'gopalbhog-select' AND NOT EXISTS (
  SELECT 1 FROM public.product_variants WHERE product_id = (SELECT id FROM public.products WHERE slug = 'gopalbhog-select') AND label = '5kg'
);

INSERT INTO public.product_variants (product_id, label, sku, price, sale_price, stock, weight_kg, sort_order)
SELECT id, '10kg', slug || '-10KG', 1000.00, NULL, 90, 10, 2
FROM public.products WHERE slug = 'gopalbhog-select' AND NOT EXISTS (
  SELECT 1 FROM public.product_variants WHERE product_id = (SELECT id FROM public.products WHERE slug = 'gopalbhog-select') AND label = '10kg'
);
