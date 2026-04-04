import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getTransactions } from "@/services/wallet";
import { type Transaction } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/BackButton";
import { toast } from "sonner";
import { Coins, CreditCard, Clock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCoinPackages, createTopupRequest, type CoinPackage } from "@/services/payment";
import { useNavigate } from "react-router-dom";

export default function TopUpPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true); 
  const [selectedPackage, setSelectedPackage] = useState<CoinPackage | null>(null);
  const [packages, setPackages] = useState<CoinPackage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<"SHOPEEPAY" | "DANA" | "QRIS" | "VA" | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchTransactions();
    fetchPackages();
  }, [user]);

  const fetchTransactions = async () => {
    try {
      const data = await getTransactions(user!.id);
      setTransactions(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPackages = async () => {
    try {
      const list = await getCoinPackages();
      setPackages(list);
    } catch {
      toast.error("Gagal memuat paket koin");
    }
  };

  const beginPayment = async () => {
    if (!selectedPackage || !user) return;
    setIsProcessing(true);
    try {
      type TopupResponse = { transaction: { id: string }; paymentUrl?: string };
      const result: TopupResponse = await createTopupRequest(user.id, selectedPackage.id);
      const trxId = result?.transaction?.id;
      if (trxId) {
        navigate(`/dashboard/topup/checkout?trx=${trxId}`, { state: { paymentUrl: result.paymentUrl } });
        return;
      }
      toast.success("Transaksi berhasil dibuat. Mengarahkan ke pembayaran...");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Gagal membuat sesi pembayaran";
      toast.error(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const proceedToPayment = () => {
    if (!paymentUrl) return;
    window.open(paymentUrl, "_blank");
    setShowPaymentDialog(false);
    setSelectedMethod(null);
    fetchTransactions();
  };

  return (
    <div className="space-y-6 md:space-y-8 pb-12 px-4 md:px-0">
      <BackButton to="/dashboard" />
      
      <div>
        <h1 className="text-xl md:text-2xl font-display font-bold text-foreground">Top Up Koin</h1>
        <p className="text-xs md:text-sm text-muted-foreground">Beli koin untuk mengaktifkan iklan Anda.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {packages.map((pkg) => (
              <div 
                key={pkg.id}
                onClick={() => setSelectedPackage(pkg)}
                className={cn(
                  "p-5 md:p-6 rounded-2xl border-2 transition-all cursor-pointer group relative overflow-hidden",
                  selectedPackage?.id === pkg.id 
                    ? "border-primary bg-primary/5" 
                    : "border-border bg-card hover:border-primary/50"
                )}
              >
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Coins className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                  </div>
                  {selectedPackage?.id === pkg.id && (
                    <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                  )}
                </div>
                <h3 className="text-lg md:text-xl font-bold text-foreground">{pkg.coinAmount} KOIN</h3>
                <p className="text-xs md:text-sm text-muted-foreground mt-1">Rp {pkg.price.toLocaleString('id-ID')}</p>
                <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-border flex justify-between items-center">
                  <span className="text-[10px] text-muted-foreground">Metode: ShopeePay, DANA, QRIS</span>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-card rounded-2xl border border-border p-5 md:p-6">
            <h3 className="text-base md:text-lg font-display font-semibold text-foreground mb-4">Ringkasan Pembayaran</h3>
            {selectedPackage ? (
              <div className="space-y-3">
                <div className="flex justify-between text-xs md:text-sm">
                  <span className="text-muted-foreground">
                    Harga Koin {selectedPackage.coinAmount} Koin
                  </span>
                  <span className="font-medium">Rp {selectedPackage.price.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-xs md:text-sm text-emerald-600">
                  <span>Biaya Admin</span>
                  <span className="font-medium">+ Rp {(selectedPackage.adminFee ?? 0).toLocaleString('id-ID')}</span>
                </div>
                <div className="pt-3 border-t border-border flex justify-between items-center">
                  <span className="font-bold text-sm md:text-base">Total Bayar</span>
                  <span className="text-lg md:text-xl font-bold text-primary">
                    Rp {(selectedPackage.price + (selectedPackage.adminFee ?? 0)).toLocaleString('id-ID')}
                  </span>
                </div>
                <Button 
                  onClick={beginPayment}
                  disabled={isProcessing}
                  className="w-full mt-4 h-12 rounded-xl text-base md:text-lg font-bold"
                >
                  {isProcessing ? "Memproses..." : "Bayar Sekarang"}
                </Button>
              </div>
            ) : (
              <p className="text-xs md:text-sm text-muted-foreground text-center py-4 italic">Pilih paket koin untuk melanjutkan</p>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
            <div className="p-4 border-b border-border bg-secondary/30">
              <h3 className="font-semibold text-xs md:text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Transaksi Terakhir
              </h3>
            </div>
            <div className="divide-y border-border max-h-[400px] md:max-h-[500px] overflow-y-auto">
              {transactions.map((t) => (
                <div key={t.id} className="p-4 space-y-2 hover:bg-secondary/10 transition-colors">
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-primary">{t.type}</span>
                    <span className="text-[9px] text-muted-foreground">{new Date(t.createdAt).toLocaleDateString('id-ID')}</span>
                  </div>
                  <p className="text-xs md:text-sm font-medium line-clamp-1">{t.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-foreground">
                      {t.amount > 0 ? `Rp ${t.amount.toLocaleString('id-ID')}` : `${t.coins} Koin`}
                    </span>
                    <span className={cn(
                      "text-[9px] font-bold px-2 py-0.5 rounded-full",
                      t.status === 'paid' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                    )}>
                      {t.status}
                    </span>
                  </div>
                </div>
              ))}
              {transactions.length === 0 && (
                <div className="p-8 text-center text-xs text-muted-foreground italic">Belum ada transaksi</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dialog pemilihan metode dipindah ke halaman checkout */}
    </div>
  );
}
