import { useState, useEffect } from "react";
import { HeroSection } from "@/components/HeroSection";
import { KosCard } from "@/components/KosCard";
import { MarketplaceCard } from "@/components/MarketplaceCard";
import { getKosListings } from "@/services/kos";
import { getMarketplaceItems } from "@/services/marketplace";
import { type KosListing, type MarketplaceItem } from "@/data/mockData";
import { Link } from "react-router-dom";
import { ArrowRight, Shield, MessageCircle, MapPin, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

const features = [
  { icon: MapPin, title: "Lokasi Strategis", desc: "Kos dekat kampus dan fasilitas umum" },
  { icon: Shield, title: "Terverifikasi", desc: "Listing telah diverifikasi tim kami" },
  { icon: MessageCircle, title: "Chat Langsung", desc: "Hubungi pemilik langsung via WhatsApp" },
];

const Index = () => {
  const [kosListings, setKosListings] = useState<KosListing[]>([]);
  const [marketplaceItems, setMarketplaceItems] = useState<MarketplaceItem[]>([]);
  const [isLoadingKos, setIsLoadingKos] = useState(true);
  const [isLoadingMarketplace, setIsLoadingMarketplace] = useState(true);

  useEffect(() => {
    const fetchKos = async () => {
      try {
        const data = await getKosListings();
        setKosListings(data.slice(0, 3));
      } catch (error) {
        console.error("Error fetching kos:", error);
      } finally {
        setIsLoadingKos(false);
      }
    };

    const fetchMarketplace = async () => {
      try {
        const data = await getMarketplaceItems();
        setMarketplaceItems(data.slice(0, 4));
      } catch (error) {
        console.error("Error fetching marketplace items:", error);
      } finally {
        setIsLoadingMarketplace(false);
      }
    };

    fetchKos();
    fetchMarketplace();

    // REALTIME: Listen for changes using a single channel
    const channel = supabase.channel('home-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'kos_listings' }, () => fetchKos())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'marketplace_items' }, () => fetchMarketplace())
      .subscribe();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  return (
    <div>
      <HeroSection />

      {/* Features */}
      <section className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="flex items-start gap-4 p-6 rounded-2xl bg-surface">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <f.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-foreground">{f.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Kos */}
      <section className="container pb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display font-bold text-2xl text-foreground">Kos Populer</h2>
          <Link
            to="/search"
            className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Lihat semua <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        
        {isLoadingKos ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : kosListings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {kosListings.map((kos) => (
              <KosCard key={kos.id} kos={kos} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            Belum ada kos populer yang tersedia saat ini.
          </div>
        )}
      </section>

      {/* Marketplace Preview */}
      <section className="bg-surface py-16">
        <div className="container">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display font-bold text-2xl text-foreground">Barang Bekas</h2>
            <Link
              to="/marketplace"
              className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Lihat semua <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {isLoadingMarketplace ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : marketplaceItems.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {marketplaceItems.map((item) => (
                <MarketplaceCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              Belum ada barang di marketplace saat ini.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Index;
