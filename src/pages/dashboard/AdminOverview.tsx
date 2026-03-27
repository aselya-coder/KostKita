import { Users, Building2, ShoppingBag, ShieldAlert, TrendingUp } from "lucide-react";
import { StatsCard } from "@/components/StatsCard";
import { mockUsers, mockKosListings, mockMarketplaceItems, mockReports } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

export default function AdminOverview() {
  const { user } = useAuth();

  const pendingListings = [
    ...mockKosListings.filter(k => k.status === "pending").map(k => ({
      id: k.id,
      name: k.title,
      user: mockUsers.find(u => u.id === k.ownerId)?.name || "Unknown",
      type: "Kos",
      date: "2024-03-12"
    })),
    ...mockMarketplaceItems.filter(i => i.status === "pending").map(i => ({
      id: i.id,
      name: i.title,
      user: i.sellerName,
      type: "Market",
      date: "2024-03-11"
    }))
  ].slice(0, 5);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Admin Overview ({user?.name})</h1>
        <p className="text-muted-foreground">Platform-wide statistics and management.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard 
          title="Total Users" 
          value={mockUsers.length} 
          icon={Users} 
          trend={{ value: 12, isUp: true }}
          to="/admin/users"
        />
        <StatsCard 
          title="Boarding Houses" 
          value={mockKosListings.length} 
          icon={Building2} 
          trend={{ value: 4, isUp: true }}
          to="/admin/kos"
        />
        <StatsCard 
          title="Marketplace Items" 
          value={mockMarketplaceItems.length} 
          icon={ShoppingBag} 
          trend={{ value: 18, isUp: true }}
          to="/admin/marketplace"
        />
        <StatsCard 
          title="Pending Reports" 
          value={mockReports.filter(r => r.status === "new").length} 
          icon={ShieldAlert} 
          trend={{ value: 2, isUp: false }}
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
                    <td className="px-6 py-4 font-medium text-foreground">{item.name}</td>
                    <td className="px-6 py-4 text-muted-foreground">{item.user}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        item.type === "Kos" ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-600"
                      )}>
                        {item.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{item.date}</td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10">Approve</Button>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">Reject</Button>
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

import { Link } from "react-router-dom";
