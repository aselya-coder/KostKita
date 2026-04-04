import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getTransactions, topUpCoins } from "@/services/wallet";
import { mockCoinPackages, type Transaction, type CoinPackage } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/BackButton";
import { toast } from "sonner";
import { Coins, CreditCard, Clock, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function TopUpPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<CoinPackage | null>(null);

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
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

  const handleTopUp = async () => {
    if (!selectedPackage || !user) return;
    
    try {
      const { success, message } = await topUpCoins(user.id, selectedPackage.id);
      if (success) {
        toast.success(message);
        fetchTransactions();
      }
    } catch (error) {
      toast.error("Gagal melakukan top up");
    }
  };

  return (
    <div className="space-y-8">
      <BackButton to="/dashboard" />
      
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Top Up Koin</h1>
        <p className="text-muted-foreground">Beli koin untuk mengaktifkan iklan Anda.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {mockCoinPackages.map((pkg) => (
              <div 
                key={pkg.id}
                onClick={() => setSelectedPackage(pkg)}
                className={cn(
                  "p-6 rounded-2xl border-2 transition-all cursor-pointer group relative overflow-hidden",
                  selectedPackage?.id === pkg.id 
                    ? "border-primary bg-primary/5" 
                    : "border-border bg-card hover:border-primary/50"
                )}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Coins className="w-6 h-6 text-primary" />
                  </div>
                  {selectedPackage?.id === pkg.id && (
                    <CheckCircle2 className="w-6 h-6 text-primary" />
                  )}
                </div>
                <h3 className="text-xl font-bold text-foreground">{pkg.coins} KOIN</h3>
                <p className="text-sm text-muted-foreground mt-1">Rp {pkg.price.toLocaleString('id-ID')}</p>
                <div className="mt-4 pt-4 border-t border-border flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Admin Fee: Rp {pkg.adminFee.toLocaleString('id-ID')}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="font-display font-semibold text-foreground mb-4">Ringkasan Pembayaran</h3>
            {selectedPackage ? (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Harga Koin ({selectedPackage.coins} Koin)</span>
                  <span className="font-medium">Rp {selectedPackage.price.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-sm text-emerald-600">
                  <span>Biaya Admin</span>
                  <span className="font-medium">+ Rp {selectedPackage.adminFee.toLocaleString('id-ID')}</span>
                </div>
                <div className="pt-3 border-t border-border flex justify-between items-center">
                  <span className="font-bold">Total Bayar</span>
                  <span className="text-xl font-bold text-primary">
                    Rp {(selectedPackage.price + selectedPackage.adminFee).toLocaleString('id-ID')}
                  </span>
                </div>
                <Button 
                  onClick={handleTopUp}
                  className="w-full mt-4 h-12 rounded-xl text-lg font-bold"
                >
                  Bayar Sekarang
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4 italic">Pilih paket koin untuk melanjutkan</p>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="p-4 border-b border-border bg-secondary/30">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Transaksi Terakhir
              </h3>
            </div>
            <div className="divide-y border-border max-h-[500px] overflow-y-auto">
              {transactions.map((t) => (
                <div key={t.id} className="p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">{t.type}</span>
                    <span className="text-[10px] text-muted-foreground">{new Date(t.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm font-medium">{t.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-foreground">
                      {t.amount > 0 ? `Rp ${t.amount.toLocaleString('id-ID')}` : `${t.coins} Koin`}
                    </span>
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full",
                      t.status === 'paid' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                    )}>
                      {t.status}
                    </span>
                  </div>
                </div>
              ))}
              {transactions.length === 0 && (
                <div className="p-8 text-center text-xs text-muted-foreground">Belum ada transaksi</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
