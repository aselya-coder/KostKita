import { useParams, Link } from "react-router-dom";
import { ArrowLeft, MapPin, MessageCircle, Tag, User, Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { type MarketplaceItem, formatPrice } from "@/data/mockData";
import { getItemById } from "@/services/marketplace";
import { BackButton } from "@/components/BackButton";
import { useFavorites } from "@/hooks/useFavorites";
import { motion } from "framer-motion";

const ItemDetail = () => {
  const { id } = useParams();
  const [item, setItem] = useState<MarketplaceItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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

  // Sanitize phone number: remove non-digits and ensure international format
  const rawPhone = item.sellerPhone || '';
  let sanitizedPhone = rawPhone.replace(/\D/g, '');
  if (sanitizedPhone.startsWith('0')) {
    sanitizedPhone = '62' + sanitizedPhone.slice(1);
  }
  
  const waLink = `https://wa.me/${sanitizedPhone}?text=${encodeURIComponent(
    `Hi ${item.sellerName}, saya tertarik dengan ${item.title} di KosKita. Apakah masih tersedia?`
  )}`;

  return (
    <div className="container py-8 pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-6">
        <BackButton to="/marketplace" className="mb-0" />
        <motion.button
          whileTap={{ scale: 0.8 }}
          onClick={() => toggleFavorite(item.id)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full ring-1 ring-foreground/10 text-sm"
        >
          <Heart className={`w-4 h-4 ${liked ? "fill-primary text-primary" : "text-muted-foreground"}`} />
          {liked ? "Tersimpan" : "Simpan"}
        </motion.button>
      </div>

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

          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className={`hidden md:flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm transition-colors bg-primary text-primary-foreground hover:bg-primary/90 shadow-md active:scale-95 ${
              !item.sellerPhone ? 'opacity-80' : ''
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            Tanya Penjual via WhatsApp
          </a>
        </div>
      </div>

      {/* Mobile CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t border-foreground/5 md:hidden z-40">
        <div className="flex items-center justify-between">
          <span className="text-lg text-price text-foreground">{formatPrice(item.price)}</span>
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-colors ${
              !item.sellerPhone ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'bg-primary text-primary-foreground'
            }`}
            onClick={(e) => !item.sellerPhone && e.preventDefault()}
            aria-disabled={!item.sellerPhone}
          >
            <MessageCircle className="w-4 h-4" />
            {item.sellerPhone ? "Chat" : "Nomor tidak ada"}
          </a>
        </div>
      </div>
    </div>
  );
};

export default ItemDetail;