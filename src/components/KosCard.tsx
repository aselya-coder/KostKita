import { Link } from "react-router-dom";
import { Heart, MapPin, Wifi, Wind, Star } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { type KosListing, formatPrice } from "@/data/mockData";
import { useFavorites } from "@/hooks/useFavorites";

interface KosCardProps {
  kos: KosListing;
}

const amenityIcons: Record<string, typeof Wifi> = {
  WiFi: Wifi,
  AC: Wind,
};

export function KosCard({ kos }: KosCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites('kos');
  const [imgIdx, setImgIdx] = useState(0);

  const liked = isFavorite(kos.id);

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="group relative rounded-2xl bg-card shadow-card hover:shadow-card-hover ring-1 ring-foreground/5 overflow-hidden transition-shadow duration-300"
    >
      <Link to={`/kos/${kos.id}`}>
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={kos.images[imgIdx]}
            alt={kos.title}
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            loading="lazy"
          />
          {kos.isPremium && (
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-accent text-accent-foreground text-xs font-semibold flex items-center gap-1">
              <Star className="w-3 h-3" />
              Premium
            </div>
          )}
          {kos.images.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
              {kos.images.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.preventDefault(); setImgIdx(i); }}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    i === imgIdx ? "bg-background" : "bg-background/50"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </Link>

      <motion.button
        whileTap={{ scale: 0.8 }}
        onClick={() => toggleFavorite(kos.id)}
        className="absolute top-3 right-3 p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
      >
        <Heart
          className={`w-4 h-4 transition-colors ${
            liked ? "fill-primary text-primary" : "text-foreground"
          }`}
        />
      </motion.button>

      <div className="p-4">
        <Link to={`/kos/${kos.id}`} className="block">
          <div className="flex items-center justify-between mb-1">
            <span className="text-lg text-price text-foreground">
              {formatPrice(kos.price)}
              <span className="text-sm font-normal text-muted-foreground">/bln</span>
            </span>
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Star className="w-3.5 h-3.5 fill-accent text-accent" />
              {kos.rating}
            </span>
          </div>
          <h3 className="font-display font-semibold text-base leading-snug tracking-tight truncate text-foreground">
            {kos.title}
          </h3>
        </Link>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(kos.location)}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1 text-sm text-muted-foreground mt-1 hover:text-primary transition-colors w-fit"
        >
          <MapPin className="w-3.5 h-3.5" />
          {kos.location}
        </a>
        <div className="flex items-center gap-3 mt-3">
          {kos.amenities.slice(0, 4).map((amenity) => {
            const Icon = amenityIcons[amenity];
            return (
              <span key={amenity} className="flex items-center gap-1 text-xs text-muted-foreground">
                {Icon ? <Icon className="w-3.5 h-3.5" /> : null}
                {amenity}
              </span>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}