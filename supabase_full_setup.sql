-- SUPABASE COMPLETE SETUP FOR KOSTKITA
-- Run this in the Supabase SQL Editor

-- ==========================================
-- 0. CLEANUP (OPTIONAL - UNCOMMENT IF YOU WANT A FRESH START)
-- ==========================================
-- DROP SCHEMA public CASCADE;
-- CREATE SCHEMA public;
-- GRANT ALL ON SCHEMA public TO postgres;
-- GRANT ALL ON SCHEMA public TO public;

-- ==========================================
-- 1. EXTENSIONS & TYPES
-- ==========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Custom Enums (Wrapped in DO blocks to avoid "already exists" errors)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'kos_type') THEN
        CREATE TYPE kos_type AS ENUM ('putra', 'putri', 'campur');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'listing_status') THEN
        CREATE TYPE listing_status AS ENUM ('pending', 'approved', 'rejected');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'item_status') THEN
        CREATE TYPE item_status AS ENUM ('active', 'sold', 'removed', 'pending');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'favorite_type') THEN
        CREATE TYPE favorite_type AS ENUM ('kos', 'item');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
        CREATE TYPE notification_type AS ENUM ('inquiry', 'sale', 'system', 'favorite');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'inquiry_status') THEN
        CREATE TYPE inquiry_status AS ENUM ('new', 'replied', 'archived');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_type') THEN
        CREATE TYPE report_type AS ENUM ('user', 'kos', 'item');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_status') THEN
        CREATE TYPE report_status AS ENUM ('new', 'resolved', 'dismissed');
    END IF;
END $$;

-- ==========================================
-- 2. TABLES
-- ==========================================

-- PROFILES: Extends auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'owner', 'admin')),
  phone TEXT,
  location TEXT,
  avatar TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- KOS_LISTINGS: Boarding house listings
CREATE TABLE IF NOT EXISTS public.kos_listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  status listing_status DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- MARKETPLACE_ITEMS: Student marketplace
CREATE TABLE IF NOT EXISTS public.marketplace_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  price NUMERIC NOT NULL,
  image TEXT,
  category TEXT,
  condition TEXT,
  location TEXT,
  description TEXT,
  status item_status DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- FAVORITES: User bookmarked items/kos
CREATE TABLE IF NOT EXISTS public.favorites (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_id UUID NOT NULL,
  type favorite_type NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, target_id, type)
);

