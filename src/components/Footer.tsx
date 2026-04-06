import { Home } from "lucide-react";
import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="bg-surface border-t border-border mt-16">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Home className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-lg text-foreground">KosKita</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Platform pencarian kos dan marketplace barang bekas terlengkap untuk mahasiswa Indonesia.
            </p>
          </div>
          <div>
            <h4 className="font-display font-semibold text-sm mb-4 text-foreground">Jelajahi</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/search" className="hover:text-foreground transition-colors">Cari Kos</Link></li>
              <li><Link to="/marketplace" className="hover:text-foreground transition-colors">Marketplace</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-semibold text-sm mb-4 text-foreground">Layanan</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/dashboard/add-kos" className="hover:text-foreground transition-colors">Pasang Iklan Kos</Link></li>
              <li><Link to="/dashboard/sell-item" className="hover:text-foreground transition-colors">Jual Barang Bekas</Link></li>
              <li><Link to="/dashboard/topup" className="hover:text-foreground transition-colors">Top Up Koin</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-semibold text-sm mb-4 text-foreground">Bantuan</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/faq" className="hover:text-foreground transition-colors">FAQ</Link></li>
              <li><Link to="/contact" className="hover:text-foreground transition-colors">Kontak</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-6 border-t border-border text-center text-xs text-muted-foreground">
          © 2026 KosKita. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
