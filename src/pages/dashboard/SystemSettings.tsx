import { useState, useEffect } from "react";
import { BackButton } from "@/components/BackButton";
import { 
  Shield, 
  Save,
  RefreshCw,
  Coins,
  CreditCard,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { getSystemConfigs, updateMultipleConfigs } from "@/services/settings";

interface ConfigItem {
  id: string;
  label: string;
  type: string;
  description: string;
  options?: string[];
}

export default function SystemSettings() {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [configs, setConfigs] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadConfigs = async () => {
      setIsLoading(true);
      const data = await getSystemConfigs();
      setConfigs(data);
      setIsLoading(false);
    };
    loadConfigs();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    const result = await updateMultipleConfigs(configs);
    if (result.success) {
      toast.success("Konfigurasi sistem berhasil diperbarui.");
    } else {
      toast.error("Gagal memperbarui konfigurasi.");
    }
    setIsSaving(false);
  };

  const updateConfig = (key: string, value: string) => {
    setConfigs(prev => ({ ...prev, [key]: value }));
  };

  const monetizationSections: { title: string; icon: any; items: ConfigItem[] }[] = [
    {
      title: "Monetisasi & Koin",
      icon: Coins,
      items: [
        { id: 'coin_price', label: "Harga per Koin (IDR)", type: "number", description: "Harga dasar 1 koin dalam Rupiah." },
        { id: 'ad_cost_per_day', label: "Biaya Iklan per Hari (Koin)", type: "number", description: "Jumlah koin yang didebet setiap hari untuk iklan aktif." },
        { id: 'free_ad_duration', label: "Durasi Iklan Gratis (Hari)", type: "number", description: "Lama waktu iklan pertama gratis untuk user baru." },
      ]
    },
    {
      title: "Biaya Layanan (Admin Fee)",
      icon: CreditCard,
      items: [
        { id: 'admin_fee_type', label: "Tipe Biaya Admin", type: "select", options: ["Flat", "Persentase"], description: "Cara menghitung biaya admin pada top up." },
        { id: 'admin_fee_value', label: "Nilai Biaya Admin", type: "number", description: "Nilai flat (Rp) atau persentase (%) biaya admin." },
        { id: 'min_topup', label: "Minimal Top Up (Koin)", type: "number", description: "Batas minimum pembelian koin per transaksi." },
        { id: 'max_topup', label: "Maksimal Top Up (Koin)", type: "number", description: "Batas maksimum pembelian koin per transaksi." },
      ]
    }
  ];

  const platformSections: { title: string; icon: any; items: ConfigItem[] }[] = [
    {
      title: "Moderasi & Keamanan",
      icon: Shield,
      items: [
        { id: 'auto_approve_ads', label: "Auto-Approve Iklan", type: "switch", description: "Setujui iklan baru secara otomatis tanpa review manual." },
        { id: 'user_reports_enabled', label: "Sistem Laporan User", type: "switch", description: "Izinkan user melaporkan konten atau akun mencurigakan." },
      ]
    }
  ];

  const getBackPath = () => {
    if (!user) return "/";
    if (user.role === "admin") return "/admin-dashboard";
    if (user.role === "owner") return "/owner-dashboard";
    return "/dashboard";
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium">Memuat konfigurasi...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <BackButton to={getBackPath()} className="mb-0" />
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">System Settings</h1>
          <p className="text-muted-foreground text-sm">Konfigurasi global platform dan pemeliharaan sistem.</p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-6"
        >
          {isSaving ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Simpan Perubahan
        </Button>
      </div>

      <div className="space-y-6">
        {[...monetizationSections, ...platformSections].map((section, idx) => (
          <div key={idx} className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
            <div className="p-6 border-b border-border bg-secondary/30 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <section.icon className="w-4 h-4 text-primary" />
              </div>
              <h3 className="font-display font-bold text-foreground">{section.title}</h3>
            </div>
            <div className="p-6 divide-y divide-border">
              {section.items.map((item, itemIdx) => (
                <div key={itemIdx} className="py-6 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1 max-w-md">
                    <label className="text-sm font-bold text-foreground">{item.label}</label>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                  <div className="flex-shrink-0 w-full sm:w-auto min-w-[120px]">
                    {item.type === "switch" ? (
                      <Switch 
                        checked={configs[item.id] === 'true'} 
                        onCheckedChange={(checked) => updateConfig(item.id, checked ? 'true' : 'false')}
                      />
                    ) : item.type === "number" ? (
                      <Input 
                        type="number" 
                        value={configs[item.id] || ''} 
                        onChange={(e) => updateConfig(item.id, e.target.value)}
                        className="bg-surface text-right font-medium" 
                      />
                    ) : (
                      <select 
                        value={configs[item.id] || ''}
                        onChange={(e) => updateConfig(item.id, e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        {item.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
