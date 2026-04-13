import { useState, useEffect, useRef } from "react";
import { BackButton } from "@/components/BackButton";
import { 
  Shield, 
  Save,
  RefreshCw,
  Coins,
  CreditCard,
  Loader2,
  ImagePlus,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { getSystemConfigs, updateMultipleConfigs, updateSystemConfig } from "@/services/settings";
import { supabase } from "@/lib/supabase";

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
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadConfigs = async () => {
      setIsLoading(true);
      const data = await getSystemConfigs();
      setConfigs(data);
      setIsLoading(false);
    };
    loadConfigs();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `system/qris.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Save directly to DB so it takes effect immediately
      await updateSystemConfig('qris_image_url', publicUrl);
      
      updateConfig('qris_image_url', publicUrl);
      toast.success("Gambar QRIS berhasil diunggah!");
    } catch (error) {
      console.error("Error uploading QRIS:", error);
      toast.error("Gagal mengunggah gambar QRIS.");
    } finally {
      setIsUploading(false);
    }
  };

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
    },
    {
      title: "Sistem Pembayaran (QRIS)",
      icon: CreditCard,
      items: [
        { id: 'qris_payload', label: "QRIS Payload (String)", type: "textarea", description: "Payload string QRIS yang akan ditampilkan jika gambar QRIS tidak diunggah." },
        { id: 'qris_image_url', label: "Gambar QRIS (Upload)", type: "image", description: "Upload gambar QRIS yang akan ditampilkan saat pembayaran." },
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
    if (user.role === "admin") return "/admin";
    if (user.role === "owner") return "/dashboard";
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
                    ) : item.type === "textarea" ? (
                      <textarea 
                        value={configs[item.id] || ''} 
                        onChange={(e) => updateConfig(item.id, e.target.value)}
                        className="w-full sm:w-[300px] px-3 py-2 rounded-lg bg-surface border border-border text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[100px]" 
                        placeholder="00020101021226660014ID.CO.QRIS..."
                      />
                    ) : item.type === "image" ? (
                      <div className="flex flex-col gap-3">
                        {configs[item.id] && (
                          <div className="relative w-32 h-32 rounded-xl border-2 border-dashed border-border overflow-hidden bg-white">
                            <img src={configs[item.id]} alt="QRIS" className="w-full h-full object-contain p-2" />
                            <Button 
                              size="icon" 
                              variant="destructive" 
                              className="absolute top-1 right-1 w-6 h-6 rounded-lg shadow-lg"
                              onClick={() => updateConfig(item.id, '')}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          onChange={handleFileUpload} 
                          className="hidden" 
                          accept="image/*" 
                        />
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="rounded-xl"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploading}
                        >
                          {isUploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ImagePlus className="w-4 h-4 mr-2" />}
                          {configs[item.id] ? "Ganti Gambar" : "Unggah Gambar"}
                        </Button>
                      </div>
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
