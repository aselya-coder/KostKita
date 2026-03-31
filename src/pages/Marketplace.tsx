import { useState, useMemo, useEffect } from "react";
import { Search, X } from "lucide-react";
import { MarketplaceCard } from "@/components/MarketplaceCard";
import { getMarketplaceItems } from "@/services/marketplace";
import { type MarketplaceItem } from "@/data/mockData";

const categories = ["Semua", "Buku", "Elektronik", "Furnitur", "Kendaraan"];

const Marketplace = () => {
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
  }, [category]);

  const filteredItems = useMemo(() => {
    if (!query) {
      return items;
    }
    return items.filter((item) => {
      return (
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        (item.location && item.location.toLowerCase().includes(query.toLowerCase()))
      );
    });
  }, [query, items]);

  return (
    <div className="container py-8">
      <h1 className="font-display font-bold text-2xl text-foreground mb-1">Marketplace</h1>
      <p className="text-sm text-muted-foreground mb-6">Jual beli barang bekas antar mahasiswa</p>

      {/* Search */}
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-surface ring-1 ring-foreground/5 mb-4">
        <Search className="w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari barang..."
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-card rounded-2xl p-3 space-y-2 animate-pulse">
              <div className="h-32 bg-secondary rounded-xl"></div>
              <div className="h-4 w-3/4 bg-secondary rounded-md"></div>
              <div className="h-5 w-1/2 bg-secondary rounded-md"></div>
            </div>
          ))}
        </div>
      ) : filteredItems.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredItems.map((item) => (
            <MarketplaceCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-muted-foreground">Tidak ada barang yang cocok.</p>
        </div>
      )}
    </div>
  );
};

export default Marketplace;