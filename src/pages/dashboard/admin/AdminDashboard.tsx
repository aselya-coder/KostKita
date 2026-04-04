import { Users, Building2, ShoppingBag, ShieldAlert, Settings, Coins, CreditCard, TrendingUp } from "lucide-react";
import { StatsCard } from "@/components/StatsCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { getAdminDashboardStats } from "@/services/dashboard";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalKos: 0,
    totalItems: 0,
    totalRevenue: 5450000,
    topUpRevenue: 4200000,
    adminFeeRevenue: 1250000,
    coinsSold: 1250,
    coinsUsed: 840
  });
  const [isLoading, setIsLoading] = useState(true);

  // Dummy chart data
  const revenueData = [
    { name: 'Mon', total: 400000, topup: 320000, fee: 80000 },
    { name: 'Tue', total: 300000, topup: 240000, fee: 60000 },
    { name: 'Wed', total: 500000, topup: 410000, fee: 90000 },
    { name: 'Thu', total: 450000, topup: 380000, fee: 70000 },
    { name: 'Fri', total: 600000, topup: 500000, fee: 100000 },
    { name: 'Sat', total: 800000, topup: 680000, fee: 120000 },
    { name: 'Sun', total: 700000, topup: 600000, fee: 100000 },
  ];

  const usageData = [
    { name: 'Mon', coins: 120 },
    { name: 'Tue', coins: 98 },
    { name: 'Wed', coins: 150 },
    { name: 'Thu', coins: 110 },
    { name: 'Fri', coins: 180 },
    { name: 'Sat', coins: 210 },
    { name: 'Sun', coins: 190 },
  ];


  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const data = await getAdminDashboardStats();
        setStats(prev => ({
          ...prev,
          ...data
        }));
      } catch (error) {
        console.error("Failed to fetch admin stats:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-8">
      <div className="bg-card rounded-3xl border border-border p-8 shadow-sm relative overflow-hidden group mb-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl transition-all group-hover:bg-primary/10" />
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center gap-5">
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
              <div className="flex flex-col md:flex-row items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
                  Administrator
                </span>
                <p className="text-sm text-muted-foreground">
                  Overview of the entire KosKita ecosystem.
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
            <Button asChild className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all active:scale-95" size="lg">
              <Link to="/admin/system-settings">
                <Settings className="w-5 h-5 mr-2" />
                System Settings
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                  formatter={(value: number) => [`Rp ${value.toLocaleString('id-ID')}`, '']}
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

    </div>
  );
};

export default AdminDashboard;