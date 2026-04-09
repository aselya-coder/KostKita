export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: "admin" | "owner" | "student" | "user";
  avatar?: string;
  phone?: string;
  location: string;
  about: string;
  createdAt: string;
}

export interface Favorite {
  id: string;
  userId: string;
  type: "kos" | "item";
  targetId: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  type: "inquiry" | "sale" | "system" | "favorite";
  link?: string;
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
  ownerName?: string;
  ownerPhone: string;
  description: string;
  rules: string[];
  type: "putra" | "putri" | "campur";
  availableRooms: number;
  status?: "pending" | "approved" | "rejected" | "active" | "expired" | "archived";
  isFreeFirstAd?: boolean;
  adDurationDays?: number;
  coinCostPerDay?: number;
  expiryDate?: string;
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
  status?: "active" | "sold" | "removed" | "pending" | "expired" | "archived";
  isFreeFirstAd?: boolean;
  adDurationDays?: number;
  coinCostPerDay?: number;
  expiryDate?: string;
}

export interface CoinPackage {
  id: string;
  coins: number;
  price: number;
  adminFee: number;
}

export interface Wallet {
  userId: string;
  balance: number;
  totalEarnings: number;
}

export interface Transaction {
  id: string;
  userId: string;
  type: "topup" | "ad_payment" | "sale_income";
  amount: number; // in IDR
  coins?: number;
  adminFee?: number;
  status: "pending" | "paid" | "failed";
  description: string;
  createdAt: string;
}

export const mockCoinPackages: CoinPackage[] = [
  { id: "p1", coins: 5, price: 50000, adminFee: 2500 },
  { id: "p2", coins: 10, price: 100000, adminFee: 5000 },
  { id: "p3", coins: 50, price: 500000, adminFee: 15000 },
  { id: "p4", coins: 100, price: 1000000, adminFee: 25000 },
];

export const mockWallets: Wallet[] = [
  { userId: "u1", balance: 0, totalEarnings: 5450000 }, // Admin wallet tracks revenue
  { userId: "u2", balance: 25, totalEarnings: 15000000 },
  { userId: "u3", balance: 10, totalEarnings: 500000 },
];

export const mockTransactions: Transaction[] = [
  {
    id: "t1",
    userId: "u2",
    type: "topup",
    amount: 105000,
    coins: 10,
    adminFee: 5000,
    status: "paid",
    description: "Top up 10 koin",
    createdAt: "2024-03-20T10:00:00Z",
  },
  {
    id: "t2",
    userId: "u2",
    type: "ad_payment",
    amount: 0,
    coins: 7,
    status: "paid",
    description: "Iklan Kos Harmoni (7 hari)",
    createdAt: "2024-03-21T14:30:00Z",
  },
];

export interface SystemSettings {
  coinPrice: number;
  adminFeeType: "flat" | "percent";
  adminFeeValue: number;
  adCostPerDay: number;
}

export const defaultSystemSettings: SystemSettings = {
  coinPrice: 10000,
  adminFeeType: "flat",
  adminFeeValue: 2500,
  adCostPerDay: 1,
};


export interface Inquiry {
  id: string;
  ownerId: string;
  senderName: string;
  senderPhone: string;
  propertyName: string;
  message: string;
  time: string;
  status: "new" | "replied" | "archived";
}

export interface Report {
  id: string;
  type: "user" | "kos" | "item";
  targetName: string;
  reporterName: string;
  reason: string;
  time: string;
  status: "new" | "resolved" | "dismissed";
}

export const mockReports: Report[] = [
  { id: "r1", type: "user", targetName: "Budi Mahasiswa", reporterName: "Sari", reason: "Spam pesan tidak jelas", time: "2 jam yang lalu", status: "new" },
  { id: "r2", type: "item", targetName: "Laptop ASUS VivoBook", reporterName: "Andi", reason: "Deskripsi barang tidak sesuai asli", time: "5 jam yang lalu", status: "new" },
  { id: "r3", type: "kos", targetName: "Kos Harmoni Residence", reporterName: "Rina", reason: "Fasilitas tidak sesuai yang dicantumkan", time: "1 hari yang lalu", status: "resolved" },
  { id: "r4", type: "item", targetName: "Sepeda Lipat Polygon", reporterName: "Budi", reason: "Penjual sulit dihubungi", time: "2 hari yang lalu", status: "dismissed" },
];

