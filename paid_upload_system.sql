-- PAYMENT & UPLOAD SYSTEM (PAID CONTENT SYSTEM)
-- Run this in the Supabase SQL Editor

-- ==========================================
-- 1. ENUMS
-- ==========================================
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_status') THEN
        CREATE TYPE transaction_status AS ENUM ('pending', 'success', 'failed');
    END IF;
END $$;

-- ==========================================
-- 2. TABLES
-- ==========================================

-- PRICING_PLANS: Packages for upload quotas
CREATE TABLE IF NOT EXISTS public.pricing_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  quota INT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TRANSACTIONS: Payment records
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pricing_plan_id UUID REFERENCES public.pricing_plans(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL,
  status transaction_status DEFAULT 'pending',
  payment_provider TEXT NOT NULL, -- 'midtrans', 'stripe', 'xendit'
  external_id TEXT, -- ID from payment gateway
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- USER_ACCESS: Quota management
CREATE TABLE IF NOT EXISTS public.user_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  quota INT NOT NULL DEFAULT 0,
  used INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- UPLOADS: Record of content uploads (kos or marketplace items)
-- This table is more of a log since actual data is in kos_listings/marketplace_items
CREATE TABLE IF NOT EXISTS public.uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL, -- 'kos' or 'item'
  content_id UUID NOT NULL, -- ID of the record in kos_listings or marketplace_items
  is_free_upload BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- 3. POLICIES (RLS)
-- ==========================================
ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;

-- PRICING_PLANS: Everyone can view active plans
CREATE POLICY "Pricing plans viewable by everyone" ON public.pricing_plans
  FOR SELECT USING (is_active = true OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- TRANSACTIONS: Users see own, Admin sees all
CREATE POLICY "Users can view own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- USER_ACCESS: Users see own, Admin sees all
CREATE POLICY "Users can view own access" ON public.user_access
  FOR SELECT USING (auth.uid() = user_id OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- UPLOADS: Users see own, Admin sees all
CREATE POLICY "Users can view own uploads" ON public.uploads
  FOR SELECT USING (auth.uid() = user_id OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- ==========================================
-- 4. SEED DATA
-- ==========================================
INSERT INTO public.pricing_plans (name, description, price, quota)
VALUES 
  ('1 Upload', 'Kuota untuk 1 kali upload konten', 5000, 1),
  ('5 Upload', 'Kuota untuk 5 kali upload konten', 20000, 5),
  ('10 Upload', 'Kuota untuk 10 kali upload konten', 35000, 10)
ON CONFLICT DO NOTHING;

-- ==========================================
-- 5. HELPER FUNCTIONS
-- ==========================================

-- Function to check if user can upload
CREATE OR REPLACE FUNCTION public.check_upload_eligibility(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_role TEXT;
    v_total_uploads INT;
    v_quota INT;
    v_used INT;
BEGIN
    -- Get user role
    SELECT role INTO v_role FROM public.profiles WHERE id = p_user_id;
    
    -- Super Admin bypass
    IF v_role = 'admin' THEN
        RETURN jsonb_build_object('eligible', true, 'message', 'Super Admin bypass active', 'is_free', false);
    END IF;
    
    -- Count total historical uploads for this user
    SELECT COUNT(*) INTO v_total_uploads FROM public.uploads WHERE user_id = p_user_id;
    
    -- First upload is free
    IF v_total_uploads = 0 THEN
        RETURN jsonb_build_object('eligible', true, 'message', 'Free first upload available', 'is_free', true);
    END IF;
    
    -- Check user_access for subsequent uploads
    SELECT quota, used INTO v_quota, v_used FROM public.user_access WHERE user_id = p_user_id;
    
    IF v_quota IS NULL OR v_quota <= v_used THEN
        RETURN jsonb_build_object(
            'eligible', false, 
            'message', 'Upload kedua dan seterusnya harus melakukan pembayaran terlebih dahulu',
            'is_free', false
        );
    END IF;
    
    RETURN jsonb_build_object('eligible', true, 'message', 'Paid quota available', 'is_free', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.check_upload_eligibility(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.check_upload_eligibility(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_upload_eligibility(UUID) TO service_role;

-- Function to increment used quota
CREATE OR REPLACE FUNCTION public.increment_used_quota(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.user_access
    SET used = used + 1,
        updated_at = now()
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.increment_used_quota(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_used_quota(UUID) TO service_role;

-- Function to update quota after success payment
CREATE OR REPLACE FUNCTION public.update_user_quota_on_success(p_user_id UUID, p_plan_id UUID)
RETURNS VOID AS $$
DECLARE
    v_quota_to_add INT;
BEGIN
    -- Get quota from plan
    SELECT quota INTO v_quota_to_add FROM public.pricing_plans WHERE id = p_plan_id;
    
    -- Insert or Update user_access
    INSERT INTO public.user_access (user_id, quota, used)
    VALUES (p_user_id, v_quota_to_add, 0)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        quota = user_access.quota + v_quota_to_add,
        updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.update_user_quota_on_success(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_quota_on_success(UUID, UUID) TO service_role;


