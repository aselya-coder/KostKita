import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ArrowRight, Camera, MapPin, X, Loader2, Zap, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/BackButton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { uploadFile } from "@/services/storage";
import { createMarketplaceItem } from "@/services/forms";
import { notifyAdmins } from '@/services/notifications';
import { toast as sonnerToast } from "sonner";
import { QuotaAlertModal } from "@/components/QuotaAlertModal";
import { getUserDashboardStats } from '@/services/dashboard';
import { getWalletBalance } from '@/services/wallet';
import { processListingPayment } from '@/services/coin';
import { getSystemConfigs } from "@/services/settings";

export default function SellItem() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingQuota, setIsCheckingQuota] = useState(true);
  const [quotaModalOpen, setQuotaModalOpen] = useState(false);
  const [quotaMessage, setQuotaMessage] = useState('');
  const [hasFreeQuota, setHasFreeQuota] = useState(true);
  const [userCoins, setUserCoins] = useState(0);
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Masa aktif iklan dinamis dari pengaturan sistem
  const [adDuration, setAdDuration] = useState("30");

  const [formData, setFormData] = useState({
    title: "",
    price: "",
    category: "Buku",
    condition: "Bekas - Baik",
    location: "",
    description: "",
  });

  const categories = ["Buku", "Elektronik", "Furnitur", "Kendaraan", "Lainnya"];
  const conditions = ["Baru", "Bekas - Sangat Baik", "Bekas - Baik", "Bekas - Cukup"];

  // Cleanup object URL
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    const checkQuotaAndLoadConfig = async () => {
      if (!user) return;

      try {
        const [stats, balance, configs] = await Promise.all([
          getUserDashboardStats(user.id),
          getWalletBalance(user.id),
          getSystemConfigs()
        ]);

        if (configs['ad_active_duration']) {
          setAdDuration(configs['ad_active_duration']);
        }

        if (user.role === 'admin') {
          setIsCheckingQuota(false);
          return;
        }

        const totalListings = (stats as any).propertiesCount + (stats as any).myListingsCount;
        const isFirstUpload = totalListings === 0;
        
        setHasFreeQuota(isFirstUpload);
        setUserCoins(balance);

        if (!isFirstUpload && balance <= 0) {
          setQuotaMessage("Anda telah menggunakan jatah 1 iklan gratis. Untuk upload iklan berikutnya, Anda memerlukan minimal 1 koin per hari.");
          setQuotaModalOpen(true);
        }
      } catch (error) {
        console.error("Error checking quota:", error);
      } finally {
        setIsCheckingQuota(false);
      }
    };

    checkQuotaAndLoadConfig();
  }, [user]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImage(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    const formatted = raw ? parseInt(raw).toLocaleString('id-ID') : '';
    setFormData(p => ({ ...p, price: formatted }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      sonnerToast.error('Anda harus login untuk menjual barang.');
      return;
    }

    if (!image) {
      sonnerToast.error('Mohon upload foto barang.');
      return;
    }

    setIsLoading(true);
    
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();
      
      if (profileError || !profile) {
        throw new Error('Profil tidak ditemukan. Harap lengkapi profil Anda.');
      }

      const fileName = `${Date.now()}-${image.name.replace(/\s/g, '_')}`;
      const path = `${user.id}/${fileName}`;
      const { url, error: uploadErr } = await uploadFile('item-images', path, image);

      if (uploadErr) throw new Error(`Gagal upload foto: ${uploadErr}`);
      
      const priceClean = parseInt(formData.price.replace(/\D/g, ''));
      if (isNaN(priceClean)) {
        throw new Error('Harga tidak valid. Harap masukkan angka.');
      }

      // 3. Deduct coins if not free
      // Use atomic RPC for payment processing
      const paymentResult = await processListingPayment(user.id, parseInt(adDuration));
      
      if (!paymentResult.success) {
        throw new Error(paymentResult.message || 'Gagal memproses pembayaran koin.');
      }

      if (paymentResult.is_free) {
        sonnerToast.info('Anda mendapatkan jatah iklan GRATIS!');
      } else {
        sonnerToast.success(`Koin berhasil dipotong: ${paymentResult.cost} Koin`);
      }

      const result = await createMarketplaceItem({
        ...formData,
        seller_id: user.id,
        price: priceClean,
        image: url || '',
        status: 'active',
      });

      if (result.success) {
        sonnerToast.success('Barang berhasil dipublikasikan!');
        setTimeout(() => navigate('/dashboard/my-items'), 1500);
      } else {
        throw new Error(result.error || 'Gagal menyimpan data barang.');
      }
    } catch (error: any) {
      sonnerToast.error(error.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingQuota) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-12">
      <QuotaAlertModal 
        isOpen={quotaModalOpen} 
        onClose={() => {
          setQuotaModalOpen(false);
          if (!hasFreeQuota && userCoins <= 0) {
            navigate('/dashboard');
          }
        }} 
        message={quotaMessage}
        role={user?.role}
      />
      
      <div className="flex items-center gap-4">
        <BackButton to="/dashboard/my-items" className="mb-0" />
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Jual Barang</h1>
          <p className="text-muted-foreground text-sm">Lengkapi detail barang yang ingin Anda jual di marketplace.</p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/5 text-primary text-[10px] font-bold uppercase tracking-wider border border-primary/10">
            <CheckCircle2 className="w-3 h-3" />
            Masa Aktif Iklan: {adDuration} Hari
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold ml-1">Nama Barang</label>
            <input 
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              type="text" 
              placeholder="Contoh: MacBook Pro M1 2020" 
              className="w-full px-4 py-3 rounded-xl bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold ml-1">Harga</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">Rp</span>
                <input 
                  name="price"
                  value={formData.price}
                  onChange={handlePriceChange}
                  required
                  type="text"
                  inputMode="numeric"
                  placeholder="0" 
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold ml-1">Kategori</label>
              <select 
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none"
              >
                {categories.map(cat => <option key={cat} value={cat.toLowerCase()}>{cat}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold ml-1">Kondisi</label>
              <select 
                name="condition"
                value={formData.condition}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none"
              >
                {conditions.map(cond => <option key={cond} value={cond.toLowerCase()}>{cond}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <label className="text-sm font-semibold">Lokasi</label>
                {formData.location && (
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formData.location)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] flex items-center gap-1 font-bold uppercase text-primary hover:underline cursor-pointer"
                  >
                    <MapPin className="w-3 h-3" />
                    Cek di Maps
                  </a>
                )}
              </div>
              <input 
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                type="text" 
                placeholder="e.g. Depok, Sleman" 
                className="w-full px-4 py-3 rounded-xl bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold ml-1">Deskripsi</label>
            <textarea 
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={4}
              placeholder="Jelaskan kondisi barang, lama pemakaian, dan detail lainnya..." 
              className="w-full px-4 py-3 rounded-xl bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
            />
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-6">
          <h3 className="font-display font-bold text-lg border-b border-border pb-4">Media</h3>
          <label
            htmlFor="sell-item-image"
            className="relative flex items-center justify-center border-2 border-dashed border-border rounded-2xl p-8 sm:p-12 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group overflow-hidden min-h-[200px]"
          >
            {previewUrl ? (
              <div className="absolute inset-0 w-full h-full">
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeImage(); }}
                    className="p-3 rounded-full bg-destructive text-white shadow-xl transform scale-75 group-hover:scale-100 transition-all"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/10 transition-colors">
                  <Camera className="w-6 h-6 text-muted-foreground group-hover:text-primary" />
                </div>
                <p className="text-sm font-semibold">Upload Photo</p>
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB</p>
              </div>
            )}
          </label>
          <input 
            id="sell-item-image"
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageChange} 
            accept="image/*" 
            className="hidden" 
          />
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-primary uppercase flex items-center gap-2">
              Status Iklan
              <Zap className="w-3 h-3 fill-current" />
            </label>
            <div className="p-3 rounded-xl border border-primary/50 bg-primary/5 text-xs font-medium text-primary">
              <p className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Otomatis Aktif selama {adDuration} Hari
              </p>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1 italic">
              {hasFreeQuota 
                ? `* Upload pertama GRATIS (${adDuration} hari).` 
                : `* Iklan berikutnya: Potong 30 koin dari saldo. Saldo Anda: ${userCoins} Koin.`
              }
            </p>
          </div>

          <Button 
            type="submit" 
            className="w-full py-6 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-base shadow-lg shadow-primary/20 group transition-all active:scale-[0.98]"
            disabled={isLoading || (!hasFreeQuota && userCoins <= 0)}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Mempublikasikan...
              </>
            ) : (
              <>
                Pasang Iklan Sekarang
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
