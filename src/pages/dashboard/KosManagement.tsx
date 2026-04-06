import { useState, useEffect } from "react";
import { type KosListing, formatPrice } from "@/data/mockData";
import { BackButton } from "@/components/BackButton";
import { 
  CheckCircle2, 
  XCircle, 
  Search, 
  Home, 
  MapPin, 
  Eye, 
  Star, 
  ShieldCheck, 
  Clock, 
  Building2, 
  Trash2,
  Calendar,
  PowerOff,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { logUserActivity } from "@/services/activity";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function KosManagement() {
  const { user } = useAuth();
  const [listings, setListings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "approved">("all");

  const calculateRemainingDays = (expiresAt: string | null) => {
    if (!expiresAt) return null;
    const end = new Date(expiresAt);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const deactivateListing = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menonaktifkan kos ini? Pengguna tidak akan bisa melihat kos ini di pencarian.")) return;

    const { error } = await supabase
      .from('kos_listings')
      .update({ listing_status: 'expired' })
      .eq('id', id);
    
    if (error) {
      toast.error("Gagal menonaktifkan kos");
    } else {
      toast.success("Kos berhasil dinonaktifkan");
      fetchListings();
    }
  };

  const fetchListings = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('kos_listings')
      .select(`
        *,
        profiles:owner_id (name)
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching listings:', error);
      toast.error("Gagal mengambil data kos");
    } else {
      setListings(data as any || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchListings();

    // REALTIME: Listen for any changes in kos_listings
    const channel = supabase.channel('admin-kos-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'kos_listings' }, () => fetchListings())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredListings = listings.filter(l => 
    activeTab === "all" ? true : l.status === activeTab
  );

  const deleteListing = async (id: string) => {
    if (confirm("Hapus kos ini secara permanen dari database? Tindakan ini tidak dapat dibatalkan.")) {
      const { error } = await supabase
        .from('kos_listings')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting listing:', error);
        toast.error("Gagal menghapus kos");
      } else {
        setListings(prev => prev.filter(l => l.id !== id));
        toast.success("Kos berhasil dihapus permanen");
      }
    }
  };

  const approveListing = async (id: string) => {
    // Get kos title for logging
    const kosToApprove = listings.find(l => l.id === id);
    const kosTitle = kosToApprove?.title || "Kos";

    const { error } = await supabase
      .from('kos_listings')
      .update({ status: 'approved' })
      .eq('id', id);
    
    if (error) {
      toast.error("Gagal menyetujui kos");
    } else {
      // Log activity
      if (user) {
        await logUserActivity(user.id, 'Moderasi: Menyetujui listing kos', kosTitle, `/kos/${id}`);
      }
      setListings(prev => prev.map(l => 
        l.id === id ? { ...l, status: "approved" } : l
      ));
      toast.success("Kos disetujui");
    }
  };

  const rejectListing = async (id: string) => {
    // Get kos title for logging
    const kosToReject = listings.find(l => l.id === id);
    const kosTitle = kosToReject?.title || "Kos";

    const { error } = await supabase
      .from('kos_listings')
      .update({ status: 'rejected' })
      .eq('id', id);
    
    if (error) {
      toast.error("Gagal menolak kos");
    } else {
      // Log activity
      if (user) {
        await logUserActivity(user.id, 'Moderasi: Menolak listing kos', kosTitle, `/kos/${id}`);
      }
      setListings(prev => prev.map(l => 
        l.id === id ? { ...l, status: "rejected" } : l
      ));
      toast.success("Kos ditolak");
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <BackButton to="/admin-dashboard" className="mb-0" />
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Verifikasi Kos</h1>
          <p className="text-muted-foreground text-sm">Tinjau dan setujui listing kos baru yang masuk.</p>
        </div>
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
            Semua ({listings.length})
            {activeTab === "all" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("pending")}
            className={cn(
              "px-6 py-4 text-sm font-semibold transition-all relative",
              activeTab === "pending" ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Menunggu ({listings.filter(l => l.status === "pending").length})
            {activeTab === "pending" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("approved")}
            className={cn(
              "px-6 py-4 text-sm font-semibold transition-all relative",
              activeTab === "approved" ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Disetujui ({listings.filter(l => l.status === "approved" || !l.status).length})
            {activeTab === "approved" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        </div>

        <div className="divide-y border-border">
          {filteredListings.length > 0 ? (
            filteredListings.map((kos) => {
              const remainingDays = calculateRemainingDays(kos.expires_at);
              const isExpired = remainingDays !== null && remainingDays <= 0;
              const isModerationPending = kos.status === "pending";

              return (
                <div key={kos.id} className="p-6 flex flex-col md:flex-row gap-6 hover:bg-secondary/10 transition-colors group">
                  <div className="relative w-full md:w-48 h-32 rounded-xl overflow-hidden shadow-sm">
                    <img src={kos.images[0]} alt={kos.title} className="w-full h-full object-cover" />
                    {kos.is_premium && (
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-primary/90 text-primary-foreground text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-lg">
                        <Star className="w-2.5 h-2.5 fill-current" />
                        Premium
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                      <div className="space-y-1">
                        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                          {kos.title}
                          {kos.status === "approved" && (
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                          )}
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {kos.profiles?.name || "Pemilik tidak dikenal"}
                          </p>
                          <a 
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(kos.location)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-muted-foreground flex items-center gap-1 hover:text-primary transition-colors"
                          >
                            <MapPin className="w-3 h-3" />
                            {kos.location}
                          </a>
                          <span className="text-xs text-primary font-bold">
                            {formatPrice(kos.price)}/bulan
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1",
                            kos.status === "approved" || !kos.status ? "bg-emerald-50 text-emerald-600" :
                            kos.status === "pending" ? "bg-amber-50 text-amber-600" :
                            "bg-red-50 text-red-600"
                          )}>
                            {kos.status === "pending" && <Clock className="w-3 h-3" />}
                            Moderasi: {kos.status || "Approved"}
                          </span>
                          
                          <span className={cn(
                            "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                            kos.listing_status === "active" && !isExpired ? "bg-blue-50 text-blue-600 border-blue-100" :
                            "bg-slate-100 text-slate-600 border-slate-200"
                          )}>
                            Iklan: {kos.listing_status || "active"}
                          </span>
                        </div>

                        {kos.listing_status === "active" && (
                          <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {remainingDays !== null ? (
                              isExpired ? (
                                <span className="text-red-600 font-bold">Masa Aktif Habis</span>
                              ) : (
                                <span>Sisa {remainingDays} Hari</span>
                              )
                            ) : (
                              <span>Masa Aktif Selamanya</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-4 mt-auto">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" asChild className="text-xs text-muted-foreground hover:text-primary">
                          <Link to={`/kos/${kos.id}`}>
                            <Eye className="w-4 h-4 mr-2" />
                            Detail
                          </Link>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => deleteListing(kos.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Hapus Permanen
                        </Button>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-auto">
                        {isModerationPending && (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="rounded-lg h-8 text-[10px] uppercase font-bold text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => rejectListing(kos.id)}
                            >
                              <XCircle className="w-3 h-3 mr-1.5" />
                              Tolak
                            </Button>
                            <Button 
                              size="sm" 
                              className="rounded-lg h-8 text-[10px] uppercase font-bold bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200"
                              onClick={() => approveListing(kos.id)}
                            >
                              <CheckCircle2 className="w-3 h-3 mr-1.5" />
                              Setujui
                            </Button>
                          </>
                        )}
                        {kos.listing_status === "active" && (
                          <Button 
                            size="sm" 
                            variant="ghost"
                            className="rounded-lg h-8 text-[10px] uppercase font-bold text-slate-600 hover:bg-slate-100"
                            onClick={() => deactivateListing(kos.id)}
                          >
                            <PowerOff className="w-3 h-3 mr-1.5" />
                            Matikan Iklan
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-20 text-center">
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-muted-foreground/40" />
              </div>
              <h3 className="text-lg font-display font-bold text-foreground">Tidak ada listing kos</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {activeTab === "pending" ? "Bagus! Semua pengajuan kos baru sudah Anda tinjau." : "Listing kos akan muncul di sini."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
