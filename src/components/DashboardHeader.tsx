import { Bell, Menu, Search, User, LogOut, Settings as SettingsIcon, UserCircle } from "lucide-react";
import { type User as UserType } from "@/data/mockData";
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
import { useAuth } from "@/context/AuthContext";

interface DashboardHeaderProps {
  user: UserType;
  onMobileMenuOpen?: () => void;
}

export function DashboardHeader({ user, onMobileMenuOpen }: DashboardHeaderProps) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  const getDashboardPath = (path: string) => {
    const prefix = user.role === "admin" ? "/admin" : user.role === "owner" ? "/owner-dashboard" : "/dashboard";
    return `${prefix}${path}`;
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="h-16 border-b border-border bg-background flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onMobileMenuOpen}>
          <Menu className="w-5 h-5" />
        </Button>
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
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full" />
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="p-1 rounded-full flex items-center gap-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={user.avatar} />
                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="hidden lg:flex flex-col items-start">
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
              <Link to={getDashboardPath("/profile")} className="w-full cursor-pointer flex items-center gap-2">
                <UserCircle className="w-4 h-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to={getDashboardPath("/settings")} className="w-full cursor-pointer flex items-center gap-2">
                <SettingsIcon className="w-4 h-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-destructive cursor-pointer flex items-center gap-2"
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
