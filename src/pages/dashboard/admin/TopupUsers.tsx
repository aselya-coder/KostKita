import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { BackButton } from "@/components/BackButton";
import { Loader2, Users } from "lucide-react";
import { getTopupUsersReport } from "@/services/dashboard";

type TopupUserRow = {
  userId: string;
  totalAmount: number;
  totalCoins: number;
  count: number;
  lastAt: string;
};

export default function TopupUsersPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<TopupUserRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const data = await getTopupUsersReport();
        setRows(data as TopupUserRow[]);
      } catch (error) {
        console.error("Failed to fetch topup report:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user]);

  return (
    <div className="max-w-5xl mx-auto space-y-6 md:space-y-8 pb-12 px-4 md:px-0">
      <BackButton to="/admin" className="mb-0" />

      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-display font-bold text-foreground">User Top Up</h1>
            <p className="text-xs md:text-sm text-muted-foreground">Daftar pengguna yang melakukan top up koin</p>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-10 md:p-20 flex flex-col items-center justify-center gap-4 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm font-medium">Memuat data...</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="p-10 md:p-20 text-center text-sm text-muted-foreground">Belum ada data top up.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs md:text-sm text-left">
              <thead className="bg-secondary/50 text-muted-foreground uppercase text-[9px] md:text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="px-4 md:px-6 py-4 text-center w-12 md:w-16">No</th>
                  <th className="px-4 md:px-6 py-4">User ID</th>
                  <th className="px-4 md:px-6 py-4">Jumlah</th>
                  <th className="px-4 md:px-6 py-4">Koin</th>
                  <th className="px-4 md:px-6 py-4">Total Harga</th>
                  <th className="px-4 md:px-6 py-4">Terakhir</th>
                </tr>
              </thead>
              <tbody className="divide-y border-border">
                {rows.map((r, i) => (
                  <tr key={r.userId} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-4 md:px-6 py-4 text-center font-medium text-muted-foreground">{i + 1}</td>
                    <td className="px-4 md:px-6 py-4 text-foreground truncate max-w-[100px] md:max-w-none">{r.userId}</td>
                    <td className="px-4 md:px-6 py-4">{r.count}x</td>
                    <td className="px-4 md:px-6 py-4 font-bold text-foreground">{r.totalCoins}</td>
                    <td className="px-4 md:px-6 py-4 font-bold text-primary whitespace-nowrap">
                      {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(r.totalAmount)}
                    </td>
                    <td className="px-4 md:px-6 py-4 text-muted-foreground whitespace-nowrap">
                      {new Date(r.lastAt).toLocaleDateString("id-ID", { day: 'numeric', month: 'short' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
