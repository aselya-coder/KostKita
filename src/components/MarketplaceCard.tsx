import { Link } from "react-router-dom";
import { MapPin, Heart, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { memo } from "react";
import { type MarketplaceItem, formatPrice } from "@/data/mockData";
import { useFavorites } from "@/hooks/useFavorites";
import { sanitizePhone } from "@/utils/whatsapp";
import { calculateRemainingDays } from "@/utils/date";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface MarketplaceCardProps {
  item: MarketplaceItem;
}

export const MarketplaceCard = memo(({ item }: MarketplaceCardProps) => {
  const { isFavorite, toggleFavorite } = useFavorites('item');
  const liked = isFavorite(item.id);

  return (
    <motion.div
      whileHover={{ y: -8, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)" }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="group relative rounded-[2rem] bg-card border border-border shadow-sm hover:shadow-2xl hover:shadow-primary/5 ring-1 ring-foreground/5 overflow-hidden transition-all duration-300"
    >
      <Link to={`/marketplace/${item.id}`}>
        <div className="relative aspect-square overflow-hidden">
          <img
            src={item.image}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            loading="lazy"
            decoding="async"
          />
          <div className="absolute top-3 left-3 flex flex-col gap-1">
            {sanitizePhone(item.sellerPhone || "") && (
              <div className="px-2 py-0.5 rounded-full bg-emerald-600/90 text-white text-[10px] font-bold flex items-center gap-1 shadow">
                <MessageCircle className="w-3 h-3" />
                WA Ready
              </div>
            )}
            {item.expires_at && (
              <div className={cn(
                "px-2 py-0.5 rounded-full text-white text-[10px] font-bold flex items-center gap-1 shadow",
                calculateRemainingDays(item.expires_at) <= 3 ? "bg-red-600/90 animate-pulse" : "bg-primary/90"
              )}>
                <Clock className="w-3 h-3" />
                {calculateRemainingDays(item.expires_at)} Hari Lagi
              </div>
            )}
          </div>
        </div>
      </Link>
      
      <motion.button
        whileTap={{ scale: 0.8 }}
        onClick={() => toggleFavorite(item.id)}
        className="absolute top-3 right-3 p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors z-10"
      >
        <Heart
          className={`w-3.5 h-3.5 transition-colors ${
            liked ? "fill-primary text-primary" : "text-foreground"
          }`}
        />
      </motion.button>
      <div className="p-4">
        <Link to={`/marketplace/${item.id}`}>
          <span className="text-lg text-price text-foreground">{formatPrice(item.price)}</span>
          <h3 className="font-display font-semibold text-sm leading-snug tracking-tight truncate mt-1 text-foreground">
            {item.title}
          </h3>
        </Link>
        <div className="flex items-center justify-between mt-2">
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.location)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <MapPin className="w-3 h-3" />
            {item.location}
          </a>
          <span className="text-xs text-muted-foreground">{item.condition}</span>
        </div>
      </div>
    </motion.div>
  );
});
