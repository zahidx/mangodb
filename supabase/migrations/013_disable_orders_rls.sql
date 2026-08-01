-- ===========================================
-- MangoBite Market — Migration 013
-- ===========================================
-- Disable RLS on orders and related tables so the admin API 
-- (which runs without a Service Role Key in this dev setup)
-- can successfully query all orders.

ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;
