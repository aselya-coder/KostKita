-- MISSING TABLES FOR KOSKITA ADVERTISEMENT & PAYMENT SYSTEM
-- Run this in the Supabase SQL Editor to fix the 400 errors
-- This script is idempotent (safe to run multiple times)

-- 1. COIN PACKAGES (Add admin_fee if missing)
ALTER TABLE public.coin_packages ADD COLUMN IF NOT EXISTS admin_fee NUMERIC DEFAULT 2500;

-- 2. TRANSACTIONS (If missing)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_status') THEN
        CREATE TYPE transaction_status AS ENUM ('pending', 'success', 'failed');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pricing_plan_id UUID REFERENCES public.coin_packages(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL,
  status transaction_status DEFAULT 'pending',
  payment_provider TEXT NOT NULL DEFAULT 'simulated',
  external_id TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. KOS ADVERTISEMENTS (PREMIUM BOOST)
CREATE TABLE IF NOT EXISTS public.kos_advertisements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kos_id UUID NOT NULL REFERENCES public.kos_listings(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  package_id TEXT NOT NULL,
  boost_level INT NOT NULL DEFAULT 1,
  coin_cost INT NOT NULL DEFAULT 0,
  duration_days INT NOT NULL DEFAULT 7,
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_date TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

ALTER TABLE public.coin_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kos_advertisements ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    -- Policy untuk coin_packages
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin manage all coin packages' AND tablename = 'coin_packages') THEN
        CREATE POLICY "Admin manage all coin packages" ON public.coin_packages
          FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public view active coin packages' AND tablename = 'coin_packages') THEN
        CREATE POLICY "Public view active coin packages" ON public.coin_packages
          FOR SELECT USING (is_active = true);
    END IF;

    -- Policy untuk transactions
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own transactions' AND tablename = 'transactions') THEN
        CREATE POLICY "Users can view own transactions" ON public.transactions
          FOR SELECT USING (auth.uid() = user_id OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
    END IF;

    -- Policy untuk kos_advertisements
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public view active ads' AND tablename = 'kos_advertisements') THEN
        CREATE POLICY "Public view active ads" ON public.kos_advertisements
          FOR SELECT USING (is_active = true OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Owners manage own ads' AND tablename = 'kos_advertisements') THEN
        CREATE POLICY "Owners manage own ads" ON public.kos_advertisements
          FOR ALL USING (auth.uid() = owner_id OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
    END IF;
END $$;

-- ==========================================
-- INDEXES FOR PERFORMANCE
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_ads_kos_id ON public.kos_advertisements(kos_id);
CREATE INDEX IF NOT EXISTS idx_ads_owner_id ON public.kos_advertisements(owner_id);
CREATE INDEX IF NOT EXISTS idx_ads_is_active ON public.kos_advertisements(is_active);
CREATE INDEX IF NOT EXISTS idx_tx_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_tx_status ON public.transactions(status);

-- ==========================================
-- 5. SEED DATA FOR COIN PACKAGES
-- ==========================================
INSERT INTO public.coin_packages (name, coin_amount, price, is_active, admin_fee)
VALUES 
  ('Paket 1 Koin', 1, 10000, true, 2500),
  ('Paket 5 Koin', 5, 50000, true, 2500),
  ('Paket 10 Koin', 10, 100000, true, 2500),
  ('Paket 50 Koin', 50, 500000, true, 2500),
  ('Paket 100 Koin', 100, 1000000, true, 2500)
ON CONFLICT DO NOTHING;
