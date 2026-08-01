-- ===========================================
-- MangoBite Market — Seed Data (Mango Edition)
-- ===========================================
-- Run this AFTER all migrations to populate sample data

-- Seed Categories
INSERT INTO public.categories (name, slug, description, is_active) VALUES
  ('Organic Harvest', 'organic', '100% chemical-free and carbide-free organic mangoes sourced directly from certified orchards.', true),
  ('Premium Crates', 'premium', 'Handpicked selection of premium grade mangoes packed in ventilated protective wooden crates.', true),
  ('Festival Gift Boxes', 'gifts', 'Beautifully designed gift packaging options, perfect for sending sweet wishes to family and corporate partners.', true),
  ('Aamsotto & Dried', 'dried', 'Traditional sun-dried mango bars (Aamsotto) and dehydrated mango slices.', true),
  ('Pure Mango Pulp', 'pulp', '100% pure, natural, and preservative-free liquid mango pulp for smoothies and desserts.', true),
  ('Seasonal Specials', 'seasonal', 'Limited-time varieties that are available only during specific weeks of the harvest season.', true)
ON CONFLICT DO NOTHING;

-- Seed Products (using category IDs from above)
WITH cat AS (SELECT id, slug FROM public.categories)
INSERT INTO public.products (name, slug, description, price, sale_price, stock, category_id, images, is_featured, is_active, metadata) VALUES
  (
    'Rajshahi Himsagar', 'himsagar-mangoes',
    'The ultimate king of Bengali taste! Thin skin, fiberless flesh, and an unparalleled sweet aroma. Direct from our partner orchards in Kansat, Rajshahi.',
    1200.00, 999.00, 150, (SELECT id FROM cat WHERE slug = 'premium'),
    '{"https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&auto=format&fit=crop&q=80"}', true, true,
    '{"origin_district": "Rajshahi", "weight_options": ["5kg", "10kg"], "badge": "King of Bengal"}'
  ),
  (
    'Rangpur Haribhanga', 'haribhanga-mangoes',
    'Highly popular variety known for its unique round shape, fleshy and fiberless nature, and distinctively rich, sweet taste.',
    1400.00, NULL, 120, (SELECT id FROM cat WHERE slug = 'premium'),
    '{"https://images.unsplash.com/photo-1591073113125-e46713c829ed?w=600&auto=format&fit=crop&q=80"}', true, true,
    '{"origin_district": "Rangpur", "weight_options": ["5kg", "10kg"], "badge": "Fleshy & Fiberless"}'
  ),
  (
    'Chapainawabganj Lengra', 'lengra-mangoes',
    'An aromatic delight with a sweet and slightly tangy undertone. Exceptionally juicy with a very small seed inside.',
    1100.00, 950.00, 200, (SELECT id FROM cat WHERE slug = 'premium'),
    '{"https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=600&auto=format&fit=crop&q=80"}', true, true,
    '{"origin_district": "Chapainawabganj", "weight_options": ["5kg", "10kg"], "badge": "Aromatic Delight"}'
  ),
  (
    'Premium Amrapali', 'amrapali-mangoes',
    'Known for its intensely dark orange pulp, rich thickness, and honey-like sweetness. Sourced from high-yield organic orchards.',
    1300.00, 1150.00, 180, (SELECT id FROM cat WHERE slug = 'premium'),
    '{"https://images.unsplash.com/photo-1552474030-b3a5b5f04e2e?w=600&auto=format&fit=crop&q=80"}', true, true,
    '{"origin_district": "Chapai Nawabganj", "weight_options": ["5kg", "10kg"], "badge": "Intensely Sweet"}'
  ),
  (
    'Gopalbhog Select', 'gopalbhog-select',
    'One of the earliest varieties of the season. Renowned for its rich golden color and soft, velvety, sweet pulp.',
    1000.00, NULL, 90, (SELECT id FROM cat WHERE slug = 'seasonal'),
    '{"https://images.unsplash.com/photo-1591073113125-e46713c829ed?w=600&auto=format&fit=crop&q=80"}', false, true,
    '{"origin_district": "Rajshahi", "weight_options": ["5kg", "10kg"], "badge": "Early Harvest"}'
  ),
  (
    'Traditional Rajshahi Aamsotto', 'rajshahi-aamsotto',
    'Deliciously sweet sun-dried mango bar made from pure Himsagar pulp. 100% natural with no artificial preservatives or sugar added.',
    600.00, 550.00, 300, (SELECT id FROM cat WHERE slug = 'dried'),
    '{"https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=600&auto=format&fit=crop&q=80"}', false, true,
    '{"origin_district": "Rajshahi", "weight_options": ["1kg", "2kg"], "badge": "Sun Dried"}'
  ),
  (
    'Pure Himsagar Pulp (1L)', 'himsagar-pulp-1l',
    'Freshly extracted and flash-frozen Himsagar pulp. Preserves the authentic flavor and aroma of fresh mangoes all year round.',
    450.00, 399.00, 250, (SELECT id FROM cat WHERE slug = 'pulp'),
    '{"https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&auto=format&fit=crop&q=80"}', false, true,
    '{"origin_district": "Rajshahi", "weight_options": ["1L"], "badge": "100% Natural"}'
  ),
  (
    'Corporate Gift Basket (15kg)', 'corporate-gift-basket',
    'An elegant wooden basket filled with an assortment of Himsagar and Lengra mangoes. Perfect corporate or festival gift.',
    2500.00, 2200.00, 50, (SELECT id FROM cat WHERE slug = 'gifts'),
    '{"https://images.unsplash.com/photo-1552474030-b3a5b5f04e2e?w=600&auto=format&fit=crop&q=80"}', false, true,
    '{"origin_district": "Rajshahi", "weight_options": ["15kg"], "badge": "Gift Special"}'
  )
ON CONFLICT DO NOTHING;

-- Seed Coupons
INSERT INTO public.coupons (code, discount_percentage, min_order_amount, is_active) VALUES
  ('MANGO10', 10, 1000.00, true),
  ('EATFRESH', 15, 2000.00, true),
  ('FREEBENGAL', 5, 0.00, true)
ON CONFLICT DO NOTHING;
