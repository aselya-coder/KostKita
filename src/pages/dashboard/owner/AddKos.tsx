import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { createKosListing } from '@/services/forms';
import { uploadMultipleFiles } from '@/services/storage';
import { getUserDashboardStats } from '@/services/dashboard';
import { getWalletBalance, deductWalletBalance } from '@/services/wallet';

import { BackButton } from '@/components/BackButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { X, Plus, Loader2, MapPin, Zap, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { QuotaAlertModal } from '@/components/QuotaAlertModal';

export default function AddKosPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingQuota, setIsCheckingQuota] = useState(true);
  const [quotaModalOpen, setQuotaModalOpen] = useState(false);
  const [quotaMessage, setQuotaMessage] = useState('');
  const [hasFreeQuota, setHasFreeQuota] = useState(true);
  const [userCoins, setUserCoins] = useState(0);
  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [rules, setRules] = useState<string[]>([]);
  const [amenityInput, setAmenityInput] = useState('');
  const [ruleInput, setRuleInput] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    location: '',
    price: '',
    type: 'campur' as 'putra' | 'putri' | 'campur',
    description: '',
    availableRooms: '1',
    rating: '5.0',
  });


  // Cleanup object URLs to avoid memory leaks
  useEffect(() => {
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  useEffect(() => {
    const checkQuota = async () => {
      if (!user) return;
      if (user.role === 'admin') {
        setIsCheckingQuota(false);
        return;
      }

      try {
        const [stats, balance] = await Promise.all([
          getUserDashboardStats(user.id),
          getWalletBalance(user.id)
        ]);

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

    checkQuota();
  }, [user]);


  const handleAddAmenity = () => {
    if (amenityInput.trim() && !amenities.includes(amenityInput.trim())) {
      setAmenities(prev => [...prev, amenityInput.trim()]);
      setAmenityInput('');
    }
  };

  const handleRemoveAmenity = (index: number) => {
    setAmenities(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddRule = () => {
    if (ruleInput.trim() && !rules.includes(ruleInput.trim())) {
      setRules(prev => [...prev, ruleInput.trim()]);
      setRuleInput('');
    }
  };

  const handleRemoveRule = (index: number) => {
    setRules(prev => prev.filter((_, i) => i !== index));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      
      // Limit to 8 images
      if (images.length + files.length > 8) {
        toast.error('Maksimal 8 gambar diperbolehkan.');
        return;
      }

      setImages(prev => [...prev, ...files]);
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setPreviewUrls(prev => [...prev, ...newPreviews]);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Anda harus login untuk menambah kos.');
      return;
    }

    if (images.length === 0) {
      toast.error('Mohon upload minimal satu gambar.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Upload Images
      const { urls, errors } = await uploadMultipleFiles('kos-images', user.id, images);
      
      if (errors.length > 0 && urls.length === 0) {
        throw new Error(`Gagal mengupload semua gambar. Error: ${errors[0]}`);
      }
      if (errors.length > 0) {
        toast.warning(`${errors.length} gambar gagal diunggah, melanjutkan dengan yang berhasil.`);
      }


      // 2. Prepare and Save Listing Data
      const priceClean = parseInt(formData.price.replace(/\D/g, ''));
      const roomsClean = parseInt(formData.availableRooms);

      // 3. Deduct coins if not free
      if (!hasFreeQuota) {
        const deducted = await deductWalletBalance(user.id, 30, `Pasang iklan kos: ${formData.title} (30 hari)`);
        if (!deducted) {
          throw new Error('Gagal memotong saldo koin. Silakan top up koin Anda.');
        }
      }

      const listingData = {
        owner_id: user.id, // Ensure snake_case for service
        title: formData.title,
        location: formData.location,
        price: priceClean,
        type: formData.type,
        description: formData.description,
        available_rooms: roomsClean, // Snake case
        images: urls,
        amenities: amenities,
        rules: rules,
        rating: parseFloat(formData.rating),
        status: 'approved'
      };

      // Call the service
      const result = await createKosListing(listingData);
      
      if (!result.success) {
        throw new Error(result.error);
      }




      toast.success('Iklan kos berhasil dipublikasikan selama 30 hari!');
      navigate('/dashboard/my-kos');

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Terjadi kesalahan sistem. Silakan coba lagi.';
      toast.error(message);
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
    <div className="max-w-4xl mx-auto space-y-6 pb-12 px-4 md:px-0">
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
      <BackButton to="/dashboard" />
      
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">Pasang Iklan Kos Baru</h1>
        <p className="text-sm text-muted-foreground">Lengkapi data iklan kos Anda untuk mulai mendapatkan penyewa.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-card rounded-2xl md:rounded-3xl border border-border p-5 md:p-8 space-y-6 md:space-y-8 shadow-sm">
        {/* Image Upload Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider">Foto Properti ({images.length}/8)</label>
            <span className="text-[10px] text-muted-foreground italic">Gunakan foto berkualitas tinggi</span>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
            {previewUrls.map((url, index) => (
              <div key={index} className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-border group shadow-sm bg-muted/20">
                <img src={url} alt={`Preview ${index}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button 
                    type="button"
                    onClick={() => removeImage(index)}
                    className="p-2 rounded-full bg-destructive text-white hover:bg-destructive/90 transform scale-75 group-hover:scale-100 transition-all duration-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
            
            {images.length < 8 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="aspect-[4/3] rounded-2xl border-2 border-dashed border-muted-foreground/20 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <Plus className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold uppercase tracking-tight">Tambah Foto</span>
              </button>
            )}
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageChange} 
            multiple 
            accept="image/*" 
            className="hidden" 
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase">Nama Kos</label>
            <Input name="title" placeholder="Contoh: Kos Harmoni Depok" value={formData.title} onChange={handleChange} required className="rounded-xl" />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-muted-foreground uppercase">Lokasi / Alamat Lengkap</label>
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
            <Input name="location" placeholder="Contoh: Jl. Margonda No. 12, Depok" value={formData.location} onChange={handleChange} required className="rounded-xl" />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase">Harga per Bulan (IDR)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">Rp</span>
              <Input 
                name="price" 
                type="text" 
                placeholder="1.500.000" 
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
                  // Allow: backspace, delete, tab, escape, enter, and .
                  if ([46, 8, 9, 27, 13].indexOf(e.keyCode) !== -1 ||
                    // Allow: Ctrl+A, Command+A
                    (e.keyCode === 65 && (e.ctrlKey === true || e.metaKey === true)) ||
                    // Allow: home, end, left, right, down, up
                    (e.keyCode >= 35 && e.keyCode <= 40)) {
                    // let it happen, don't do anything
                    return;
                  }
                  // Ensure that it is a number and stop the keypress
                  if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                    e.preventDefault();
                  }
                }}
                required 
                className="pl-11 rounded-xl font-bold text-primary" 
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase">Tipe Kos</label>
            <Select onValueChange={(v) => setFormData(p => ({ ...p, type: v as 'putra' | 'putri' | 'campur' }))} defaultValue={formData.type}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Pilih Tipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="putra">Khusus Putra</SelectItem>
                <SelectItem value="putri">Khusus Putri</SelectItem>
                <SelectItem value="campur">Campur</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase">Kamar Tersedia</label>
            <Input name="availableRooms" type="number" min="1" value={formData.availableRooms} onChange={handleChange} required className="rounded-xl" />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase">Rating Awal (1.0 - 5.0)</label>
            <Input name="rating" type="number" min="1" max="5" step="0.1" value={formData.rating} onChange={handleChange} required className="rounded-xl" />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-primary uppercase flex items-center gap-2">
              Status Iklan
              <Zap className="w-3 h-3 fill-current" />
            </label>
            <div className="p-3 rounded-xl border border-primary/50 bg-primary/5 text-xs font-medium text-primary">
              <p className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Otomatis Aktif selama 30 Hari
              </p>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1 italic">
              {hasFreeQuota 
                ? "* Upload pertama GRATIS (30 hari)." 
                : `* Iklan berikutnya: Potong 30 koin dari saldo. Saldo Anda: ${userCoins} Koin.`
              }
            </p>
          </div>

        </div>


        {/* Amenities Input */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-muted-foreground uppercase">Fasilitas</label>
          <div className="flex gap-2">
            <Input
              value={amenityInput}
              onChange={(e) => setAmenityInput(e.target.value)}
              placeholder="Contoh: WiFi, AC, Parkir Mobil"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddAmenity();
                }
              }}
            />
            <Button type="button" onClick={handleAddAmenity} variant="secondary">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {amenities.map((amenity, index) => (
              <div key={index} className="flex items-center gap-1.5 bg-secondary text-secondary-foreground rounded-lg px-3 py-1.5 text-xs font-medium">
                <span>{amenity}</span>
                <button type="button" onClick={() => handleRemoveAmenity(index)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Rules Input */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-muted-foreground uppercase">Peraturan Kos</label>
          <div className="flex gap-2">
            <Input
              value={ruleInput}
              onChange={(e) => setRuleInput(e.target.value)}
              placeholder="Contoh: Dilarang merokok di kamar"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddRule();
                }
              }}
            />
            <Button type="button" onClick={handleAddRule} variant="secondary">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {rules.map((rule, index) => (
              <div key={index} className="flex items-center gap-1.5 bg-secondary text-secondary-foreground rounded-lg px-3 py-1.5 text-xs font-medium">
                <span>{rule}</span>
                <button type="button" onClick={() => handleRemoveRule(index)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-muted-foreground uppercase">Deskripsi Tambahan</label>
          <Textarea 
            name="description" 
            placeholder="Jelaskan tentang properti kos Anda, seperti suasana, lingkungan sekitar, dan keunggulan lainnya."
            value={formData.description} 
            onChange={handleChange} 
            required 
            className="min-h-[120px] rounded-2xl resize-none" 
          />
        </div>

        <div className="pt-4">
          <Button 
            type="submit" 
            className="w-full h-14 text-lg font-bold rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-95" 
            disabled={isLoading || (!hasFreeQuota && userCoins <= 0)}
          >
            {isLoading ? (
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Memproses...</span>
              </div>
            ) : 'Daftarkan Properti Kos'}
          </Button>
        </div>

      </form>
    </div>
  );
}