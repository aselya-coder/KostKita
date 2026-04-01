import { useState, useEffect } from "react";
import { formatPrice } from "@/data/mockData";
import { BackButton } from "@/components/BackButton";
import { Search, ShoppingBag, Eye, Trash2, AlertTriangle, CheckCircle2, MoreVertical, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { logUserActivity } from "@/services/marketplace";
import { toast } from "sonner";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

export default function MarketplaceModeration() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchItems = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('marketplace_items')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching items:', error);
      toast.error("Gagal mengambil data marketplace");
    } else {
      setItems(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchItems();

    // REALTIME: Listen for any changes in marketplace_items
    const channel = supabase.channel('admin-marketplace-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'marketplace_items' }, () => fetchItems())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredItems = items.filter(i => 
    i.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const removeItem = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus barang ini dari marketplace?")) {
      // Get item title first for logging
      const itemToDelete = items.find(i => i.id === id);
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
          await logUserActivity(user.id, 'Moderasi: Menghapus barang marketplace', itemTitle);
        }
        setItems(prev => prev.filter(i => i.id !== id));
        toast.success("Barang berhasil dihapus");
      }
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <BackButton to="/admin" className="mb-0" />
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Moderasi Marketplace</h1>
          <p className="text-muted-foreground text-sm">Pantau dan kelola semua barang yang dijual di marketplace.</p>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border bg-secondary/30">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Cari nama barang atau penjual..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-secondary/50 text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">Barang</th>
                <th className="px-6 py-4">Kategori</th>
                <th className="px-6 py-4">Harga</th>
                <th className="px-6 py-4">Penjual</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y border-border">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-secondary/20 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={item.image} alt={item.title} className="w-10 h-10 rounded-lg object-cover bg-muted" />
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate max-w-[180px]">{item.title}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[180px]">{item.location}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 rounded-full bg-secondary text-[10px] font-bold uppercase tracking-wider">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-foreground">
                    {formatPrice(item.price)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground">{item.sellerName}</p>
                      <p className="text-[10px] text-muted-foreground">{item.sellerPhone}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1",
                      item.status === "active" || !item.status ? "bg-emerald-50 text-emerald-600" :
                      item.status === "sold" ? "bg-blue-50 text-blue-600" :
                      "bg-red-50 text-red-600"
                    )}>
                      {item.status === "active" || !item.status ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : item.status === "sold" ? (
                        <ShoppingBag className="w-3 h-3" />
                      ) : (
                        <AlertTriangle className="w-3 h-3" />
                      )}
                      {item.status || "Active"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuLabel>Aksi Moderasi</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="cursor-pointer">
                          <Eye className="w-4 h-4 mr-2" />
                          Lihat Halaman
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer text-amber-600">
                          <AlertTriangle className="w-4 h-4 mr-2" />
                          Beri Peringatan
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive cursor-pointer"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Hapus Listing
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredItems.length === 0 && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-8 h-8 text-muted-foreground/40" />
            </div>
            <h3 className="text-lg font-display font-bold text-foreground">Barang tidak ditemukan</h3>
            <p className="text-sm text-muted-foreground mt-1">Coba kata kunci pencarian yang lain.</p>
          </div>
        )}
      </div>
    </div>
  );
}
