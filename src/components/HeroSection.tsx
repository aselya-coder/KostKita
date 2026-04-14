import { Search, MapPin } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import heroBg from "@/assets/hero-bg.jpg";

export function HeroSection() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
      <img
        src={heroBg}
        alt="Indonesian campus neighborhood"
        className="absolute inset-0 w-full h-full object-cover"
        // @ts-expect-error - fetchpriority is valid HTML but missing in older React types
        fetchpriority="high"
        loading="eager"
        decoding="async"
      />
      <div className="absolute inset-0 bg-foreground/50" />

      <div className="relative z-10 container text-center px-4">
        <h1 className="font-display font-bold text-[clamp(1.75rem,5vw,3rem)] leading-[1.1] tracking-[-0.02em] text-background mb-4">
          Find your perfect space.
          <br />
          Near campus, within budget.
        </h1>
        <p className="text-background/80 text-lg mb-8 max-w-xl mx-auto">
          Cari kos-kosan dan barang bekas mahasiswa terlengkap. Langsung hubungi via WhatsApp.
        </p>

        <form
          onSubmit={handleSearch}
          className="max-w-2xl mx-auto flex items-center bg-background rounded-2xl shadow-card-hover p-2 ring-1 ring-foreground/5"
        >
          <div className="flex items-center gap-2 flex-1 px-4">
            <MapPin className="w-5 h-5 text-muted-foreground shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari kos atau barang dekat kampus (ex: dekat UGM)..."
              className="w-full py-3 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-sm"
            />
          </div>
          <button
            type="submit"
            className="shrink-0 flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
          >
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline">Cari Kos</span>
          </button>
        </form>

        <div className="flex flex-wrap justify-center gap-2 mt-6">
          {["Depok", "Yogyakarta", "Bandung", "Semarang", "Malang"].map((city) => (
            <button
              key={city}
              onClick={() => navigate(`/search?q=${city}`)}
              className="px-4 py-2 rounded-full bg-background/20 backdrop-blur-sm text-background text-sm font-medium hover:bg-background/30 transition-colors"
            >
              {city}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
