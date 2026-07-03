CREATE TABLE IF NOT EXISTS public.user_payment_methods (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    provider TEXT NOT NULL, -- e.g., 'bkash', 'nagad', 'card'
    account_details TEXT NOT NULL, -- e.g., '01712345678' or '**** **** **** 1234'
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS user_payment_methods_user_id_idx ON public.user_payment_methods(user_id);

-- RLS
ALTER TABLE public.user_payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payment methods"
    ON public.user_payment_methods FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payment methods"
    ON public.user_payment_methods FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payment methods"
    ON public.user_payment_methods FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own payment methods"
    ON public.user_payment_methods FOR DELETE
    USING (auth.uid() = user_id);
