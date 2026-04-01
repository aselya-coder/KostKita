import { Link } from "react-router-dom";
import { MapPin, Heart } from "lucide-react";
import { motion } from "framer-motion";
import { type MarketplaceItem, formatPrice } from "@/data/mockData";
import { useFavorites } from "@/hooks/useFavorites";

interface MarketplaceCardProps {
  item: MarketplaceItem;
}

export function MarketplaceCard({ item }: MarketplaceCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites('item');
  const liked = isFavorite(item.id);

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="group relative rounded-2xl bg-card shadow-card hover:shadow-card-hover ring-1 ring-foreground/5 overflow-hidden transition-shadow duration-300"
    >
      <Link to={`/item/${item.id}`}>
        <div className="relative aspect-square overflow-hidden">
          <img
            src={item.image}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-background/80 backdrop-blur-sm text-xs font-medium text-foreground hover:bg-background transition-colors">
            {item.category}
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
        <Link to={`/item/${item.id}`}>
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
}