import { ReactNode } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Building2,
  ShieldAlert,
  Settings,
  BarChart,
  Coins,
  ShoppingBag,
  User,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/users", label: "User Management", icon: Users },
    { href: "/admin/kos", label: "Kos Management", icon: Building2 },
    { href: "/admin/marketplace", label: "Marketplace", icon: ShoppingBag },
    { href: "/admin/reports", label: "Reports", icon: ShieldAlert },
    { href: "/admin/activity-log", label: "Activity Log", icon: BarChart },
    { href: "/admin/coin-packages", label: "Coin Packages", icon: Coins },
    { href: "/admin/system-settings", label: "System Settings", icon: Settings },
    { href: "/dashboard/profile", label: "My Profile", icon: User },
  ];

  return (
    <div className="flex min-h-screen bg-secondary/50">
      <aside className="w-64 flex-shrink-0 bg-card border-r border-border p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold font-display">Admin Panel</h1>
        </div>

        <nav className="flex-grow space-y-2 overflow-y-auto pr-2 custom-scrollbar">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
                location.pathname === item.href
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="mt-auto pt-6 space-y-4">
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 px-4 py-2.5 text-sm font-medium text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </Button>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-border/50">
            <Avatar className="w-10 h-10 border-2 border-primary/20">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback>{user?.name?.[0]}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-bold truncate">{user?.name}</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Administrator</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;