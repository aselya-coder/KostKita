import { 
  Users, 
  UserPlus,
  Building2, 
  ShoppingBag, 
  ShieldAlert, 
  TrendingUp, 
  CheckCircle2, 
  XCircle, 
  MapPin, 
  Settings,
  CreditCard,
  Coins,
  ArrowUpRight,
  Flame,
  LayoutDashboard,
  Zap,
  Loader2
} from "lucide-react";
import { StatsCard } from "@/components/StatsCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { getAdminDashboardStats } from "@/services/dashboard";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatPrice } from "@/data/mockData";

export default function AdminOverview() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>({ 
    totalUsers: 0, 
    totalKos: 0, 
    totalItems: 0,
    totalRevenue: 0,
    topUpRevenue: 0,
    adminFeeRevenue: 0,
    coinsSold: 0,
    coinsUsed: 0,
    totalActiveAds: 0
  });
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunningMaintenance, setIsRunningMaintenance] = useState(false);
  
  const handleRunMaintenance = async () => {
    setIsRunningMaintenance(true);
    try {
      // Manual trigger to handle expired listings using RPC if available, 
      // or manual update as fallback
      const { data, error } = await supabase.rpc('handle_expired_listings');
      
      if (error) {
        // Fallback: manual update if RPC doesn't exist yet
        const now = new Date().toISOString();
        const [kosRes, itemRes] = await Promise.all([
          supabase.from('kos_listings').update({ status: 'expired' }).lt('expires_at', now).neq('status', 'expired'),
          supabase.from('marketplace_items').update({ status: 'expired' }).lt('expires_at', now).neq('status', 'expired')
        ]);
        
        if (kosRes.error || itemRes.error) throw new Error("Gagal menjalankan pemeliharaan manual.");
      }
      
      toast.success("Pemeliharaan sistem selesai. Iklan kedaluwarsa telah dinonaktifkan.");
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsRunningMaintenance(false);
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const statsData = await getAdminDashboardStats();
      setStats(statsData);

      // Fetch recent activities
      const { data: activityData, error: activityError } = await supabase
        .from('activities')
        .select(`
          *,
          profiles:user_id (name, avatar)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (activityError) throw activityError;
      setActivities(activityData || []);
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Realtime for activities
    const activityChannel = supabase.channel('admin-activities')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activities' }, () => fetchData())
      .subscribe();

    return () => {
      if (activityChannel) {
        supabase.removeChannel(activityChannel);
      }
    };
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="space-y-8">
      <div className="bg-card rounded-3xl border border-border p-8 shadow-sm relative overflow-hidden group">
        {/* Background Decorative Element */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl transition-all group-hover:bg-primary/10" />
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <Avatar className="w-20 h-20 border-4 border-background shadow-xl">
                <AvatarImage src={user?.avatar} alt={user?.name} className="object-cover" />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                  {user?.name?.charAt(0).toUpperCase() || "A"}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-4 border-background rounded-full shadow-sm" title="Online" />
            </div>
            
            <div className="space-y-1">
              <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
                Admin Panel: {user?.name}!
              </h1>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                  Administrator
                </span>
                <p className="text-sm text-muted-foreground">
                  Overview of the entire KosKita ecosystem.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button 
              onClick={handleRunMaintenance} 
              disabled={isRunningMaintenance}
              variant="outline" 
              className="rounded-xl border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary shadow-sm" 
              size="lg"
            >
              {isRunningMaintenance ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Zap className="w-5 h-5 mr-2" />
              )}
              Maintenance
            </Button>
            <Button asChild className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all active:scale-95" size="lg">
              <Link to="/admin/system-settings">
                <Settings className="w-5 h-5 mr-2" />
                System Settings
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard 
          title="Total Revenue" 
          value={isLoading ? '...' : formatPrice(stats.totalRevenue)} 
          icon={TrendingUp} 
          trend={{ value: 12.5, isUp: true }}
          description="Total income from all sources"
        />
        <StatsCard 
          title="Revenue (Top Up)" 
          value={isLoading ? '...' : formatPrice(stats.topUpRevenue)} 
          icon={CreditCard} 
          trend={{ value: 8.2, isUp: true }}
          description="Revenue from coin purchases"
        />
        <StatsCard 
          title="Revenue (Admin Fee)" 
          value={isLoading ? '...' : formatPrice(stats.adminFeeRevenue)} 
          icon={Settings} 
          trend={{ value: 4.5, isUp: true }}
          description="Revenue from admin fees"
        />
        <StatsCard 
          title="Koin Terjual" 
          value={isLoading ? '...' : stats.coinsSold} 
          icon={Coins} 
          trend={{ value: 15.2, isUp: true }}
          description="Total coins purchased by users"
        />
        <StatsCard 
          title="Koin Digunakan" 
          value={isLoading ? '...' : stats.coinsUsed} 
          icon={ShoppingBag} 
          trend={{ value: 9.8, isUp: true }}
          description="Total coins used for ads"
        />
        <StatsCard 
          title="Total Users" 
          value={isLoading ? '...' : stats.totalUsers} 
          icon={Users} 
          trend={{ value: 2.1, isUp: true }}
          to="/admin/users"
        />
        <StatsCard 
          title="User Baru Hari Ini" 
          value={isLoading ? '...' : stats.newUsersToday} 
          icon={UserPlus} 
          description="Pendaftaran hari ini"
          to="/admin/users"
        />
        <StatsCard 
          title="Iklan Kos" 
          value={isLoading ? '...' : stats.totalKos} 
          icon={Building2} 
          trend={{ value: 5.4, isUp: true }}
          to="/admin/kos"
        />
        <StatsCard 
          title="Iklan Barang" 
          value={isLoading ? '...' : stats.totalItems} 
          icon={ShoppingBag} 
          trend={{ value: 3.2, isUp: true }}
          to="/admin/marketplace"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border overflow-hidden">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <h3 className="font-display font-semibold text-foreground">Aktivitas Pengguna Terbaru</h3>
            <Button asChild variant="ghost" size="sm" className="text-primary text-xs font-bold uppercase">
              <Link to="/admin/activity-log">
                Lihat Semua
              </Link>
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-secondary/50 text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-3">Pengguna</th>
                  <th className="px-6 py-3">Aktivitas</th>
                  <th className="px-6 py-3">Target</th>
                  <th className="px-6 py-3">Waktu</th>
                </tr>
              </thead>
              <tbody className="divide-y border-border">
                {activities.map((item, i) => (
                  <tr key={i} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={item.profiles?.avatar} />
                          <AvatarFallback>{item.profiles?.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-foreground">{item.profiles?.name || 'User'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground capitalize">{item.activity}</td>
                    <td className="px-6 py-4">
                      <span className="text-foreground font-medium">{item.target_name || '-'}</span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{formatDate(item.created_at)}</td>
                  </tr>
                ))}
                {activities.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                      Belum ada aktivitas terbaru.
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
