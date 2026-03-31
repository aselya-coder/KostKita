import { Building2, Users, MessageCircle, BarChart3, Trash2, Edit2, Eye } from "lucide-react";
import { StatsCard } from "@/components/StatsCard";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContextType";
import { useState, useEffect } from "react";
import { getOwnerDashboardStats } from "@/services/dashboard";
import { getKosListings, deleteKosListing } from "@/services/kos";
import { getInquiries } from "@/services/inquiries";
import { type KosListing, type Inquiry, formatPrice } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function OwnerOverview() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ propertiesCount: 0, inquiriesCount: 0 });
  const [myKos, setMyKos] = useState<KosListing[]>([]);
  const [ownerInquiries, setOwnerInquiries] = useState<Inquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    if (!user) return;
    try {
      const [statsData, kosData, inquiriesData] = await Promise.all([
        getOwnerDashboardStats(user.id),
        getKosListings(user.id),
        getInquiries(user.id)
      ]);
      setStats({
        propertiesCount: kosData.length,
        inquiriesCount: inquiriesData.length
      });
      setMyKos(kosData);
      setOwnerInquiries(inquiriesData.slice(0, 5));
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteKos = async (id: string) => {
    if (confirm("Hapus properti ini secara permanen?")) {
      const { success } = await deleteKosListing(id);
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

      // REALTIME: Listen for changes in kos_listings and inquiries
      const kosChannel = supabase
        .channel('owner-kos-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'kos_listings', filter: `owner_id=eq.${user.id}` }, () => fetchData())
        .subscribe();

      const inquiryChannel = supabase
        .channel('owner-inquiry-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'inquiries', filter: `owner_id=eq.${user.id}` }, () => fetchData())
        .subscribe();

      return () => {
        supabase.removeChannel(kosChannel);
        supabase.removeChannel(inquiryChannel);
      };
    }
  }, [user]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Welcome back, {user?.name}!</h1>
        <p className="text-muted-foreground">Manage your properties and marketplace activity.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard 
          title="Properties" 
          value={isLoading ? '...' : stats.propertiesCount} 
          icon={Building2} 
          description="Boarding houses listed"
          to="/owner-dashboard/my-kos"
        />
        <StatsCard 
          title="Total Inquiries" 
          value={isLoading ? '...' : stats.inquiriesCount} 
          icon={MessageCircle} 
          trend={{ value: 0, isUp: true }}
          to="/owner-dashboard/inquiries"
        />
        <StatsCard 
          title="Occupancy Rate" 
          value={isLoading ? '...' : (myKos.length > 0 ? "85%" : "0%")} 
          icon={Users} 
          trend={{ value: 0, isUp: true }}
          to="/owner-dashboard/my-kos"
        />
        <StatsCard 
          title="Revenue (Est.)" 
          value={isLoading ? '...' : (myKos.length > 0 ? "Rp 12.5M" : "Rp 0")} 
          icon={BarChart3} 
          description="Monthly estimated"
          to="/owner-dashboard/my-kos"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <h3 className="font-display font-semibold text-foreground">My Properties</h3>
            <Link to="/owner-dashboard/my-kos" className="text-sm font-medium text-primary hover:underline">
              Manage All
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
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="font-display font-semibold text-foreground mb-6">Recent Inquiries</h3>
          <div className="space-y-6">
            {ownerInquiries.map((inquiry) => (
              <div key={inquiry.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold text-muted-foreground">
                    {inquiry.senderName ? inquiry.senderName.charAt(0) : "?"}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{inquiry.senderName}</p>
                    <p className="text-xs text-muted-foreground">{inquiry.propertyName}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">{inquiry.time}</p>
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-wider",
                    inquiry.status === "new" ? "text-primary" : "text-muted-foreground"
                  )}>
                    {inquiry.status}
                  </span>
                </div>
              </div>
            ))}
            {ownerInquiries.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">No recent inquiries.</p>
              </div>
            )}
          </div>
          <Link to="/owner-dashboard/inquiries">
            <Button variant="outline" className="w-full mt-6">View All Inquiries</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
