-- Create coupons table
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value DECIMAL(10, 2) NOT NULL,
    min_order_amount DECIMAL(10, 2) DEFAULT 0,
    max_discount_amount DECIMAL(10, 2), -- Useful for percentage caps (e.g. 10% off up to 500 BDT)
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    usage_limit INTEGER, -- Total times this coupon can be used
    used_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active coupons (needed for validation)
CREATE POLICY "Allow public read access to active coupons" ON public.coupons
    FOR SELECT
    USING (is_active = true AND (expires_at IS NULL OR expires_at > NOW()));

-- Allow admins full access
CREATE POLICY "Allow admin full access to coupons" ON public.coupons
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Insert some demo coupons
INSERT INTO public.coupons (code, discount_type, discount_value, min_order_amount, usage_limit)
VALUES 
    ('MANGOLOVE', 'percentage', 10, 1000, 100),
    ('FRESH100', 'fixed', 100, 500, 50),
    ('EIDSPL', 'percentage', 15, 2000, 500)
ON CONFLICT (code) DO NOTHING;
