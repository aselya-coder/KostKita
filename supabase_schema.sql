-- ==========================================
-- KOSKITA COMPLETE DATABASE SCHEMA (ROBUST START)
-- ==========================================

-- 0. CLEANUP
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP TABLE IF EXISTS public.reports CASCADE;
DROP TABLE IF EXISTS public.inquiries CASCADE;
DROP TABLE IF EXISTS public.user_activities CASCADE;
DROP TABLE IF EXISTS public.favorites CASCADE;
DROP TABLE IF EXISTS public.coin_logs CASCADE;
DROP TABLE IF EXISTS public.wallets CASCADE;
DROP TABLE IF EXISTS public.marketplace_items CASCADE;
DROP TABLE IF EXISTS public.kos_listings CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TYPE IF EXISTS kos_type CASCADE;

-- 1. PROFILES & AUTH EXTENSION
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  phone TEXT,
  avatar_url TEXT,
  location TEXT,
  about TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- WALLET TABLE
CREATE TABLE public.wallets (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  balance INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Sync existing users from auth.users to public.profiles (to fix FK error)
INSERT INTO public.profiles (id, name, role, phone, avatar_url)
SELECT 
    id, 
    COALESCE(raw_user_meta_data->>'name', 'User Eksisting'),
    COALESCE(raw_user_meta_data->>'role', 'user'),
    raw_user_meta_data->>'phone',
    raw_user_meta_data->>'avatar_url'
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Sync wallets for existing users
INSERT INTO public.wallets (user_id, balance)
SELECT id, 0 FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;

-- Trigger function for future signups
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role, phone, avatar_url)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'name', 'User Baru'),
    COALESCE(new.raw_user_meta_data->>'role', 'user'),
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'avatar_url'
  );
  
  INSERT INTO public.wallets (user_id, balance) VALUES (new.id, 0);
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 2. KOS LISTINGS
CREATE TYPE kos_type AS ENUM ('putra', 'putri', 'campur');

CREATE TABLE public.kos_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  location TEXT NOT NULL,
  price NUMERIC NOT NULL,
  images TEXT[] DEFAULT '{}',
  amenities TEXT[] DEFAULT '{}',
  rating NUMERIC DEFAULT 0,
  is_premium BOOLEAN DEFAULT false,
  description TEXT,
  rules TEXT[] DEFAULT '{}',
  type kos_type NOT NULL DEFAULT 'campur',
  available_rooms INT DEFAULT 1,
  status TEXT DEFAULT 'approved',
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '30 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. MARKETPLACE ITEMS
CREATE TABLE public.marketplace_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  price NUMERIC NOT NULL,
  image TEXT,
  category TEXT,
  condition TEXT,
  location TEXT,
  description TEXT,
  status TEXT DEFAULT 'active',
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '30 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. TRANSACTIONS & COIN LOGS
CREATE TABLE public.coin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INT NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. FAVORITES
CREATE TABLE public.favorites (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_id UUID NOT NULL,
  type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, target_id, type)
);

-- 6. USER ACTIVITIES (LOGS)
CREATE TABLE public.user_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity TEXT NOT NULL,
  target_name TEXT,
  target_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. INQUIRIES & REPORTS
