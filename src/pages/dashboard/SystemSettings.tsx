import { useState } from "react";
import { BackButton } from "@/components/BackButton";
import { 
  Shield, 
  Globe, 
  Database, 
  Save,
  RefreshCw,
  Coins,
  CreditCard,
  DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export default function SystemSettings() {
  const { user } = useAuth();
  const [isSaving, setIsLoading] = useState(false);

  const handleSave = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast.success("Konfigurasi sistem berhasil diperbarui.");
    }, 1500);
  };

  const monetizationSections = [
    {
      title: "Monetisasi & Koin",
      icon: Coins,
      items: [
        { label: "Harga per Koin (IDR)", type: "number", value: "10000", description: "Harga dasar 1 koin dalam Rupiah." },
        { label: "Biaya Iklan per Hari (Koin)", type: "number", value: "1", description: "Jumlah koin yang didebet setiap hari untuk iklan aktif." },
        { label: "Durasi Iklan Gratis (Hari)", type: "number", value: "30", description: "Lama waktu iklan pertama gratis untuk user baru." },
      ]
    },
    {
      title: "Biaya Layanan (Admin Fee)",
      icon: CreditCard,
      items: [
        { label: "Tipe Biaya Admin", type: "select", options: ["Flat", "Persentase"], value: "Flat", description: "Cara menghitung biaya admin pada top up." },
        { label: "Nilai Biaya Admin", type: "number", value: "2500", description: "Nilai flat (Rp) atau persentase (%) biaya admin." },
        { label: "Minimal Top Up (Koin)", type: "number", value: "5", description: "Batas minimum pembelian koin per transaksi." },
        { label: "Maksimal Top Up (Koin)", type: "number", value: "100", description: "Batas maksimum pembelian koin per transaksi." },
      ]
    }
  ];

  const platformSections = [
    {
      title: "Moderasi & Keamanan",
      icon: Shield,
      items: [
        { label: "Auto-Approve Iklan", type: "switch", value: false, description: "Setujui iklan baru secara otomatis tanpa review manual." },
        { label: "Sistem Laporan User", type: "switch", value: true, description: "Izinkan user melaporkan konten atau akun mencurigakan." },
      ]
    }
  ];


  const getBackPath = () => {
    if (!user) return "/";
    if (user.role === "admin") return "/admin-dashboard";
    if (user.role === "owner") return "/owner-dashboard";
    return "/dashboard";
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <BackButton to={getBackPath()} className="mb-0" />
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">System Settings</h1>
          <p className="text-muted-foreground text-sm">Global platform configuration and maintenance tools.</p>
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
          Save Changes
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
                      <Switch checked={item.value as boolean} />
                    ) : item.type === "number" ? (
                      <Input 
                        type="number" 
                        defaultValue={item.value as string} 
                        className="bg-surface text-right font-medium" 
                      />
                    ) : (
                      <select className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                        {item.options?.map(opt => <option key={opt}>{opt}</option>)}
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
