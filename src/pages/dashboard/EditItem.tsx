import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Camera, MapPin, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/BackButton";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { uploadFile } from "@/services/storage";
import { toast as sonnerToast } from "sonner";
import { type MarketplaceItem } from "@/data/mockData";

export default function EditItem() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [item, setItem] = useState<MarketplaceItem | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  
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

  useEffect(() => {
    const fetchItem = async () => {
      if (!id) return;
      setIsFetching(true);
      try {
        const { data, error } = await supabase
          .from('marketplace_items')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) throw error;
        if (data) {
          setItem(data);
          setFormData({
            title: data.title,
            price: data.price.toLocaleString('id-ID'),
            category: data.category.toLowerCase(),
            condition: data.condition.toLowerCase(),
            location: data.location || "",
            description: data.description || "",
          });
          setExistingImageUrl(data.image);
        }
      } catch (error) {
        console.error("Error fetching item:", error);
        sonnerToast.error("Gagal mengambil data barang.");
        navigate(-1);
      } finally {
        setIsFetching(false);
      }
    };

    fetchItem();
  }, [id, navigate]);

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
    setExistingImageUrl(null);
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
    if (!user || !id) return;

    if (!image && !existingImageUrl) {
      sonnerToast.error('Mohon upload foto barang.');
      return;
    }

    setIsLoading(true);
    
    try {
      let imageUrl = existingImageUrl;

      if (image) {
        const fileName = `${Date.now()}-${image.name.replace(/\s/g, '_')}`;
        const path = `${user.id}/${fileName}`;
        const { url, error } = await uploadFile('item-images', path, image);
        if (error) throw new Error(`Gagal upload foto: ${error}`);
        imageUrl = url;
      }

      const priceClean = parseInt(formData.price.replace(/\D/g, ''));
      
      const { error: updateError } = await supabase
        .from('marketplace_items')
        .update({
          title: formData.title,
          price: priceClean,
          category: formData.category,
          condition: formData.condition,
          location: formData.location,
          description: formData.description,
          image: imageUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) throw updateError;

      sonnerToast.success('Barang berhasil diperbarui!');
      const basePath = user?.role === "owner" ? "/owner-dashboard" : "/dashboard";
      setTimeout(() => navigate(`${basePath}/my-items`), 1500);
    } catch (error: any) {
      sonnerToast.error(error.message || 'Gagal memperbarui barang.');
    } finally {
      setIsLoading(false);
    }
  };

  const basePath = user?.role === "owner" ? "/owner-dashboard" : "/dashboard";

  if (isFetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <BackButton to={`${basePath}/my-items`} className="mb-0" />
        <h1 className="text-2xl font-display font-bold text-foreground">Edit Item</h1>
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
                  className={`text-[10px] flex items-center gap-1 font-bold uppercase transition-opacity ${
                    formData.location ? 'text-primary hover:underline' : 'text-muted-foreground opacity-40'
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
              placeholder="Describe the item condition..." 
              className="w-full px-4 py-3 rounded-xl bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
            />
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-6">
          <h3 className="font-display font-bold text-lg border-b border-border pb-4">Media</h3>
          <label
            htmlFor="edit-item-image"
            className="relative flex items-center justify-center border-2 border-dashed border-border rounded-2xl p-8 sm:p-12 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group overflow-hidden min-h-[200px]"
          >
            {(previewUrl || existingImageUrl) ? (
              <div className="absolute inset-0 w-full h-full">
                <img src={previewUrl || existingImageUrl || ''} alt="Preview" className="w-full h-full object-cover" />
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
            id="edit-item-image"
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
            onClick={() => navigate(-1)}
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
                Updating...
              </div>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
