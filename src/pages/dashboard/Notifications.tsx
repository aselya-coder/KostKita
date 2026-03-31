import { useState } from "react";
import { useAuth } from "@/context/AuthContextType";
import { useNotifications } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";
import { MessageCircle, ShoppingBag, Info, Heart, Bell, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { BackButton } from "@/components/BackButton";
import { useNavigate } from "react-router-dom";

export default function Notifications() {
  const navigate = useNavigate();
  const { notifications, markAsRead, markAllAsRead, deleteNotif, isLoading } = useNotifications();
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");

  const handleNotifClick = (n: any) => {
    markAsRead(n.id);
    if (n.link) {
      navigate(n.link);
    }
  };

  const filteredNotifications = notifications.filter(n => 
    activeTab === "all" ? true : !n.isRead
  );

  const getNotifIcon = (type: string) => {
    switch (type) {
      case "inquiry": return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case "sale": return <ShoppingBag className="w-5 h-5 text-emerald-500" />;
      case "favorite": return <Heart className="w-5 h-5 text-pink-500" />;
      default: return <Info className="w-5 h-5 text-amber-500" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <BackButton className="mb-0" />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Semua Notifikasi</h1>
          <p className="text-muted-foreground text-sm">Pantau semua aktivitas dan pesan terbaru Anda.</p>
        </div>
        {notifications.some(n => !n.isRead) && (
          <Button 
            variant="outline" 
            onClick={markAllAsRead}
            className="rounded-xl border-border hover:bg-primary/5 hover:text-primary transition-colors text-xs h-9"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Tandai semua dibaca
          </Button>
        )}
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
        <div className="flex border-b border-border bg-secondary/30">
          <button
            onClick={() => setActiveTab("all")}
            className={cn(
              "px-6 py-4 text-sm font-semibold transition-all relative",
              activeTab === "all" ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Semua ({notifications.length})
            {activeTab === "all" && (
              <motion.div layoutId="notifTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("unread")}
            className={cn(
              "px-6 py-4 text-sm font-semibold transition-all relative",
              activeTab === "unread" ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Belum Dibaca ({notifications.filter(n => !n.isRead).length})
            {activeTab === "unread" && (
              <motion.div layoutId="notifTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        </div>

        <div className="divide-y border-border">
          <AnimatePresence mode="popLayout">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((n) => (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className={cn(
                    "p-6 flex gap-4 hover:bg-secondary/10 transition-colors group relative cursor-pointer",
                    !n.isRead && "bg-primary/[0.02]"
                  )}
                  onClick={() => handleNotifClick(n)}
                >
                  <div className="w-12 h-12 rounded-2xl bg-card border border-border flex items-center justify-center shrink-0 shadow-sm">
                    {getNotifIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-1">
                      <h4 className={cn("text-base leading-tight", !n.isRead ? "font-bold text-foreground" : "font-medium text-muted-foreground/80")}>
                        {n.title}
                      </h4>
                      <span className="text-[10px] font-medium text-muted-foreground/60 bg-secondary/50 px-2 py-0.5 rounded-full uppercase tracking-wider">{n.time}</span>
                    </div>
                    <p className={cn("text-sm leading-relaxed mb-4", !n.isRead ? "text-foreground/90" : "text-muted-foreground")}>{n.message}</p>
                    <div className="flex items-center gap-3 h-6">
                      {!n.isRead ? (
                        <button 
                          onClick={(e) => { e.stopPropagation(); markAsRead(n.id); }}
                          className="text-xs font-bold text-primary hover:underline"
                        >
                          Tandai dibaca
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Dibaca
                        </span>
                      )}
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteNotif(n.id); }}
                        className="text-xs font-bold text-destructive opacity-0 group-hover:opacity-100 transition-opacity ml-auto"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                  {!n.isRead && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary shadow-[2px_0_8px_rgba(var(--primary),0.2)]" />
                  )}
                </motion.div>
              ))
            ) : (
              <div className="p-20 text-center">
                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                  <Bell className="w-8 h-8 text-muted-foreground/40" />
                </div>
                <h3 className="text-lg font-display font-bold text-foreground">Tidak ada notifikasi</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {activeTab === "unread" ? "Bagus! Semua notifikasi Anda sudah dibaca." : "Notifikasi Anda akan muncul di sini."}
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
