import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getKosById, updateKosListing } from "@/services/kos";
import { type KosListing } from "@/data/mockData"; // Perbaikan: Menggunakan KosListing
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { useAuth } from "@/hooks/useAuth"; // Import useAuth

const EditKos = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth(); // Dapatkan user yang login
  const [kos, setKos] = useState<Partial<KosListing> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!id) {
      toast.error("ID Kos tidak ditemukan.");
      navigate("/admin-dashboard/kos");
      return;
    }

    const fetchKos = async () => {
      try {
        setIsLoading(true);
        const data = await getKosById(id);
        if (data) {
          setKos(data);
        } else {
          toast.error("Kos tidak ditemukan.");
          navigate("/admin-dashboard/kos");
        }
      } catch (error) {
        console.error("Gagal mengambil data kos:", error);
        toast.error("Gagal mengambil data kos.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchKos();
  }, [id, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setKos((prev) => (prev ? { ...prev, [name]: value } : null));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kos || !id || !user) return;

    setIsSaving(true);
    try {
      // Perbaikan: Menambahkan user.id sebagai argumen ketiga
      await updateKosListing(id, user.id, kos);
      toast.success("Data kos berhasil diperbarui!");
      navigate(`/kos/${id}`);
    } catch (error) {
      console.error("Gagal memperbarui kos:", error);
      toast.error("Gagal memperbarui data kos.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!kos) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <BackButton to={`/kos/${id}`} />
      <h1 className="text-3xl font-bold my-6">Edit Kos: {kos.title}</h1>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-foreground mb-1">
            Judul
          </label>
          <Input
            id="title"
            name="title"
            value={kos.title || ""}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-foreground mb-1">
            Deskripsi
          </label>
          <Textarea
            id="description"
            name="description"
            value={kos.description || ""}
            onChange={handleChange}
            rows={5}
            required
          />
        </div>
        
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-foreground mb-1">
            Harga per Bulan
          </label>
          <Input
            id="price"
            name="price"
            type="number"
            value={kos.price || ""}
            onChange={handleChange}
            required
          />
        </div>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
            Batal
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Simpan Perubahan
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditKos;