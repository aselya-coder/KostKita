import { Building2, MessageCircle, Trash2, Eye, Plus, ShoppingBag, Heart, Calendar, MessageSquare } from "lucide-react";
import { StatsCard } from "@/components/StatsCard";
import { WalletCard } from "@/components/WalletCard";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { getUserDashboardStats } from "@/services/dashboard";
import { getKosListings, deleteKosListing } from "@/services/kos";
import { getInquiries } from "@/services/inquiries";
import { getMarketplaceItems } from "@/services/marketplace";
import { type KosListing, type Inquiry, type Wallet as WalletType, type MarketplaceItem, formatPrice } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getWalletData } from "@/services/wallet";

export default function UserOverview() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ 
    propertiesCount: 0, 
    inquiriesCount: 0,
    myListingsCount: 0, 
    favoritesCount: 0,
    bookingsCount: 0,
    ownerBookingsCount: 0,
    unreadMessagesCount: 0
  });
  const [myKos, setMyKos] = useState<KosListing[]>([]);
  const [myItems, setMyItems] = useState<MarketplaceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [wallet, setWallet] = useState<WalletType | null>(null);

  const fetchData = async () => {
    if (!user) return;
    try {
      const [uStats, kosData, inquiriesData, itemsData, walletData] = await Promise.all([
        getUserDashboardStats(user.id),
        getKosListings(user.id),
        getInquiries(user.id),
        getMarketplaceItems(undefined, user.id),
        getWalletData(user.id)
      ]);
      setStats(uStats);
      setMyKos(kosData);
      setMyItems(itemsData);
      setWallet(walletData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };


  const handleDeleteKos = async (id: string) => {
    if (confirm("Hapus properti ini secara permanen?")) {
      const { success } = await deleteKosListing(id, user?.id || '');
      if (success) {
        setMyKos(prev => prev.filter(k => k.id !== id));
        toast.success("Property deleted");
        fetchData(); // Refresh stats
      }
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();

      // REALTIME: Listen for changes in kos_listings, inquiries, and marketplace items using a single channel
      const channel = supabase
        .channel('user-dashboard-changes')
        .on(
          'postgres_changes', 
          { event: '*', schema: 'public', table: 'kos_listings', filter: `owner_id=eq.${user.id}` }, 
          () => fetchData()
        )
        .on(
          'postgres_changes', 
          { event: '*', schema: 'public', table: 'inquiries', filter: `owner_id=eq.${user.id}` }, 
          () => fetchData()
        )
        .on(
          'postgres_changes', 
          { event: '*', schema: 'public', table: 'marketplace_items', filter: `seller_id=eq.${user.id}` }, 
          () => fetchData()
        )
        .subscribe();

      return () => {
        // Increase timeout to 200ms to allow the WebSocket to establish before closing
        setTimeout(() => {
          if (channel) {
            channel.unsubscribe();
            supabase.removeChannel(channel);
          }
        }, 300);
      };
    }
  }, [user]);

  return (
    <div className="space-y-8">
      <div className="bg-card rounded-3xl border border-border p-8 shadow-sm relative overflow-hidden group">
        {/* Background Decorative Element */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl transition-all group-hover:bg-primary/10" />
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center gap-5">
            <div className="relative">
              <Avatar className="w-20 h-20 border-4 border-background shadow-xl">
                <AvatarImage src={user?.avatar} alt={user?.name} className="object-cover" />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-4 border-background rounded-full shadow-sm" title="Online" />
            </div>
            
            <div className="space-y-1">
              <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
                Welcome back, {user?.name}!
              </h1>
              <div className="flex flex-col md:flex-row items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                  {user?.role === "admin" ? "Administrator" : "User"}
                </span>
                <p className="text-sm text-muted-foreground">
                  Kelola kos, barang marketplace, dan aktivitas akun Anda di sini.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-end gap-3">
            <Button asChild variant="outline" className="rounded-xl border-border shadow-sm" size="lg">
              <Link to="/dashboard/profile">
                Edit Profile
              </Link>
            </Button>
            <Button asChild variant="outline" className="rounded-xl border-border shadow-sm" size="lg">
              <Link to="/dashboard/sell-item">
                <ShoppingBag className="w-4 h-4 mr-2" />
                Jual Barang
              </Link>
            </Button>
            <Button asChild className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all active:scale-95" size="lg">
              <Link to="/dashboard/add-kos">
                <Plus className="w-4 h-4 mr-2" />
                Tambah Kos
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <WalletCard 
            balance={wallet?.balance || 0} 
            totalEarnings={wallet?.totalEarnings} 
            className="h-full"
          />
        </div>
        
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatsCard 
            title="Pesan Chat" 
            value={isLoading ? '...' : stats.unreadMessagesCount} 
            icon={MessageCircle} 
            description="Pesan belum dibaca"
            to="/dashboard/chat"
            trend={stats.unreadMessagesCount > 0 ? { value: stats.unreadMessagesCount, isUp: true } : undefined}
          />
          <StatsCard 
            title="Pemesanan" 
            value={isLoading ? '...' : (user?.role === 'owner' ? stats.ownerBookingsCount : stats.bookingsCount)} 
            icon={Calendar} 
            description={user?.role === 'owner' ? "Pemesanan masuk" : "Pemesanan saya"}
            to="/dashboard/bookings"
          />
          <StatsCard 
            title="Iklan Kos" 
            value={isLoading ? '...' : stats.propertiesCount} 
            icon={Building2} 
            description="Total iklan kos"
            to="/dashboard/my-kos"
          />
          <StatsCard 
            title="Inquiries" 
            value={isLoading ? '...' : stats.inquiriesCount} 
            icon={MessageSquare} 
            to="/dashboard/inquiries"
          />
          <StatsCard 
            title="Barang Saya" 
            value={isLoading ? '...' : stats.myListingsCount} 
            icon={ShoppingBag} 
            to="/dashboard/my-items"
          />
          <StatsCard 
            title="Favorit" 
            value={isLoading ? '...' : stats.favoritesCount} 
            icon={Heart} 
            to="/dashboard/favorites"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <h3 className="font-display font-semibold text-foreground">Kos Terbaru</h3>
            <Link to="/dashboard/my-kos" className="text-sm font-medium text-primary hover:underline">
              Lihat Semua
            </Link>
          </div>
          <div className="divide-y border-border">
            {myKos.slice(0, 3).map((kos) => (
              <div key={kos.id} className="p-4 flex items-center gap-4 hover:bg-secondary/50 transition-colors">
                <img src={kos.images[0]} alt={kos.title} className="w-12 h-12 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-foreground truncate">{kos.title}</h4>
                  <p className="text-xs text-muted-foreground">{kos.location}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" asChild>
                    <Link to={`/kos/${kos.id}`}>
                      <Eye className="w-4 h-4" />
                    </Link>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDeleteKos(kos.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            {myKos.length === 0 && (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Belum ada kos yang terdaftar.
              </div>
            )}
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <h3 className="font-display font-semibold text-foreground">Barang Marketplace Terbaru</h3>
            <Link to="/dashboard/my-items" className="text-sm font-medium text-primary hover:underline">
              Lihat Semua
            </Link>
          </div>
          <div className="divide-y border-border">
            {myItems.slice(0, 3).map((item) => (
              <div key={item.id} className="p-4 flex items-center gap-4 hover:bg-secondary/50 transition-colors">
                <img src={item.image} alt={item.title} className="w-12 h-12 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-foreground truncate">{item.title}</h4>
                  <p className="text-xs text-muted-foreground">{formatPrice(item.price)}</p>
                </div>
                <span className={cn(
                  "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                  item.status === "active" ? "bg-emerald-50 text-emerald-600 border border-emerald-200" :
                  item.status === "sold" ? "bg-secondary text-muted-foreground border border-border" :
                  "bg-amber-50 text-amber-600 border border-amber-200"
                )}>
                  {item.status || "Active"}
                </span>
              </div>
            ))}
            {myItems.length === 0 && (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Belum ada barang yang dijual.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