CREATE TABLE public.inquiries (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  sender_phone TEXT NOT NULL,
  message TEXT NOT NULL,
  listing_id UUID REFERENCES public.kos_listings(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.reports (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_id UUID NOT NULL,
  type TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kos_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public profiles viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "View active kos" ON public.kos_listings FOR SELECT USING (status = 'approved' AND (expires_at > now() OR owner_id = auth.uid()));
CREATE POLICY "Owners manage own kos" ON public.kos_listings FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "View active items" ON public.marketplace_items FOR SELECT USING (status = 'active' AND (expires_at > now() OR seller_id = auth.uid()));
CREATE POLICY "Sellers manage own items" ON public.marketplace_items FOR ALL USING (auth.uid() = seller_id);
CREATE POLICY "Users view own wallet" ON public.wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users view own coin logs" ON public.coin_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users manage own favorites" ON public.favorites FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users view own activities" ON public.user_activities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Owners view own inquiries" ON public.inquiries FOR SELECT USING (auth.uid() = owner_id);

-- ==========================================
-- SEED DATA (INITIAL ITEMS)
-- ==========================================

DO $$
DECLARE
    first_user_id UUID;
BEGINQ  
    SELECT id INTO first_user_id FROM public.profiles LIMIT 1;

    IF first_user_id IS NOT NULL THEN
        -- Insert Sample Kos (Total 6) dengan minimal 2 gambar
        INSERT INTO public.kos_listings (owner_id, title, location, price, type, images, amenities, rating, available_rooms)
        VALUES 
        (first_user_id, 'Kos Harmoni Residence', 'Jl. Margonda Raya, Depok', 1500000, 'campur', ARRAY['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267', 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c'], ARRAY['WiFi', 'AC', 'Parkir'], 4.8, 3),
        (first_user_id, 'Kos Putri Melati', 'Jl. Kaliurang, Yogyakarta', 900000, 'putri', ARRAY['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2', 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd'], ARRAY['WiFi', 'Kamar Mandi Dalam'], 4.5, 2),
        (first_user_id, 'Kos Eksekutif Sudirman', 'Jl. Sudirman No. 45, Bandung', 2200000, 'campur', ARRAY['https://images.unsplash.com/photo-1493809842364-78817add7ffb', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688'], ARRAY['WiFi', 'AC', 'Parkir', 'Laundry', 'CCTV'], 4.9, 1),
        (first_user_id, 'Kos Murah Jatinangor', 'Jl. Raya Jatinangor, Sumedang', 650000, 'putra', ARRAY['https://images.unsplash.com/photo-1554995207-c18c203602cb', 'https://images.unsplash.com/photo-1505691938895-1758d7feb511'], ARRAY['Kamar Mandi Dalam', 'Parkir Motor'], 4.0, 5),
        (first_user_id, 'Kos Modern Tembalang', 'Jl. Prof. Sudarto, Semarang', 1200000, 'campur', ARRAY['https://images.unsplash.com/photo-1540518614846-7eded433c457', 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a'], ARRAY['WiFi', 'AC', 'Kamar Mandi Dalam', 'Laundry'], 4.6, 4),
        (first_user_id, 'Kos Premium Gejayan', 'Jl. Gejayan, Yogyakarta', 1800000, 'campur', ARRAY['https://images.unsplash.com/photo-1615529328331-f8917597711f', 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af'], ARRAY['WiFi', 'AC', 'Parkir', 'Rooftop'], 4.7, 1);

        -- Insert Sample Marketplace Items (Total 6)
        INSERT INTO public.marketplace_items (seller_id, title, price, category, condition, location, image)
        VALUES 
        (first_user_id, 'Buku Kalkulus Purcell', 75000, 'Buku', 'Bekas - Baik', 'Depok', 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c'),
        (first_user_id, 'Laptop ASUS VivoBook', 4500000, 'Elektronik', 'Bekas - Sangat Baik', 'Yogyakarta', 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853'),
        (first_user_id, 'Sepeda Lipat Polygon', 2000000, 'Kendaraan', 'Bekas - Baik', 'Bandung', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d'),
        (first_user_id, 'Meja Belajar Minimalis', 350000, 'Furnitur', 'Bekas - Baik', 'Sumedang', 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd'),
        (first_user_id, 'Rice Cooker Philips', 250000, 'Elektronik', 'Bekas - Sangat Baik', 'Semarang', 'https://images.unsplash.com/photo-1585128903994-9788298932a4'),
        (first_user_id, 'Gitar Akustik Yamaha', 800000, 'Hobi', 'Bekas - Baik', 'Yogyakarta', 'https://images.unsplash.com/photo-1550291652-6ea9114a47b1');
    END IF;
END $$;