export const mockUsers: User[] = [
  {
    id: "u1",
    name: "Admin KosKita",
    email: "admin@koskita.com",
    password: "admin123",
    role: "admin",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=admin",
    location: "",
    about: "",
    createdAt: "2023-01-01",
  },
  {
    id: "u2",
    name: "Haji Sulam",
    email: "sulam@owner.com",
    password: "owner123",
    role: "owner",
    phone: "6281234567890",
    location: "Depok",
    about: "Pemilik kos ramah dan suka berkebun.",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=owner1",
    createdAt: "2023-05-10",
  },
  {
    id: "u3",
    name: "Budi Mahasiswa",
    email: "budi@student.com",
    password: "student123",
    role: "student",
    phone: "6289876543210",
    location: "Yogyakarta",
    about: "Mahasiswa semester 5 yang sedang mencari inspirasi.",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=student1",
    createdAt: "2023-08-15",
  },
];

export const mockFavorites: Favorite[] = [];

export const mockNotifications: Notification[] = [
  {
    id: "n1",
    userId: "u2", // Haji Sulam (Owner)
    title: "Pertanyaan Baru",
    message: "Budi Mahasiswa tertarik dengan Kos Harmoni Residence.",
    time: "10 menit yang lalu",
    isRead: false,
    type: "inquiry",
    link: "/dashboard/inquiries",
  },
  {
    id: "n2",
    userId: "u2",
    title: "Barang Terjual",
    message: "Sepeda Lipat Polygon Anda telah laku terjual!",
    time: "2 jam yang lalu",
    isRead: true,
    type: "sale",
    link: "/dashboard/my-items",
  },
  {
    id: "n3",
    userId: "u3", // Budi (Student)
    title: "Kos Favorit Turun Harga",
    message: "Kos Putri Melati yang Anda simpan kini lebih murah.",
    time: "1 jam yang lalu",
    isRead: false,
    type: "favorite",
    link: "/dashboard/favorites",
  },
  {
    id: "n4",
    userId: "u3",
    title: "Pesan Baru",
    message: "Haji Sulam membalas pertanyaan Anda.",
    time: "5 jam yang lalu",
    isRead: true,
    type: "inquiry",
    link: "/dashboard",
  },
  {
    id: "n5",
    userId: "u1", // Admin
    title: "Laporan Baru",
    message: "Ada 1 laporan konten yang perlu dimoderasi.",
    time: "30 menit yang lalu",
    isRead: false,
    type: "system",
    link: "/admin/reports",
  },
];

export const mockKosListings: KosListing[] = [
  {
    id: "1",
    ownerId: "u2",
    title: "Kos Harmoni Residence",
    location: "Jl. Margonda Raya, Depok (Dekat UI)",
    price: 1500000,
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=80",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80",
    ],
    amenities: ["WiFi", "AC", "Kamar Mandi Dalam", "Parkir"],
    rating: 4.8,
    isPremium: true,
    ownerPhone: "6281234567890",
    description: "Kos nyaman sangat dekat dengan kampus UI Depok dengan fasilitas lengkap. Lingkungan aman dan tenang, cocok untuk mahasiswa.",
    rules: ["Tidak boleh membawa hewan", "Jam malam 23:00", "Tidak merokok di dalam kamar"],
    type: "campur",
    availableRooms: 3,
  },
  {
    id: "2",
    ownerId: "u2",
    title: "Kos Putri Melati",
    location: "Jl. Kaliurang KM 5, Yogyakarta (Dekat UGM)",
    price: 900000,
    images: [
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80",
      "https://images.unsplash.com/photo-1486304873000-235643847519?w=600&q=80",
    ],
    amenities: ["WiFi", "Kamar Mandi Dalam", "Dapur Bersama"],
    rating: 4.5,
    isPremium: false,
    ownerPhone: "6281234567890",
    description: "Kos putri bersih dan nyaman sangat dekat dengan kampus UGM. Akses mudah ke kampus dan pusat kota.",
    rules: ["Khusus putri", "Jam malam 22:00", "Tamu lawan jenis di ruang tamu saja"],
    type: "putri",
    availableRooms: 2,
  },
  {
    id: "3",
    ownerId: "u2",
    title: "Kos Eksekutif Sudirman",
    location: "Jl. Sudirman No. 45, Bandung (Dekat ITB)",
    price: 2200000,
    images: [
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&q=80",
      "https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=600&q=80",
    ],
    amenities: ["WiFi", "AC", "Kamar Mandi Dalam", "Parkir", "Laundry", "CCTV"],
    rating: 4.9,
    isPremium: true,
    ownerPhone: "6281234567890",
    description: "Kos eksekutif full furnished sangat dekat dengan kampus ITB. Fasilitas premium dengan keamanan 24 jam.",
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
    availableRooms: 1,
  },
  {
    id: "7",
    ownerId: "u2",
    title: "Kos Baru Menunggu",
    location: "Jl. Baru No. 1, Jakarta",
    price: 2000000,
    images: ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=80"],
    amenities: ["WiFi", "AC"],
    rating: 0,
    isPremium: false,
    ownerPhone: "6281234567890",
    description: "Kos baru yang sedang menunggu persetujuan admin.",
    rules: ["No rules yet"],
    type: "campur",
    availableRooms: 10,
    status: "pending",
  },
];

