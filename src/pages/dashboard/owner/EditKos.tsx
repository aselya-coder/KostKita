import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getKosById, updateKosListing } from '@/services/kos';
import { uploadMultipleFiles } from '@/services/storage';
import { BackButton } from '@/components/BackButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { X, Plus, Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { type KosListing } from '@/data/mockData';

export default function EditKosPage() {
  const { user } = useAuth();
  const { id: kosId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [kos, setKos] = useState<KosListing | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  
  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);

  // State for amenities and rules
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

  useEffect(() => {
    if (!kosId) {
      toast.error("ID Kos tidak ditemukan.");
      navigate('/owner-dashboard/my-kos');
      return;
    }

    const fetchKosData = async () => {
      setIsFetching(true);
      try {
        const data = await getKosById(kosId);
        if (data) {
          setKos(data);
          setFormData({
            title: data.title,
            location: data.location,
            price: data.price.toString(),
            type: data.type,
            description: data.description,
            availableRooms: String(data.availableRooms),
            rating: String(data.rating),
          });
          setExistingImageUrls(data.images);
          setAmenities(data.amenities || []);
          setRules(data.rules || []);
        } else {
          toast.error("Data kos tidak ditemukan.");
          navigate('/owner-dashboard/my-kos');
        }
      } catch (error) {
        toast.error("Gagal mengambil data kos.");
      } finally {
        setIsFetching(false);
      }
    };

    fetchKosData();
  }, [kosId, navigate]);

  useEffect(() => {
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (existingImageUrls.length + previewUrls.length + files.length > 8) {
        toast.error('Maksimal 8 gambar diperbolehkan.');
        return;
      }
      setImages(prev => [...prev, ...files]);
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setPreviewUrls(prev => [...prev, ...newPreviews]);
    }
  };

  const removeNewImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const removeExistingImage = (index: number) => {
    setExistingImageUrls(prev => prev.filter((_, i) => i !== index));
  };

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !kosId) return;

    setIsLoading(true);
    try {
      let uploadedImageUrls: string[] = [];
      if (images.length > 0) {
        const { urls, errors } = await uploadMultipleFiles('kos-images', user.id, images);
        if (errors.length > 0) {
          toast.warning(`${errors.length} gambar baru gagal diunggah.`);
        }
        uploadedImageUrls = urls;
      }

      const finalImageUrls = [...existingImageUrls, ...uploadedImageUrls];
      if (finalImageUrls.length === 0) {
        throw new Error("Harus ada minimal satu gambar.");
      }

      const priceClean = parseInt(formData.price.replace(/\D/g, ''));
      const roomsClean = parseInt(formData.availableRooms);

      const updatedData = {
        title: formData.title,
        location: formData.location,
        price: priceClean,
        type: formData.type,
        description: formData.description,
        availableRooms: roomsClean,
        images: finalImageUrls,
        amenities: amenities,
        rules: rules,
        rating: parseFloat(formData.rating),
      };

      await updateKosListing(kosId, user.id, updatedData);
      
      toast.success('Data kos berhasil diperbarui!');
      navigate('/owner-dashboard/my-kos');

    } catch (error) {
      const err = error as Error;
      toast.error(err.message || 'Gagal memperbarui data kos.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Memuat data kos...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <BackButton to="/owner-dashboard/my-kos" />
      
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-display font-bold text-foreground">Edit Informasi Kos</h1>
        <p className="text-muted-foreground">Perbarui detail properti Anda di bawah ini.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-card rounded-3xl border border-border p-8 space-y-8 shadow-sm">
        <div className="space-y-4">
          <label className="text-sm font-bold text-foreground uppercase tracking-wider">Foto Properti ({existingImageUrls.length + previewUrls.length}/8)</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {existingImageUrls.map((url, index) => (
              <div key={`existing-${index}`} className="relative aspect-[4/3] rounded-2xl overflow-hidden border group shadow-sm bg-muted/20">
                <img src={url} alt={`Existing ${index}`} className="w-full h-full object-contain" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button type="button" onClick={() => removeExistingImage(index)} className="p-2 rounded-full bg-destructive text-white hover:bg-destructive/90 transform scale-75 group-hover:scale-100 transition-all"><X className="w-5 h-5" /></button>
                </div>
              </div>
            ))}
            {previewUrls.map((url, index) => (
              <div key={`new-${index}`} className="relative aspect-[4/3] rounded-2xl overflow-hidden border group shadow-sm bg-muted/20">
                <img src={url} alt={`New ${index}`} className="w-full h-full object-contain" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button type="button" onClick={() => removeNewImage(index)} className="p-2 rounded-full bg-destructive text-white hover:bg-destructive/90 transform scale-75 group-hover:scale-100 transition-all"><X className="w-5 h-5" /></button>
                </div>
              </div>
            ))}
            {existingImageUrls.length + previewUrls.length < 8 && (
              <button type="button" onClick={() => fileInputRef.current?.click()} className="aspect-[4/3] rounded-2xl border-2 border-dashed border-muted-foreground/20 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all group">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center group-hover:bg-primary/10 transition-colors"><Plus className="w-6 h-6" /></div>
                <span className="text-xs font-bold uppercase tracking-tight">Tambah Foto</span>
              </button>
            )}
          </div>
          <input type="file" ref={fileInputRef} onChange={handleImageChange} multiple accept="image/*" className="hidden" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase">Nama Kos</label>
            <Input name="title" placeholder="Contoh: Kos Harmoni Depok" value={formData.title} onChange={handleChange} required className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase">Lokasi</label>
            <Input name="location" placeholder="Contoh: Jl. Margonda No. 12" value={formData.location} onChange={handleChange} required className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase">Harga per Bulan</label>
            <Input name="price" type="text" placeholder="1.500.000" value={formData.price} onChange={(e) => setFormData(p => ({...p, price: e.target.value.replace(/\D/g, '')}))} required className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase">Tipe Kos</label>
            <Select onValueChange={(v: 'putra' | 'putri' | 'campur') => setFormData(p => ({ ...p, type: v }))} value={formData.type}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="putra">Putra</SelectItem>
                <SelectItem value="putri">Putri</SelectItem>
                <SelectItem value="campur">Campur</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase">Kamar Tersedia</label>
            <Input name="availableRooms" type="number" min="0" value={formData.availableRooms} onChange={handleChange} required className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase">Rating Awal (1.0 - 5.0)</label>
            <Input name="rating" type="number" min="1" max="5" step="0.1" value={formData.rating} onChange={handleChange} required className="rounded-xl" />
          </div>
        </div>

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

        <div className="space-y-3">
          <label className="text-xs font-bold text-muted-foreground uppercase">Peraturan Kos</label>
          <div className="flex gap-2">
            <Input
              value={ruleInput}
              onChange={(e) => setRuleInput(e.target.value)}
              placeholder="Contoh: Dilarang merokok, Akses 24 jam"
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
          <Textarea name="description" placeholder="Jelaskan detail lain tentang kos Anda..." value={formData.description} onChange={handleChange} required className="min-h-[120px] rounded-2xl" />
        </div>

        <div className="pt-4">
          <Button type="submit" className="w-full h-14 text-lg font-bold rounded-2xl" disabled={isLoading}>
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Simpan Perubahan'}
          </Button>
        </div>
      </form>
    </div>
  );
}