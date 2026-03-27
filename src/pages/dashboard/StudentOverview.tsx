import { ShoppingBag, Heart, MessageCircle, Clock } from "lucide-react";
import { StatsCard } from "@/components/StatsCard";
import { mockMarketplaceItems, formatPrice } from "@/data/mockData";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function StudentOverview() {
  const { user } = useAuth();
  
  const myItems = mockMarketplaceItems.filter(item => item.sellerPhone === user?.phone);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Welcome back, {user?.name}!</h1>
        <p className="text-muted-foreground">Here's what's happening with your account today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard 
          title="My Listings" 
          value={myItems.length} 
          icon={ShoppingBag} 
          description="Active items for sale"
          to="/dashboard/my-items"
        />
        <StatsCard 
          title="Favorites" 
          value="5" 
          icon={Heart} 
          description="Saved boarding houses"
          to="/dashboard/favorites"
        />
        <StatsCard 
          title="Messages" 
          value="12" 
          icon={MessageCircle} 
          trend={{ value: 8, isUp: true }}
          to="/dashboard/notifications"
        />
        <StatsCard 
          title="Active Search" 
          value="1" 
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
