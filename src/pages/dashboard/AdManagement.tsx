import { useState, useEffect } from "react";
import { BackButton } from "@/components/BackButton";
import { 
  Calendar, 
  Clock, 
  Shield, 
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Info,
  Megaphone,
  History,
  Zap,
  Settings as SettingsIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getSystemConfigs, updateMultipleConfigs } from "@/services/settings";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function AdManagement() {
  const [configs, setConfigs] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"settings" | "history">("settings");

  useEffect(() => {
    const loadConfigs = async () => {
      setIsLoading(true);
      try {
        const data = await getSystemConfigs();
        setConfigs(data);
      } catch (error) {
        console.error("Error loading configs:", error);
        toast.error("Gagal memuat pengaturan.");
      } finally {
        setIsLoading(false);
      }
    };
    loadConfigs();
  }, []);

  const handleUpdateConfig = (id: string, value: string) => {
    setConfigs(prev => ({ ...prev, [id]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await updateMultipleConfigs(configs);
      if (result.success) {
        toast.success("Pengaturan iklan berhasil diperbarui secara global.");
      } else {
        throw new Error("Gagal menyimpan ke database.");
      }
    } catch (error) {
      console.error("Error saving configs:", error);
      toast.error("Gagal menyimpan pengaturan.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <BackButton to="/admin" className="mb-0" />
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
              <Megaphone className="w-6 h-6 text-primary" />
              Manajemen Iklan Global
            </h1>
            <p className="text-muted-foreground text-sm italic">
              Atur masa aktif dan kebijakan iklan untuk seluruh ekosistem KosKita.
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn(
              "rounded-xl",
              activeTab === "settings" && "bg-primary/10 text-primary hover:bg-primary/20"
            )}
            onClick={() => setActiveTab("settings")}
          >
            <SettingsIcon className="w-4 h-4 mr-2" />
            Pengaturan
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn(
              "rounded-xl",
              activeTab === "history" && "bg-primary/10 text-primary hover:bg-primary/20"
            )}
            onClick={() => setActiveTab("history")}
          >
            <History className="w-4 h-4 mr-2" />
            Riwayat
          </Button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "settings" ? (
          <motion.div 
            key="settings"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="bg-card rounded-3xl border border-border overflow-hidden shadow-sm">
              <div className="p-8 border-b border-border bg-primary/[0.02] flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-display font-bold text-foreground">Durasi & Masa Aktif</h3>
                    <p className="text-xs text-muted-foreground italic">Menentukan kapan iklan akan otomatis dinonaktifkan.</p>
                  </div>
                </div>
              </div>

              <div className="p-8 space-y-8">
                <div className="max-w-2xl space-y-8">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-bold text-foreground flex items-center gap-2">
                        Masa Aktif Iklan Global
                        <div className="p-1 rounded-full bg-secondary/50 cursor-help" title="Durasi iklan tetap aktif sebelum kedaluwarsa">
                          <Info className="w-3 h-3 text-muted-foreground" />
                        </div>
                      </label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="number"
                          value={configs['ad_active_duration'] ?? ''}
                          onChange={(e) => handleUpdateConfig('ad_active_duration', e.target.value)}
                          className="w-24 px-4 py-2 rounded-xl bg-surface border border-border text-center font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                          min="1"
                          placeholder="30"
                        />
                        <span className="text-sm font-medium text-muted-foreground">Hari</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed italic">
                      Kebijakan durasi tayang iklan di seluruh platform saat ini ditetapkan selama <span className="font-bold">{configs['ad_active_duration'] || '0'} hari</span>. Setelah mencapai batas waktu ini, iklan kos maupun barang marketplace akan <span className="text-red-500 font-bold italic">otomatis dinonaktifkan</span> oleh sistem untuk menjaga relevansi data.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Zap className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-primary mb-1 italic">Dampak Perubahan Global</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Perubahan pada pengaturan ini akan <span className="font-bold underline">langsung diterapkan</span> pada setiap iklan baru maupun <span className="font-bold">iklan yang sedang berjalan</span> secara otomatis.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-3xl border border-border p-8 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground italic">Pastikan semua data sudah benar sebelum menyimpan.</p>
              </div>
              <Button 
                onClick={handleSave} 
                disabled={isSaving || isLoading}
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-10 py-6 h-auto text-base font-bold shadow-lg shadow-primary/20 transition-all active:scale-95"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Simpan Perubahan
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="history"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-card rounded-3xl border border-border p-12 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
              <History className="w-8 h-8 text-muted-foreground/40" />
            </div>
            <h3 className="text-lg font-display font-bold text-foreground italic">Fitur Riwayat Segera Hadir</h3>
            <p className="text-sm text-muted-foreground mt-1 italic">Anda akan dapat melihat siapa dan kapan pengaturan diubah.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
