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

    const studentItems: SidebarItem[] = [
      { title: "Overview", href: "/dashboard", icon: LayoutDashboard },
      { title: "My Items", href: "/dashboard/my-items", icon: ShoppingBag },
      { title: "Sell Item", href: "/dashboard/sell-item", icon: PlusCircle },
      { title: "Favorites", href: "/dashboard/favorites", icon: Heart },
      { title: "Profile", href: "/dashboard/profile", icon: User },
      { title: "Settings", href: "/dashboard/settings", icon: SettingsIcon },
    ];

    const ownerItems: SidebarItem[] = [
      { title: "Overview", href: "/dashboard", icon: LayoutDashboard },
      { title: "My Boarding Houses", href: "/dashboard/my-kos", icon: Building2 },
      { title: "Add Boarding House", href: "/dashboard/add-kos", icon: PlusCircle },
      { title: "My Items", href: "/dashboard/my-items", icon: ShoppingBag },
      { title: "Sell Item", href: "/dashboard/sell-item", icon: PlusCircle },
      { title: "Favorites", href: "/dashboard/favorites", icon: Heart },
      { title: "Profile", href: "/dashboard/profile", icon: User },
      { title: "Settings", href: "/dashboard/settings", icon: SettingsIcon },
    ];

    switch (role) {
      case "owner":
        return ownerItems;
      case "student":
        return studentItems;
      default:
        return [];
    }
  };

  if (!user) {
    return null; // Don't render sidebar if no user
  }

  const items = getSidebarItems();

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card">
      <div className="p-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Home className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-foreground">
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