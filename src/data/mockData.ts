export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "owner" | "student";
  avatar?: string;
  phone?: string;
  location?: string;
  createdAt: string;
}

export interface Favorite {
  id: string;
  userId: string;
  type: "kos" | "item";
  targetId: string;
}

export interface KosListing {
  id: string;
  ownerId?: string;
  title: string;
  location: string;
  price: number;
  images: string[];
  amenities: string[];
  rating: number;
  isPremium: boolean;
  ownerPhone: string;
  description: string;
  rules: string[];
  type: "putra" | "putri" | "campur";
  availableRooms: number;
  status?: "pending" | "approved" | "rejected";
}

export interface MarketplaceItem {
  id: string;
  sellerId?: string;
  title: string;
  price: number;
  image: string;
  category: string;
  condition: string;
  sellerPhone: string;
  sellerName: string;
  location: string;
  description: string;
  createdAt: string;
  status?: "active" | "sold" | "removed";
}

export const mockUsers: User[] = [
  {
    id: "u1",
    name: "Admin KosKita",
    email: "admin@koskita.com",
    role: "admin",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=admin",
    createdAt: "2023-01-01",
  },
  {
    id: "u2",
    name: "Haji Sulam",
    email: "sulam@owner.com",
    role: "owner",
    phone: "6281234567890",
    location: "Depok",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=owner1",
    createdAt: "2023-05-10",
  },
  {
    id: "u3",
    name: "Budi Mahasiswa",
    email: "budi@student.com",
    role: "student",
    phone: "6289876543210",
    location: "Yogyakarta",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=student1",
    createdAt: "2023-08-15",
  },
];

export const mockFavorites: Favorite[] = [];

export const mockKosListings: KosListing[] = [
  {
    id: "1",
    title: "Kos Harmoni Residence",
    location: "Jl. Margonda Raya, Depok",
    price: 1500000,
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=80",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80",
    ],
    amenities: ["WiFi", "AC", "Kamar Mandi Dalam", "Parkir"],
    rating: 4.8,
    isPremium: true,
    ownerPhone: "6281234567890",
    description: "Kos nyaman dekat UI dengan fasilitas lengkap. Lingkungan aman dan tenang, cocok untuk mahasiswa.",
    rules: ["Tidak boleh membawa hewan", "Jam malam 23:00", "Tidak merokok di dalam kamar"],
    type: "campur",
    availableRooms: 3,
  },
  {
    id: "2",
    title: "Kos Putri Melati",
    location: "Jl. Kaliurang KM 5, Yogyakarta",
    price: 900000,
    images: [
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80",
      "https://images.unsplash.com/photo-1486304873000-235643847519?w=600&q=80",
    ],
    amenities: ["WiFi", "Kamar Mandi Dalam", "Dapur Bersama"],
    rating: 4.5,
    isPremium: false,
    ownerPhone: "6289876543210",
    description: "Kos putri bersih dan nyaman dekat UGM. Akses mudah ke kampus dan pusat kota.",
    rules: ["Khusus putri", "Jam malam 22:00", "Tamu lawan jenis di ruang tamu saja"],
    type: "putri",
    availableRooms: 2,
  },
  {
    id: "3",
    title: "Kos Eksekutif Sudirman",
    location: "Jl. Sudirman No. 45, Bandung",
    price: 2200000,
    images: [
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&q=80",
      "https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=600&q=80",
    ],
    amenities: ["WiFi", "AC", "Kamar Mandi Dalam", "Parkir", "Laundry", "CCTV"],
    rating: 4.9,
    isPremium: true,
    ownerPhone: "6281122334455",
    description: "Kos eksekutif full furnished dekat ITB. Fasilitas premium dengan keamanan 24 jam.",
    rules: ["Tidak boleh membawa hewan", "Deposit 1 bulan"],
    type: "campur",
    availableRooms: 1,
  },
  {
    id: "4",
    title: "Kos Murah Jatinangor",
    location: "Jl. Raya Jatinangor, Sumedang",
    price: 650000,
    images: [
      "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=600&q=80",
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600&q=80",
    ],
    amenities: ["Kamar Mandi Dalam", "Parkir Motor"],
    rating: 4.0,
    isPremium: false,
    ownerPhone: "6285566778899",
    description: "Kos sederhana dan terjangkau dekat Unpad Jatinangor. Cocok untuk mahasiswa hemat.",
    rules: ["Bayar di muka", "Tidak boleh memasak di kamar"],
    type: "putra",
    availableRooms: 5,
  },
  {
    id: "5",
    title: "Kos Modern Tembalang",
    location: "Jl. Prof. Sudarto, Semarang",
    price: 1200000,
    images: [
      "https://images.unsplash.com/photo-1540518614846-7eded433c457?w=600&q=80",
      "https://images.unsplash.com/photo-1585128903994-9788298932a4?w=600&q=80",
    ],
    amenities: ["WiFi", "AC", "Kamar Mandi Dalam", "Laundry"],
    rating: 4.6,
    isPremium: false,
    ownerPhone: "6287788990011",
    description: "Kos modern dekat Undip Tembalang. Desain minimalis dengan fasilitas lengkap.",
    rules: ["Jam malam 23:00", "Tidak merokok"],
    type: "campur",
    availableRooms: 4,
  },
  {
    id: "6",
    title: "Kos Premium Gejayan",
    location: "Jl. Gejayan, Yogyakarta",
    price: 1800000,
    images: [
      "https://images.unsplash.com/photo-1615529328331-f8917597711f?w=600&q=80",
      "https://images.unsplash.com/photo-1556020685-ae41abfc9365?w=600&q=80",
    ],
    amenities: ["WiFi", "AC", "Kamar Mandi Dalam", "Parkir", "Rooftop"],
    rating: 4.7,
    isPremium: true,
    ownerPhone: "6282233445566",
    description: "Kos premium di area strategis Gejayan dekat UGM dan UNY.",
    rules: ["Deposit 1 bulan", "Tidak boleh membawa hewan"],
    type: "campur",
    availableRooms: 2,
  },
];

