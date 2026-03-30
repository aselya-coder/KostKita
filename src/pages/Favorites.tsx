import { Heart } from "lucide-react";
import { motion } from "framer-motion";
import { BackButton } from "@/components/BackButton";
import { useFavorites } from "@/hooks/useFavorites";
import { KosCard } from "@/components/KosCard";
import { MarketplaceCard } from "@/components/MarketplaceCard";
import { useState, useEffect } from "react";
import { getKosListings } from "@/services/kos";
import { getMarketplaceItems } from "@/services/marketplace";
import { type KosListing, type MarketplaceItem } from "@/data/mockData";

const Favorites = () => {
  const { favorites: favoriteIds, isLoading: isLoadingFavorites } = useFavorites('kos'); // Default to kos, but it fetches all
  const [activeTab, setActiveTab] = useState<"kos" | "items">("kos");
  const [kosListings, setKosListings] = useState<KosListing[]>([]);
  const [marketplaceItems, setMarketplaceItems] = useState<MarketplaceItem[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingData(true);
      const [kosData, itemsData] = await Promise.all([
        getKosListings(),
        getMarketplaceItems(),
      ]);
      setKosListings(kosData);
      setMarketplaceItems(itemsData);
      setIsLoadingData(false);
    };
    fetchData();
  }, []);
  
  const favoriteKos = kosListings.filter(kos => favoriteIds.includes(kos.id));
  const favoriteItems = marketplaceItems.filter(item => favoriteIds.includes(item.id));

  const isLoading = isLoadingFavorites || isLoadingData;

  return (
    <div className="container py-8">
      <BackButton />
      
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-foreground">Favorit Anda</h1>
        <p className="text-muted-foreground mt-2">Daftar kos dan barang yang telah Anda simpan.</p>
      </div>

      <div className="flex gap-2 mb-8 border-b border-border">
        <button
          onClick={() => setActiveTab("kos")}
          className={`pb-4 px-4 text-sm font-medium transition-colors relative ${
            activeTab === "kos" ? "text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Kos ({isLoading ? "..." : favoriteKos.length})
          {activeTab === "kos" && (
            <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("items")}
          className={`pb-4 px-4 text-sm font-medium transition-colors relative ${
            activeTab === "items" ? "text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Barang ({isLoading ? "..." : favoriteItems.length})
          {activeTab === "items" && (
            <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-20">Memuat favorit...</div>
      ) : activeTab === "kos" ? (
        favoriteKos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {favoriteKos.map((kos) => (
              <KosCard key={kos.id} kos={kos} />
            ))}
          </div>
        ) : (
          <EmptyState message="Belum ada kos yang Anda simpan." />
        )
      ) : (
        favoriteItems.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {favoriteItems.map((item) => (
              <MarketplaceCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <EmptyState message="Belum ada barang yang Anda simpan." />
        )
      )}
    </div>
  );
};

const EmptyState = ({ message }: { message: string }) => (
  <div className="text-center py-20">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto"
    >
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
        <Heart className="w-8 h-8 text-primary" />
      </div>
      <h2 className="text-2xl font-display font-bold mb-4">Belum Ada Favorit</h2>
      <p className="text-muted-foreground mb-8">{message}</p>
      <div className="flex flex-wrap justify-center gap-4">
        <a
          href="/search"
          className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
        >
          Cari Kos
        </a>
        <a
          href="/marketplace"
          className="inline-flex items-center justify-center px-6 py-3 rounded-lg ring-1 ring-primary text-primary font-medium hover:bg-primary/5 transition-colors"
        >
          Buka Marketplace
        </a>
      </div>
    </motion.div>
  </div>
);

export default Favorites;
