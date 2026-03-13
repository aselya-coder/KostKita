import { Link, useLocation } from "react-router-dom";
import { Home, Search, ShoppingBag, Heart, User } from "lucide-react";

const tabs = [
  { to: "/", label: "Beranda", icon: Home },
  { to: "/search", label: "Cari Kos", icon: Search },
  { to: "/marketplace", label: "Market", icon: ShoppingBag },
  { to: "/favorites", label: "Favorit", icon: Heart },
  { to: "/dashboard", label: "Akun", icon: User },
];

export function MobileBottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-lg border-t border-border md:hidden">
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const active = location.pathname === tab.to;
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-medium transition-colors ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <tab.icon className={`w-5 h-5 ${active ? "text-primary" : ""}`} />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
