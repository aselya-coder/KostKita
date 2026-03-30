import { ReactNode, useState } from "react";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardHeader } from "./DashboardHeader";
import { type User as UserType } from "@/data/mockData";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Home, LogOut, HelpCircle, MessageSquare, LayoutDashboard, Users, Building, ShoppingBag, Package, Heart, User as UserIcon } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

interface DashboardLayoutProps {
  children: ReactNode;
  user: UserType;
}

export function DashboardLayout({ children, user }: DashboardLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const getMobileSidebarItems = () => {
    switch (user.role) {
      case "admin":
        return [
          { title: "Overview", href: "/admin", icon: Home },
          { title: "Users", href: "/admin/users", icon: Home },
          { title: "Kos", href: "/admin/kos", icon: Home },
          { title: "Market", href: "/admin/marketplace", icon: Home },
        ];
      case "owner":
        return [
          { title: "Overview", href: "/owner-dashboard", icon: Home },
          { title: "My Kos", href: "/owner-dashboard/my-kos", icon: Home },
          { title: "My Items", href: "/owner-dashboard/my-items", icon: Home },
          { title: "Profile", href: "/owner-dashboard/profile", icon: Home },
        ];
      case "student":
        return [
          { title: "Overview", href: "/dashboard", icon: Home },
          { title: "My Items", href: "/dashboard/my-items", icon: Home },
          { title: "Favorites", href: "/dashboard/favorites", icon: Home },
          { title: "Profile", href: "/dashboard/profile", icon: Home },
        ];
      default:
        return [];
    }
  };

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Desktop Sidebar */}
      <DashboardSidebar role={user.role} />

      {/* Mobile Sidebar (Sheet) */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-64 bg-card">
          <SheetHeader className="p-6 border-b border-border">
            <SheetTitle className="text-left">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <Home className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-display font-bold text-xl tracking-tight text-foreground">
                  KosKita
                </span>
              </Link>
            </SheetTitle>
            <SheetDescription className="sr-only">
              Menu navigasi untuk dashboard KosKita.
            </SheetDescription>
          </SheetHeader>
          <nav className="p-4 space-y-1">
            {getMobileSidebarItems().map((item) => {
              const active = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
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
                onClick={() => setMobileMenuOpen(false)}
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
                onClick={() => setMobileMenuOpen(false)}
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
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <DashboardHeader user={user} onMobileMenuOpen={() => setMobileMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
