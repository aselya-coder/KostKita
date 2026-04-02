import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { KosCard } from "@/components/KosCard";
import { getKosListings } from "@/services/kos";
import { type KosListing } from "@/data/mockData";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";

const priceRanges = [
  { label: "Semua", min: 0, max: Infinity },
  { label: "< 1 Juta", min: 0, max: 1000000 },
  { label: "1-1.5 Juta", min: 1000000, max: 1500000 },
  { label: "1.5-2 Juta", min: 1500000, max: 2000000 },
  { label: "> 2 Juta", min: 2000000, max: Infinity },
];

const amenitiesList = ["WiFi", "AC", "Kamar Mandi Dalam", "Parkir", "Laundry"];

const SearchKos = () => {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [priceIdx, setPriceIdx] = useState(0);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [kosListings, setKosListings] = useState<KosListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchKos = async () => {
      setIsLoading(true);
      const data = await getKosListings();
      setKosListings(data);
      setIsLoading(false);
    };

    fetchKos();

    // REALTIME: Listen for changes in kos_listings
    const channel = supabase
      .channel('kos-listings-changes')
      .on(
        'postgres_changes', 
        { event: '*', schema: 'public', table: 'kos_listings', filter: 'status=eq.approved' }, 
        () => fetchKos()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const toggleAmenity = (a: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
    );
  };

  const filtered = useMemo(() => {
    return kosListings.filter((kos) => {
      const matchesQuery =
        !query ||
        kos.title.toLowerCase().includes(query.toLowerCase()) ||
        kos.location.toLowerCase().includes(query.toLowerCase()) ||
        kos.description.toLowerCase().includes(query.toLowerCase());
      const range = priceRanges[priceIdx];
      const matchesPrice = kos.price >= range.min && kos.price < range.max;
      const matchesAmenities =
        selectedAmenities.length === 0 ||
        selectedAmenities.every((a) => kos.amenities.includes(a));
      return matchesQuery && matchesPrice && matchesAmenities;
    });
  }, [query, priceIdx, selectedAmenities, kosListings]);

  return (
    <div className="container py-8">
      {/* Search bar */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 flex items-center gap-2 px-4 py-3 rounded-xl bg-surface ring-1 ring-foreground/5">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari nama kos, lokasi, atau dekat kampus (ex: dekat UI)..."
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
            showFilters ? "bg-primary text-primary-foreground" : "bg-surface text-foreground ring-1 ring-foreground/5 hover:bg-secondary"
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filter
        </button>
      </div>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="overflow-hidden mb-6"
          >
            <div className="p-6 rounded-2xl bg-surface ring-1 ring-foreground/5 space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">Harga per bulan</h4>
                <div className="flex flex-wrap gap-2">
                  {priceRanges.map((r, i) => (
                    <button
                      key={r.label}
                      onClick={() => setPriceIdx(i)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        i === priceIdx
                          ? "bg-primary text-primary-foreground"
                          : "bg-background ring-1 ring-foreground/10 text-foreground hover:bg-secondary"
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">Fasilitas</h4>
                <div className="flex flex-wrap gap-2">
                  {amenitiesList.map((a) => (
                    <button
                      key={a}
                      onClick={() => toggleAmenity(a)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        selectedAmenities.includes(a)
                          ? "bg-primary text-primary-foreground"
                          : "bg-background ring-1 ring-foreground/10 text-foreground hover:bg-secondary"
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <p className="text-sm text-muted-foreground mb-4">
        {isLoading ? "Mencari kos..." : `${filtered.length} kos ditemukan`}
        {query && !isLoading ? ` untuk "${query}"` : ""}
      </p>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-card rounded-2xl p-4 space-y-3 animate-pulse">
              <div className="h-48 bg-secondary rounded-xl"></div>
              <div className="h-5 w-3/4 bg-secondary rounded-md"></div>
              <div className="h-4 w-1/2 bg-secondary rounded-md"></div>
              <div className="h-6 w-1/3 bg-secondary rounded-md"></div>
            </div>
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((kos) => (
            <KosCard key={kos.id} kos={kos} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-muted-foreground">
            No kos matches these exact filters. Try expanding your search area or adjusting the price.
          </p>
        </div>
      )}
    </div>
  );
};

export default SearchKos;
