import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ArrowRight, Camera, MapPin, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/BackButton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { uploadFile } from "@/services/storage";
import { createMarketplaceItem } from "@/services/forms";
import { toast as sonnerToast } from "sonner";

export default function SellItem() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    price: "",
    category: "buku",
    condition: "baru",
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
      // 0. Verify profile exists (needed for RLS)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();
      
      if (profileError || !profile) {
        throw new Error('Profil tidak ditemukan. Harap lengkapi profil Anda.');
      }

      // 1. Upload Image to Supabase Storage
      const fileName = `${Date.now()}-${image.name.replace(/\s/g, '_')}`;
      const path = `${user.id}/${fileName}`;
      const { url, error } = await uploadFile('item-images', path, image);

      if (error) throw new Error(`Gagal upload foto: ${error}`);
      
      // 2. Save Item with Image URL
      const priceClean = parseInt(formData.price.replace(/\D/g, ''));
      if (isNaN(priceClean)) {
        throw new Error('Harga tidak valid. Harap masukkan angka.');
      }

      const result = await createMarketplaceItem({
        ...formData,
        seller_id: user.id,
        price: priceClean,
        image: url || '',
      });

      if (result.success) {
        sonnerToast.success('Barang berhasil didaftarkan!');
        const basePath = user?.role === "owner" ? "/owner-dashboard" : "/dashboard";
        setTimeout(() => navigate(`${basePath}/my-items`), 1500);
      } else {
        throw new Error(result.error || 'Gagal menyimpan data barang.');
      }
    } catch (error: any) {
      sonnerToast.error(error.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsLoading(false);
    }
  };

  const basePath = user?.role === "owner" ? "/owner-dashboard" : "/dashboard";

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <BackButton to={`${basePath}/my-items`} className="mb-0" />
        <h1 className="text-2xl font-display font-bold text-foreground">Sell New Item</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold ml-1">Item Title</label>
            <input 
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              type="text" 
              placeholder="e.g. MacBook Pro M1 2020" 
              className="w-full px-4 py-3 rounded-xl bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold ml-1">Price</label>
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
              <label className="text-sm font-semibold ml-1">Category</label>
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
              <label className="text-sm font-semibold ml-1">Condition</label>
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
                <label className="text-sm font-semibold">Location</label>
                <a 
                  href={formData.location
                    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formData.location)}`
                    : undefined}
                  onClick={!formData.location ? (e) => e.preventDefault() : undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-disabled={!formData.location}
                  className={`text-[10px] flex items-center gap-1 font-bold uppercase transition-opacity ${
                    formData.location
                      ? 'text-primary hover:underline cursor-pointer'
                      : 'text-muted-foreground opacity-40 cursor-not-allowed pointer-events-none'
                  }`}
                >
                  <MapPin className="w-3 h-3" />
                  Cek di Maps
                </a>
              </div>
              <input 
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                type="text" 
                inputMode="text"
                autoComplete="street-address"
                placeholder="e.g. Depok, Sleman" 
                className="w-full px-4 py-3 rounded-xl bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold ml-1">Description</label>
            <textarea 
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={4}
              placeholder="Describe the item condition, usage duration, and other details..." 
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

        <div className="flex gap-4">
          <Button 
            type="button" 
            variant="outline" 
            className="flex-1 py-6 rounded-xl border-border"
            onClick={() => navigate(`${basePath}/my-items`)}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading}
            className="flex-[2] py-6 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20 group"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Listing Item...</span>
              </div>
            ) : (
              <>
                List Item for Sale
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
