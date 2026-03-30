import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, Plus, X, Check, Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/BackButton";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { uploadMultipleFiles } from "@/services/storage";
import { createKosListing } from "@/services/forms";
import { supabase } from "@/lib/supabase";
import { toast as sonnerToast } from "sonner";

export default function AddBoardingHouse() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loadingStatus, setLoadingStatus] = useState<string>('');
  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    title: "",
    location: "",
    price: "",
    type: "campur" as "putra" | "putri" | "campur",
    description: "",
    available_rooms: 1,
  });

  const amenitiesList = [
    "WiFi", "AC", "Kamar Mandi Dalam", "Parkir", "Laundry", "CCTV", "Dapur Bersama", "Penjaga Kos"
  ];

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
        sonnerToast.error('Maksimal 8 gambar diperbolehkan.');
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

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities(prev => 
      prev.includes(amenity) 
        ? prev.filter(a => a !== amenity) 
        : [...prev, amenity]
    );
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      sonnerToast.error('Anda harus login untuk menambah kos.');
      return;
    }

    if (images.length === 0) {
      sonnerToast.error('Mohon upload minimal satu gambar.');
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
        sonnerToast.warning(`${errors.length} gambar gagal diunggah, melanjutkan dengan yang berhasil.`);
      }
      
      console.log('Images uploaded successfully:', urls);
      setUploadProgress(60);
      setLoadingStatus('Menyimpan data kos ke database (Step 2/2)...');

      // 2. Save Listing with Image URLs
      const priceClean = parseFloat(formData.price.toString().replace(/\D/g, ''));
      if (isNaN(priceClean)) {
        throw new Error('Harga tidak valid. Harap masukkan angka.');
      }

      const listingData = {
        ...formData,
        owner_id: user.id,
        price: priceClean,
        images: urls,
        amenities: selectedAmenities,
        rules: [], 
      };

      console.log('Final listing data to be sent:', listingData);
      const result = await createKosListing(listingData);

      if (result.success) {
        setUploadProgress(100);
        setLoadingStatus('Berhasil!');
        sonnerToast.success('Kos berhasil didaftarkan! Menunggu persetujuan admin.');
        setTimeout(() => navigate('/owner-dashboard/my-kos'), 1500);
      } else {
        console.error('Database insertion error:', result.error);
        throw new Error(result.error || 'Gagal menyimpan data ke database.');
      }
    } catch (error: any) {
      console.error('CRITICAL SUBMIT ERROR:', error);
      sonnerToast.error(error.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
      setLoadingStatus('');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <BackButton to="/owner-dashboard/my-kos" className="mb-0" />
        <h1 className="text-2xl font-display font-bold text-foreground">Add New Boarding House</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-6">
          <h3 className="font-display font-bold text-lg border-b border-border pb-4">Basic Information</h3>
          
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-2">
              <label className="text-sm font-semibold ml-1">Kos Name</label>
              <input 
                required
                name="title"
                type="text" 
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Kos Harmoni Residence" 
                className="w-full px-4 py-3 rounded-xl bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>

            <div className="sm:col-span-2 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold ml-1">Full Address</label>
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
              <textarea 
                required
                name="location"
                rows={3}
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g. Jl. Margonda Raya No. 123, Depok" 
                className="w-full px-4 py-3 rounded-xl bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold ml-1">Price per Month</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">Rp</span>
                <input 
                  required
                  name="price"
                  type="number" 
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="1.500.000" 
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold ml-1">Kos Type</label>
              <select 
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none"
              >
                <option value="putra">Putra</option>
                <option value="putri">Putri</option>
                <option value="campur">Campur</option>
              </select>
            </div>
          </div>
        </div>

        {/* Details & Amenities */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-6">
          <h3 className="font-display font-bold text-lg border-b border-border pb-4">Details & Amenities</h3>
          
          <div className="space-y-2">
            <label className="text-sm font-semibold ml-1">Description</label>
            <textarea 
              required
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe your kos, environment, and rules..." 
              className="w-full px-4 py-3 rounded-xl bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-semibold ml-1">Amenities</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {amenitiesList.map(amenity => (
                <button
                  key={amenity}
                  type="button"
                  onClick={() => toggleAmenity(amenity)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all",
                    selectedAmenities.includes(amenity)
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-surface border-border text-muted-foreground hover:border-primary/50"
                  )}
                >
                  <div className={cn(
                    "w-4 h-4 rounded-full border flex items-center justify-center transition-all",
                    selectedAmenities.includes(amenity) ? "bg-primary border-primary" : "border-muted-foreground/30"
                  )}>
                    {selectedAmenities.includes(amenity) && <Check className="w-2.5 h-2.5 text-white" />}
                  </div>
                  {amenity}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Media */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-6">
          <h3 className="font-display font-bold text-lg border-b border-border pb-4">Photos</h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {previewUrls.map((url, index) => (
              <div key={index} className="relative aspect-square rounded-2xl overflow-hidden border border-border group">
                <img src={url} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                <button 
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square rounded-2xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-2 group"
            >
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                <Plus className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Add Photo</span>
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageChange} 
              multiple 
              accept="image/*" 
              className="hidden" 
            />
          </div>
          <p className="text-xs text-muted-foreground">Upload at least 1 high-quality photo of your property.</p>
        </div>

        <div className="flex gap-4">
          <Button 
            type="button" 
            variant="outline" 
            className="flex-1 py-6 rounded-xl border-border"
            onClick={() => navigate("/owner-dashboard/my-kos")}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading}
            className="flex-[2] py-6 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20 transition-all active:scale-95"
          >
            {isLoading ? (
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{loadingStatus || 'Memproses...'}</span>
                </div>
                {uploadProgress > 0 && (
                  <div className="w-48 h-1 bg-white/20 rounded-full overflow-hidden mt-1">
                    <div 
                      className="h-full bg-white transition-all duration-300" 
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}
              </div>
            ) : "Submit Listing"}
          </Button>
        </div>
      </form>
    </div>
  );
}