-- NOTIFICATIONS: User alerts
CREATE TABLE IF NOT EXISTS public.notifications (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  type notification_type NOT NULL,
  link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- INQUIRIES: Contact requests for kos
CREATE TABLE IF NOT EXISTS public.inquiries (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  sender_name TEXT NOT NULL,
  sender_phone TEXT NOT NULL,
  listing_id UUID REFERENCES public.kos_listings(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  status inquiry_status DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- REPORTS: Admin moderation
CREATE TABLE IF NOT EXISTS public.reports (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_id UUID NOT NULL,
  type report_type NOT NULL,
  reason TEXT NOT NULL,
  status report_status DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- 3. FUNCTIONS & TRIGGERS
-- ==========================================

-- Function to handle updated_at timestamps
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
DROP TRIGGER IF EXISTS set_updated_at_profiles ON public.profiles;
CREATE TRIGGER set_updated_at_profiles BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_kos ON public.kos_listings;
CREATE TRIGGER set_updated_at_kos BEFORE UPDATE ON public.kos_listings FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_items ON public.marketplace_items;
CREATE TRIGGER set_updated_at_items BEFORE UPDATE ON public.marketplace_items FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_inquiries ON public.inquiries;
CREATE TRIGGER set_updated_at_inquiries BEFORE UPDATE ON public.inquiries FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();

-- Function to handle new user profile creation on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role, phone, avatar, location)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'name', 'User ' || substr(new.id::text, 1, 8)),
    COALESCE(new.raw_user_meta_data->>'role', 'student'),
    new.raw_user_meta_data->>'phone',
    COALESCE(new.raw_user_meta_data->>'avatar', 'https://api.dicebear.com/7.x/avataaars/svg?seed=' || new.id),
    new.raw_user_meta_data->>'location'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==========================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kos_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- --- PROFILES POLICIES ---
DROP POLICY IF EXISTS "Public profiles are viewable by authenticated users." ON public.profiles;
CREATE POLICY "Public profiles are viewable by authenticated users." ON public.profiles
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
CREATE POLICY "Users can update their own profile." ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- --- KOS_LISTINGS POLICIES ---
DROP POLICY IF EXISTS "Anyone can view approved listings." ON public.kos_listings;
CREATE POLICY "Anyone can view approved listings." ON public.kos_listings
  FOR SELECT USING (status = 'approved' OR auth.uid() = owner_id OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Owners can create listings." ON public.kos_listings;
CREATE POLICY "Owners can create listings." ON public.kos_listings
  FOR INSERT WITH CHECK (auth.uid() = owner_id AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'owner');

DROP POLICY IF EXISTS "Owners can update their own listings." ON public.kos_listings;
CREATE POLICY "Owners can update their own listings." ON public.kos_listings
  FOR UPDATE USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners can delete their own listings." ON public.kos_listings;
CREATE POLICY "Owners can delete their own listings." ON public.kos_listings
  FOR DELETE USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Admins can manage everything." ON public.kos_listings;
CREATE POLICY "Admins can manage everything." ON public.kos_listings
  FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- --- MARKETPLACE_ITEMS POLICIES ---
DROP POLICY IF EXISTS "Anyone can view active items." ON public.marketplace_items;
CREATE POLICY "Anyone can view active items." ON public.marketplace_items
  FOR SELECT USING (status = 'active' OR auth.uid() = seller_id OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Users can create items." ON public.marketplace_items;
CREATE POLICY "Users can create items." ON public.marketplace_items
  FOR INSERT WITH CHECK (auth.uid() = seller_id);

DROP POLICY IF EXISTS "Users can update their own items." ON public.marketplace_items;
CREATE POLICY "Users can update their own items." ON public.marketplace_items
  FOR UPDATE USING (auth.uid() = seller_id) WITH CHECK (auth.uid() = seller_id);

DROP POLICY IF EXISTS "Users can delete their own items." ON public.marketplace_items;
CREATE POLICY "Users can delete their own items." ON public.marketplace_items
  FOR DELETE USING (auth.uid() = seller_id);

DROP POLICY IF EXISTS "Admins can manage everything." ON public.marketplace_items;
CREATE POLICY "Admins can manage everything." ON public.marketplace_items
  FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- --- FAVORITES POLICIES ---
DROP POLICY IF EXISTS "Users can manage their own favorites." ON public.favorites;
CREATE POLICY "Users can manage their own favorites." ON public.favorites
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- --- NOTIFICATIONS POLICIES ---
DROP POLICY IF EXISTS "Users can manage their own notifications." ON public.notifications;
CREATE POLICY "Users can manage their own notifications." ON public.notifications
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- --- INQUIRIES POLICIES ---
DROP POLICY IF EXISTS "Anyone can create inquiries." ON public.inquiries;
CREATE POLICY "Anyone can create inquiries." ON public.inquiries
  FOR INSERT WITH CHECK (true); -- Allow guest inquiries if needed, or auth.role() = 'authenticated'

DROP POLICY IF EXISTS "Owners can view inquiries for their listings." ON public.inquiries;
CREATE POLICY "Owners can view inquiries for their listings." ON public.inquiries
  FOR SELECT USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Senders can view their own inquiries." ON public.inquiries;
CREATE POLICY "Senders can view their own inquiries." ON public.inquiries
  FOR SELECT USING (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Owners can update status of inquiries." ON public.inquiries;
CREATE POLICY "Owners can update status of inquiries." ON public.inquiries
  FOR UPDATE USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners can delete their own inquiries." ON public.inquiries;
CREATE POLICY "Owners can delete their own inquiries." ON public.inquiries
  FOR DELETE USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Admins can view all inquiries." ON public.inquiries;
CREATE POLICY "Admins can view all inquiries." ON public.inquiries
  FOR SELECT USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- --- REPORTS POLICIES ---
DROP POLICY IF EXISTS "Authenticated users can create reports." ON public.reports;
CREATE POLICY "Authenticated users can create reports." ON public.reports
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can manage all reports." ON public.reports;
CREATE POLICY "Admins can manage all reports." ON public.reports
  FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- ==========================================
-- 4.1 PERMISSIONS
-- ==========================================
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- ==========================================
-- 5. STORAGE SETUP (CRITICAL FOR UPLOADS)
-- ==========================================
-- This section ensures the buckets exist and are public.

-- Create buckets if they don't exist
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('kos-images', 'kos-images', true),
  ('item-images', 'item-images', true),
  ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Set up RLS for Storage
-- Allow public read access to all files
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id IN ('kos-images', 'item-images', 'avatars'));

-- Allow authenticated users to upload files
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND 
  (bucket_id IN ('kos-images', 'item-images', 'avatars'))
);

-- Allow owners to update/delete their own files
DROP POLICY IF EXISTS "Owner Update" ON storage.objects;
CREATE POLICY "Owner Update" ON storage.objects FOR UPDATE USING (auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Owner Delete" ON storage.objects;
CREATE POLICY "Owner Delete" ON storage.objects FOR DELETE USING (auth.uid()::text = (storage.foldername(name))[1]);

-- Grant permissions to storage schema
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;
GRANT ALL ON storage.objects TO anon;
GRANT ALL ON storage.buckets TO anon;

-- ==========================================
-- 6. AUTHENTICATION & SAMPLE DATA (SEEDING)
-- ==========================================
-- This section handles profiles for manually created users and populates sample data.

-- Step 1: Manual Profile Sync for Dashboard Users
-- Use the UIDs from your Supabase Auth dashboard screenshot
INSERT INTO public.profiles (id, name, role, phone, location, avatar)
VALUES 
  ('bcb79531-0e27-497e-949d-00fc7b219240', 'Admin KosKita', 'admin', NULL, NULL, 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin'),
  ('f0c1db18-3150-4869-a62c-2c4faedc0d43', 'Haji Sulam (Owner)', 'owner', '6281234567890', 'Depok', 'https://api.dicebear.com/7.x/avataaars/svg?seed=owner'),
  ('5d3a8827-59f3-45b5-9bbb-7c094afc8721', 'Budi Mahasiswa', 'student', '6289876543210', 'Yogyakarta', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student')
ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  name = EXCLUDED.name,
  phone = COALESCE(profiles.phone, EXCLUDED.phone),
  location = COALESCE(profiles.location, EXCLUDED.location);

-- Step 2: Insert sample Kos Listings
-- Linked to Owner ID: f0c1db18-3150-4869-a62c-2c4faedc0d43
DO $$ 
DECLARE 
  v_kos_id UUID := uuid_generate_v4();
BEGIN
  INSERT INTO public.kos_listings (id, owner_id, title, location, price, images, amenities, rating, is_premium, description, rules, type, available_rooms, status)
  VALUES 
    (v_kos_id, 'f0c1db18-3150-4869-a62c-2c4faedc0d43', 'Kos Harmoni Residence', 'Jl. Margonda Raya, Depok', 1500000, ARRAY['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=80', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80'], ARRAY['WiFi', 'AC', 'Kamar Mandi Dalam', 'Parkir'], 4.8, true, 'Kos nyaman dekat UI dengan fasilitas lengkap. Lingkungan aman dan tenang, cocok untuk mahasiswa.', ARRAY['Tidak boleh membawa hewan', 'Jam malam 23:00', 'Tidak merokok di dalam kamar'], 'campur', 3, 'approved'),
    (uuid_generate_v4(), 'f0c1db18-3150-4869-a62c-2c4faedc0d43', 'Kos Putri Melati', 'Jl. Kaliurang KM 5, Yogyakarta', 900000, ARRAY['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80', 'https://images.unsplash.com/photo-1486304873000-235643847519?w=600&q=80'], ARRAY['WiFi', 'Kamar Mandi Dalam', 'Dapur Bersama'], 4.5, false, 'Kos putri bersih dan nyaman dekat UGM. Akses mudah ke kampus dan pusat kota.', ARRAY['Khusus putri', 'Jam malam 22:00', 'Tamu lawan jenis di ruang tamu saja'], 'putri', 2, 'approved'),
    (uuid_generate_v4(), 'f0c1db18-3150-4869-a62c-2c4faedc0d43', 'Kos Eksekutif Sudirman', 'Jl. Sudirman No. 45, Bandung', 2200000, ARRAY['https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&q=80', 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=600&q=80'], ARRAY['WiFi', 'AC', 'Kamar Mandi Dalam', 'Parkir', 'Laundry', 'CCTV'], 4.9, true, 'Kos eksekutif full furnished dekat ITB. Fasilitas premium dengan keamanan 24 jam.', ARRAY['Tidak boleh membawa hewan', 'Deposit 1 bulan'], 'campur', 1, 'approved'),
    (uuid_generate_v4(), 'f0c1db18-3150-4869-a62c-2c4faedc0d43', 'Kos Murah Jatinangor', 'Jl. Raya Jatinangor, Sumedang', 650000, ARRAY['https://images.unsplash.com/photo-1554995207-c18c203602cb?w=600&q=80', 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600&q=80'], ARRAY['Kamar Mandi Dalam', 'Parkir Motor'], 4.0, false, 'Kos sederhana dan terjangkau dekat Unpad Jatinangor. Cocok untuk mahasiswa hemat.', ARRAY['Bayar di muka', 'Tidak boleh memasak di kamar'], 'putra', 5, 'approved'),
    (uuid_generate_v4(), 'f0c1db18-3150-4869-a62c-2c4faedc0d43', 'Kos Modern Tembalang', 'Jl. Prof. Sudarto, Semarang', 1200000, ARRAY['https://images.unsplash.com/photo-1540518614846-7eded433c457?w=600&q=80', 'https://images.unsplash.com/photo-1585128903994-9788298932a4?w=600&q=80'], ARRAY['WiFi', 'AC', 'Kamar Mandi Dalam', 'Laundry'], 4.6, false, 'Kos modern dekat Undip Tembalang. Desain minimalis dengan fasilitas lengkap.', ARRAY['Jam malam 23:00', 'Tidak merokok'], 'campur', 4, 'approved'),
    (uuid_generate_v4(), 'f0c1db18-3150-4869-a62c-2c4faedc0d43', 'Kos Premium Gejayan', 'Jl. Gejayan, Yogyakarta', 1800000, ARRAY['https://images.unsplash.com/photo-1615529328331-f8917597711f?w=600&q=80', 'https://images.unsplash.com/photo-1556020685-ae41abfc9365?w=600&q=80'], ARRAY['WiFi', 'AC', 'Kamar Mandi Dalam', 'Parkir', 'Rooftop'], 4.7, true, 'Kos premium di area strategis Gejayan dekat UGM dan UNY.', ARRAY['Deposit 1 bulan', 'Tidak boleh membawa hewan'], 'campur', 1, 'approved'),
    (uuid_generate_v4(), 'f0c1db18-3150-4869-a62c-2c4faedc0d43', 'Kos Baru Menunggu', 'Jl. Baru No. 1, Jakarta', 2000000, ARRAY['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=80'], ARRAY['WiFi', 'AC'], 0, false, 'Kos baru yang sedang menunggu persetujuan admin.', ARRAY['No rules yet'], 'campur', 10, 'pending');

  -- Step 3: Insert ALL sample Marketplace Items
  -- Linked to Student ID: 5d3a8827-59f3-45b5-9bbb-7c094afc8721
  INSERT INTO public.marketplace_items (id, seller_id, title, price, image, category, condition, location, description, status)
  VALUES 
    (uuid_generate_v4(), '5d3a8827-59f3-45b5-9bbb-7c094afc8721', 'Textbook Kalkulus Purcell Ed. 9', 75000, 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80', 'Buku', 'Bekas - Baik', 'Yogyakarta', 'Buku kalkulus Purcell edisi 9, ada sedikit coretan pensil tapi masih sangat layak.', 'active'),
    (uuid_generate_v4(), '5d3a8827-59f3-45b5-9bbb-7c094afc8721', 'Laptop ASUS VivoBook 14', 4500000, 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&q=80', 'Elektronik', 'Bekas - Sangat Baik', 'Yogyakarta', 'Laptop ASUS VivoBook 14 inch, i5 Gen 10, RAM 8GB, SSD 512GB. Masih mulus.', 'active'),
    (uuid_generate_v4(), '5d3a8827-59f3-45b5-9bbb-7c094afc8721', 'Sepeda Lipat Polygon', 2000000, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80', 'Kendaraan', 'Bekas - Baik', 'Bandung', 'Sepeda lipat Polygon Urbano 3, cocok untuk mobilitas di sekitar kampus.', 'active'),
    (uuid_generate_v4(), '5d3a8827-59f3-45b5-9bbb-7c094afc8721', 'Meja Belajar Minimalis', 350000, 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=400&q=80', 'Furnitur', 'Bekas - Baik', 'Sumedang', 'Meja belajar minimalis kayu jati, ukuran 100x60cm. Ada laci kecil.', 'active'),
    (uuid_generate_v4(), '5d3a8827-59f3-45b5-9bbb-7c094afc8721', 'Kamus Oxford Advanced', 120000, 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&q=80', 'Buku', 'Bekas - Sangat Baik', 'Semarang', 'Kamus Oxford Advanced Learner''s Dictionary edisi terbaru.', 'active'),
    (uuid_generate_v4(), '5d3a8827-59f3-45b5-9bbb-7c094afc8721', 'Rice Cooker Miyako 1.8L', 150000, 'https://images.unsplash.com/photo-1585664811087-47f65abbad64?w=400&q=80', 'Elektronik', 'Bekas - Baik', 'Yogyakarta', 'Rice cooker Miyako 1.8L, fungsi normal semua. Cocok untuk anak kos.', 'active');

  -- Step 4: Insert sample Inquiries (Linked to v_kos_id)
  INSERT INTO public.inquiries (owner_id, sender_id, sender_name, sender_phone, listing_id, message, status)
  VALUES 
    ('f0c1db18-3150-4869-a62c-2c4faedc0d43', '5d3a8827-59f3-45b5-9bbb-7c094afc8721', 'Budi Mahasiswa', '6289876543210', v_kos_id, 'Halo, apakah kamar kos masih tersedia untuk bulan depan?', 'new'),
    ('f0c1db18-3150-4869-a62c-2c4faedc0d43', NULL, 'Ani Safitri', '6287654321098', v_kos_id, 'Saya ingin tanya apakah boleh membawa laptop dan rice cooker?', 'replied');
END $$;

-- Step 5: Insert sample Notifications
INSERT INTO public.notifications (user_id, title, message, type, link)
VALUES 
  ('f0c1db18-3150-4869-a62c-2c4faedc0d43', 'Pertanyaan Baru', 'Budi Mahasiswa tertarik dengan Kos Harmoni Residence.', 'inquiry', '/owner-dashboard/inquiries'),
  ('5d3a8827-59f3-45b5-9bbb-7c094afc8721', 'Kos Favorit Turun Harga', 'Kos Putri Melati yang Anda simpan kini lebih murah.', 'favorite', '/dashboard/favorites'),
  ('bcb79531-0e27-497e-949d-00fc7b219240', 'Laporan Baru', 'Ada 1 laporan konten yang perlu dimoderasi.', 'system', '/admin/reports');

-- Step 6: Insert sample Reports
INSERT INTO public.reports (reporter_id, target_id, type, reason, status)
VALUES 
  ('5d3a8827-59f3-45b5-9bbb-7c094afc8721', 'f0c1db18-3150-4869-a62c-2c4faedc0d43', 'user', 'Spam pesan tidak jelas', 'new');

