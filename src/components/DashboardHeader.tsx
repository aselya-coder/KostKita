import { Bell, Menu, Search, User, LogOut, Settings as SettingsIcon, UserCircle, MessageCircle, ShoppingBag, Info, Heart, Home } from "lucide-react";
import { type User as UserType, type Notification } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";

interface DashboardHeaderProps {
  user: UserType;
  onMobileMenuOpen?: () => void;
}

export function DashboardHeader({ user, onMobileMenuOpen }: DashboardHeaderProps) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  
  const getDashboardPath = (path: string) => {
    const prefix = user.role === "admin" ? "/admin" : user.role === "owner" ? "/owner-dashboard" : "/dashboard";
    return `${prefix}${path}`;
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleNotifClick = (n: Notification) => {
    markAsRead(n.id);
    if (n.link) {
      navigate(n.link);
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case "inquiry": return <MessageCircle className="w-4 h-4 text-blue-500" />;
      case "sale": return <ShoppingBag className="w-4 h-4 text-emerald-500" />;
      case "favorite": return <Heart className="w-4 h-4 text-pink-500" />;
      default: return <Info className="w-4 h-4 text-amber-500" />;
    }
  };

  return (
    <header className="h-16 border-b border-border bg-background flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onMobileMenuOpen}>
          <Menu className="w-5 h-5" />
        </Button>
        <Link 
          to="/" 
          className="flex items-center gap-2"
          onClick={() => {
            if (window.location.pathname === "/") {
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
          }}
        >
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Home className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-foreground">
            KosKita
          </span>
        </Link>
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface ring-1 ring-foreground/5 w-64">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="bg-transparent text-sm w-full focus:outline-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5 text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-0 overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between bg-secondary/30">
              <h3 className="font-display font-bold text-sm">Notifikasi</h3>
              {unreadCount > 0 && (
                <button 
                  onClick={(e) => { e.preventDefault(); markAllAsRead(); }}
                  className="text-[10px] font-bold uppercase tracking-wider text-primary hover:underline"
                >
                  Tandai semua dibaca
                </button>
              )}
            </div>
            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map((n) => (
                  <div 
                    key={n.id} 
                    className={cn(
                      "p-4 flex gap-3 hover:bg-secondary/30 transition-colors cursor-pointer border-b border-border last:border-0",
                      !n.isRead && "bg-primary/[0.03]"
                    )}
                    onClick={() => handleNotifClick(n)}
                  >
                    <div className="mt-1 shrink-0">{getNotifIcon(n.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm leading-snug mb-1", !n.isRead ? "font-bold text-foreground" : "text-muted-foreground")}>
                        {n.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-1">{n.message}</p>
                      <p className="text-[10px] text-muted-foreground/60">{n.time}</p>
                    </div>
                    {!n.isRead && (
                      <div className="mt-2 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    )}
                  </div>
                ))
              ) : (
                <div className="p-8 text-center">
                  <p className="text-sm text-muted-foreground">Tidak ada notifikasi baru</p>
                </div>
              )}
            </div>
            {notifications.length > 0 && (
              <div className="p-2 bg-secondary/10 border-t border-border text-center">
                <Link 
                  to={getDashboardPath("/notifications")}
                  className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors block w-full py-1"
                >
                  Lihat Semua Notifikasi
                </Link>
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="p-1 rounded-full flex items-center gap-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={user.avatar} />
                <AvatarFallback>{user?.name ? user.name.charAt(0) : "U"}</AvatarFallback>
              </Avatar>
              <div className="hidden lg:flex flex-col items-start text-left">
                <span className="text-sm font-semibold text-foreground leading-none">
                  {user.name}
                </span>
                <span className="text-xs text-muted-foreground capitalize mt-1">
                  {user.role}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to={getDashboardPath("/profile")} className="w-full cursor-pointer flex items-center gap-2 px-2 py-1.5">
                <UserCircle className="w-4 h-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to={getDashboardPath("/settings")} className="w-full cursor-pointer flex items-center gap-2 px-2 py-1.5">
                <SettingsIcon className="w-4 h-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-destructive cursor-pointer flex items-center gap-2 px-2 py-1.5"
              onSelect={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}