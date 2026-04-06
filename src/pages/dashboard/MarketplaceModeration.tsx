import { useState, useEffect } from "react";
import { formatPrice } from "@/data/mockData";
import { BackButton } from "@/components/BackButton";
import { 
  Search, 
  ShoppingBag, 
  Eye, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  MoreVertical, 
  Shield, 
  Coins, 
  Clock,
  PowerOff,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { logUserActivity } from "@/services/activity";
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

  const calculateRemainingDays = (expiresAt: string | null) => {
    if (!expiresAt) return null;
    const end = new Date(expiresAt);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

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
    i.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.seller_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const deactivateItem = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menonaktifkan iklan barang ini?")) return;

    const { error } = await supabase
      .from('marketplace_items')
      .update({ listing_status: 'expired' })
      .eq('id', id);
    
    if (error) {
      toast.error("Gagal menonaktifkan iklan");
    } else {
      toast.success("Iklan barang dinonaktifkan");
      fetchItems();
    }
  };

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
    <div className="space-y-6 md:space-y-8 pb-12 px-4 md:px-0 max-w-7xl mx-auto">
      <BackButton to="/admin" className="mb-0" />
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-display font-bold text-foreground">Manajemen Iklan Barang</h1>
          <p className="text-muted-foreground text-xs md:text-sm">Pantau dan kelola semua iklan barang yang dijual di marketplace.</p>
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
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div className="overflow-x-auto -mx-4 md:mx-0">
          <div className="inline-block min-w-full align-middle">
            <table className="w-full text-xs md:text-sm text-left">
              <thead className="bg-secondary/50 text-muted-foreground uppercase text-[9px] md:text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="px-4 md:px-6 py-4">Barang</th>
                  <th className="px-4 md:px-6 py-4">Penjual</th>
                  <th className="px-4 md:px-6 py-4">Harga</th>
                  <th className="px-4 md:px-6 py-4">Masa Aktif</th>
                  <th className="px-4 md:px-6 py-4">Status</th>
                  <th className="px-4 md:px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y border-border">
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-4 md:px-6 py-4"><div className="h-10 w-40 bg-secondary rounded-lg"></div></td>
                      <td className="px-4 md:px-6 py-4"><div className="h-4 w-24 bg-secondary rounded-md"></div></td>
                      <td className="px-4 md:px-6 py-4"><div className="h-4 w-20 bg-secondary rounded-md"></div></td>
                      <td className="px-4 md:px-6 py-4"><div className="h-4 w-20 bg-secondary rounded-md"></div></td>
                      <td className="px-4 md:px-6 py-4"><div className="h-6 w-16 bg-secondary rounded-full"></div></td>
                      <td className="px-4 md:px-6 py-4 text-right"><div className="h-8 w-8 bg-secondary rounded-lg ml-auto"></div></td>
                    </tr>
                  ))
                ) : filteredItems.length > 0 ? (
                  filteredItems.map((item) => {
                    const remainingDays = calculateRemainingDays(item.expires_at || item.expiry_date);
                    const isExpired = remainingDays !== null && remainingDays <= 0;

                    return (
                      <tr key={item.id} className="hover:bg-secondary/20 transition-colors">
                        <td className="px-4 md:px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img src={item.image} alt="" className="w-10 h-10 md:w-12 md:h-12 rounded-lg object-cover bg-muted flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground truncate max-w-[120px] md:max-w-[200px]">{item.title}</p>
                              <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wider">{item.category}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 md:px-6 py-4 font-medium truncate max-w-[100px] md:max-w-none">
                          {item.seller_name || "Unknown"}
                        </td>
                        <td className="px-4 md:px-6 py-4 whitespace-nowrap font-medium text-foreground">
                          {formatPrice(item.price)}
                        </td>
                        <td className="px-4 md:px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Clock className="w-3.5 h-3.5" />
                              {remainingDays !== null ? (
                                isExpired ? (
                                  <span className="text-red-600 font-bold">Expired</span>
                                ) : (
                                  <span className="text-foreground font-medium">{remainingDays} Hari</span>
                                )
                              ) : (
                                <span>Selamanya</span>
                              )}
                            </div>
                            {(item.expires_at || item.expiry_date) && (
                              <p className="text-[9px] md:text-[10px] text-muted-foreground flex items-center gap-1">
                                <Calendar className="w-2.5 h-2.5" />
                                {new Date(item.expires_at || item.expiry_date).toLocaleDateString('id-ID')}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 md:px-6 py-4">
                          <span className={cn(
                            "px-2.5 py-1 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-wider border",
                            item.listing_status === "active" && !isExpired ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                            "bg-slate-100 text-slate-600 border-slate-200"
                          )}>
                            {item.listing_status || "active"}
                          </span>
                        </td>
                        <td className="px-4 md:px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary" asChild>
                              <a href={`/marketplace/${item.id}`} target="_blank" rel="noopener noreferrer">
                                <Eye className="w-4 h-4" />
                              </a>
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl border-border">
                                <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-muted-foreground">Moderasi</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {item.listing_status === "active" && (
                                  <DropdownMenuItem onClick={() => deactivateItem(item.id)}>
                                    <PowerOff className="w-4 h-4 mr-2" />
                                    Nonaktifkan Iklan
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => removeItem(item.id)}>
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Hapus Permanen
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <AlertTriangle className="w-4 h-4 mr-2" />
                                  Beri Peringatan
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Shield className="w-4 h-4 mr-2" />
                                  Banned Penjual
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground italic">
                      Belum ada barang di marketplace.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {filteredItems.length === 0 && !isLoading && (
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
