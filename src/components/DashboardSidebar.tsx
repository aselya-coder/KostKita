import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Home, 
  ShoppingBag, 
  Heart, 
  User, 
  PlusCircle, 
  Users, 
  Building2, 
  BarChart3, 
  LogOut,
  ShieldAlert,
  HelpCircle,
  MessageSquare,
  Settings as SettingsIcon,
  Coins,
  CalendarCheck,
  MessageCircle,
  type LucideIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface SidebarItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

export function DashboardSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const getSidebarItems = (): SidebarItem[] => {
    const role = user?.role;

    if (role === "admin") {
      return [
        { title: "Admin Panel", href: "/admin", icon: ShieldAlert },
        { title: "Profile", href: "/dashboard/profile", icon: User },
        { title: "Settings", href: "/dashboard/settings", icon: SettingsIcon },
      ];
    }

    if (role === "owner") {
      return [
        { title: "Ringkasan", href: "/dashboard", icon: LayoutDashboard },
        { title: "Pemesanan Masuk", href: "/dashboard/bookings", icon: CalendarCheck },
        { title: "Chat", href: "/dashboard/chat", icon: MessageCircle },
        { title: "Kos Saya", href: "/dashboard/my-kos", icon: Building2 },
        { title: "Tambah Kos", href: "/dashboard/add-kos", icon: PlusCircle },
        { title: "Marketplace Saya", href: "/dashboard/my-items", icon: ShoppingBag },
        { title: "Jual Barang", href: "/dashboard/sell-item", icon: PlusCircle },
        { title: "Top Up Koin", href: "/dashboard/topup", icon: Coins },
        { title: "Profil", href: "/dashboard/profile", icon: User },
        { title: "Pengaturan", href: "/dashboard/settings", icon: SettingsIcon },
      ];
    }

    // Default for student/user
    return [
      { title: "Ringkasan", href: "/dashboard", icon: LayoutDashboard },
      { title: "Pemesanan Saya", href: "/dashboard/bookings", icon: CalendarCheck },
      { title: "Chat", href: "/dashboard/chat", icon: MessageCircle },
      { title: "Marketplace Saya", href: "/dashboard/my-items", icon: ShoppingBag },
      { title: "Jual Barang", href: "/dashboard/sell-item", icon: PlusCircle },
      { title: "Favorit", href: "/dashboard/favorites", icon: Heart },
      { title: "Top Up Koin", href: "/dashboard/topup", icon: Coins },
      { title: "Profil", href: "/dashboard/profile", icon: User },
      { title: "Pengaturan", href: "/dashboard/settings", icon: SettingsIcon },
    ];
  };

  if (!user) {
    return null; // Don't render sidebar if no user
  }

  const items = getSidebarItems();

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card">
      {/* Logo */}
      <div className="mb-10 px-6 pt-6">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform duration-300">
            <Home className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold font-display tracking-tight text-foreground">
            KosKita
          </span>
        </Link>
      </div>
      
      <nav className="flex-1 px-4 space-y-1">
        {items.map((item) => {
          const active = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                active 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <item.icon className={cn("w-4 h-4", active ? "text-primary" : "")} />
              {item.title}
            </Link>
          );
        })}

        <div className="pt-4 mt-4 border-t border-border">
          <p className="px-3 mb-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Bantuan
          </p>
          <Link
            to="/faq"
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              location.pathname === "/faq"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}
          >
            <HelpCircle className="w-4 h-4" />
            FAQ
          </Link>
          <Link
            to="/contact"
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              location.pathname === "/contact"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}
          >
            <MessageSquare className="w-4 h-4" />
            Kontak Kami
          </Link>
        </div>
      </nav>

      <div className="p-4 border-t border-border">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}