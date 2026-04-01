import { useParams, Link } from "react-router-dom";
import {
  DoorOpen,
  Heart,
  MapPin,
  MessageCircle,
  Star,
  Users,
} from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { getKosById } from "@/services/kos";
import { type KosListing, formatPrice } from "@/data/mockData";
import { BackButton } from "@/components/BackButton";
import { useFavorites } from "@/hooks/useFavorites";
import { getAmenityIcon } from "@/utils/amenityIcons";

const KosDetail = () => {
  const { id } = useParams();
  const [kos, setKos] = useState<KosListing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isFavorite, toggleFavorite } = useFavorites('kos');

  useEffect(() => {
    const fetchKos = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const data = await getKosById(id);
        setKos(data);
      } catch (error) {
        console.error("Failed to fetch kos details:", error);
        setKos(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchKos();
  }, [id]);

  if (isLoading) {
    return (
      <div className="container py-20 text-center">
        <p className="text-muted-foreground">Memuat data kos...</p>
      </div>
    );
  }

  if (!kos) {
    return (
      <div className="container py-20 text-center">
        <p className="text-muted-foreground">Kos tidak ditemukan.</p>
        <Link to="/search" className="text-primary mt-4 inline-block">Kembali ke pencarian</Link>
      </div>
    );
  }

  const liked = isFavorite(kos.id);

  // Sanitize phone number: remove non-digits and ensure international format
  const rawPhone = kos.ownerPhone || '';
  let sanitizedPhone = rawPhone.replace(/\D/g, '');
  if (sanitizedPhone.startsWith('0')) {
    sanitizedPhone = '62' + sanitizedPhone.slice(1);
  }
  
  const waLink = `https://wa.me/${sanitizedPhone}?text=${encodeURIComponent(
    `Hi, saya tertarik dengan ${kos.title} di KosKita. Apakah masih tersedia?`
  )}`;

  return (
    <div className="bg-background min-h-screen">
      <div className="pt-4 pb-8">
        <div className="container">
          <div className="flex items-center justify-between mb-6">
            <BackButton to="/search" />
            <motion.button
              whileTap={{ scale: 0.8 }}
              onClick={() => toggleFavorite(kos.id)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full ring-1 ring-border text-sm"
            >
              <Heart className={`w-4 h-4 ${liked ? "fill-primary text-primary" : "text-muted-foreground"}`} />
              {liked ? "Tersimpan" : "Simpan"}
            </motion.button>
          </div>

          {/* Images */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
            {/* Image 1 */}
            <div className="aspect-video md:aspect-[4/3] rounded-2xl overflow-hidden bg-muted/30">
              <img src={kos.images[0]} alt={kos.title} className="w-full h-full object-cover" />
            </div>

            {/* Secondary Images */}
            {kos.images.length > 1 && (
              <div className={`hidden lg:grid gap-4 ${kos.images.length > 2 ? 'grid-rows-2' : ''}`}>
                {kos.images[1] && (
                  <div className="aspect-video md:aspect-[4/3] rounded-2xl overflow-hidden bg-muted/30">
                    <img src={kos.images[1]} alt={`${kos.title} 2`} className="w-full h-full object-cover" />
                  </div>
                )}
                {kos.images[2] && (
                  <div className="aspect-video md:aspect-[4/3] rounded-2xl overflow-hidden bg-muted/30">
                    <img src={kos.images[2]} alt={`${kos.title} 3`} className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            {/* Main info */}
            <div className="lg:col-span-2 space-y-4">
              <div>
                {kos.isPremium && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent text-accent-foreground text-xs font-semibold mb-3">
                    <Star className="w-3 h-3" /> Premium
                  </span>
                )}
                <h1 className="font-display font-bold text-3xl lg:text-4xl tracking-tight text-foreground">
                  {kos.title}
                </h1>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(kos.location)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-muted-foreground mt-2 hover:text-primary transition-colors w-fit"
                >
                  <MapPin className="w-4 h-4" /> {kos.location}
                </a>
              </div>

              <div className="flex items-center gap-6 py-4 border-y border-border">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 fill-accent text-accent" />
                  <span className="font-semibold text-foreground text-lg">{kos.rating}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <DoorOpen className="w-4 h-4" />
                  {kos.availableRooms} kamar tersedia
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  {kos.type === "putra" ? "Putra" : kos.type === "putri" ? "Putri" : "Campur"}
                </div>
              </div>

              <div>
                <h2 className="font-display font-semibold text-xl text-foreground mb-4">Deskripsi</h2>
                <p className="text-muted-foreground leading-relaxed">{kos.description}</p>
              </div>

              <div>
                <h2 className="font-display font-semibold text-xl text-foreground mb-4">Fasilitas</h2>
                <div className="grid grid-cols-2 gap-4">
                  {kos.amenities.map((a) => {
                    const Icon = getAmenityIcon(a);
                    return (
                      <div key={a} className="flex items-center gap-3 text-foreground">
                        <Icon className="w-5 h-5 text-primary" />
                        {a}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h2 className="font-display font-semibold text-xl text-foreground mb-4">Peraturan</h2>
                <ul className="space-y-3">
                  {kos.rules.map((r) => (
                    <li key={r} className="text-muted-foreground flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Pricing and CTA */}
            <div className="lg:sticky top-24 h-fit">
              <div className="p-6 rounded-2xl ring-1 ring-border shadow-lg space-y-4 bg-card">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-bold text-foreground">{formatPrice(kos.price)}</span>
                    <span className="text-muted-foreground text-sm"> / bulan</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{kos.ownerName}</p>
                    <p className="text-xs text-muted-foreground">Pemilik Kos</p>
                  </div>
                </div>
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-sm transition-colors hover:bg-primary/90 shadow-md active:scale-95 ${
                    !kos.ownerPhone ? 'opacity-80' : ''
                  }`}
                >
                  <MessageCircle className="w-4 h-4" />
                  Chat via WhatsApp
                </a>
                <p className="text-xs text-muted-foreground text-center">
                  Terhubung langsung dengan Pemilik Kos
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KosDetail;