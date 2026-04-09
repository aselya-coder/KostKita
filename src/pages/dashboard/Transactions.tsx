import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { BackButton } from "@/components/BackButton";
import { CreditCard, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getTransactions } from "@/services/wallet";
import { getAllAdminTransactions, AdminTransaction } from "@/services/admin";
import { type Transaction } from "@/data/mockData";

export default function TransactionsPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[] | AdminTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        let data: Transaction[] | AdminTransaction[];
        if (user.role === 'admin') {
          data = await getAllAdminTransactions(user.id, 'ADMIN');
        } else {
          data = await getTransactions(user.id);
        }
        setTransactions(data || []);
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, [user]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const basePath = "/dashboard";

  return (
    <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 pb-12 px-4 md:px-0">
      <BackButton to={basePath} className="mb-0" />
      
      <div>
        <h1 className="text-xl md:text-2xl font-display font-bold text-foreground">Riwayat Transaksi</h1>
        <p className="text-muted-foreground text-xs md:text-sm">Pantau status pembayaran paket kuota upload Anda.</p>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-10 md:p-20 flex flex-col items-center justify-center gap-4 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm font-medium">Memuat data...</p>
          </div>
        ) : transactions.length > 0 ? (
          <div className="overflow-x-auto -mx-4 md:mx-0">
            <div className="inline-block min-w-full align-middle">
              <table className="w-full text-xs md:text-sm text-left">
                {user?.role === 'admin' ? (
                  <>
                    <thead className="bg-secondary/50 text-muted-foreground uppercase text-[9px] md:text-[10px] font-bold tracking-wider">
                      <tr>
                        <th className="px-4 md:px-6 py-4 text-center w-12 md:w-16">No</th>
                        <th className="px-4 md:px-6 py-4">User</th>
                        <th className="px-4 md:px-6 py-4">Paket</th>
                        <th className="px-4 md:px-6 py-4">Koin</th>
                        <th className="px-4 md:px-6 py-4">Harga</th>
                        <th className="px-4 md:px-6 py-4">Admin Fee</th>
                        <th className="px-4 md:px-6 py-4">Total</th>
                        <th className="px-4 md:px-6 py-4">Status</th>
                        <th className="px-4 md:px-6 py-4 text-right">Tanggal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y border-border">
                      {(transactions as AdminTransaction[]).map((tx, i) => (
                        <tr key={tx.id} className="hover:bg-secondary/20 transition-colors">
                          <td className="px-4 md:px-6 py-4 text-center font-medium text-muted-foreground">
                            {i + 1}
                          </td>
                          <td className="px-4 md:px-6 py-4 text-muted-foreground truncate max-w-[80px] md:max-w-none">
                            {tx.userId}
                          </td>
                          <td className="px-4 md:px-6 py-4 font-medium text-foreground whitespace-nowrap">
                            {tx.coinPackage.name}
                          </td>
                          <td className="px-4 md:px-6 py-4 whitespace-nowrap">{tx.coinAmount}</td>
                          <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(tx.amount)}
                          </td>
                          <td className="px-4 md:px-6 py-4 text-muted-foreground whitespace-nowrap">
                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(tx.adminFee || 0)}
                          </td>
                          <td className="px-4 md:px-6 py-4 font-bold text-primary whitespace-nowrap">
                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(tx.totalAmount || tx.amount)}
                          </td>
                          <td className="px-4 md:px-6 py-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-wider ${tx.status === 'success' ? 'bg-emerald-50 text-emerald-600' :
                              tx.status === 'failed' ? 'bg-red-50 text-red-600' :
                              'bg-amber-50 text-amber-600'
                            }`}>
                              {tx.status}
                            </span>
                          </td>
                          <td className="px-4 md:px-6 py-4 text-muted-foreground text-right whitespace-nowrap text-[10px] md:text-xs">
                            {formatDate(tx.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                ) : (
                  <>
                    <thead className="bg-secondary/50 text-muted-foreground uppercase text-[9px] md:text-[10px] font-bold tracking-wider">
                      <tr>
                        <th className="px-4 md:px-6 py-4 text-center w-12 md:w-16">No</th>
                        <th className="px-4 md:px-6 py-4">Tipe / Deskripsi</th>
                        <th className="px-4 md:px-6 py-4">Status</th>
                        <th className="px-4 md:px-6 py-4">Detail</th>
                        <th className="px-4 md:px-6 py-4 text-right">Tanggal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y border-border">
                      {(transactions as Transaction[]).map((log, i) => (
                        <tr key={log.id} className="hover:bg-secondary/20 transition-colors">
                          <td className="px-4 md:px-6 py-4 text-center font-medium text-muted-foreground">
                            {i + 1}
                          </td>
                          <td className="px-4 md:px-6 py-4">
                            <div className="flex flex-col min-w-[120px]">
                              <span className="font-bold text-foreground text-xs md:text-sm">
                                {log.type === 'topup' ? 'Top Up Koin' : log.type === 'ad_payment' ? 'Iklan' : 'Penghasilan'}
                              </span>
                              <span className="text-[9px] md:text-[10px] text-muted-foreground truncate max-w-[150px]">
                                {log.description || '-'}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 md:px-6 py-4">
                            <span className={cn(
                              "px-2 py-0.5 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-wider",
                              log.status === 'paid' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                            )}>
                              {log.status}
                            </span>
                          </td>
                          <td className="px-4 md:px-6 py-4 font-bold text-foreground whitespace-nowrap text-xs md:text-sm">
                            {log.amount > 0 ? `Rp ${log.amount.toLocaleString('id-ID')}` : `${log.coins} Koin`}
                          </td>
                          <td className="px-4 md:px-6 py-4 text-muted-foreground text-right whitespace-nowrap text-[10px] md:text-xs">
                            {formatDate(log.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                )}
              </table>
            </div>
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
