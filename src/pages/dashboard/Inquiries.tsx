import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { type Inquiry } from "@/data/mockData";
import { getInquiries, updateInquiryStatus, deleteInquiry as deleteInquiryService } from "@/services/inquiries";
import { BackButton } from "@/components/BackButton";
import { cn } from "@/lib/utils";
import { MessageCircle, Phone, Home, Clock, Trash2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";

export default function Inquiries() {
  const { user } = useAuth();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "new">("all");

  const fetchInquiries = async () => {
    if (!user) return;
    setIsLoading(true);
    const data = await getInquiries(user.id);
    setInquiries(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchInquiries();

    // Subscribe to REALTIME changes for inquiries
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inquiries',
          filter: `owner_id=eq.${user?.id}`
        },
        () => {
          // Refresh data whenever anything changes in the database
          fetchInquiries();
        }
      )
      .subscribe();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [user]);

  const deleteInquiry = async (id: string) => {
    if (confirm("Hapus pesan ini?")) {
      const { success } = await deleteInquiryService(id);
      if (success) {
        setInquiries(prev => prev.filter(iq => iq.id !== id));
      }
    }
  };

  const markAsReplied = async (id: string) => {
    const { success } = await updateInquiryStatus(id, "replied");
    if (success) {
      setInquiries(prev => prev.map(iq => 
        iq.id === id ? { ...iq, status: "replied" } : iq
      ));
    }
  };

  const filteredInquiries = inquiries.filter(iq => 
    activeTab === "all" ? true : iq.status === "new"
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <BackButton className="mb-0" />
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-display font-bold text-foreground tracking-tight">Pertanyaan Masuk</h1>
          <p className="text-muted-foreground">Kelola pesan dan minat dari calon penyewa kos Anda.</p>
        </div>
      </div>

      <div className="bg-card rounded-3xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
        <div className="flex border-b border-border bg-secondary/30">
          <button
            onClick={() => setActiveTab("all")}
            className={cn(
              "px-8 py-5 text-sm font-bold transition-all relative",
              activeTab === "all" ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Semua ({inquiries.length})
            {activeTab === "all" && (
              <motion.div layoutId="inquiryTab" className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("new")}
            className={cn(
              "px-8 py-5 text-sm font-bold transition-all relative",
              activeTab === "new" ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Baru ({inquiries.filter(iq => iq.status === "new").length})
            {activeTab === "new" && (
              <motion.div layoutId="inquiryTab" className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />
            )}
          </button>
        </div>

        <div className="divide-y border-border">
          <AnimatePresence mode="popLayout">
            {filteredInquiries.length > 0 ? (
              filteredInquiries.map((iq) => (
                <motion.div
                  key={iq.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className={cn(
                    "p-8 flex flex-col sm:flex-row gap-8 hover:bg-secondary/10 transition-colors group relative",
                    iq.status === "new" && "bg-primary/[0.02]"
                  )}
                >
                  <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center shrink-0 shadow-sm font-bold text-xl text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    {iq.senderName ? iq.senderName.charAt(0) : "?"}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                      <div className="space-y-1">
                        <h4 className="text-lg font-bold text-foreground flex items-center gap-3">
                          {iq.senderName}
                          {iq.status === "new" && (
                            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-[10px] text-primary uppercase tracking-widest font-bold border border-primary/20">Baru</span>
                          )}
                        </h4>
                        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-1">
                          <span className="text-xs text-muted-foreground flex items-center gap-2 bg-secondary/50 px-3 py-1 rounded-full">
                            <Home className="w-3.5 h-3.5 text-primary" />
                            {iq.propertyName}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-2 bg-secondary/50 px-3 py-1 rounded-full">
                            <Clock className="w-3.5 h-3.5 text-primary" />
                            {iq.time}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <a 
                          href={`tel:${iq.senderPhone}`}
                          className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all active:scale-90 shadow-sm"
                          title="Hubungi"
                        >
                          <Phone className="w-4 h-4" />
                        </a>
                        <button 
                          onClick={() => deleteInquiry(iq.id)}
                          className="p-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-all active:scale-90 opacity-0 group-hover:opacity-100 shadow-sm"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-secondary/50 border border-border/50 text-sm text-foreground/80 leading-relaxed mb-6 italic shadow-inner">
                      "{iq.message}"
                    </div>

                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-3">
                        {iq.status !== "replied" ? (
                          <Button 
                            size="sm" 
                            className="rounded-xl h-9 px-4 text-xs font-bold shadow-md shadow-primary/10 transition-all active:scale-95"
                            onClick={() => markAsReplied(iq.id)}
                          >
                            Tandai Sudah Dibalas
                          </Button>
                        ) : (
                          <span className="text-xs font-bold text-emerald-500 bg-emerald-50 px-3 py-1.5 rounded-full flex items-center gap-2 border border-emerald-100">
                            <CheckCircle2 className="w-4 h-4" />
                            Sudah Dibalas
                          </span>
                        )}
                      </div>
                      <a 
                        href={`https://wa.me/${iq.senderPhone}?text=${encodeURIComponent(`Halo ${iq.senderName}, saya owner dari ${iq.propertyName}...`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl hover:bg-emerald-100 transition-all flex items-center gap-2 border border-emerald-100 shadow-sm"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Balas via WhatsApp
                      </a>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="p-20 text-center">
                <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <MessageCircle className="w-10 h-10 text-muted-foreground/40" />
                </div>
                <h3 className="text-xl font-display font-bold text-foreground mb-2">Tidak ada pertanyaan</h3>
                <p className="text-muted-foreground max-w-xs mx-auto italic">
                  {activeTab === "new" ? "Semua pertanyaan baru sudah Anda balas!" : "Belum ada calon penyewa yang bertanya."}
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
