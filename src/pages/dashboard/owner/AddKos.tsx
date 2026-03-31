import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContextType';
import { supabase } from '@/lib/supabase';
import { createKosListing } from '@/services/forms';
import { uploadMultipleFiles } from '@/services/storage';
import { BackButton } from '@/components/BackButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Camera, X, Plus, Loader2, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AddKosPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loadingStatus, setLoadingStatus] = useState<string>('');
  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    location: '',
    price: '',
    type: 'campur' as 'putra' | 'putri' | 'campur',
    description: '',
    available_rooms: '1',
  });

  // Cleanup object URLs to avoid memory leaks
  useEffect(() => {
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

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
    setUploadProgress(10);
    setLoadingStatus('Mengecek profil user...');
    
    try {
      console.log('Starting submission for user:', user.id);
      
      // 0. Verify profile exists (needed for RLS)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();
      
      if (profileError || !profile) {
        console.error('Profile check failed:', profileError);
        throw new Error('Profil tidak ditemukan. Harap lengkapi profil Anda terlebih dahulu.');
      }

      // 1. Upload Images to Supabase Storage
      setLoadingStatus('Mengupload gambar (Step 1/2)...');
      const { urls, errors } = await uploadMultipleFiles('kos-images', user.id, images);
      
      if (errors.length > 0) {
        console.error('Storage errors during multi-upload:', errors);
        if (urls.length === 0) {
          throw new Error(`Gagal mengupload gambar: ${errors[0]}`);
        }
        toast.warning(`${errors.length} gambar gagal diunggah, melanjutkan dengan yang berhasil.`);
      }
      
      console.log('Images uploaded successfully:', urls);
      setUploadProgress(60);
      setLoadingStatus('Menyimpan data kos ke database (Step 2/2)...');

      // 2. Save Listing with Image URLs
      const priceClean = parseInt(formData.price.replace(/\D/g, ''));
      if (isNaN(priceClean)) {
        throw new Error('Harga tidak valid. Harap masukkan angka.');
      }

      const roomsClean = parseInt(formData.available_rooms);
      if (isNaN(roomsClean)) {
        throw new Error('Jumlah kamar tidak valid.');
      }

      const listingData = {
        ...formData,
        owner_id: user.id,
        price: priceClean,
        images: urls,
        available_rooms: roomsClean,
        amenities: [], 
        rules: [],
      };

      console.log('Final listing data to be sent:', listingData);
      const result = await createKosListing(listingData);

      if (result.success) {
        setUploadProgress(100);
        setLoadingStatus('Berhasil!');
        toast.success('Kos berhasil didaftarkan! Menunggu persetujuan admin.');
        setTimeout(() => navigate('/owner-dashboard/my-kos'), 1500);
      } else {
        console.error('Database insertion error:', result.error);
        throw new Error(result.error || 'Gagal menyimpan data ke database.');
      }
    } catch (error: any) {
      console.error('CRITICAL SUBMIT ERROR:', error);
      toast.error(error.message || 'Terjadi kesalahan sistem. Silakan cek koneksi atau coba lagi.');
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
      setLoadingStatus('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <BackButton to="/owner-dashboard/my-kos" />
      
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-display font-bold text-foreground">Tambah Kos Baru</h1>
        <p className="text-muted-foreground">Lengkapi data kos Anda untuk mulai mendapatkan penyewa.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-card rounded-3xl border border-border p-8 space-y-8 shadow-sm">
        {/* Image Upload Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-foreground uppercase tracking-wider">Foto Properti ({images.length}/8)</label>
            <span className="text-xs text-muted-foreground italic">Gunakan foto berkualitas tinggi</span>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {previewUrls.map((url, index) => (
              <div key={index} className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-border group shadow-sm">
                <img src={url} alt={`Preview ${index}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
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
            <Select onValueChange={(v) => setFormData(p => ({ ...p, type: v as any }))} defaultValue={formData.type}>
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
            <Input name="available_rooms" type="number" min="1" value={formData.available_rooms} onChange={handleChange} required className="rounded-xl" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-muted-foreground uppercase">Deskripsi & Fasilitas</label>
          <Textarea 
            name="description" 
            placeholder="Jelaskan fasilitas kamar, lingkungan, dan aturan kos..." 
            value={formData.description} 
            onChange={handleChange} 
            required 
            className="min-h-[120px] rounded-2xl resize-none" 
          />
        </div>

        <div className="pt-4">
          <Button type="submit" className="w-full h-14 text-lg font-bold rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-95" disabled={isLoading}>
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
