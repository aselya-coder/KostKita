import { Users, Building2, ShoppingBag, ShieldAlert, Settings } from "lucide-react";
import { StatsCard } from "@/components/StatsCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { getAdminDashboardStats } from "@/services/dashboard";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalKos: 0,
    totalItems: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const data = await getAdminDashboardStats();
        setStats(data);
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
      <div className="bg-card rounded-2xl border border-border p-8 shadow-sm relative overflow-hidden group">
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
                Welcome, {user?.name}!
              </h1>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                  Administrator
                </span>
                <p className="text-sm text-muted-foreground">
                  Here's an overview of the KosKita ecosystem.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button asChild className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all active:scale-95" size="lg">
              <Link to="/admin-dashboard/system-settings">
                <Settings className="w-5 h-5 mr-2" />
                System Settings
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title="Total Users" 
          value={isLoading ? '...' : stats.totalUsers} 
          icon={Users} 
          trend={{ value: 0, isUp: true }}
          to="/admin-dashboard/users"
        />
        <StatsCard 
          title="Boarding Houses" 
          value={isLoading ? '...' : stats.totalKos} 
          icon={Building2} 
          trend={{ value: 0, isUp: true }}
          to="/admin-dashboard/kos"
        />
        <StatsCard 
          title="Marketplace Items" 
          value={isLoading ? '...' : stats.totalItems} 
          icon={ShoppingBag} 
          trend={{ value: 0, isUp: true }}
          to="/admin-dashboard/marketplace"
        />
        <StatsCard 
          title="Pending Reports" 
          value="0" // Replace with real data
          icon={ShieldAlert} 
          trend={{ value: 0, isUp: false }}
          to="/admin-dashboard/reports"
        />
      </div>
    </div>
  );
};

export default AdminDashboard;