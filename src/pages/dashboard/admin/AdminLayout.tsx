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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const AdminLayout = () => {
  const { user } = useAuth();
  const location = useLocation();

  const navItems = [
    { href: "/admin-dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin-dashboard/users", label: "User Management", icon: Users },
    { href: "/admin-dashboard/kos", label: "Kos Management", icon: Building2 },
    { href: "/admin-dashboard/reports", label: "Reports", icon: ShieldAlert },
    { href: "/admin-dashboard/activity-log", label: "Activity Log", icon: BarChart },
    { href: "/admin-dashboard/coin-packages", label: "Coin Packages", icon: Coins },
    { href: "/admin-dashboard/system-settings", label: "System Settings", icon: Settings },
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

        <nav className="flex-grow space-y-2">
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

        <div className="mt-auto">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary">
            <Avatar className="w-10 h-10 border-2 border-primary">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback>{user?.name?.[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold">{user?.name}</p>
              <p className="text-xs text-muted-foreground">Administrator</p>
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