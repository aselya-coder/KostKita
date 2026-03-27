import { Plus, Building2, Edit2, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mockKosListings, formatPrice } from "@/data/mockData";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { BackButton } from "@/components/BackButton";

export default function MyBoardingHouses() {
  const { user } = useAuth();
  
  // Filter kos by current owner (using ownerPhone as a proxy since ownerId might be missing in some mock data)
  const myKos = mockKosListings.filter(kos => kos.ownerPhone === user?.phone);

  return (
    <div className="space-y-8">
      <BackButton to="/owner-dashboard" className="mb-0" />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">My Boarding Houses</h1>
          <p className="text-muted-foreground">Manage and monitor your property listings.</p>
        </div>
        <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Link to="/owner-dashboard/add-kos">
            <Plus className="w-4 h-4 mr-2" />
            Add New Kos
          </Link>
        </Button>
      </div>

      {myKos.length > 0 ? (
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-secondary/50 text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Property</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4">Rooms</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y border-border text-foreground">
                {myKos.map((kos) => (
                  <tr key={kos.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={kos.images[0]} 
                          alt={kos.title} 
                          className="w-12 h-12 rounded-lg object-cover bg-muted" 
                        />
                        <div className="min-w-0">
                          <p className="font-semibold truncate max-w-[200px]">{kos.title}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">{kos.location}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="capitalize">{kos.type}</span>
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {formatPrice(kos.price)}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {kos.availableRooms} Available
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        kos.status === "approved" ? "bg-emerald-50 text-emerald-600" : 
                        kos.status === "pending" ? "bg-amber-50 text-amber-600" : 
                        "bg-red-50 text-red-600"
                      )}>
                        {kos.status || "Approved"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" asChild>
                          <Link to={`/kos/${kos.id}`}>
                            <Eye className="w-4 h-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-display font-bold mb-2">No listings found</h3>
          <p className="text-muted-foreground max-w-sm mx-auto mb-8">
            You haven't added any boarding house listings yet. Start promoting your property today!
          </p>
          <Button asChild>
            <Link to="/owner-dashboard/add-kos">
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Kos
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
