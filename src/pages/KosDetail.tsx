import { useParams, Link, useNavigate } from "react-router-dom";
import {
  DoorOpen,
  Heart,
  MapPin,
  MessageCircle,
  Star,
  Users,
  Flag,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
import { supabase } from "@/lib/supabase";
import { createNotification } from "@/services/notifications";
import { createBooking } from "@/services/booking";
import { getOrCreateConversation, sendMessage } from "@/services/chat";
import { toast } from "sonner";
import { logUserActivity } from "@/services/activity";
import { 
  Calendar,
  ChevronDown,
  Loader2,
  Info,
  Clock,
} from "lucide-react";
import { sanitizePhone, buildWaLink } from "@/utils/whatsapp";

const KosDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [kos, setKos] = useState<KosListing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isAdvertiseModalOpen, setIsAdvertiseModalOpen] = useState(false);
  const { isFavorite, toggleFavorite } = useFavorites('kos');
  
  // Booking state
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingDate, setBookingDate] = useState("");
  const [duration, setDuration] = useState(1);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);

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
      let mounted = true;
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
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            if (!mounted && channel) {
              supabase.removeChannel(channel);
            }
          }
        });

      return () => {
        mounted = false;
        if (channel) {
          supabase.removeChannel(channel);
        }
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

  // Generate URL yang clean menggunakan window.location.origin
  const baseUrl = window.location.origin;
  const cleanKosUrl = `${baseUrl}/kos/${kos.id}`;

  const sanitizedPhone = sanitizePhone(kos.ownerPhone || "");
  const hasPhone = !!sanitizedPhone;
  const waLink = hasPhone 
    ? buildWaLink(sanitizedPhone, `Hi, saya tertarik dengan Kos "${kos.title}" di KosKita.\nLink: ${cleanKosUrl}\nApakah masih tersedia?`)
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

    if (user.id !== kos.ownerId) {
      // Bridge to internal chat
      try {
        await getOrCreateConversation(user.id, kos.ownerId);
      } catch (err) {
        console.error("Error bridging to internal chat:", err);
      }
    }
    
    // Redirect to WhatsApp
    if (hasPhone) {
      try {
        await logUserActivity(user.id, 'Klik WhatsApp Kos', kos.title, `/kos/${kos.id}`);
      } catch {}
      window.open(waLink, '_blank');
    }
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !kos) {
      toast.error("Anda harus login untuk memesan kos.");
      navigate("/login");
      return;
    }

    if (!bookingDate) {
      toast.error("Pilih tanggal masuk terlebih dahulu.");
      return;
    }

    setIsSubmittingBooking(true);
    try {
      const result = await createBooking({
        kosId: kos.id,
        userId: user.id,
        ownerId: kos.ownerId,
        checkInDate: bookingDate,
        durationMonths: duration,
        totalPrice: kos.price * duration,
        message: `Pemesanan baru untuk ${kos.title} dari ${user.name}`
      });

      if (result.success) {
        await createNotification(
          kos.ownerId,
          "Pemesanan Kos Baru!",
          `${user.name} telah mengirim permintaan pemesanan untuk "${kos.title}".`,
          "booking",
          `/dashboard/bookings`
        );
        if (user.id !== kos.ownerId) {
          try {
            const conv = await getOrCreateConversation(user.id, kos.ownerId);
            if (conv.success) {
              const bookingMsg = `Halo ${kos.ownerName}, saya telah mengajukan booking untuk "${kos.title}" di KosKita.\nTanggal masuk: ${new Date(bookingDate).toLocaleDateString('id-ID')}\nDurasi: ${duration} bulan\nTotal: ${formatPrice(kos.price * duration)}`;
              await sendMessage(conv.data.id, user.id, bookingMsg);
            }
          } catch {}
        }
        toast.success("Permintaan pemesanan berhasil dikirim!");
        setIsBookingModalOpen(false);
        if (hasPhone) {
          const waText = `Halo ${kos.ownerName},\n\nSaya ingin memesan kamar di *${kos.title}* via KosKita.\nLink: ${cleanKosUrl}\n\n*Detail Pesanan:*\n- Tanggal Masuk: ${new Date(bookingDate).toLocaleDateString('id-ID')}\n- Durasi Sewa: ${duration} Bulan\n- Total Estimasi: ${formatPrice(kos.price * duration)}\n\nMohon informasi selanjutnya. Terima kasih!`;
          const waUrl = buildWaLink(sanitizedPhone, waText);
          try {
            await logUserActivity(user.id, 'Klik WhatsApp Booking', kos.title, `/kos/${kos.id}`);
          } catch {}
          window.open(waUrl, '_blank');
        }
      } else {
        throw new Error("Failed to create booking");
      }
    } catch (error) {
      toast.error("Gagal mengirim permintaan pemesanan. Silakan coba lagi.");
    } finally {
      setIsSubmittingBooking(false);
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
                  className={`flex items-center justify-center gap-2 w-full py-3 rounded-lg font-semibold text-sm transition-all shadow-md active:scale-95 mb-3 ${
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

                <button
                  onClick={() => setIsBookingModalOpen(true)}
                  disabled={(user && user.id === kos.ownerId) || kos.availableRooms <= 0}
                  className={`flex items-center justify-center gap-2 w-full py-3 rounded-lg font-semibold text-sm transition-all shadow-md active:scale-95 ${
                    (user && user.id === kos.ownerId) || kos.availableRooms <= 0
                      ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  {kos.availableRooms <= 0 ? "Kamar Penuh" : "Booking via WhatsApp"}
                </button>

                <p className="text-xs text-muted-foreground text-center">
                  Terhubung langsung dengan Pemilik Kos
                </p>
                {!hasPhone && (
                  <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg p-2 text-center">
                    {user && user.id === kos.ownerId
                      ? <a href="/dashboard/profile" className="underline font-semibold">Lengkapi nomor WhatsApp Anda di Profil</a>
                      : "Nomor WhatsApp pemilik belum tersedia"}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      <AnimatePresence>
        {isBookingModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-card w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-border"
            >
              <div className="p-6 border-b border-border flex items-center justify-between bg-primary/5">
                <h3 className="text-xl font-bold font-display">Booking Kamar</h3>
                <button 
                  onClick={() => setIsBookingModalOpen(false)}
                  className="p-2 hover:bg-background rounded-full transition-colors"
                >
                  <ChevronDown className="w-6 h-6 rotate-180" />
                </button>
              </div>
              
              <form onSubmit={handleBooking} className="p-6 space-y-6">
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-secondary/50 border border-border">
                  <img src={kos.images[0]} alt={kos.title} className="w-16 h-16 rounded-xl object-cover" />
                  <div>
                    <h4 className="font-bold text-foreground line-clamp-1">{kos.title}</h4>
                    <p className="text-sm text-muted-foreground">{formatPrice(kos.price)} / bulan</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-foreground flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      Tanggal Mulai Sewa
                    </label>
                    <input 
                      type="date"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-surface border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-foreground flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      Durasi Sewa (Bulan)
                    </label>
                    <div className="flex items-center gap-4">
                      {[1, 3, 6, 12].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setDuration(m)}
                          className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-all ${
                            duration === m 
                              ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20' 
                              : 'bg-surface border-border text-muted-foreground hover:border-primary/50'
                          }`}
                        >
                          {m} Bln
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Harga Sewa x {duration} Bulan</span>
                    <span>{formatPrice(kos.price * duration)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-foreground pt-2 border-t border-primary/10">
                    <span>Total Estimasi</span>
                    <span className="text-primary">{formatPrice(kos.price * duration)}</span>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={isSubmittingBooking}
                  className="w-full py-6 rounded-2xl font-bold text-lg bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-600/20"
                >
                  {isSubmittingBooking ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    "Konfirmasi & Lanjut ke WhatsApp"
                  )}
                </Button>
                
                <p className="text-[10px] text-muted-foreground text-center flex items-center justify-center gap-1">
                  <Info className="w-3 h-3" />
                  Pembayaran akan dilakukan setelah pemilik menyetujui permintaan Anda.
                </p>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
