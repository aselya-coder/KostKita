import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { BackButton } from "@/components/BackButton";
import { 
  Zap, 
  Clock, 
  Power, 
  PowerOff, 
  Building2, 
  User,
  Calendar,
  AlertCircle,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Advertisement {
  id: string;
  kos_id: string;
  owner_id: string;
  package_id: string;
  boost_level: number;
  coin_cost: number;
  duration_days: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  kos_listings: {
    title: string;
    location: string;
  };
  profiles: {
    name: string;
  };
}

export default function AdminAdvertisements() {
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAds = async () => {
    setIsLoading(true);
    try {
      // Fetch ads first
      const { data: adsData, error: adsError } = await supabase
        .from('kos_advertisements')
        .select('*')
        .order('created_at', { ascending: false });

      if (adsError) throw adsError;
      if (!adsData || adsData.length === 0) {
        setAds([]);
        return;
      }

      // Get unique kos IDs and owner IDs
      const kosIds = [...new Set(adsData.map(ad => ad.kos_id))];
      const ownerIds = [...new Set(adsData.map(ad => ad.owner_id))];

      // Fetch kos listings and owner profiles
      const [kosRes, profilesRes] = await Promise.all([
        supabase.from('kos_listings').select('id, title, location').in('id', kosIds),
        supabase.from('profiles').select('id, name').in('id', ownerIds)
      ]);

      const kosMap: Record<string, any> = {};
      kosRes.data?.forEach(k => { kosMap[k.id] = k; });

      const profileMap: Record<string, any> = {};
      profilesRes.data?.forEach(p => { profileMap[p.id] = p; });

      // Format data
      const formattedAds = adsData.map(ad => ({
        ...ad,
        kos_listings: kosMap[ad.kos_id] || { title: 'Unknown', location: '-' },
        profiles: profileMap[ad.owner_id] || { name: 'Unknown' }
      }));

      setAds(formattedAds as any);
    } catch (error: any) {
      console.error("Error fetching advertisements:", error);
      toast.error("Gagal mengambil data iklan.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, []);

  const handleDeactivate = async (adId: string, kosId: string) => {
    if (!confirm("Apakah Anda yakin ingin menonaktifkan iklan ini?")) return;

    try {
      // 1. Deactivate advertisement
      const { error: adError } = await supabase
        .from('kos_advertisements')
        .update({ is_active: false })
        .eq('id', adId);

      if (adError) throw adError;

      // 2. Also update kos_listings premium status if needed
      // Check if there are other active ads for this kos
      const { data: otherAds } = await supabase
        .from('kos_advertisements')
        .select('id')
        .eq('kos_id', kosId)
        .eq('is_active', true)
        .neq('id', adId);

      if (!otherAds || otherAds.length === 0) {
        await supabase
          .from('kos_listings')
          .update({ is_premium: false })
          .eq('id', kosId);
      }

      toast.success("Iklan berhasil dinonaktifkan.");
      fetchAds();
    } catch (error: any) {
      console.error("Error deactivating ad:", error);
      toast.error("Gagal menonaktifkan iklan.");
    }
  };

  const calculateRemainingDays = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusColor = (isActive: boolean, remainingDays: number) => {
    if (!isActive) return "bg-slate-100 text-slate-600 border-slate-200";
    if (remainingDays <= 0) return "bg-red-50 text-red-600 border-red-100";
    if (remainingDays <= 3) return "bg-amber-50 text-amber-600 border-amber-100";
    return "bg-emerald-50 text-emerald-600 border-emerald-100";
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 md:space-y-8 pb-12 px-4 md:px-0">
      <BackButton to="/admin" className="mb-0" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-display font-bold text-foreground">Manajemen Iklan Premium</h1>
          <p className="text-muted-foreground text-xs md:text-sm">Pantau dan kelola masa aktif fitur boost iklan kos premium.</p>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-10 md:p-20 flex flex-col items-center justify-center gap-4 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm font-medium">Memuat data iklan...</p>
          </div>
        ) : ads.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs md:text-sm text-left">
              <thead className="bg-secondary/50 text-muted-foreground uppercase text-[9px] md:text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="px-4 md:px-6 py-4">Kos & Pemilik</th>
                  <th className="px-4 md:px-6 py-4">Paket / Level</th>
                  <th className="px-4 md:px-6 py-4">Masa Aktif</th>
                  <th className="px-4 md:px-6 py-4 text-center">Status</th>
                  <th className="px-4 md:px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y border-border">
                {ads.map((ad) => {
                  const remainingDays = calculateRemainingDays(ad.end_date);
                  const isExpired = remainingDays <= 0;
                  const statusClass = getStatusColor(ad.is_active, remainingDays);

                  return (
                    <tr key={ad.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="px-4 md:px-6 py-4">
                        <div className="space-y-1">
                          <p className="font-bold text-foreground flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-primary" />
                            {ad.kos_listings?.title || "Kos Dihapus"}
                          </p>
                          <p className="text-[10px] md:text-xs text-muted-foreground flex items-center gap-1.5">
                            <User className="w-3 h-3" />
                            {ad.profiles?.name || "User Dihapus"}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-4">
                        <div className="space-y-1">
                          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase">
                            Level {ad.boost_level}
                          </span>
                          <p className="text-[10px] text-muted-foreground">
                            {ad.duration_days} Hari - {ad.coin_cost} 💎
                          </p>
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-foreground font-medium">
                            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                            {isExpired && ad.is_active ? (
                              <span className="text-red-600 font-bold">Kedaluwarsa</span>
                            ) : (
                              <span>{Math.max(0, remainingDays)} Hari Tersisa</span>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Sampai: {new Date(ad.end_date).toLocaleDateString('id-ID')}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-4 text-center">
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-wider border",
                          statusClass
                        )}>
                          {ad.is_active ? (isExpired ? "Expired" : "Aktif") : "Nonaktif"}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-4 text-right">
                        {ad.is_active && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50 font-bold text-[10px] uppercase"
                            onClick={() => handleDeactivate(ad.id, ad.kos_id)}
                          >
                            <PowerOff className="w-3.5 h-3.5 mr-1.5" />
                            Matikan
                          </Button>
                        )}
                        {!ad.is_active && (
                          <span className="text-[10px] text-muted-foreground italic">Sudah Mati</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-10 md:p-20 flex flex-col items-center justify-center gap-4 text-muted-foreground">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
              <Zap className="w-8 h-8 opacity-20" />
            </div>
            <div className="text-center">
              <p className="text-lg font-display font-bold text-foreground">Belum ada iklan premium</p>
              <p className="text-sm">Data fitur boost/premium akan muncul di sini jika ada pengguna yang mempromosikan iklannya.</p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-bold text-amber-900">Informasi Admin</p>
          <p className="text-xs text-amber-800 leading-relaxed">
            Iklan yang sudah melewati tanggal berakhir (Expired) tetap akan tampil sebagai "Aktif" di sistem sampai Anda menekan tombol <strong>Matikan</strong> atau ada sistem otomatis yang membersihkannya. Menekan tombol matikan akan mencabut status Premium pada kos tersebut jika tidak ada iklan aktif lainnya.
          </p>
        </div>
      </div>
    </div>
  );
}
