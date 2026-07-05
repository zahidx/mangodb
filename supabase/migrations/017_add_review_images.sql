-- ============================================
-- Migration 017: Add images column to reviews
-- ============================================

ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT NULL;

COMMENT ON COLUMN public.reviews.images IS 'Array of image URLs uploaded with the review';
