import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { BackButton } from "@/components/BackButton";
import { CreditCard, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function TransactionsPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('transactions')
          .select(`
            *,
            pricing_plans(name)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setTransactions(data || []);
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, [user]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-wider">
            <CheckCircle2 className="w-3 h-3" />
            Berhasil
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-50 text-red-600 text-[10px] font-bold uppercase tracking-wider">
            <XCircle className="w-3 h-3" />
            Gagal
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-600 text-[10px] font-bold uppercase tracking-wider">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
    }
  };

  const basePath = user?.role === "owner" ? "/owner-dashboard" : "/dashboard";

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <BackButton to={basePath} className="mb-0" />
      
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Riwayat Transaksi</h1>
        <p className="text-muted-foreground text-sm">Pantau status pembayaran paket kuota upload Anda.</p>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm font-medium">Memuat data...</p>
          </div>
        ) : transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-secondary/50 text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4 text-center w-16">No</th>
                  <th className="px-6 py-4">Paket / Tanggal</th>
                  <th className="px-6 py-4">Metode</th>
                  <th className="px-6 py-4">Total</th>
                  <th className="px-6 py-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y border-border">
                {transactions.map((tx, i) => (
                  <tr key={tx.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-6 py-4 text-center font-medium text-muted-foreground">
                      {i + 1}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground">
                          {tx.pricing_plans?.name || 'Paket Kustom'}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {formatDate(tx.created_at)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 uppercase font-bold text-[10px] text-muted-foreground">
                      {tx.payment_provider}
                    </td>
                    <td className="px-6 py-4 font-bold text-foreground">
                      {formatCurrency(tx.amount)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getStatusBadge(tx.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-20 text-center space-y-4">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto">
              <CreditCard className="w-8 h-8 text-muted-foreground/40" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Belum ada transaksi</h3>
              <p className="text-sm text-muted-foreground">Transaksi pembayaran kuota Anda akan muncul di sini.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
