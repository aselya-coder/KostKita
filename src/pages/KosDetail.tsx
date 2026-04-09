import { useParams, Link, useNavigate } from "react-router-dom";
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
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/hooks/useFavorites";
import { getAmenityIcon } from "@/utils/amenityIcons";
import { useAuth } from "@/hooks/useAuth";
import { ReportModal } from "@/components/ReportModal";
import { AdvertiseKosModal } from "@/components/AdvertiseKosModal";
import { Flag, MessageCircle, Send } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { createNotification } from "@/services/notifications";


const KosDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [kos, setKos] = useState<KosListing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isAdvertiseModalOpen, setIsAdvertiseModalOpen] = useState(false);
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

    if (id) {
      const channel = supabase
        .channel(`kos-detail:${id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'kos_listings', filter: `id=eq.${id}` },
          (payload) => {
            if (payload.eventType === 'DELETE') {
              setKos(null); // Kos deleted
            } else {
              fetchKos(); // Kos updated
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
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
  } else if (sanitizedPhone.startsWith('8')) {
    sanitizedPhone = '62' + sanitizedPhone;
  }
  
  const hasPhone = sanitizedPhone.length >= 10;
  const waLink = hasPhone 
    ? `https://wa.me/${sanitizedPhone}?text=${encodeURIComponent(
        `Hi, saya tertarik dengan ${kos.title} di KosKita. Apakah masih tersedia?`
      )}`
    : "#";

  const handleInquiry = async () => {
    if (!user || !kos) return;
    
    // Notify the owner
    await createNotification(
      kos.ownerId,
      "Seseorang tertarik dengan kos Anda!",
      `${user.name} tertarik dengan "${kos.title}". Mereka mungkin akan menghubungi Anda via WhatsApp.`,
      "inquiry",
      `/dashboard/inquiries`
    );
    
    // Redirect to WhatsApp
    if (hasPhone) {
      window.open(waLink, '_blank');
    }
  };

  return (
    <>
      <div className="pt-4 pb-8">
        <div className="container">
          <div className="flex items-center justify-between mb-6">
            <BackButton to="/search" />
            <div className="flex items-center gap-2">
              <motion.button
                whileTap={{ scale: 0.8 }}
                onClick={() => toggleFavorite(kos.id)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full ring-1 ring-border text-sm"
              >
                <Heart className={`w-4 h-4 ${liked ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                {liked ? "Tersimpan" : "Simpan"}
              </motion.button>
              
              {user && user.id !== kos.ownerId && (
                <button
                  onClick={() => setIsReportModalOpen(true)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full ring-1 ring-border text-sm hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  <Flag className="w-4 h-4" />
                  Laporkan
                </button>
              )}
            </div>
          </div>

          <ReportModal 
            isOpen={isReportModalOpen}
            onClose={() => setIsReportModalOpen(false)}
            targetId={kos.id}
            targetName={kos.title}
            type="kos"
            reporterId={user?.id || ""}
          />

          {/* Images */}
          <div className="mb-8">
            <div className="flex lg:grid lg:grid-cols-2 gap-4 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 snap-x snap-mandatory hide-scrollbar">
              {/* Image 1 */}
              <div className="min-w-[85vw] sm:min-w-[60vw] lg:min-w-full aspect-video md:aspect-[4/3] rounded-2xl overflow-hidden bg-muted/30 snap-center">
                <img src={kos.images[0]} alt={kos.title} className="w-full h-full object-cover" />
              </div>

              {/* Secondary Images */}
              {kos.images.length > 1 && (
                <div className={`flex lg:grid gap-4 ${kos.images.length > 2 ? 'lg:grid-rows-2' : ''}`}>
                  {kos.images.slice(1, 3).map((img, idx) => (
                    <div key={idx} className="min-w-[85vw] sm:min-w-[60vw] lg:min-w-full aspect-video md:aspect-[4/3] rounded-2xl overflow-hidden bg-muted/30 snap-center">
                      <img src={img} alt={`${kos.title} ${idx + 2}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>
            {kos.images.length > 1 && (
              <p className="text-[10px] text-muted-foreground mt-2 lg:hidden italic">Geser untuk melihat foto lainnya</p>
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
                <button
                  onClick={handleInquiry}
                  disabled={!hasPhone || (user && user.id === kos.ownerId)}
                  className={`flex items-center justify-center gap-2 w-full py-3 rounded-lg font-semibold text-sm transition-all shadow-md active:scale-95 ${
                    !hasPhone || (user && user.id === kos.ownerId)
                      ? 'bg-muted text-muted-foreground cursor-not-allowed grayscale' 
                      : 'bg-primary text-primary-foreground hover:bg-primary/90'
                  }`}
                >
                  <MessageCircle className="w-4 h-4" />
                  {user && user.id === kos.ownerId 
                    ? "Ini kos Anda sendiri" 
                    : hasPhone ? "Chat via WhatsApp" : "Nomor tidak tersedia"}
                </button>
                <p className="text-xs text-muted-foreground text-center">
                  Terhubung langsung dengan Pemilik Kos
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {kos && (
        <AdvertiseKosModal
          isOpen={isAdvertiseModalOpen}
          onClose={() => setIsAdvertiseModalOpen(false)}
          kosId={kos.id}
          ownerId={kos.ownerId}
        />
      )}
    </>
  );
};

export default KosDetail;