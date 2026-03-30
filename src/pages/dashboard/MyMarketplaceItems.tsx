import { useState, useEffect } from "react";
import { Plus, Tag, MapPin, Edit2, Trash2, Eye, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/data/mockData";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { BackButton } from "@/components/BackButton";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function MyMarketplaceItems() {
  const { user } = useAuth();
  const [myItems, setMyItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const fetchMyItems = async () => {
    if (!user) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from('marketplace_items')
      .select('*')
      .eq('seller_id', user.id);
    
    if (error) {
      console.error('Error fetching items:', error);
    } else {
      setMyItems(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchMyItems();

    // REALTIME: Listen for changes in marketplace_items
    const channel = supabase
      .channel('my-items-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'marketplace_items', 
        filter: `seller_id=eq.${user?.id}` 
      }, () => fetchMyItems())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleDelete = async (id: string) => {
    if (confirm("Hapus barang ini secara permanen?")) {
      const { error } = await supabase
        .from('marketplace_items')
        .delete()
        .eq('id', id);
      
      if (error) {
        toast.error("Failed to delete item");
      } else {
        setMyItems(prev => prev.filter(item => item.id !== id));
        toast.success("Item deleted");
      }
    }
  };

  const basePath = user?.role === "owner" ? "/owner-dashboard" : "/dashboard";

  return (
    <div className="space-y-8">
      <BackButton to={basePath} className="mb-0" />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">My Marketplace Items</h1>
          <p className="text-muted-foreground">Manage your items for sale in the marketplace.</p>
        </div>
        <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Link to={user?.role === "owner" ? "/owner-dashboard/sell-item" : "/dashboard/sell-item"}>
            <Plus className="w-4 h-4 mr-2" />
            Sell New Item
          </Link>
        </Button>
      </div>

      {myItems.length > 0 ? (
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-secondary/50 text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Item</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4">Condition</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y border-border text-foreground">
                {myItems.map((item) => (
                  <tr key={item.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={item.image} 
                          alt={item.title} 
                          className="w-12 h-12 rounded-lg object-cover bg-muted" 
                        />
                        <div className="min-w-0">
                          <p className="font-semibold truncate max-w-[200px]">{item.title}</p>
                          <a 
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.location)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-muted-foreground truncate max-w-[200px] block hover:text-primary transition-colors"
                          >
                            {item.location}
                          </a>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="capitalize">{item.category}</span>
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {formatPrice(item.price)}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {item.condition}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        item.status === "active" ? "bg-emerald-50 text-emerald-600" : 
                        item.status === "sold" ? "bg-blue-50 text-blue-600" : 
                        "bg-red-50 text-red-600"
                      )}>
                        {item.status || "Active"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" asChild>
                          <Link to={`/item/${item.id}`}>
                            <Eye className="w-4 h-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(item.id)}
                          title="Hapus Barang"
                        >
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
            <ShoppingBag className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-display font-bold mb-2">No items found</h3>
          <p className="text-muted-foreground max-w-sm mx-auto mb-8">
            You haven't listed any items for sale yet. Turn your unused stuff into cash!
          </p>
          <Button asChild>
            <Link to={user?.role === "owner" ? "/owner-dashboard/sell-item" : "/dashboard/sell-item"}>
              <Plus className="w-4 h-4 mr-2" />
              Sell Your First Item
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
