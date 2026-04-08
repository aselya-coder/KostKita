import { useState, useMemo, useEffect } from "react";
import { Search, X, Plus, ShoppingBag } from "lucide-react";
import { MarketplaceCard } from "@/components/MarketplaceCard";
import { getMarketplaceItems } from "@/services/marketplace";
import { type MarketplaceItem } from "@/data/mockData";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

const categories = ["Semua", "Buku", "Elektronik", "Furnitur", "Kendaraan"];

const Marketplace = () => {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Semua");
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      setIsLoading(true);
      const data = await getMarketplaceItems(category);
      setItems(data);
      setIsLoading(false);
    };

    fetchItems();

    // REALTIME: Listen for changes
    const channel = supabase
      .channel("marketplace-items-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "marketplace_items" },
        () => fetchItems()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [category]);

  const filteredItems = useMemo(() => {
    if (!query) {
      return items;
    }
    return items.filter((item) => {
      return (
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        (item.location && item.location.toLowerCase().includes(query.toLowerCase())) ||
        (item.description && item.description.toLowerCase().includes(query.toLowerCase()))
      );
    });
  }, [query, items]);

  const canSell = user?.role === "student" || user?.role === "owner";
  const sellPath = user?.role === "owner" ? "/owner-dashboard/sell-item" : "/dashboard/sell-item";

  return (
    <div className="container py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-foreground mb-1">Marketplace</h1>
          <p className="text-sm text-muted-foreground">Jual beli barang bekas antar mahasiswa</p>
        </div>
        
        {canSell && (
          <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">
            <Link to={sellPath}>
              <Plus className="w-4 h-4 mr-2" />
              Jual Barang
            </Link>
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-surface ring-1 ring-foreground/5 mb-4">
        <Search className="w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari barang, lokasi, atau dekat kampus (ex: dekat UGM)..."
          className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        {query && (
          <button onClick={() => setQuery("")} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Categories */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              c === category
                ? "bg-primary text-primary-foreground"
                : "bg-surface ring-1 ring-foreground/10 text-foreground hover:bg-secondary"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        {isLoading ? "Mencari barang..." : `${filteredItems.length} barang ditemukan`}
      </p>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-card rounded-2xl p-4 space-y-4 animate-pulse border border-border">
              <div className="aspect-square w-full bg-secondary rounded-xl"></div>
              <div className="space-y-2">
                <div className="h-4 w-3/4 bg-secondary rounded-md"></div>
                <div className="h-6 w-1/2 bg-secondary rounded-md"></div>
                <div className="h-3 w-1/3 bg-secondary rounded-md"></div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredItems.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {filteredItems.map((item) => (
            <MarketplaceCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-card rounded-3xl border border-dashed border-border">
          <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-8 h-8 text-muted-foreground/40" />
          </div>
          <h3 className="text-lg font-display font-bold text-foreground">Barang Tidak Ditemukan</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
            Coba gunakan kata kunci lain atau ganti kategori pencarian Anda.
          </p>
          <Button 
            variant="outline" 
            onClick={() => { setQuery(""); setCategory("Semua"); }}
            className="mt-6 rounded-xl border-primary/20 text-primary hover:bg-primary/5"
          >
            Reset Pencarian
          </Button>
        </div>
      )}
    </div>
  );
};

export default Marketplace;