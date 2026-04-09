import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Building2, Edit2, Trash2, Eye } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { type KosListing } from "@/data/mockData";
import { getKosListings, deleteKosListing } from "@/services/kos";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/BackButton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export default function MyBoardingHouses() {
  const { user } = useAuth();
  const [myKos, setMyKos] = useState<KosListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMyKos = async () => {
    if (!user) return;
    setIsLoading(true);
    const data = await getKosListings(user.id);
    setMyKos(data);
    setIsLoading(false);
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
  }, [user]);

  const handleDelete = async (id: string) => {
    if (confirm("Hapus properti ini secara permanen?")) {
      const { success } = await deleteKosListing(id, user.id);
      if (success) {
        setMyKos(prev => prev.filter(k => k.id !== id));
        toast.success("Properti dihapus");
      }
    }
  };

  return (
    <div className="space-y-8">
      <BackButton to="/dashboard" className="mb-0" />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Iklan Kos Saya</h1>
          <p className="text-muted-foreground">Kelola dan pantau daftar iklan kos Anda.</p>
        </div>
        <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Link to="/dashboard/add-kos">
            <Plus className="w-4 h-4 mr-2" />
            Tambah Kos Baru
          </Link>
        </Button>
      </div>

      {myKos.length > 0 ? (
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-secondary/50 text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Properti</th>
                  <th className="px-6 py-4">Harga</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y border-border text-foreground">
                {myKos.map((kos) => (
                  <tr key={kos.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={kos.images[0]} 
                          alt={kos.title} 
                          className="w-12 h-12 rounded-lg object-cover bg-muted" 
                        />
                        <div className="min-w-0">
                          <p className="font-semibold truncate max-w-[200px]">{kos.title}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">{kos.location}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-foreground">Rp {kos.price.toLocaleString('id-ID')}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        kos.status === "approved" || kos.status === "active" ? "bg-emerald-50 text-emerald-600 border border-emerald-200" :
                        kos.status === "expired" ? "bg-red-50 text-red-600 border border-red-200" :
                        "bg-amber-50 text-amber-600 border border-amber-200"
                      )}>
                        {kos.status || "pending"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" asChild>
                          <Link to={`/kos/${kos.id}`}>
                            <Eye className="w-4 h-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" asChild>
                          <Link to={`/dashboard/edit-kos/${kos.id}`}>
                            <Edit2 className="w-4 h-4" />
                          </Link>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(kos.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Belum Ada Properti</h3>
          <p className="text-muted-foreground mb-6">Mulai dengan menambahkan iklan kos pertama Anda.</p>
          <Button asChild>
            <Link to="/dashboard/add-kos">Tambah Kos Baru</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
