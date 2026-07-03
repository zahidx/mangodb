-- ===========================================
-- MangoDB Market — Migration 007
-- ===========================================
-- Add User Addresses table for multiple shipping addresses

CREATE TABLE IF NOT EXISTS public.user_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  country TEXT NOT NULL,
  state TEXT NOT NULL,
  city TEXT NOT NULL,
  area TEXT NOT NULL,
  postal_code TEXT,
  street_address TEXT NOT NULL,
  apartment TEXT,
  label TEXT DEFAULT 'Home' CHECK (label IN ('Home', 'Office', 'Other')),
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster queries by user
CREATE INDEX IF NOT EXISTS idx_user_addresses_user ON public.user_addresses(user_id);

-- Function to ensure only one default address per user
CREATE OR REPLACE FUNCTION public.ensure_single_default_address()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE public.user_addresses
    SET is_default = false
    WHERE user_id = NEW.user_id AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to run the function before insert or update
DROP TRIGGER IF EXISTS trg_ensure_single_default_address ON public.user_addresses;
CREATE TRIGGER trg_ensure_single_default_address
  BEFORE INSERT OR UPDATE OF is_default
  ON public.user_addresses
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_single_default_address();

-- Apply updated_at trigger
DROP TRIGGER IF EXISTS set_updated_at ON public.user_addresses;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.user_addresses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
