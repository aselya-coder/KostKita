import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Heart, MapPin, Star, Wifi, Wind, MessageCircle, Users, DoorOpen, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { mockKosListings, formatPrice } from "@/data/mockData";
import { BackButton } from "@/components/BackButton";
import { useFavorites } from "@/hooks/useFavorites";

const KosDetail = () => {
  const { id } = useParams();
  const kos = mockKosListings.find((k) => k.id === id);
  const { isFavorite, toggleFavorite } = useFavorites();

  if (!kos) {
    return (
      <div className="container py-20 text-center">
        <p className="text-muted-foreground">Kos tidak ditemukan.</p>
        <Link to="/search" className="text-primary mt-4 inline-block">Kembali ke pencarian</Link>
      </div>
    );
  }

  const liked = isFavorite(kos.id);

  const waLink = `https://wa.me/${kos.ownerPhone}?text=${encodeURIComponent(
    `Hi, saya tertarik dengan ${kos.title} di KosKita. Apakah masih tersedia?`
  )}`;

  return (
    <div className="pb-24 md:pb-8">
      {/* Image gallery */}
      <div className="container pt-6">
        <div className="flex items-center justify-between mb-4">
          <BackButton to="/search" className="mb-0" />
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={() => toggleFavorite(kos.id)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full ring-1 ring-foreground/10 text-sm"
          >
            <Heart className={`w-4 h-4 ${liked ? "fill-primary text-primary" : "text-muted-foreground"}`} />
            {liked ? "Tersimpan" : "Simpan"}
          </motion.button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-2 rounded-2xl overflow-hidden h-auto md:h-[50vh]">
          <div className="md:col-span-2 md:row-span-2">
            <img src={kos.images[0]} alt={kos.title} className="w-full h-full object-cover" />
          </div>
          {kos.images.slice(1).map((img, i) => (
            <div key={i} className="hidden md:block">
              <img src={img} alt={`${kos.title} ${i + 2}`} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      </div>

      <div className="container mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main info */}
        <div className="md:col-span-2 space-y-6">
          <div>
            {kos.isPremium && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent text-accent-foreground text-xs font-semibold mb-3">
                <Star className="w-3 h-3" /> Premium
              </span>
            )}
            <h1 className="font-display font-bold text-[clamp(1.75rem,4vw,2.5rem)] leading-[1.1] tracking-[-0.02em] text-foreground">
              {kos.title}
            </h1>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(kos.location)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-muted-foreground mt-2 hover:text-primary transition-colors w-fit"
            >
              <MapPin className="w-4 h-4" /> {kos.location}
            </a>
          </div>

          <div className="flex items-center gap-6 py-4 border-y border-border">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 fill-accent text-accent" />
              <span className="font-semibold text-foreground">{kos.rating}</span>
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
            <h2 className="font-display font-semibold text-lg text-foreground mb-3">Deskripsi</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{kos.description}</p>
          </div>

          <div>
            <h2 className="font-display font-semibold text-lg text-foreground mb-3">Fasilitas</h2>
            <div className="grid grid-cols-2 gap-3">
              {kos.amenities.map((a) => (
                <div key={a} className="flex items-center gap-2 text-sm text-foreground">
                  {a === "WiFi" ? <Wifi className="w-4 h-4 text-primary" /> :
                   a === "AC" ? <Wind className="w-4 h-4 text-primary" /> :
                   <Shield className="w-4 h-4 text-primary" />}
                  {a}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-display font-semibold text-lg text-foreground mb-3">Peraturan</h2>
            <ul className="space-y-2">
              {kos.rules.map((r) => (
                <li key={r} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Sidebar pricing (desktop) */}
        <div className="hidden md:block">
          <div className="sticky top-24 p-6 rounded-2xl ring-1 ring-foreground/5 shadow-card space-y-4">
            <div>
              <span className="text-2xl text-price text-foreground">{formatPrice(kos.price)}</span>
              <span className="text-muted-foreground text-sm"> / bulan</span>
            </div>
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Chat via WhatsApp
            </a>
            <p className="text-xs text-muted-foreground text-center">
              Langsung terhubung dengan pemilik kos
            </p>
          </div>
        </div>
      </div>

      {/* Mobile WhatsApp CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t border-foreground/5 md:hidden z-40">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-lg text-price text-foreground">{formatPrice(kos.price)}</span>
            <span className="text-muted-foreground text-sm"> / bulan</span>
          </div>
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm"
          >
            <MessageCircle className="w-4 h-4" />
            Chat via WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
};

export default KosDetail;
