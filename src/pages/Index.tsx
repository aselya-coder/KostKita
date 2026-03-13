import { HeroSection } from "@/components/HeroSection";
import { KosCard } from "@/components/KosCard";
import { MarketplaceCard } from "@/components/MarketplaceCard";
import { mockKosListings, mockMarketplaceItems } from "@/data/mockData";
import { Link } from "react-router-dom";
import { ArrowRight, Shield, MessageCircle, MapPin } from "lucide-react";

const features = [
  { icon: MapPin, title: "Lokasi Strategis", desc: "Kos dekat kampus dan fasilitas umum" },
  { icon: Shield, title: "Terverifikasi", desc: "Listing telah diverifikasi tim kami" },
  { icon: MessageCircle, title: "Chat Langsung", desc: "Hubungi pemilik langsung via WhatsApp" },
];

const Index = () => {
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockKosListings.slice(0, 3).map((kos) => (
            <KosCard key={kos.id} kos={kos} />
          ))}
        </div>
      </section>

      {/* Marketplace Preview */}
      <section className="bg-surface py-16">
        <div className="container">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display font-bold text-2xl text-foreground">Barang Bekas Mahasiswa</h2>
            <Link
              to="/marketplace"
              className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Lihat semua <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {mockMarketplaceItems.slice(0, 4).map((item) => (
              <MarketplaceCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