export const mockMarketplaceItems: MarketplaceItem[] = [
  {
    id: "m1",
    title: "Textbook Kalkulus Purcell Ed. 9",
    price: 75000,
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80",
    category: "Buku",
    condition: "Bekas - Baik",
    sellerPhone: "6281234567890",
    sellerName: "Andi",
    location: "Depok",
    description: "Buku kalkulus Purcell edisi 9, ada sedikit coretan pensil tapi masih sangat layak.",
    createdAt: "2024-01-15",
  },
  {
    id: "m2",
    title: "Laptop ASUS VivoBook 14",
    price: 4500000,
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&q=80",
    category: "Elektronik",
    condition: "Bekas - Sangat Baik",
    sellerPhone: "6289876543210",
    sellerName: "Sari",
    location: "Yogyakarta",
    description: "Laptop ASUS VivoBook 14 inch, i5 Gen 10, RAM 8GB, SSD 512GB. Masih mulus.",
    createdAt: "2024-01-10",
  },
  {
    id: "m3",
    title: "Sepeda Lipat Polygon",
    price: 2000000,
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
    category: "Kendaraan",
    condition: "Bekas - Baik",
    sellerPhone: "6281122334455",
    sellerName: "Budi",
    location: "Bandung",
    description: "Sepeda lipat Polygon Urbano 3, cocok untuk mobilitas di sekitar kampus.",
    createdAt: "2024-01-12",
  },
  {
    id: "m4",
    title: "Meja Belajar Minimalis",
    price: 350000,
    image: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=400&q=80",
    category: "Furnitur",
    condition: "Bekas - Baik",
    sellerPhone: "6285566778899",
    sellerName: "Dewi",
    location: "Sumedang",
    description: "Meja belajar minimalis kayu jati, ukuran 100x60cm. Ada laci kecil.",
    createdAt: "2024-01-14",
  },
  {
    id: "m5",
    title: "Kamus Oxford Advanced",
    price: 120000,
    image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&q=80",
    category: "Buku",
    condition: "Bekas - Sangat Baik",
    sellerPhone: "6287788990011",
    sellerName: "Rina",
    location: "Semarang",
    description: "Kamus Oxford Advanced Learner's Dictionary edisi terbaru.",
    createdAt: "2024-01-08",
  },
  {
    id: "m6",
    title: "Rice Cooker Miyako 1.8L",
    price: 150000,
    image: "https://images.unsplash.com/photo-1585664811087-47f65abbad64?w=400&q=80",
    category: "Elektronik",
    condition: "Bekas - Baik",
    sellerPhone: "6282233445566",
    sellerName: "Fajar",
    location: "Yogyakarta",
    description: "Rice cooker Miyako 1.8L, fungsi normal semua. Cocok untuk anak kos.",
    createdAt: "2024-01-11",
  },
];

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};
