import { Users, Building2, ShoppingBag, ShieldAlert, TrendingUp, CheckCircle2, XCircle, MapPin } from "lucide-react";
import { StatsCard } from "@/components/StatsCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { getAdminDashboardStats } from "@/services/dashboard";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function AdminOverview() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ totalUsers: 0, totalKos: 0, totalItems: 0 });
  const [pendingListings, setPendingListings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const statsData = await getAdminDashboardStats();
      setStats(statsData);

      // Fetch real pending listings from both tables
      const [kosRes, itemsRes] = await Promise.all([
        supabase.from('kos_listings').select('id, title, location, profiles(name), created_at').eq('status', 'pending'),
        supabase.from('marketplace_items').select('id, title, location, profiles(name), created_at').eq('status', 'pending')
      ]);

      const formattedPending = [
        ...(kosRes.data || []).map((k: any) => ({ 
          id: k.id, 
          name: k.title, 
          location: k.location,
          user: k.profiles?.name || 'Unknown', 
          type: 'Kos', 
          date: k.created_at 
        })),
        ...(itemsRes.data || []).map((i: any) => ({ 
          id: i.id, 
          name: i.title, 
          location: i.location,
          user: i.profiles?.name || 'Unknown', 
          type: 'Item', 
          date: i.created_at 
        }))
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setPendingListings(formattedPending);
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Realtime for pending listings
    const kosChannel = supabase.channel('admin-kos-pending')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'kos_listings' }, () => fetchData())
      .subscribe();
    
    const itemsChannel = supabase.channel('admin-items-pending')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'marketplace_items' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(kosChannel);
      supabase.removeChannel(itemsChannel);
    };
  }, []);

  const handleApprove = async (id: string, type: string) => {
    const table = type === 'Kos' ? 'kos_listings' : 'marketplace_items';
    const { error } = await supabase.from(table).update({ status: type === 'Kos' ? 'approved' : 'active' }).eq('id', id);
    
    if (error) {
      toast.error(`Gagal menyetujui ${type}`);
    } else {
      toast.success(`${type} disetujui!`);
      fetchData();
    }
  };

  const handleReject = async (id: string, type: string) => {
    if (confirm(`Hapus/Tolak ${type} ini?`)) {
      const table = type === 'Kos' ? 'kos_listings' : 'marketplace_items';
      const { error } = await supabase.from(table).delete().eq('id', id);
      
      if (error) {
        toast.error(`Gagal menghapus ${type}`);
      } else {
        toast.success(`${type} berhasil dihapus!`);
        fetchData();
      }
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Admin Overview ({user?.name})</h1>
        <p className="text-muted-foreground">Platform-wide statistics and management.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard 
          title="Total Users" 
          value={isLoading ? '...' : stats.totalUsers} 
          icon={Users} 
          trend={{ value: 0, isUp: true }}
          to="/admin/users"
        />
        <StatsCard 
          title="Boarding Houses" 
          value={isLoading ? '...' : stats.totalKos} 
          icon={Building2} 
          trend={{ value: 0, isUp: true }}
          to="/admin/kos"
        />
        <StatsCard 
          title="Marketplace Items" 
          value={isLoading ? '...' : stats.totalItems} 
          icon={ShoppingBag} 
          trend={{ value: 0, isUp: true }}
          to="/admin/marketplace"
        />
        <StatsCard 
          title="Pending Reports" 
          value="0" // Replace with real data
          icon={ShieldAlert} 
          trend={{ value: 0, isUp: false }}
          to="/admin/reports"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border overflow-hidden">
          <div className="p-6 border-b border-border">
            <h3 className="font-display font-semibold text-foreground">Recent Listings for Approval</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-secondary/50 text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-3">Property / Item</th>
                  <th className="px-6 py-3">Owner / Seller</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y border-border">
                {pendingListings.map((item, i) => (
                  <tr key={i} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{item.name}</span>
                        {item.location && (
                          <a 
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.location)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                          >
                            <MapPin className="w-2.5 h-2.5" />
                            {item.location}
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{item.user}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        item.type === "Kos" ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-600"
                      )}>
                        {item.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{formatDate(item.date)}</td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-primary hover:text-primary hover:bg-primary/10"
                        onClick={() => handleApprove(item.id, item.type)}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleReject(item.id, item.type)}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </td>
                  </tr>
                ))}
                {pendingListings.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                      Tidak ada listing baru yang menunggu persetujuan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="font-display font-semibold text-foreground mb-6">System Health</h3>
          <div className="space-y-6">
            {[
              { label: "Server Load", value: "24%", icon: TrendingUp, color: "text-emerald-500" },
              { label: "Storage Used", value: "68%", icon: TrendingUp, color: "text-amber-500" },
              { label: "User Growth", value: "+12.5%", icon: TrendingUp, color: "text-emerald-500" },
            ].map((stat, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn("w-2 h-2 rounded-full", stat.color.replace('text', 'bg'))} />
                  <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
                </div>
                <span className="text-sm font-bold text-foreground">{stat.value}</span>
              </div>
            ))}
          </div>
          <hr className="my-6 border-border" />
          <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/20 transition-all">
            <Link to="/admin/system-settings">
              System Settings
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
