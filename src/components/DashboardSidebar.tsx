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
  type LucideIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface SidebarItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

interface DashboardSidebarProps {
  role: "admin" | "owner" | "student";
}

export function DashboardSidebar({ role }: DashboardSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const getSidebarItems = (): SidebarItem[] => {
    switch (role) {
      case "admin":
        return [
          { title: "Overview", href: "/admin", icon: LayoutDashboard },
          { title: "Users", href: "/admin/users", icon: Users },
          { title: "Boarding Houses", href: "/admin/kos", icon: Building2 },
          { title: "Marketplace", href: "/admin/marketplace", icon: ShoppingBag },
          { title: "Reports", href: "/admin/reports", icon: ShieldAlert },
          { title: "Activity Log", href: "/admin/activity-log", icon: BarChart3 },
          { title: "Favorites", href: "/admin/favorites", icon: Heart },
        ];
      case "owner":
        return [
          { title: "Overview", href: "/owner-dashboard", icon: LayoutDashboard },
          { title: "My Boarding Houses", href: "/owner-dashboard/my-kos", icon: Building2 },
          { title: "Add Boarding House", href: "/owner-dashboard/add-kos", icon: PlusCircle },
          { title: "My Items", href: "/owner-dashboard/my-items", icon: ShoppingBag },
          { title: "Sell Item", href: "/owner-dashboard/sell-item", icon: PlusCircle },
          { title: "Laporan", href: "/owner-dashboard/reports", icon: ShieldAlert },
          { title: "Favorites", href: "/owner-dashboard/favorites", icon: Heart },
          { title: "Profile", href: "/owner-dashboard/profile", icon: User },
        ];
      case "student":
        return [
          { title: "Overview", href: "/dashboard", icon: LayoutDashboard },
          { title: "My Items", href: "/dashboard/my-items", icon: ShoppingBag },
          { title: "Sell Item", href: "/dashboard/sell-item", icon: PlusCircle },
          { title: "Laporan", href: "/dashboard/reports", icon: ShieldAlert },
          { title: "Favorites", href: "/dashboard/favorites", icon: Heart },
          { title: "Profile", href: "/dashboard/profile", icon: User },
        ];
      default:
        return [];
    }
  };

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