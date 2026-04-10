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
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Pertanyaan Masuk</h1>
          <p className="text-muted-foreground text-sm">Kelola pesan dan minat dari calon penyewa kos Anda.</p>
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
            Semua ({inquiries.length})
            {activeTab === "all" && (
              <motion.div layoutId="inquiryTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("new")}
            className={cn(
              "px-6 py-4 text-sm font-semibold transition-all relative",
              activeTab === "new" ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Baru ({inquiries.filter(iq => iq.status === "new").length})
            {activeTab === "new" && (
              <motion.div layoutId="inquiryTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
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
                    "p-6 flex flex-col sm:flex-row gap-6 hover:bg-secondary/10 transition-colors group relative",
                    iq.status === "new" && "bg-primary/[0.02]"
                  )}
                >
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center shrink-0 shadow-sm font-bold text-lg text-muted-foreground">
                    {iq.senderName ? iq.senderName.charAt(0) : "?"}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-3">
                      <div>
                        <h4 className="text-base font-bold text-foreground flex items-center gap-2">
                          {iq.senderName}
                          {iq.status === "new" && (
                            <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-[10px] text-primary uppercase tracking-wider font-bold">Baru</span>
                          )}
                        </h4>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Home className="w-3 h-3" />
                            {iq.propertyName}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {iq.time}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <a 
                          href={`tel:${iq.senderPhone}`}
                          className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                          title="Hubungi"
                        >
                          <Phone className="w-4 h-4" />
                        </a>
                        <button 
                          onClick={() => deleteInquiry(iq.id)}
                          className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors opacity-0 group-hover:opacity-100"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-secondary/50 border border-border/50 text-sm text-foreground/80 leading-relaxed mb-4 italic">
                      "{iq.message}"
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {iq.status !== "replied" ? (
                          <Button 
                            size="sm" 
                            className="rounded-lg h-8 text-xs font-bold"
                            onClick={() => markAsReplied(iq.id)}
                          >
                            Tandai Sudah Dibalas
                          </Button>
                        ) : (
                          <span className="text-xs font-bold text-emerald-500 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4" />
                            Sudah Dibalas
                          </span>
                        )}
                      </div>
                      <a 
                        href={`https://wa.me/${iq.senderPhone}?text=${encodeURIComponent(`Halo ${iq.senderName}, saya owner dari ${iq.propertyName}...`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                      >
                        <MessageCircle className="w-3 h-3" />
                        Balas via WhatsApp
                      </a>
                    </div>
                  </div>

                  {iq.status === "new" && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary shadow-[2px_0_8px_rgba(var(--primary),0.2)]" />
                  )}
                </motion.div>
              ))
            ) : (
              <div className="p-20 text-center">
                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8 text-muted-foreground/40" />
                </div>
                <h3 className="text-lg font-display font-bold text-foreground">Tidak ada pertanyaan</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {activeTab === "new" ? "Bagus! Semua pertanyaan sudah Anda tindak lanjuti." : "Pertanyaan dari calon penyewa akan muncul di sini."}
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
