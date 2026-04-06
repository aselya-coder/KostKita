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
    const channel = supabase
      .channel('my-items-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'marketplace_items', 
        filter: `seller_id=eq.${user?.id}` 
      }, () => fetchMyItems())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-display font-bold text-foreground">Marketplace Saya</h1>
          <p className="text-muted-foreground text-xs md:text-sm">Kelola barang yang Anda jual di marketplace.</p>
        </div>
        <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto">
          <Link to="/dashboard/sell-item">
            <Plus className="w-4 h-4 mr-2" />
            Jual Barang Baru
          </Link>
        </Button>
      </div>

      {myItems.length > 0 ? (
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto -mx-4 md:mx-0">
            <div className="inline-block min-w-full align-middle">
              <table className="w-full text-xs md:text-sm text-left">
                <thead className="bg-secondary/50 text-muted-foreground uppercase text-[9px] md:text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="px-4 md:px-6 py-4">Barang</th>
                    <th className="px-4 md:px-6 py-4">Kategori</th>
                    <th className="px-4 md:px-6 py-4">Harga</th>
                    <th className="px-4 md:px-6 py-4">Kondisi</th>
                    <th className="px-4 md:px-6 py-4">Status</th>
                    <th className="px-4 md:px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y border-border text-foreground">
                  {myItems.map((item) => (
                    <tr key={item.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="px-4 md:px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img 
                            src={item.image} 
                            alt={item.title} 
                            className="w-10 h-10 md:w-12 md:h-12 rounded-lg object-cover bg-muted flex-shrink-0" 
                          />
                          <div className="min-w-0">
                            <p className="font-semibold truncate max-w-[120px] md:max-w-[200px]">{item.title}</p>
                            <a 
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.location)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] md:text-xs text-muted-foreground truncate max-w-[120px] md:max-w-[200px] block hover:text-primary transition-colors"
                            >
                              {item.location}
                            </a>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-4">
                        <span className="capitalize">{item.category}</span>
                      </td>
                      <td className="px-4 md:px-6 py-4 font-medium whitespace-nowrap">
                        {formatPrice(item.price)}
                      </td>
                      <td className="px-4 md:px-6 py-4 text-muted-foreground whitespace-nowrap">
                        {item.condition}
                      </td>
                      <td className="px-4 md:px-6 py-4">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-wider",
                          item.status === "active" ? "bg-emerald-50 text-emerald-600" : 
                          item.status === "sold" ? "bg-blue-50 text-blue-600" : 
                          "bg-red-50 text-red-600"
                        )}>
                          {item.status || "Active"}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 md:gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" asChild>
                            <Link to={`/item/${item.id}`}>
                              <Eye className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" asChild>
                            <Link to={`/dashboard/edit-item/${item.id}`}>
                              <Edit2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            </Link>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(item.id)}
                            title="Hapus Barang"
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
            <ShoppingBag className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-display font-bold mb-2">Belum ada barang</h3>
          <p className="text-muted-foreground max-w-sm mx-auto mb-8">
            Anda belum memasang barang untuk dijual. Ayo mulai hasilkan uang dari barang tidak terpakai!
          </p>
          <Button asChild>
            <Link to="/dashboard/sell-item">
              <Plus className="w-4 h-4 mr-2" />
              Jual Barang Pertama Anda
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
