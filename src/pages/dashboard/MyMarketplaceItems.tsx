import { useState, useEffect } from "react";
import { Plus, Tag, MapPin, Edit2, Trash2, Eye, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/data/mockData";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { BackButton } from "@/components/BackButton";
import { supabase } from "@/lib/supabase";
import { logUserActivity } from "@/services/activity";
import { toast } from "sonner";

export default function MyMarketplaceItems() {
  const { user } = useAuth();
  const [myItems, setMyItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const fetchMyItems = async () => {
    if (!user) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from('marketplace_items')
      .select('*')
      .eq('seller_id', user.id);
    
    if (error) {
      console.error('Error fetching items:', error);
    } else {
      setMyItems(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (!user) return;

    fetchMyItems();

    // REALTIME: Listen for changes in marketplace_items
    let mounted = true;
    const channel = supabase
      .channel('my-items-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'marketplace_items', 
        filter: `seller_id=eq.${user?.id}` 
      }, () => fetchMyItems())
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          if (!mounted && channel) {
            supabase.removeChannel(channel);
          }
        }
      });

    return () => {
      mounted = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [user]);

  const handleDelete = async (id: string) => {
    if (confirm("Hapus barang ini secara permanen?")) {
      // Get item title first for logging
      const itemToDelete = myItems.find(i => i.id === id);
      const itemTitle = itemToDelete?.title || "Barang";

      const { error } = await supabase
        .from('marketplace_items')
        .delete()
        .eq('id', id);
      
      if (error) {
        toast.error("Gagal menghapus barang");
      } else {
        // Log activity
        if (user) {
          await logUserActivity(user.id, 'Menghapus barang marketplace', itemTitle);
        }
        setMyItems(prev => prev.filter(item => item.id !== id));
        toast.success("Barang dihapus");
      }
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 pb-12 px-4 md:px-0">
      <BackButton to="/dashboard" className="mb-0" />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground tracking-tight">Iklan Barang Saya</h1>
          <p className="text-muted-foreground text-sm">Kelola daftar iklan barang yang Anda jual.</p>
        </div>
        <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg shadow-primary/20 px-6 h-12 font-bold transition-all active:scale-95 w-full sm:w-auto">
          <Link to="/dashboard/sell-item">
            <Plus className="w-5 h-5 mr-2" />
            Jual Barang Baru
          </Link>
        </Button>
      </div>

      {myItems.length > 0 ? (
        <div className="bg-card rounded-3xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
          <div className="overflow-x-auto -mx-4 md:mx-0">
            <div className="inline-block min-w-full align-middle">
              <table className="w-full text-xs md:text-sm text-left">
                <thead className="bg-secondary/50 text-muted-foreground uppercase text-[9px] md:text-[10px] font-bold tracking-widest">
                  <tr>
                    <th className="px-6 py-5">Barang</th>
                    <th className="px-6 py-5">Kategori</th>
                    <th className="px-6 py-5">Harga</th>
                    <th className="px-6 py-5">Kondisi</th>
                    <th className="px-6 py-5">Status</th>
                    <th className="px-6 py-5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y border-border text-foreground">
                  {myItems.map((item) => (
                    <tr key={item.id} className="hover:bg-secondary/30 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="relative w-12 h-12 md:w-14 md:h-14 shrink-0 overflow-hidden rounded-xl bg-muted shadow-sm group-hover:shadow-md transition-all">
                            <img 
                              src={item.image} 
                              alt={item.title} 
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-sm md:text-base truncate max-w-[120px] md:max-w-[200px] tracking-tight">{item.title}</p>
                            <a 
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.location)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] md:text-xs text-muted-foreground truncate max-w-[120px] md:max-w-[200px] hover:text-primary transition-colors flex items-center gap-1 mt-0.5"
                            >
                              <MapPin className="w-3 h-3 text-primary" />
                              {item.location}
                            </a>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <span className="capitalize font-medium">{item.category}</span>
                      </td>
                      <td className="px-6 py-5 font-bold text-base whitespace-nowrap tracking-tight">
                        {formatPrice(item.price)}
                      </td>
                      <td className="px-6 py-5 text-muted-foreground whitespace-nowrap">
                        {item.condition}
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-widest border",
                          item.expires_at && new Date(item.expires_at) < new Date() ? "bg-red-50 text-red-600 border-red-200" :
                          item.status === "active" ? "bg-emerald-50 text-emerald-600 border-emerald-200" : 
                          item.status === "sold" ? "bg-blue-50 text-blue-600 border-blue-200" : 
                          "bg-red-50 text-red-600 border-red-200"
                        )}>
                          {item.expires_at && new Date(item.expires_at) < new Date() ? "expired" : (item.status || "Active")}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1 md:gap-2">
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all" asChild>
                            <Link to={`/item/${item.id}`}>
                              <Eye className="w-4 h-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all" asChild>
                            <Link to={`/dashboard/edit-item/${item.id}`}>
                              <Edit2 className="w-4 h-4" />
                            </Link>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                            onClick={() => handleDelete(item.id)}
                            title="Hapus Barang"
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
        </div>
      ) : (
        <div className="bg-card rounded-3xl border border-border border-dashed p-16 text-center shadow-sm">
          <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mx-auto mb-6 shadow-inner">
            <ShoppingBag className="w-10 h-10 text-muted-foreground/40" />
          </div>
          <h3 className="text-xl font-display font-bold text-foreground mb-3">Belum ada barang</h3>
          <p className="text-muted-foreground max-w-sm mx-auto mb-8">
            Anda belum memasang barang untuk dijual. Ayo mulai hasilkan uang dari barang tidak terpakai!
          </p>
          <Button asChild className="rounded-xl px-8 h-12 font-bold shadow-lg shadow-primary/20 transition-all active:scale-95">
            <Link to="/dashboard/sell-item">
              <Plus className="w-5 h-5 mr-2" />
              Jual Barang Baru
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
