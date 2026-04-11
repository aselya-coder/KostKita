import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Building2, Edit2, Trash2, Eye, MapPin } from "lucide-react";
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
      if (channel) {
        supabase.removeChannel(channel);
      }
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
    <div className="space-y-8 pb-12">
      <BackButton to="/dashboard" className="mb-0" />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-display font-bold text-foreground tracking-tight">Iklan Kos Saya</h1>
          <p className="text-muted-foreground">Kelola dan pantau daftar iklan kos Anda.</p>
        </div>
        <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg shadow-primary/20 px-6 h-12 font-bold transition-all active:scale-95">
          <Link to="/dashboard/add-kos">
            <Plus className="w-5 h-5 mr-2" />
            Tambah Kos Baru
          </Link>
        </Button>
      </div>

      {myKos.length > 0 ? (
        <div className="bg-card rounded-3xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-secondary/50 text-muted-foreground uppercase text-[10px] font-bold tracking-widest">
                <tr>
                  <th className="px-8 py-5">Properti</th>
                  <th className="px-8 py-5">Harga</th>
                  <th className="px-8 py-5">Status</th>
                  <th className="px-8 py-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y border-border text-foreground">
                {myKos.map((kos) => (
                  <tr key={kos.id} className="hover:bg-secondary/30 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="relative w-14 h-14 shrink-0 overflow-hidden rounded-xl bg-muted shadow-sm group-hover:shadow-md transition-all">
                          <img 
                            src={kos.images[0]} 
                            alt={kos.title} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-base truncate max-w-[240px] tracking-tight">{kos.title}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[240px] flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-primary" />
                            {kos.location}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <p className="font-bold text-foreground text-lg tracking-tight">Rp {kos.price.toLocaleString('id-ID')}</p>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border",
                        kos.status === "approved" || kos.status === "active" ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                        kos.status === "expired" ? "bg-red-50 text-red-600 border-red-200" :
                        "bg-amber-50 text-amber-600 border-amber-200"
                      )}>
                        {kos.status || "pending"}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all" asChild>
                          <Link to={`/kos/${kos.id}`}>
                            <Eye className="w-4 h-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all" asChild>
                          <Link to={`/dashboard/edit-kos/${kos.id}`}>
                            <Edit2 className="w-4 h-4" />
                          </Link>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-9 w-9 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
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
        <div className="bg-card rounded-3xl border border-border border-dashed p-16 text-center shadow-sm">
          <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Building2 className="w-10 h-10 text-muted-foreground/40" />
          </div>
          <h3 className="text-xl font-display font-bold text-foreground mb-3">Belum Ada Properti</h3>
          <p className="text-muted-foreground mb-8 max-w-xs mx-auto">Mulai dengan menambahkan iklan kos pertama Anda untuk menarik penyewa.</p>
          <Button asChild className="rounded-xl px-8 h-12 font-bold shadow-lg shadow-primary/20 transition-all active:scale-95">
            <Link to="/dashboard/add-kos">Tambah Kos Baru</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
