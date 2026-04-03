import { useState, useEffect } from "react";
import {
  Check,
  Zap,
  CreditCard,
  Loader2,
  Star,
  ShieldCheck,
  Wallet,
  Coins,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/BackButton";
import { useAuth } from "@/hooks/useAuth";
import { getCoinPackages, createTopupRequest, type CoinPackage } from "@/services/payment";
import { getWalletBalance } from "@/services/wallet";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);

const toBackendRole = (role?: string): "USER" | "ADMIN" =>
  role === "admin" ? "ADMIN" : "USER";

const toBasePath = (role?: string) => {
  if (role === "owner") return "/owner-dashboard";
  if (role === "admin") return "/admin-dashboard";
  return "/dashboard";
};

export default function PricingPage() {
  const { user } = useAuth();
  const [packages, setPackages] = useState<CoinPackage[]>([]);
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const [pkgs, bal] = await Promise.all([
          getCoinPackages(),
          getWalletBalance(user.id),
        ]);
        setPackages(pkgs);
        setBalance(bal);
      } catch {
        toast.error("Gagal memuat data paket. Coba lagi.");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [user]);

  const handlePurchase = async (pkg: CoinPackage) => {
    if (!user) {
      toast.error("Silakan login terlebih dahulu.");
      return;
    }
    setIsProcessing(pkg.id);
    try {
      const result = await createTopupRequest(user.id, pkg.id, toBackendRole(user.role));
      toast.success(`Pesanan "${pkg.name}" berhasil dibuat!`, {
        description: `ID Transaksi: ${result.id} — mengarahkan ke pembayaran...`,
        duration: 5000,
      });
    } catch (error: any) {
      toast.error(error.message || "Gagal memproses pembayaran.");
    } finally {
      setIsProcessing(null);
    }
  };

  const basePath = toBasePath(user?.role);

  const FEATURES = (coinAmount: number) => [
    `Saldo ${coinAmount} Koin`,
    "Masa Aktif Koin Selamanya",
    "Biaya 1 Koin/Hari per Iklan",
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20 px-4">
      {/* ── Header ── */}
      <div className="flex flex-col items-center text-center space-y-4 pt-8">
        <BackButton to={basePath} className="self-start mb-0" />
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest">
          <Zap className="w-3 h-3 fill-current" />
          Coin Wallet
        </div>
        <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground tracking-tight">
          Isi Saldo Koin Anda
        </h1>
        <p className="text-muted-foreground max-w-2xl text-lg">
          1 Koin = Rp10.000. Biaya iklan hanya 1 Koin per hari. Pilih paket di
          bawah untuk mulai mempromosikan kos atau barang Anda.
        </p>
      </div>

      {/* ── Wallet Balance Card ── */}
      {!isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-primary to-primary/75 rounded-3xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl shadow-primary/20"
        >
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
              <Wallet className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-white/70 text-sm font-medium mb-0.5">
                Saldo Koin Saat Ini
              </p>
              <p className="text-4xl font-display font-bold text-white leading-none">
                {balance !== null ? balance : "—"}
                <span className="text-2xl font-medium opacity-75 ml-2">Koin</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white/10 rounded-2xl px-6 py-4">
            <Coins className="w-5 h-5 text-white/70" />
            <div className="text-center sm:text-right">
              <p className="text-white/70 text-xs uppercase tracking-wider font-bold mb-0.5">
                Setara dengan
              </p>
              <p className="text-2xl font-bold text-white">
                {balance !== null ? formatCurrency(balance * 10000) : "—"}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Package Cards ── */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      ) : packages.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">
          <Coins className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="font-medium">Belum ada paket koin tersedia.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {packages.map((pkg, index) => {
            const isPopular = index === Math.floor(packages.length / 2);
            return (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "relative flex flex-col p-8 bg-card border rounded-3xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-1",
                  isPopular
                    ? "border-primary shadow-xl ring-1 ring-primary/20"
                    : "border-border shadow-sm"
                )}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-lg whitespace-nowrap">
                    <Star className="w-3 h-3 fill-current" />
                    Paling Laris
                  </div>
                )}

                {/* Price info */}
                <div className="space-y-2 mb-8">
                  <h3 className="text-xl font-bold text-foreground">{pkg.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-foreground">
                      {formatCurrency(pkg.price)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Dapatkan{" "}
                    <span className="font-bold text-foreground">
                      {pkg.coinAmount} Koin
                    </span>{" "}
                    untuk durasi iklan Anda.
                  </p>
                </div>

                {/* Features */}
                <ul className="space-y-4 mb-8 flex-1">
                  {FEATURES(pkg.coinAmount).map((f) => (
                    <li key={f} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-emerald-500" />
                      </div>
                      <span className="text-sm font-medium text-foreground">{f}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handlePurchase(pkg)}
                  disabled={!!isProcessing}
                  className={cn(
                    "w-full h-14 rounded-2xl font-bold text-base transition-all active:scale-95",
                    isPopular
                      ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
                      : "bg-secondary hover:bg-secondary/80 text-foreground"
                  )}
                >
                  {isProcessing === pkg.id ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5 mr-2" />
                      Beli Paket
                    </>
                  )}
                </Button>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── Security Strip ── */}
      <div className="bg-secondary/30 border border-border/50 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-background rounded-2xl flex items-center justify-center shadow-sm border border-border">
            <ShieldCheck className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h4 className="font-bold text-foreground">
              Pembayaran Aman & Terverifikasi
            </h4>
            <p className="text-sm text-muted-foreground">
              Kami bekerja sama dengan Midtrans untuk menjamin keamanan transaksi
              Anda.
            </p>
          </div>
        </div>
        <div className="flex gap-4 grayscale opacity-40">
          <div className="h-6 w-16 bg-muted-foreground/30 rounded" />
          <div className="h-6 w-16 bg-muted-foreground/30 rounded" />
          <div className="h-6 w-16 bg-muted-foreground/30 rounded" />
        </div>
      </div>
    </div>
  );
}
