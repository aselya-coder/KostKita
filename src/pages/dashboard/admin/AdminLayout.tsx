import { ReactNode, useState } from "react";
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
  Menu,
  X,
  Globe,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/", label: "Lihat Website", icon: Globe, isExternal: true },
    { href: "/admin/users", label: "User Management", icon: Users },
    { href: "/admin/kos", label: "Kos Management", icon: Building2 },
    { href: "/admin/advertisements", label: "Advertisements", icon: Zap },
    { href: "/admin/marketplace", label: "Marketplace", icon: ShoppingBag },
    { href: "/admin/topup-users", label: "Topup Users", icon: Coins },
    { href: "/admin/reports", label: "Reports", icon: ShieldAlert },
    { href: "/admin/activity-log", label: "Activity Log", icon: BarChart },
    { href: "/admin/coin-packages", label: "Coin Packages", icon: Coins },
    { href: "/admin/system-settings", label: "System Settings", icon: Settings },
    { href: "/dashboard/profile", label: "My Profile", icon: User },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 mb-10 px-2">
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
            onClick={() => setIsMobileMenuOpen(false)}
            className={cn(
              "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
              location.pathname === item.href
                ? "bg-primary text-primary-foreground shadow-sm"
                : item.isExternal 
                  ? "text-emerald-600 hover:bg-emerald-50"
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
    </div>
  );

  return (
    <div className="flex min-h-screen bg-secondary/50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-shrink-0 bg-card border-r border-border p-6 flex-col sticky top-0 h-screen">
        <SidebarContent />
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between p-4 bg-card border-b border-border sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-lg font-bold font-display">Admin Panel</h1>
          </div>
          
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-6">
              <SidebarContent />
            </SheetContent>
          </Sheet>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;