import { useState, useEffect } from "react";
import { Plus, Building2, Edit2, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { BackButton } from "@/components/BackButton";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { getKosListings, deleteKosListing } from "@/services/kos";
import { type KosListing } from "@/data/mockData";
import { generateProductPath } from "@/utils/slug";

export default function MyKos() {
  const { user } = useAuth();
  const [myKos, setMyKos] = useState<KosListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMyKos = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const data = await getKosListings(user.id);
      setMyKos(data);
    } catch (error) {
      console.error('Error fetching kos listings:', error);
      toast.error("Gagal memuat data kos Anda.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyKos();

    const channel = supabase
      .channel('my-kos-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'kos_listings', 
        filter: `owner_id=eq.${user?.id}` 
      }, () => fetchMyKos())
      .subscribe();

    return () => {
      // Small timeout to allow the WebSocket to establish before closing
      setTimeout(() => {
        if (channel) {
          channel.unsubscribe();
          supabase.removeChannel(channel);
        }
      }, 300);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleDelete = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus listing kos ini?")) {
      try {
        await deleteKosListing(id, user?.id || '');
        toast.success("Listing kos berhasil dihapus.");
        // The real-time listener will handle the UI update
      } catch (error) {
        toast.error("Gagal menghapus listing kos.");
      }
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 pb-12 px-4 md:px-0">
      <BackButton to="/dashboard" className="mb-0" />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-display font-bold text-foreground">Kos Saya</h1>
          <p className="text-muted-foreground text-xs md:text-sm">Kelola semua listing kos yang Anda miliki.</p>
        </div>
        <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto">
          <Link to="/dashboard/add-kos">
            <Plus className="w-4 h-4 mr-2" />
            Tambah Kos Baru
          </Link>
        </Button>
      </div>

      {myKos.length > 0 ? (
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto -mx-4 md:mx-0">
            <div className="inline-block min-w-full align-middle">
              <table className="w-full text-xs md:text-sm text-left">
                <thead className="bg-secondary/50 text-muted-foreground uppercase text-[9px] md:text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="px-4 md:px-6 py-4">Nama Kos</th>
                    <th className="px-4 md:px-6 py-4">Tipe</th>
                    <th className="px-4 md:px-6 py-4">Harga/Bulan</th>
                    <th className="px-4 md:px-6 py-4">Status</th>
                    <th className="px-4 md:px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y border-border text-foreground">
                  {myKos.map((kos) => (
                    <tr key={kos.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="px-4 md:px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img 
                            src={kos.images[0]} 
                            alt={kos.title} 
                            className="w-10 h-10 md:w-12 md:h-12 rounded-lg object-cover bg-muted flex-shrink-0" 
                          />
                          <div className="min-w-0">
                            <p className="font-semibold truncate max-w-[120px] md:max-w-[200px]">{kos.title}</p>
                            <p className="text-[10px] md:text-xs text-muted-foreground truncate max-w-[120px] md:max-w-[200px]">{kos.location}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-4">
                        <span className="capitalize">{kos.type}</span>
                      </td>
                      <td className="px-4 md:px-6 py-4 font-medium whitespace-nowrap">
                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(kos.price)}
                      </td>
                      <td className="px-4 md:px-6 py-4">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-wider",
                          kos.expires_at && new Date(kos.expires_at) < new Date() ? "bg-red-50 text-red-600" :
                          kos.status === "approved" ? "bg-emerald-50 text-emerald-600" :
                          kos.status === "pending" ? "bg-amber-50 text-amber-600" :
                          "bg-red-50 text-red-600"
                        )}>
                          {kos.expires_at && new Date(kos.expires_at) < new Date() ? "expired" : kos.status}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 md:gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" asChild>
                            <Link to={generateProductPath('kos', kos.title, kos.id)}>
                              <Eye className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" asChild>
                            <Link to={`/dashboard/edit-kos/${kos.id}`}>
                              <Edit2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            </Link>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(kos.id)}
                            title="Hapus Kos"
                          >
                            <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-display font-bold mb-2">Belum ada kos</h3>
          <p className="text-muted-foreground max-w-sm mx-auto mb-8">
            Anda belum menambahkan listing kos. Mulai sewakan properti Anda sekarang!
          </p>
          <Button asChild>
            <Link to="/dashboard/add-kos">
              <Plus className="w-4 h-4 mr-2" />
              Tambah Kos Pertama Anda
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
