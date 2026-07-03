-- ===========================================
-- MangoDB Market — Migration 006
-- ===========================================
-- Add new profile fields: Date of Birth, Gender, Country, City

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS dob TEXT,
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'other')),
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS city TEXT;
