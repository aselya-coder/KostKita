import { Users, Building2, ShoppingBag, ShieldAlert, Settings, Coins, CreditCard, TrendingUp, Globe, Zap } from "lucide-react";
import { StatsCard } from "@/components/StatsCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { getAdminDashboardStats, getTopupUsersReport } from "@/services/dashboard";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalKos: 0,
    totalItems: 0,
    totalActiveAds: 0,
    totalRevenue: 0,
    topUpRevenue: 0,
    adminFeeRevenue: 0,
    coinsSold: 0,
    coinsUsed: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [topupUsers, setTopupUsers] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [usageData, setUsageData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const data = await getAdminDashboardStats();
        setStats({
          totalUsers: data.totalUsers,
          totalKos: data.totalKos,
          totalItems: data.totalItems,
          totalActiveAds: data.totalActiveAds,
          totalRevenue: data.totalRevenue,
          topUpRevenue: data.topUpRevenue,
          adminFeeRevenue: data.adminFeeRevenue,
          coinsSold: data.coinsSold,
          coinsUsed: data.coinsUsed,
        });
        setRevenueData(data.revenueData);
        setUsageData(data.usageData);

        // Fetch topup users from Supabase
        const topupData = await getTopupUsersReport();
        setTopupUsers(topupData.slice(0, 5));
      } catch (error) {
        console.error("Failed to fetch admin stats:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user]);

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="bg-card rounded-2xl md:rounded-3xl border border-border p-4 md:p-8 shadow-sm relative overflow-hidden group mb-6 md:mb-8">
        <div className="absolute top-0 right-0 w-48 h-48 md:w-64 md:h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl transition-all group-hover:bg-primary/10" />
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-5">
            <div className="relative">
              <Avatar className="w-16 h-16 md:w-20 md:h-20 border-4 border-background shadow-xl">
                <AvatarImage src={user?.avatar} alt={user?.name} className="object-cover" />
                <AvatarFallback className="bg-primary/10 text-primary text-xl md:text-2xl font-bold">
                  {user?.name?.charAt(0).toUpperCase() || "A"}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 md:w-6 md:h-6 bg-emerald-500 border-4 border-background rounded-full shadow-sm" title="Online" />
            </div>
            
            <div className="space-y-1">
              <h1 className="text-xl md:text-3xl font-display font-bold text-foreground">
                Admin Panel: {user?.name}!
              </h1>
              <div className="flex flex-col md:flex-row items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[9px] md:text-[10px] font-bold uppercase tracking-wider">
                  Administrator
                </span>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Overview of the entire KosKita ecosystem.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 md:gap-3">
            <Button asChild variant="outline" className="rounded-xl border-border shadow-sm flex-1 md:flex-none" size="sm">
              <Link to="/">
                <Globe className="w-4 h-4 mr-2" />
                View Website
              </Link>
            </Button>
            <Button asChild variant="outline" className="rounded-xl border-border shadow-sm flex-1 md:flex-none" size="sm">
              <Link to="/dashboard/profile">
                Edit Profile
              </Link>
            </Button>
            <Button asChild className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all active:scale-95 flex-1 md:flex-none" size="sm">
              <Link to="/admin/system-settings">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatsCard 
          title="Total Revenue" 
          value={`Rp ${(stats.totalRevenue ?? 0).toLocaleString('id-ID')}`} 
          icon={TrendingUp} 
          trend={{ value: 12.5, isUp: true }}
          description="Total income from all sources"
        />
        <StatsCard 
          title="Revenue (Top Up)" 
          value={`Rp ${(stats.topUpRevenue ?? 0).toLocaleString('id-ID')}`} 
          icon={CreditCard} 
          trend={{ value: 8.2, isUp: true }}
          description="Revenue from coin purchases"
        />
        <StatsCard 
          title="Revenue (Admin Fee)" 
          value={`Rp ${(stats.adminFeeRevenue ?? 0).toLocaleString('id-ID')}`} 
          icon={Settings} 
          trend={{ value: 4.5, isUp: true }}
          description="Revenue from admin fees"
        />
        <StatsCard 
          title="Koin Terjual" 
          value={stats.coinsSold ?? 0} 
          icon={Coins} 
          trend={{ value: 15.2, isUp: true }}
          description="Total coins purchased by users"
        />
        <StatsCard 
          title="Koin Digunakan" 
          value={stats.coinsUsed ?? 0} 
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
          title="Boarding Houses" 
          value={isLoading ? '...' : stats.totalKos} 
          icon={Building2} 
          trend={{ value: 5.4, isUp: true }}
          to="/admin/kos"
        />
        <StatsCard 
          title="Iklan Premium" 
          value={isLoading ? '...' : stats.totalActiveAds} 
          icon={Zap} 
          trend={{ value: 12.0, isUp: true }}
          to="/admin/advertisements"
        />
        <StatsCard 
          title="Iklan Aktif" 
          value={isLoading ? '...' : stats.totalItems} 
          icon={ShoppingBag} 
          trend={{ value: 3.2, isUp: true }}
          to="/admin/marketplace"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-display font-bold text-foreground">Revenue per Day</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Top Up</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Fees</span>
              </div>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorTopup" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number, name: string) => [`Rp ${value.toLocaleString('id-ID')}`, name === 'topup' ? 'Top Up' : 'Fees']}
                />
                <Area type="monotone" dataKey="topup" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#colorTopup)" />
                <Area type="monotone" dataKey="fee" stroke="#10b981" strokeWidth={2} fillOpacity={0} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-display font-bold text-foreground">Penggunaan Koin</h3>
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">7 Days Overview</span>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={usageData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="coins" fill="#2563eb" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        <div className="bg-card rounded-2xl border border-border p-4 md:p-6 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between mb-4 md:mb-6 px-1 md:px-2">
            <h3 className="text-base md:text-lg font-display font-bold text-foreground">Top Up Koin Terbaru</h3>
            <Button asChild variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10 text-xs h-8">
              <Link to="/admin/topup-users">Lihat Semua</Link>
            </Button>
          </div>
          <div className="overflow-x-auto -mx-4 md:mx-0">
            <div className="inline-block min-w-full align-middle">
              <table className="w-full text-xs md:text-sm text-left">
                <thead className="bg-secondary/50 text-muted-foreground uppercase text-[9px] md:text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="px-3 md:px-4 py-3">User ID</th>
                    <th className="px-3 md:px-4 py-3">Total Koin</th>
                    <th className="px-3 md:px-4 py-3 text-right">Total Rupiah</th>
                  </tr>
                </thead>
                <tbody className="divide-y border-border">
                  {topupUsers.map((r, i) => (
                    <tr key={r.userId} className="hover:bg-secondary/20 transition-colors group">
                      <td className="px-3 md:px-4 py-3 md:py-4 font-medium text-foreground truncate max-w-[100px] md:max-w-[120px]">{r.userId}</td>
                      <td className="px-3 md:px-4 py-3 md:py-4">{r.totalCoins} Koin</td>
                      <td className="px-3 md:px-4 py-3 md:py-4 text-right font-bold text-primary whitespace-nowrap">
                        {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(r.totalAmount)}
                      </td>
                    </tr>
                  ))}
                  {topupUsers.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground italic">Belum ada data top up.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-4 md:p-6 shadow-sm">
          <h3 className="text-base md:text-lg font-display font-bold text-foreground mb-4 md:mb-6">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <Link to="/admin/users" className="p-3 md:p-4 rounded-xl bg-primary/5 border border-primary/10 hover:border-primary/30 transition-all group">
              <Users className="w-5 h-5 md:w-6 md:h-6 text-primary mb-2" />
              <p className="font-bold text-xs md:text-sm">Users</p>
              <p className="text-[9px] md:text-[10px] text-muted-foreground uppercase tracking-wider">Manage Accounts</p>
            </Link>
            <Link to="/admin/kos" className="p-3 md:p-4 rounded-xl bg-emerald-50 border border-emerald-100 hover:border-emerald-300 transition-all group">
              <Building2 className="w-5 h-5 md:w-6 md:h-6 text-emerald-600 mb-2" />
              <p className="font-bold text-xs md:text-sm">Kos</p>
              <p className="text-[9px] md:text-[10px] text-muted-foreground uppercase tracking-wider">Verify Listings</p>
            </Link>
            <Link to="/admin/marketplace" className="p-3 md:p-4 rounded-xl bg-blue-50 border border-blue-100 hover:border-blue-300 transition-all group">
              <ShoppingBag className="w-5 h-5 md:w-6 md:h-6 text-blue-600 mb-2" />
              <p className="font-bold text-xs md:text-sm">Market</p>
              <p className="text-[9px] md:text-[10px] text-muted-foreground uppercase tracking-wider">Moderation</p>
            </Link>
            <Link to="/admin/advertisements" className="p-3 md:p-4 rounded-xl bg-orange-50 border border-orange-100 hover:border-orange-300 transition-all group">
              <Zap className="w-5 h-5 md:w-6 md:h-6 text-orange-600 mb-2" />
              <p className="font-bold text-xs md:text-sm">Iklan</p>
              <p className="text-[9px] md:text-[10px] text-muted-foreground uppercase tracking-wider">Manage Ads</p>
            </Link>
            <Link to="/admin/coin-packages" className="p-3 md:p-4 rounded-xl bg-amber-50 border border-amber-100 hover:border-amber-300 transition-all group">
              <Coins className="w-5 h-5 md:w-6 md:h-6 text-amber-600 mb-2" />
              <p className="font-bold text-xs md:text-sm">Coins</p>
              <p className="text-[9px] md:text-[10px] text-muted-foreground uppercase tracking-wider">Price Settings</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;