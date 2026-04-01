import { useState, useEffect } from "react";
import { ShieldAlert, Plus, Search, MessageSquare, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/BackButton";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ReportModal } from "@/components/ReportModal";

export default function UserReports() {
  const { user } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchUserReports = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('reporter_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Fetch target names
      const formatted = await Promise.all((data || []).map(async (r) => {
        let targetName = "Konten";
        try {
          if (r.type === 'user') {
            const { data: p } = await supabase.from('profiles').select('name').eq('id', r.target_id).single();
            if (p) targetName = p.name;
          } else if (r.type === 'kos') {
            const { data: k } = await supabase.from('kos_listings').select('title').eq('id', r.target_id).single();
            if (k) targetName = k.title;
          } else if (r.type === 'item') {
            const { data: i } = await supabase.from('marketplace_items').select('title').eq('id', r.target_id).single();
            if (i) targetName = i.title;
          }
        } catch (e) {
          console.warn("Could not fetch target name", e);
        }

        return {
          ...r,
          targetName,
          date: new Date(r.created_at).toLocaleDateString('id-ID', { 
            day: 'numeric', 
            month: 'short',
            year: 'numeric'
          })
        };
      }));

      setReports(formatted);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error("Gagal mengambil riwayat laporan");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserReports();

    // REALTIME: Listen for status changes
    const channel = supabase.channel(`user-reports-${user?.id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'reports', 
        filter: `reporter_id=eq.${user?.id}` 
      }, () => fetchUserReports())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'in_progress': return <Clock className="w-4 h-4 text-amber-500" />;
      default: return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'resolved': return 'Selesai';
      case 'in_progress': return 'Diproses';
      default: return 'Baru';
    }
  };

  const basePath = user?.role === "owner" ? "/owner-dashboard" : "/dashboard";

  return (
    <div className="space-y-8 pb-12">
      <BackButton to={basePath} className="mb-0" />
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Laporan Saya</h1>
          <p className="text-muted-foreground text-sm">Pantau status laporan yang telah Anda kirimkan ke admin.</p>
        </div>
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/20"
        >
          <Plus className="w-4 h-4 mr-2" />
          Kirim Laporan Baru
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          <div className="py-20 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-muted-foreground">Memuat laporan...</p>
          </div>
        ) : reports.length > 0 ? (
          reports.map((report) => (
            <div key={report.id} className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded-full bg-secondary text-[10px] font-bold uppercase tracking-wider">
                        {report.type}
                      </span>
                      <span className="text-xs text-muted-foreground">{report.date}</span>
                    </div>
                    <h3 className="font-bold text-foreground mb-1">Laporan: {report.targetName}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{report.reason}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 ml-14 md:ml-0">
                  <div className={cn(
                    "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                    report.status === 'resolved' ? "bg-emerald-50 text-emerald-600" :
                    report.status === 'in_progress' ? "bg-amber-50 text-amber-600" :
                    "bg-secondary text-muted-foreground"
                  )}>
                    {getStatusIcon(report.status)}
                    {getStatusLabel(report.status)}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-20 text-center bg-card rounded-3xl border border-dashed border-border">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-muted-foreground/40" />
            </div>
            <h3 className="text-lg font-display font-bold text-foreground">Belum ada laporan</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
              Anda belum pernah mengirimkan laporan. Gunakan tombol di atas untuk melaporkan masalah.
            </p>
          </div>
        )}
      </div>

      <ReportModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        targetId={user?.id || ""} // For general reports, we can use user's own ID or a fixed "system" ID
        targetName="Layanan / Sistem"
        type="user" // Default to user for general reports
        reporterId={user?.id || ""}
      />
    </div>
  );
}
