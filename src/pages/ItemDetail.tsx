import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, MessageCircle, Tag, User, Heart, Flag, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { type MarketplaceItem, formatPrice } from "@/data/mockData";
import { getItemById } from "@/services/marketplace";
import { BackButton } from "@/components/BackButton";
import { useFavorites } from "@/hooks/useFavorites";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { ReportModal } from "@/components/ReportModal";
import { supabase } from "@/lib/supabase";
import { createNotification } from "@/services/notifications";
import { getOrCreateConversation, sendMessage } from "@/services/chat";
import { toast } from "sonner";
import { sanitizePhone, buildWaLink } from "@/utils/whatsapp";
import { logUserActivity } from "@/services/activity";

const ItemDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [item, setItem] = useState<MarketplaceItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const { isFavorite, toggleFavorite } = useFavorites('item');

  

  useEffect(() => {
    const fetchItem = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const data = await getItemById(id);
        setItem(data);
      } catch (error) {
        console.error("Failed to fetch item details:", error);
        setItem(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchItem();

    if (id) {
      let mounted = true;
      const channel = supabase
        .channel(`item-detail:${id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'marketplace_items', filter: `id=eq.${id}` },
          (payload) => {
            if (payload.eventType === 'DELETE') {
              setItem(null); // Item deleted
            } else {
              fetchItem(); // Item updated
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
        <p className="text-muted-foreground">Memuat data barang...</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="container py-20 text-center">
        <p className="text-muted-foreground">Barang tidak ditemukan.</p>
        <Link to="/marketplace" className="text-primary mt-4 inline-block">Kembali ke Marketplace</Link>
      </div>
    );
  }

  const liked = isFavorite(item.id);

  const sanitizedPhone = sanitizePhone(item.sellerPhone || "");
  const hasPhone = !!sanitizedPhone;
  const waLink = hasPhone 
    ? buildWaLink(sanitizedPhone, `Hi ${item.sellerName}, saya tertarik dengan ${item.title} di KosKita. Apakah masih tersedia?`)
    : "#";

  const handleInquiry = async () => {
    if (!user || !item) return;
    
    // Notify the seller
    await createNotification(
      item.sellerId,
      "Seseorang tertarik dengan barang Anda!",
      `${user.name} tertarik dengan "${item.title}". Mereka mungkin akan menghubungi Anda via WhatsApp.`,
      "marketplace",
      `/dashboard/my-items`
    );

    if (user.id !== item.sellerId) {
      // START internal chat first to bridge the two
      try {
        const result = await getOrCreateConversation(user.id, item.sellerId);
        if (result.success) {
          // Send a message to internal chat to log the interest
          await sendMessage(result.data.id, user.id, `Halo, saya baru saja menghubungi Anda melalui WhatsApp mengenai barang "${item.title}".`);
        }
      } catch (err) {
        console.error("Error bridging to internal chat:", err);
      }
    }
    
    // Redirect to WhatsApp
    if (hasPhone) {
      try {
        await logUserActivity(user.id, 'Klik WhatsApp Marketplace', item.title, `/marketplace/${item.id}`);
      } catch {}
      window.open(waLink, '_blank');
    }
  };

  return (
    <div className="container py-8 pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-6">
        <BackButton to="/marketplace" className="mb-0" />
        <div className="flex items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={() => toggleFavorite(item.id)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full ring-1 ring-foreground/10 text-sm"
          >
            <Heart className={`w-4 h-4 ${liked ? "fill-primary text-primary" : "text-muted-foreground"}`} />
            {liked ? "Tersimpan" : "Simpan"}
          </motion.button>
          
          {user && user.id !== item.sellerId && (
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full ring-1 ring-foreground/10 text-sm hover:bg-red-50 hover:text-red-600 transition-colors"
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
        targetId={item.id}
        targetName={item.title}
        type="item"
        reporterId={user?.id || ""}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="rounded-2xl overflow-hidden ring-1 ring-foreground/5">
          <img src={item.image} alt={item.title} className="w-full aspect-square object-cover" />
        </div>

        <div className="space-y-6">
          <div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface text-xs font-medium text-muted-foreground mb-3 ring-1 ring-foreground/5">
              <Tag className="w-3 h-3" />
              {item.category}
            </span>
            <h1 className="font-display font-bold text-2xl text-foreground">{item.title}</h1>
            <p className="text-3xl text-price text-foreground mt-2">{formatPrice(item.price)}</p>
          </div>

          <div className="py-4 border-y border-border space-y-3">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.location)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors w-fit"
            >
              <MapPin className="w-4 h-4" /> {item.location}
            </a>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="w-4 h-4" /> {item.sellerName}
            </div>
            <div className="text-sm text-muted-foreground">
              Kondisi: <span className="text-foreground font-medium">{item.condition}</span>
            </div>
          </div>

          <div>
            <h2 className="font-display font-semibold text-lg text-foreground mb-2">Deskripsi</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleInquiry}
              disabled={!hasPhone || (user && user.id === item.sellerId)}
              className={`hidden md:flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm transition-all shadow-md active:scale-95 ${
                !hasPhone || (user && user.id === item.sellerId)
                  ? 'bg-muted text-muted-foreground cursor-not-allowed grayscale' 
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              {user && user.id === item.sellerId 
                ? "Ini barang Anda sendiri" 
                : hasPhone ? "Chat via WhatsApp" : "Nomor tidak tersedia"}
            </button>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t border-foreground/5 md:hidden z-40">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Harga</p>
            <p className="text-lg text-price text-foreground truncate">{formatPrice(item.price)}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleInquiry}
              disabled={!hasPhone || (user && user.id === item.sellerId)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all ${
                !hasPhone || (user && user.id === item.sellerId)
                  ? 'bg-muted text-muted-foreground cursor-not-allowed grayscale' 
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              {hasPhone ? "Chat via WhatsApp" : "Nomor"}
            </button>
          </div>
          {!hasPhone && (
            <p className="text-[11px] text-amber-600 bg-amber-50 border border-amber-100 rounded-lg p-2 mt-2">
              {user && user.id === item.sellerId
                ? <a href="/dashboard/profile" className="underline font-semibold">Lengkapi nomor WhatsApp Anda di Profil</a>
                : "Nomor WhatsApp penjual belum tersedia"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ItemDetail;
