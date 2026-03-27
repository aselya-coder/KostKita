import { Building2, Users, MessageCircle, BarChart3 } from "lucide-react";
import { StatsCard } from "@/components/StatsCard";
import { mockKosListings, mockInquiries, formatPrice } from "@/data/mockData";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function OwnerOverview() {
  const { user } = useAuth();
  
  const ownerInquiries = mockInquiries.filter(iq => iq.ownerId === user?.id).slice(0, 3);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Welcome back, {user?.name}!</h1>
        <p className="text-muted-foreground">Manage your properties and marketplace activity.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard 
          title="Properties" 
          value="3" 
          icon={Building2} 
          description="Boarding houses listed"
          to="/owner-dashboard/my-kos"
        />
        <StatsCard 
          title="Total Inquiries" 
          value={mockInquiries.filter(iq => iq.ownerId === user?.id).length} 
          icon={MessageCircle} 
          trend={{ value: 12, isUp: true }}
          to="/owner-dashboard/inquiries"
        />
        <StatsCard 
          title="Occupancy Rate" 
          value="85%" 
          icon={Users} 
          trend={{ value: 5, isUp: true }}
          to="/owner-dashboard/my-kos"
        />
        <StatsCard 
          title="Revenue (Est.)" 
          value="Rp 12.5M" 
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
            {mockKosListings.slice(0, 3).map((kos) => (
              <div key={kos.id} className="p-4 flex items-center gap-4 hover:bg-secondary/50 transition-colors">
                <img src={kos.images[0]} alt={kos.title} className="w-12 h-12 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-foreground truncate">{kos.title}</h4>
                  <p className="text-xs text-muted-foreground">{kos.location}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">{kos.availableRooms} Left</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Rooms</p>
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
                    {inquiry.senderName.charAt(0)}
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

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
