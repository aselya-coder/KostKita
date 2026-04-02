-- KOIN & WALLET SYSTEM (MODERN MARKETPLACE SYSTEM - UPDATED DAILY COST)
-- Run this in the Supabase SQL Editor

-- ==========================================
-- 1. ENUMS & TYPES
-- ==========================================
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'listing_status') THEN
        CREATE TYPE listing_status AS ENUM ('active', 'expired', 'archived');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'coin_log_type') THEN
        CREATE TYPE coin_log_type AS ENUM ('credit', 'debit');
    END IF;
END $$;

-- ==========================================
-- 2. TABLES
-- ==========================================

-- WALLETS: User coin balance
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  balance INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- COIN_PACKAGES: Admin defined packages (Min 5, Max 100)
CREATE TABLE IF NOT EXISTS public.coin_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  coin_amount INT NOT NULL CHECK (coin_amount >= 5 AND coin_amount <= 100),
  price NUMERIC NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- COIN_LOGS: Audit trail for coins
CREATE TABLE IF NOT EXISTS public.coin_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type coin_log_type NOT NULL,
  amount INT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- UPDATE LISTINGS TABLE (Add expiration and daily cost tracking)
-- Assuming kos_listings and marketplace_items exist
ALTER TABLE public.kos_listings 
ADD COLUMN IF NOT EXISTS coin_used INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS listing_status listing_status DEFAULT 'active',
ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS daily_cost INT DEFAULT 1;

ALTER TABLE public.marketplace_items 
ADD COLUMN IF NOT EXISTS coin_used INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS listing_status listing_status DEFAULT 'active',
ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS daily_cost INT DEFAULT 1;

-- ==========================================
-- 3. POLICIES (RLS)
-- ==========================================
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_logs ENABLE ROW LEVEL SECURITY;

-- If policy already exists, we skip it
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own wallet') THEN
        CREATE POLICY "Users can view own wallet" ON public.wallets FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own coin logs') THEN
        CREATE POLICY "Users can view own coin logs" ON public.coin_logs FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view active coin packages') THEN
        CREATE POLICY "Anyone can view active coin packages" ON public.coin_packages FOR SELECT USING (is_active = true);
    END IF;
END $$;

-- ==========================================
-- 4. LOGIC: STORED PROCEDURES (RPC)
-- ==========================================

-- FUNCTION: Process Upload with Daily Coin Logic (1 Coin/Day)
CREATE OR REPLACE FUNCTION public.process_listing_upload(
    p_user_id UUID,
    p_duration_days INT DEFAULT 30
)
RETURNS JSONB AS $$
DECLARE
    v_role TEXT;
    v_total_listings INT;
    v_balance INT;
    v_total_cost INT;
    v_is_free BOOLEAN := false;
BEGIN
    -- 1. Get user role
    SELECT role INTO v_role FROM public.profiles WHERE id = p_user_id;
    
    -- 2. Super Admin Bypass
    IF v_role = 'admin' THEN
        RETURN jsonb_build_object('success', true, 'is_free', true, 'cost', 0, 'duration', 365, 'message', 'Admin bypass');
    END IF;

    -- 3. Count total listings (kos + items)
    SELECT (
        (SELECT COUNT(*) FROM public.kos_listings WHERE owner_id = p_user_id) +
        (SELECT COUNT(*) FROM public.marketplace_items WHERE seller_id = p_user_id)
    ) INTO v_total_listings;

    -- 4. Logic IKLAN PERTAMA GRATIS (30 Hari)
    IF v_total_listings = 0 THEN
        v_is_free := true;
        RETURN jsonb_build_object('success', true, 'is_free', true, 'cost', 0, 'duration', 30, 'message', 'Iklan pertama gratis (30 hari)');
    END IF;

    -- 5. Logic Iklan Berbayar (1 Koin/Hari)
    v_total_cost := p_duration_days * 1;
    
    SELECT balance INTO v_balance FROM public.wallets WHERE user_id = p_user_id;
    
    IF v_balance IS NULL OR v_balance < v_total_cost THEN
        RETURN jsonb_build_object('success', false, 'message', 'Koin tidak cukup, silakan top up terlebih dahulu');
    END IF;

    -- 6. Deduct Coin & Log
    UPDATE public.wallets SET balance = balance - v_total_cost, updated_at = now() WHERE user_id = p_user_id;
    
    INSERT INTO public.coin_logs (user_id, type, amount, description)
    VALUES (p_user_id, 'debit', v_total_cost, 'Upload iklan berbayar (' || p_duration_days || ' hari)');

    RETURN jsonb_build_object('success', true, 'is_free', false, 'cost', v_total_cost, 'duration', p_duration_days, 'message', 'Upload menggunakan ' || v_total_cost || ' koin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- FUNCTION: Update Wallet on Success Topup
CREATE OR REPLACE FUNCTION public.update_wallet_on_success(
    p_user_id UUID,
    p_package_id UUID
)
RETURNS VOID AS $$
DECLARE
    v_coin_amount INT;
BEGIN
    -- 1. Get coin amount from package
    SELECT coin_amount INTO v_coin_amount FROM public.coin_packages WHERE id = p_package_id;
    
    -- 2. Update wallet (Create if not exists)
    INSERT INTO public.wallets (user_id, balance)
    VALUES (p_user_id, v_coin_amount)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        balance = wallets.balance + v_coin_amount,
        updated_at = now();

    -- 3. Log the credit
    INSERT INTO public.coin_logs (user_id, type, amount, description)
    VALUES (p_user_id, 'credit', v_coin_amount, 'Top up koin via pembayaran');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- FUNCTION: Auto Expire Cron Logic (To be called by Cron)
CREATE OR REPLACE FUNCTION public.handle_expired_listings()
RETURNS VOID AS $$
BEGIN
    -- Archive Kos
    UPDATE public.kos_listings 
    SET listing_status = 'expired'
    WHERE listing_status = 'active' AND expires_at < now();

    -- Archive Items
    UPDATE public.marketplace_items 
    SET listing_status = 'expired'
    WHERE listing_status = 'active' AND expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 5. SEED DATA (Min 5, Max 100)
-- ==========================================
-- Clear old packages first
DELETE FROM public.coin_packages;

INSERT INTO public.coin_packages (name, coin_amount, price)
VALUES 
  ('5 Koin', 5, 50000),
  ('10 Koin', 10, 95000),
  ('20 Koin', 20, 180000),
  ('50 Koin', 50, 450000),
  ('100 Koin', 100, 850000)
ON CONFLICT DO NOTHING;
