-- ===========================================
-- MangoBite Market — Migration 011
-- ===========================================
-- Disable Row Level Security on profiles table to allow all API requests

ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
