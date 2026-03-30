# Panduan Setup Supabase untuk KostKita

Ikuti langkah-langkah berikut untuk menghubungkan aplikasi KostKita dengan backend Supabase Anda.

## 1. Setup Database & Auth
1. Buka [Supabase Dashboard](https://app.supabase.com/).
2. Masuk ke proyek Anda.
3. Buka menu **SQL Editor**.
4. Salin seluruh isi dari file `supabase_full_setup.sql` yang ada di root folder project ini.
5. Tempelkan ke editor dan klik **Run**.
   - Ini akan membuat semua tabel, trigger, sistem keamanan (RLS), dan akun login sampel.

## 2. Setup Storage (Gambar)
Skrip SQL di atas sudah mencoba membuat bucket secara otomatis. Namun, pastikan kembali di menu **Storage**:
1. Pastikan ada bucket bernama: `kos-images`, `item-images`, dan `avatars`.
2. Pastikan semuanya diatur ke **Public**.

## 3. Konfigurasi Environment Variables
Buat file bernama `.env` di root folder project ini (jika belum ada) dan isi dengan kredensial dari menu **Project Settings > API**:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 4. Akun Login Sampel
Setelah menjalankan SQL, Anda bisa login dengan akun berikut:

| Peran | Email | Password |
|-------|-------|----------|
| **Admin** | admin@koskita.com | `admin123` |
| **Owner** | sulam@owner.com | `owner123` |
| **Student** | budi@student.com | `student123` |

## 5. Fitur yang Sudah Terintegrasi
- **Autentikasi**: Login, Register (dengan role), dan Logout.
- **Dashboard**: Statistik riil berdasarkan data database.
- **Listing**: Tambah kos/barang dengan upload gambar otomatis ke storage.
- **Interaksi**: Sistem pesan (inquiries) dan notifikasi.
- **Admin**: Manajemen user, verifikasi kos, dan moderasi laporan.
