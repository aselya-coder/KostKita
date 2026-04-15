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
  X, 
  type LucideIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface SidebarItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

interface DashboardSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function DashboardSidebar({ isOpen, onClose }: DashboardSidebarProps) {
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

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="mb-10 px-6 pt-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform duration-300">
            <Home className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold font-display tracking-tight text-foreground">
            KosKita
          </span>
        </Link>
        {onClose && (
          <Button variant="ghost" size="icon" className="md:hidden" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto scrollbar-hide">
        {items.map((item) => {
          const isActive = location.pathname === item.href || (item.href !== "/dashboard" && location.pathname.startsWith(item.href));
          return (    
            <Link
              key={item.href}
              to={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
              {item.title}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-border mt-auto">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          Keluar
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[60] md:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 bg-card border-r border-border z-[70] md:hidden shadow-2xl"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}