import { ShoppingBag, Heart, MessageCircle, Clock, Plus } from "lucide-react";
import { StatsCard } from "@/components/StatsCard";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { getStudentDashboardStats } from "@/services/dashboard";
import { getMarketplaceItems } from "@/services/marketplace";
import { type MarketplaceItem, formatPrice } from "@/data/mockData";
import { Button } from "@/components/ui/button";

export default function StudentOverview() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ myListingsCount: 0, favoritesCount: 0 });
  const [myItems, setMyItems] = useState<MarketplaceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        setIsLoading(true);
        const [statsData, itemsData] = await Promise.all([
          getStudentDashboardStats(user.id),
          getMarketplaceItems(), // This fetches all, we filter locally
        ]);
        setStats(statsData);
        setMyItems(itemsData.filter(item => item.sellerId === user.id));
        setIsLoading(false);
      };
      fetchData();
    }
  }, [user]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Welcome back, {user?.name}!</h1>
          <p className="text-muted-foreground">Here's what's happening with your account today.</p>
        </div>
        <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">
          <Link to="/dashboard/sell-item">
            <Plus className="w-4 h-4 mr-2" />
            Jual Barang Baru
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard 
          title="My Listings" 
          value={isLoading ? '...' : stats.myListingsCount} 
          icon={ShoppingBag} 
          description="Active items for sale"
          to="/dashboard/my-items"
        />
        <StatsCard 
          title="Favorites" 
          value={isLoading ? '...' : stats.favoritesCount} 
          icon={Heart} 
          description="Saved boarding houses"
          to="/dashboard/favorites"
        />
        <StatsCard 
          title="Messages" 
          value="0" 
          icon={MessageCircle} 
          trend={{ value: 0, isUp: true }}
          to="/dashboard/notifications"
        />
        <StatsCard 
          title="Active Search" 
          value="0" 
          icon={Clock} 
          description="Boarding house alerts"
          to="/search"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <h3 className="font-display font-semibold text-foreground">My Recent Listings</h3>
            <Link to="/dashboard/my-items" className="text-sm font-medium text-primary hover:underline">
              View All
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
                <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-wider">
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

        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="font-display font-semibold text-foreground mb-6">Recent Activity</h3>
          <div className="space-y-6">
            {[
              { type: "favorite", text: "You saved 'Kos Harmoni Residence' to favorites", time: "2 hours ago" },
              { type: "message", text: "New message from Haji Sulam regarding your inquiry", time: "5 hours ago" },
              { type: "sale", text: "Your listing 'Textbook Kalkulus' received 3 views", time: "Yesterday" },
            ].map((activity, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                <div>
                  <p className="text-sm text-foreground leading-snug">{activity.text}</p>
                  <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
