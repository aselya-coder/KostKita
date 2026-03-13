import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { type MarketplaceItem, formatPrice } from "@/data/mockData";

interface MarketplaceCardProps {
  item: MarketplaceItem;
}

export function MarketplaceCard({ item }: MarketplaceCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="group rounded-2xl bg-card shadow-card hover:shadow-card-hover ring-1 ring-foreground/5 overflow-hidden transition-shadow duration-300"
    >
      <Link to={`/item/${item.id}`}>
        <div className="relative aspect-square overflow-hidden">
          <img
            src={item.image}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-background/80 backdrop-blur-sm text-xs font-medium text-foreground">
            {item.category}
          </div>
        </div>
        <div className="p-4">
          <span className="text-lg text-price text-foreground">{formatPrice(item.price)}</span>
          <h3 className="font-display font-semibold text-sm leading-snug tracking-tight truncate mt-1 text-foreground">
            {item.title}
          </h3>
          <div className="flex items-center justify-between mt-2">
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3" />
              {item.location}
            </p>
            <span className="text-xs text-muted-foreground">{item.condition}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
