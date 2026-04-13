import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { createMarketplaceItem } from '@/services/forms';
import { notifyAdmins } from '@/services/notifications';
import { uploadFile } from '@/services/storage';
import { BackButton } from '@/components/BackButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Camera, X, Plus, Loader2, ShoppingBag, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getProfile } from '@/services/profile';
import { processListingPayment } from '@/services/coin';
import { getSystemConfigs } from '@/services/settings';

export default function AddItemPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loadingStatus, setLoadingStatus] = useState<string>('');
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Masa aktif iklan dinamis dari pengaturan sistem
  const [adDuration, setAdDuration] = useState("30");

  const [formData, setFormData] = useState({
    title: '',
    price: '',
    category: '',
    condition: 'Bekas - Baik',
    location: '',
    description: '',
  });

  // Cleanup object URL
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const configs = await getSystemConfigs();
        if (configs['ad_active_duration']) {
          setAdDuration(configs['ad_active_duration']);
        }
      } catch (error) {
        console.error("Error loading config:", error);
      }
    };
    loadConfig();
  }, []);

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
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Anda harus login untuk menjual barang.');
      return;
    }

    if (!image) {
      toast.error('Mohon upload foto barang.');
      return;
    }

    setIsLoading(true);
    setUploadProgress(10);
    setLoadingStatus('Mengecek profil user...');

    try {
      console.log('Starting item submission for user:', user.id);

      // 0. Verify Phone Number in Profile
      const profileData = await getProfile(user.id);
      if (!profileData?.phone || profileData.phone.trim() === '') {
        toast.error('Mohon lengkapi nomor WhatsApp di profil Anda sebelum memasang iklan agar pembeli dapat menghubungi Anda.');
        setTimeout(() => navigate('/dashboard/profile'), 2000);
        return;
      }

      // 1. Process coin payment (Student also pays after first ad)
      setLoadingStatus('Memproses pembayaran koin...');
      const paymentResult = await processListingPayment(user.id, parseInt(adDuration));
      
      if (!paymentResult.success) {
        throw new Error(paymentResult.message || 'Gagal memproses pembayaran koin.');
      }

      if (paymentResult.is_free) {
         toast.info('Anda mendapatkan jatah iklan GRATIS!');
       } else {
         toast.success(`Koin berhasil dipotong: ${paymentResult.cost} Koin`);
       }
 
       // 2. Upload Image to Supabase Storage
       setLoadingStatus('Mengupload foto barang (Step 1/2)...');
       const fileName = `${Date.now()}-${image.name.replace(/\s/g, '_')}`;
       const path = `${user.id}/${fileName}`;
       const { url, error } = await uploadFile('item-images', path, image);

       if (error) {
         console.error('Storage error (Item):', error);
         throw new Error(`Gagal upload foto: ${error}`);
       }
       
       console.log('Image uploaded successfully:', url);
       setUploadProgress(70);
       setLoadingStatus('Menyimpan data barang (Step 2/2)...');

       // 3. Save Item with Image URL
       const priceClean = parseInt(formData.price.replace(/\D/g, ''));
       if (isNaN(priceClean)) {
         throw new Error('Harga tidak valid. Harap masukkan angka.');
       }

      const itemData = {
        ...formData,
        seller_id: user.id,
        seller_name: profileData?.name || user.name,
        price: priceClean,
        image: url || '',
        status: 'active', // Automatically approve the item
      };

      console.log('Final item data to be sent:', itemData);
      const result = await createMarketplaceItem(itemData);

      if (result.success) {
        setUploadProgress(100);
        setLoadingStatus('Berhasil!');
        toast.success('Iklan barang berhasil dipublikasikan selama 30 hari!');
        setTimeout(() => navigate('/dashboard/my-items'), 1500);
      } else {
        console.error('Database insertion error (Item):', result.error);
        throw new Error(result.error || 'Gagal menyimpan data barang.');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Terjadi kesalahan sistem.';
      console.error('CRITICAL SUBMIT ERROR (Item):', error);
      toast.error(message);
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
      setLoadingStatus('');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12 px-4 md:px-0">
      <BackButton to="/dashboard/my-items" />
      
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">Jual Barang</h1>
        <p className="text-sm text-muted-foreground">Punya barang tidak terpakai? Jual di marketplace KosKita sekarang.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-card rounded-2xl md:rounded-3xl border border-border p-5 md:p-8 space-y-6 md:space-y-8 shadow-sm">
        {/* Image Upload */}
        <div className="space-y-4 text-center flex flex-col items-center">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider self-start">Foto Barang</label>
          
          <div className="relative group">
            {previewUrl ? (
              <div className="relative w-48 h-48 md:w-64 md:h-64 aspect-square rounded-2xl overflow-hidden border border-border shadow-md">
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                <button 
                  type="button"
                  onClick={removeImage}
                  className="absolute top-3 right-3 p-2 rounded-full bg-destructive text-white shadow-lg hover:scale-110 transition-transform"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-64 aspect-square rounded-2xl border-2 border-dashed border-muted-foreground/20 flex flex-col items-center justify-center gap-3 text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
              >
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                  <Camera className="w-6 h-6" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-bold uppercase">Upload Foto</span>
                  <span className="text-[10px] italic">Format: JPG, PNG (Max 5MB)</span>
                </div>
              </button>
            )}
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageChange} 
            accept="image/*" 
            className="hidden" 
          />
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase">Nama Barang</label>
            <Input name="title" placeholder="Contoh: Textbook Kalkulus Purcell" value={formData.title} onChange={handleChange} required className="rounded-xl h-12" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase">Harga (IDR)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">Rp</span>
                <Input 
                  name="price" 
                  type="text" 
                  placeholder="50.000" 
                  value={formData.price} 
                  onChange={(e) => {
                  const rawValue = e.target.value.replace(/\D/g, '');
                  if (rawValue === '') {
                    setFormData(prev => ({ ...prev, price: '' }));
                    return;
                  }
                  const formattedValue = parseInt(rawValue).toLocaleString('id-ID');
                  setFormData(prev => ({ ...prev, price: formattedValue }));
                }} 
                onKeyDown={(e) => {
                  if ([46, 8, 9, 27, 13].indexOf(e.keyCode) !== -1 ||
                    (e.keyCode === 65 && (e.ctrlKey === true || e.metaKey === true)) ||
                    (e.keyCode >= 35 && e.keyCode <= 40)) {
                    return;
                  }
                  if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                    e.preventDefault();
                  }
                }}
                required 
                className="pl-11 rounded-xl h-12 font-bold text-primary" 
              />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase">Kategori</label>
              <Select onValueChange={(v) => setFormData(p => ({ ...p, category: v }))}>
                <SelectTrigger className="rounded-xl h-12">
                  <SelectValue placeholder="Pilih Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Buku">Buku</SelectItem>
                  <SelectItem value="Elektronik">Elektronik</SelectItem>
                  <SelectItem value="Furnitur">Furnitur</SelectItem>
                  <SelectItem value="Pakaian">Pakaian</SelectItem>
                  <SelectItem value="Kendaraan">Kendaraan</SelectItem>
                  <SelectItem value="Lainnya">Lainnya</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase">Kondisi Barang</label>
              <Select onValueChange={(v) => setFormData(p => ({ ...p, condition: v }))} defaultValue={formData.condition}>
                <SelectTrigger className="rounded-xl h-12">
                  <SelectValue placeholder="Pilih Kondisi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Baru">Baru</SelectItem>
                  <SelectItem value="Bekas - Seperti Baru">Bekas - Seperti Baru</SelectItem>
                  <SelectItem value="Bekas - Sangat Baik">Bekas - Sangat Baik</SelectItem>
                  <SelectItem value="Bekas - Baik">Bekas - Baik</SelectItem>
                  <SelectItem value="Bekas - Cukup">Bekas - Cukup</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-muted-foreground uppercase">Lokasi COD / Ambil</label>
                {formData.location && (
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formData.location)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-primary hover:underline flex items-center gap-1 font-bold uppercase tracking-tighter"
                  >
                    <MapPin className="w-3 h-3" />
                    Cek di Maps
                  </a>
                )}
              </div>
              <Input name="location" placeholder="Contoh: Kantin Teknik / Depan Gerbang Kos" value={formData.location} onChange={handleChange} required className="rounded-xl h-12" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase">Deskripsi Barang</label>
            <Textarea 
              name="description" 
              placeholder="Jelaskan detail barang, alasan dijual, atau kekurangan jika ada..." 
              value={formData.description} 
              onChange={handleChange} 
              required 
              className="min-h-[120px] rounded-2xl resize-none" 
            />
          </div>
        </div>

        <div className="pt-4">
          <Button type="submit" className="w-full h-14 text-lg font-bold rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-95 flex flex-col gap-1" disabled={isLoading}>
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Mengupload...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" />
                <span>Pasang Iklan Sekarang</span>
              </div>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