export const mockInquiries: Inquiry[] = [
  {
    id: "iq1",
    ownerId: "u2",
    senderName: "Budi Mahasiswa",
    senderPhone: "6289876543210",
    propertyName: "Kos Harmoni Residence",
    message: "Halo, apakah kamar kos masih tersedia untuk bulan depan?",
    time: "10 menit yang lalu",
    status: "new",
  },
  {
    id: "iq2",
    ownerId: "u2",
    senderName: "Ani Safitri",
    senderPhone: "6287654321098",
    propertyName: "Kos Putri Melati",
    message: "Saya ingin tanya apakah boleh membawa laptop dan rice cooker?",
    time: "1 jam yang lalu",
    status: "replied",
  },
  {
    id: "iq3",
    ownerId: "u2",
    senderName: "Dedi Kurniawan",
    senderPhone: "6285432109876",
    propertyName: "Kos Eksekutif Sudirman",
    message: "Apakah harga sudah termasuk biaya listrik dan WiFi?",
    time: "3 jam yang lalu",
    status: "replied",
  },
  {
    id: "iq4",
    ownerId: "u2",
    senderName: "Rina Amelia",
    senderPhone: "6283210987654",
    propertyName: "Kos Harmoni Residence",
    message: "Boleh survei lokasi besok sore jam 4?",
    time: "1 hari yang lalu",
    status: "archived",
  },
];

export const mockMarketplaceItems: MarketplaceItem[] = [
  {
    id: "m1",
    sellerId: "u3",
    title: "Textbook Kalkulus Purcell Ed. 9",
    price: 75000,
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80",
    category: "Buku",
    condition: "Bekas - Baik",
    sellerPhone: "6289876543210",
    sellerName: "Budi Mahasiswa",
    location: "Yogyakarta (Dekat UGM)",
    description: "Buku kalkulus Purcell edisi 9, ada sedikit coretan pensil tapi masih sangat layak. Bisa COD dekat kampus UGM.",
    createdAt: "2024-01-15",
    status: "active",
  },
  {
    id: "m2",
    sellerId: "u3",
    title: "Laptop ASUS VivoBook 14",
    price: 4500000,
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&q=80",
    category: "Elektronik",
    condition: "Bekas - Sangat Baik",
    sellerPhone: "6289876543210",
    sellerName: "Budi Mahasiswa",
    location: "Yogyakarta (Dekat UGM/UNY)",
    description: "Laptop ASUS VivoBook 14 inch, i5 Gen 10, RAM 8GB, SSD 512GB. Masih mulus. Bisa COD sekitar UGM atau UNY.",
    createdAt: "2024-01-10",
    status: "active",
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
    location: "Bandung (Dekat ITB)",
    description: "Sepeda lipat Polygon Urbano 3, cocok untuk mobilitas di sekitar kampus ITB atau Unpad Dipatiukur.",
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
    location: "Sumedang (Dekat Unpad Jatinangor)",
    description: "Meja belajar minimalis kayu jati, ukuran 100x60cm. Ada laci kecil. Lokasi dekat Unpad Jatinangor / IPDN.",
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
    location: "Semarang (Dekat Undip)",
    description: "Kamus Oxford Advanced Learner's Dictionary edisi terbaru. Bisa COD area Undip Tembalang.",
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
    location: "Yogyakarta (Dekat UNY)",
    description: "Rice cooker Miyako 1.8L, fungsi normal semua. Cocok untuk anak kos. Lokasi dekat UNY.",
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