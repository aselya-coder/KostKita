import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { BackButton } from "@/components/BackButton";
import { Loader2, Users } from "lucide-react";
import { cn } from "@/lib/utils";

type TopupUserRow = {
  userId: string;
  totalAmount: number;
  totalCoins: number;
  count: number;
  lastAt: string;
};

const BACKEND_URL = "http://localhost:3000/api";

export default function TopupUsersPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<TopupUserRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user || user.role !== "admin") return;
      setIsLoading(true);
      try {
        const res = await fetch(`${BACKEND_URL}/admin/topup-users`, {
          headers: {
            "x-user-id": user.id,
            "x-user-role": "ADMIN",
          },
        });
        const json = await res.json();
        if (json?.success) setRows(json.data as TopupUserRow[]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user]);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <BackButton to="/admin" className="mb-0" />

      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">User Top Up</h1>
            <p className="text-sm text-muted-foreground">Daftar pengguna yang melakukan top up koin</p>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm font-medium">Memuat data...</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="p-20 text-center text-sm text-muted-foreground">Belum ada data top up.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-secondary/50 text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4 text-center w-16">No</th>
                  <th className="px-6 py-4">User ID</th>
                  <th className="px-6 py-4">Jumlah Topup</th>
                  <th className="px-6 py-4">Total Koin</th>
                  <th className="px-6 py-4">Total Rupiah</th>
                  <th className="px-6 py-4">Terakhir</th>
                </tr>
              </thead>
              <tbody className="divide-y border-border">
                {rows.map((r, i) => (
                  <tr key={r.userId} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-6 py-4 text-center font-medium text-muted-foreground">{i + 1}</td>
                    <td className="px-6 py-4 text-foreground">{r.userId}</td>
                    <td className="px-6 py-4">{r.count} kali</td>
                    <td className="px-6 py-4">{r.totalCoins} Koin</td>
                    <td className="px-6 py-4 font-bold text-primary">
                      {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(r.totalAmount)}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {new Date(r.lastAt).toLocaleString("id-ID")}
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
