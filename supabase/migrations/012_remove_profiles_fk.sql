-- ===========================================
-- MangoBite Market — Migration 012
-- ===========================================
-- Drop foreign key constraint on profiles.id to allow manual customer creation

ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_id_fkey;
