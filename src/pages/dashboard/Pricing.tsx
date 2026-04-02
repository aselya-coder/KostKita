import { useState, useEffect } from "react";
import { Check, Zap, CreditCard, Loader2, Star, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/BackButton";
import { useAuth } from "@/hooks/useAuth";
import { getCoinPackages, createTopUpRequest, type CoinPackage } from "@/services/coin";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function PricingPage() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<CoinPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const data = await getCoinPackages();
        setPlans(data);
      } catch (error) {
        toast.error("Gagal mengambil data paket.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const handlePurchase = async (packageId: string) => {
    if (!user) {
      toast.error("Silakan login terlebih dahulu.");
      return;
    }

    setIsProcessing(packageId);
    try {
      // 1. Create transaction in our DB
      const transaction = await createTopUpRequest(user.id, packageId);
      
      // 2. In a real app, we would redirect to Midtrans/Stripe here
      toast.success("Mengarahkan ke pembayaran...");
      
      console.log("Top-up request created:", transaction);
      
      // Simulate redirection delay
      setTimeout(() => {
        toast.info("Sistem Koin: 1 Koin = Rp10.000. Biaya Iklan: 1 Koin/Hari.");
        setIsProcessing(null);
      }, 2000);

    } catch (error: any) {
      toast.error(error.message || "Gagal memproses pembayaran.");
      setIsProcessing(null);
    }
  };


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const basePath = user?.role === "owner" ? "/owner-dashboard" : "/dashboard";

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20 px-4">
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
          1 Koin = Rp10.000. Biaya iklan hanya 1 Koin per hari. 
          Pilih paket di bawah untuk mulai mempromosikan kos atau barang Anda.
        </p>

      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => {
            const isPopular = plan.coin_amount === 20;
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "relative flex flex-col p-8 bg-card border rounded-3xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-1",
                  isPopular ? "border-primary shadow-xl ring-1 ring-primary/20" : "border-border shadow-sm"
                )}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-lg">
                    <Star className="w-3 h-3 fill-current" />
                    Paling Laris
                  </div>
                )}

                <div className="space-y-2 mb-8">
                  <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-foreground">
                      {formatCurrency(plan.price)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Dapatkan {plan.coin_amount} Koin untuk durasi iklan Anda.
                  </p>
                </div>

                <div className="space-y-4 mb-8 flex-1">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-emerald-500" />
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      Saldo {plan.coin_amount} Koin
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-emerald-500" />
                    </div>
                    <span className="text-sm font-medium text-foreground">Masa Aktif Koin Selamanya</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-emerald-500" />
                    </div>
                    <span className="text-sm font-medium text-foreground">Biaya 1 Koin/Hari per Iklan</span>
                  </div>
                </div>


                <Button
                  onClick={() => handlePurchase(plan.id)}
                  disabled={isProcessing === plan.id}
                  className={cn(
                    "w-full h-14 rounded-2xl font-bold text-base transition-all active:scale-95",
                    isPopular 
                      ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20" 
                      : "bg-secondary hover:bg-secondary/80 text-foreground"
                  )}
                >
                  {isProcessing === plan.id ? (
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

      <div className="bg-secondary/30 border border-border/50 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-background rounded-2xl flex items-center justify-center shadow-sm border border-border">
            <ShieldCheck className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h4 className="font-bold text-foreground">Pembayaran Aman & Terverifikasi</h4>
            <p className="text-sm text-muted-foreground">Kami bekerja sama dengan Midtrans untuk menjamin keamanan transaksi Anda.</p>
          </div>
        </div>
        <div className="flex gap-4 grayscale opacity-50">
          {/* Mock payment methods icons could go here */}
          <div className="h-6 w-12 bg-muted-foreground/20 rounded" />
          <div className="h-6 w-12 bg-muted-foreground/20 rounded" />
          <div className="h-6 w-12 bg-muted-foreground/20 rounded" />
        </div>
      </div>
    </div>
  );
}
