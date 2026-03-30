import { useState, useEffect } from "react";
import { BackButton } from "@/components/BackButton";
import { AlertTriangle, User, MessageCircle, ShoppingBag, Home, CheckCircle2, Trash2, ShieldAlert, Clock, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function Reports() {
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "new">("all");

  const fetchReports = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching reports:', error);
      toast.error("Gagal mengambil data laporan");
    } else {
      // Map basic data
      const formatted = (data || []).map(r => ({
        ...r,
        reporterName: "User", // Placeholder if profile not joined
        targetName: "Konten", // Placeholder
        time: new Date(r.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
      }));
      setReports(formatted);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchReports();

    // REALTIME: Listen for report changes
    const channel = supabase.channel('admin-reports-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => fetchReports())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const deleteReport = async (id: string) => {
    if (confirm("Hapus laporan ini secara permanen dari database?")) {
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', id);
      
      if (error) {
        toast.error("Gagal menghapus laporan");
      } else {
        setReports(prev => prev.filter(r => r.id !== id));
        toast.success("Laporan berhasil dihapus permanen");
      }
    }
  };

  const filteredReports = reports.filter(r => 
    activeTab === "all" ? true : r.status === "new"
  );

  const resolveReport = async (id: string) => {
    const { error } = await supabase
      .from('reports')
      .update({ status: 'resolved' })
      .eq('id', id);
    
    if (error) {
      toast.error("Gagal memproses laporan");
    } else {
      setReports(prev => prev.map(r => 
        r.id === id ? { ...r, status: "resolved" } : r
      ));
      toast.success("Laporan diselesaikan");
    }
  };

  const dismissReport = async (id: string) => {
    const { error } = await supabase
      .from('reports')
      .update({ status: 'dismissed' })
      .eq('id', id);
    
    if (error) {
      toast.error("Gagal menolak laporan");
    } else {
      setReports(prev => prev.map(r => 
        r.id === id ? { ...r, status: "dismissed" } : r
      ));
      toast.success("Laporan ditolak");
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "user": return <User className="w-4 h-4 text-blue-500" />;
      case "kos": return <Home className="w-4 h-4 text-emerald-500" />;
      case "item": return <ShoppingBag className="w-4 h-4 text-amber-500" />;
      default: return <Flag className="w-4 h-4 text-primary" />;
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <BackButton to="/admin" className="mb-0" />
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Laporan Masalah</h1>
          <p className="text-muted-foreground text-sm">Tangani laporan dari pengguna mengenai konten atau akun.</p>
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
            Semua ({reports.length})
            {activeTab === "all" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("new")}
            className={cn(
              "px-6 py-4 text-sm font-semibold transition-all relative",
              activeTab === "new" ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Baru ({reports.filter(r => r.status === "new").length})
            {activeTab === "new" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        </div>

        <div className="divide-y border-border">
          {filteredReports.length > 0 ? (
            filteredReports.map((report) => (
              <div key={report.id} className={cn(
                "p-6 flex flex-col sm:flex-row gap-6 hover:bg-secondary/10 transition-colors group relative",
                report.status === "new" && "bg-red-50/20"
              )}>
                <div className="w-12 h-12 rounded-2xl bg-card border border-border flex items-center justify-center shrink-0 shadow-sm">
                  {getTypeIcon(report.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-3">
                    <div>
                      <h4 className="text-base font-bold text-foreground flex items-center gap-2">
                        {report.targetName}
                        {report.status === "new" && (
                          <span className="px-1.5 py-0.5 rounded-full bg-red-100 text-[10px] text-red-600 uppercase tracking-wider font-bold">New</span>
                        )}
                      </h4>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <User className="w-3 h-3" />
                          Pelapor: {report.reporterName}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {report.time}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1",
                        report.status === "resolved" ? "bg-emerald-50 text-emerald-600" :
                        report.status === "new" ? "bg-red-50 text-red-600" :
                        "bg-secondary text-muted-foreground"
                      )}>
                        {report.status}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-secondary/50 border border-border/50 text-sm text-foreground/80 leading-relaxed mb-4">
                    <span className="font-bold text-red-600 mr-2">Alasan:</span>
                    {report.reason}
                  </div>

                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => deleteReport(report.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Hapus Laporan
                      </Button>
                    </div>

                    {report.status === "new" && (
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="rounded-lg h-8 text-xs font-bold"
                          onClick={() => dismissReport(report.id)}
                        >
                          <Trash2 className="w-3 h-3 mr-1.5" />
                          Abaikan
                        </Button>
                        <Button 
                          size="sm" 
                          className="rounded-lg h-8 text-xs font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                          onClick={() => resolveReport(report.id)}
                        >
                          <CheckCircle2 className="w-3 h-3 mr-1.5" />
                          Tindak Lanjuti
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {report.status === "new" && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 shadow-[2px_0_8px_rgba(239,68,68,0.2)]" />
                )}
              </div>
            ))
          ) : (
            <div className="p-20 text-center">
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                <ShieldAlert className="w-8 h-8 text-muted-foreground/40" />
              </div>
              <h3 className="text-lg font-display font-bold text-foreground">Tidak ada laporan</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {activeTab === "new" ? "Bagus! Semua laporan sudah Anda selesaikan." : "Laporan masalah akan muncul di sini."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
