import { useState, useEffect } from "react";
import { type KosListing, formatPrice } from "@/data/mockData";
import { BackButton } from "@/components/BackButton";
import { CheckCircle2, XCircle, Search, Home, MapPin, Eye, Star, ShieldCheck, Clock, Building2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { logUserActivity } from "@/services/marketplace";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function KosManagement() {
  const { user } = useAuth();
  const [listings, setListings] = useState<KosListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "approved">("all");

  const fetchListings = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('kos_listings')
      .select('*')
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
            filteredListings.map((kos) => (
              <div key={kos.id} className="p-6 flex flex-col md:flex-row gap-6 hover:bg-secondary/10 transition-colors group">
                <div className="relative w-full md:w-48 h-32 rounded-xl overflow-hidden shadow-sm">
                  <img src={kos.images[0]} alt={kos.title} className="w-full h-full object-cover" />
                  {kos.isPremium && (
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-primary/90 text-primary-foreground text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-lg">
                      <Star className="w-2.5 h-2.5 fill-current" />
                      Premium
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-foreground mb-1 flex items-center gap-2">
                        {kos.title}
                        {kos.status === "approved" && (
                          <ShieldCheck className="w-4 h-4 text-emerald-500" />
                        )}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                        <a 
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(kos.location)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-muted-foreground flex items-center gap-1 hover:text-primary transition-colors"
                        >
                          <MapPin className="w-3 h-3" />
                          {kos.location}
                        </a>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Home className="w-3 h-3" />
                          {kos.availableRooms} Kamar Tersisa
                        </span>
                        <span className="text-xs text-primary font-bold">
                          {formatPrice(kos.price)}/bulan
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1",
                        kos.status === "approved" || !kos.status ? "bg-emerald-50 text-emerald-600" :
                        kos.status === "pending" ? "bg-amber-50 text-amber-600" :
                        "bg-red-50 text-red-600"
                      )}>
                        {kos.status === "pending" && <Clock className="w-3 h-3" />}
                        {kos.status || "Approved"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => deleteListing(kos.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Hapus Permanen
                      </Button>
                      <Button variant="ghost" size="sm" asChild className="text-xs text-muted-foreground hover:text-primary">
                        <Link to={`/kos/${kos.id}`}>
                          <Eye className="w-4 h-4 mr-2" />
                          Lihat Detail
                        </Link>
                      </Button>
                    </div>
                    
                    {kos.status === "pending" && (
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="rounded-lg h-8 text-xs font-bold text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => rejectListing(kos.id)}
                        >
                          <XCircle className="w-3 h-3 mr-1.5" />
                          Tolak
                        </Button>
                        <Button 
                          size="sm" 
                          className="rounded-lg h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200"
                          onClick={() => approveListing(kos.id)}
                        >
                          <CheckCircle2 className="w-3 h-3 mr-1.5" />
                          Setujui
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
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
