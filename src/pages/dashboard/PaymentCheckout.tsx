import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Wallet, QrCode, Smartphone, Banknote, Clock, CheckCircle2, XCircle, Copy } from "lucide-react";
import { getWalletBalance } from "@/services/wallet";
import { BackButton } from "@/components/BackButton";
import { supabase } from "@/lib/supabase";
import { initiatePayment, type InitiatePaymentResponse } from "@/services/payment";

type MethodGroup = "EWALLET" | "QRIS" | "VA";
type EwalletMethod = "SHOPEEPAY" | "DANA" | "OVO";
type VAMethod = "BCA" | "BRI" | "MANDIRI";

type Method =
  | { group: "EWALLET"; method: EwalletMethod }
  | { group: "QRIS"; method: "QRIS" }
  | { group: "VA"; method: VAMethod };

type TransactionStatus = "pending" | "success" | "failed";

type CoinPackage = {
  id: string;
  name: string;
  coinAmount: number;
  price: number;
};

type Transaction = {
  id: string;
  userId: string;
  amount: number;
  coinAmount: number;
  status: TransactionStatus;
  externalId?: string;
  coinPackage: CoinPackage;
};

const BACKEND_URL = "http://localhost:3000/api";

export default function PaymentCheckout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const location = useLocation();
  type LocationState = { paymentUrl?: string } | null | undefined;
  const state = location.state as LocationState;
  const paymentUrl = state?.paymentUrl as string | undefined;

  const trxId = search.get("trx") || "";
  const [trx, setTrx] = useState<Transaction | null>(null);
  const [phase, setPhase] = useState<"select" | "process" | "success" | "failed">("select");
  const [selected, setSelected] = useState<Method | null>(null);
  const [countdown, setCountdown] = useState(15 * 60);
  const [balance, setBalance] = useState<number | null>(null);
  const [adminQrisUrl, setAdminQrisUrl] = useState<string | null>(null);
  const [qrisLoadFailed, setQrisLoadFailed] = useState(false);
  const [serverVA, setServerVA] = useState<string | null>(null);
  const [serverRedirectUrl, setServerRedirectUrl] = useState<string | null>(null);
  const [serverQrisPayload, setServerQrisPayload] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !trxId) {
      navigate("/dashboard/topup", { replace: true });
      return;
    }
    fetch(`${BACKEND_URL}/transactions/${trxId}`, {
      headers: {
        "x-user-id": user.id,
        "x-user-role": user.role === "admin" ? "ADMIN" : "USER",
      },
    })
      .then((r) => r.json())
      .then((res) => {
        if (res?.success && res?.data) setTrx(res.data as Transaction);
        else navigate("/dashboard/topup", { replace: true });
      })
      .catch(() => navigate("/dashboard/topup", { replace: true }));
  }, [trxId, user, navigate]);

  useEffect(() => {
    if (!trx) return;
    const iv = setInterval(async () => {
      if (!user) return;
      const r = await fetch(`${BACKEND_URL}/transactions/${trx.id}`, {
        headers: {
          "x-user-id": user.id,
          "x-user-role": user.role === "admin" ? "ADMIN" : "USER",
        },
      });
      const res = await r.json();
      if (res?.success) {
        const t = res.data as Transaction;
        setTrx(t);
        if (t.status === "success") {
          setPhase("success");
        } else if (t.status === "failed") {
          setPhase("failed");
        }
      }
    }, 3000);
    return () => clearInterval(iv);
  }, [trx, user]);

  useEffect(() => {
    if (!selected || selected.group !== "QRIS") return;
    const timer = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, [selected]);

  useEffect(() => {
    const loadAdminQris = async () => {
      try {
        const { data, error } = await supabase.from("profiles").select("id").eq("role", "admin").limit(1).single();
        if (!error && data?.id) {
          const { data: pub } = supabase.storage.from("avatars").getPublicUrl(`${data.id}/qris.png`);
          if (pub?.publicUrl) setAdminQrisUrl(pub.publicUrl);
        }
      } catch {
        // ignore
      }
    };
    loadAdminQris();
  }, []);

  const timeText = useMemo(() => {
    const m = Math.floor(countdown / 60)
      .toString()
      .padStart(2, "0");
    const s = (countdown % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }, [countdown]);

  const total = trx ? trx.amount : 0;
  const adminFee = Math.max(0, total - (trx?.coinPackage?.price ?? 0));

  const startProcess = async () => {
    if (!selected || !user || !trx) return;
    setPhase("process");
    try {
      const resp: InitiatePaymentResponse = await initiatePayment(
        user.id,
        user.role === "admin" ? "ADMIN" : "USER",
        trx.id,
        selected.group,
        selected.group === "VA" ? selected.method : selected.group === "EWALLET" ? selected.method : undefined
      );
      if (resp.vaNumber) setServerVA(resp.vaNumber);
      if (resp.redirectUrl) setServerRedirectUrl(resp.redirectUrl);
      if (resp.qrisPayload) setServerQrisPayload(resp.qrisPayload);
      if (resp.method === "EWALLET") {
        if (resp.redirectUrl) {
          window.open(resp.redirectUrl, "_blank");
        } else {
          if (selected.method === "SHOPEEPAY") openEwalletApp("SHOPEEPAY");
          if (selected.method === "DANA") openEwalletApp("DANA");
          if (selected.method === "OVO") openEwalletApp("OVO");
        }
      }
    } catch {
      // Keep UI, user can retry or use fallback buttons
    }
  };

  const copyVA = () => {
    if (!trx) return;
    const num = buildVANumber(trx, selected);
    navigator.clipboard?.writeText(num);
  };

  const buildVANumber = (t: Transaction, sel: Method | null) => {
    if (!sel || sel.group !== "VA") return "000000000000";
    const map: Record<VAMethod, string> = { BCA: "014", BRI: "002", MANDIRI: "008" };
    const prefix = map[sel.method];
    const body = (t.externalId || t.id).replace(/\D/g, "").slice(-10).padStart(10, "0");
    return `${prefix}${body}`;
  };

  useEffect(() => {
    if (phase !== "success" || !user) return;
    getWalletBalance(user.id, user.role === "admin" ? "ADMIN" : "USER")
      .then(setBalance)
      .catch(() => {});
  }, [phase, user]);

  const getQRPayload = (t: Transaction) => {
    return `KOSKITA|TRX|${t.externalId || t.id}|AMOUNT|${t.amount}`;
  };

  const openEwalletApp = (wallet: EwalletMethod) => {
    const isAndroid = /Android/i.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (!isAndroid && !isIOS) {
      if (paymentUrl) window.open(paymentUrl, "_blank");
      return;
    }
    const m: Record<EwalletMethod, { scheme: string; android: string; ios: string }> = {
      SHOPEEPAY: {
        scheme: "shopeepay://",
        android: "https://play.google.com/store/apps/details?id=com.shopee.app",
        ios: "https://apps.apple.com/app/id959841449",
      },
      DANA: {
        scheme: "dana://",
        android: "https://play.google.com/store/apps/details?id=id.dana",
        ios: "https://apps.apple.com/app/id1433835370",
      },
      OVO: {
        scheme: "ovo://",
        android: "https://play.google.com/store/apps/details?id=id.ovo",
        ios: "https://apps.apple.com/app/id1113037096",
      },
    };
    const target = m[wallet];
    let didHide = false;
    const hidden = document.createElement("iframe");
    hidden.style.display = "none";
    hidden.src = target.scheme;
    document.body.appendChild(hidden);
    const timer = setTimeout(() => {
      if (!didHide) {
        if (isAndroid) window.location.href = target.android;
        else if (isIOS) window.location.href = target.ios;
        else window.open(target.android, "_blank");
      }
    }, 1200);
    setTimeout(() => {
      didHide = true;
      document.body.removeChild(hidden);
      clearTimeout(timer);
    }, 1500);
  };

  if (!trx) {
    return (
      <div className="max-w-5xl mx-auto p-4">
        <div className="text-center py-20 text-muted-foreground">Memuat transaksi...</div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6 md:space-y-8 pb-12">
      <BackButton to="/dashboard/topup" />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="inline-flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-display font-bold text-foreground">Top Up Koin</h1>
            <p className="text-[10px] md:text-xs text-muted-foreground truncate max-w-[200px]">ID: {trx.id}</p>
          </div>
        </div>
        <div className="flex items-center justify-between md:flex-col md:items-end gap-2">
          <p className="text-xs md:text-sm text-muted-foreground">Status Pembayaran</p>
          <StatusBadge status={phase === "select" || phase === "process" ? "pending" : trx.status} />
        </div>
      </div>

      {phase === "select" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          <div className="lg:col-span-2 space-y-6 md:space-y-8">
            <SectionTitle title="Pilih Metode Pembayaran" />
            <div className="grid gap-6">
              <Group title="E-Wallet">
                <MethodCard
                  active={selected?.group === "EWALLET" && selected.method === "SHOPEEPAY"}
                  icon={<Smartphone className="w-5 h-5 text-orange-500" />}
                  title="ShopeePay"
                  subtitle="Instan"
                  onClick={() => setSelected({ group: "EWALLET", method: "SHOPEEPAY" })}
                />
                <MethodCard
                  active={selected?.group === "EWALLET" && selected.method === "DANA"}
                  icon={<Smartphone className="w-5 h-5 text-blue-500" />}
                  title="DANA"
                  subtitle="Instan"
                  onClick={() => setSelected({ group: "EWALLET", method: "DANA" })}
                />
                <MethodCard
                  active={selected?.group === "EWALLET" && selected.method === "OVO"}
                  icon={<Smartphone className="w-5 h-5 text-purple-500" />}
                  title="OVO"
                  subtitle="Instan"
                  onClick={() => setSelected({ group: "EWALLET", method: "OVO" })}
                />
              </Group>
              <Group title="QRIS">
                <MethodCard
                  active={selected?.group === "QRIS"}
                  icon={<QrCode className="w-5 h-5 text-emerald-600" />}
                  title="QRIS (Semua E-Wallet)"
                  subtitle="Scan QR Code"
                  onClick={() => setSelected({ group: "QRIS", method: "QRIS" })}
                />
              </Group>
              <Group title="Virtual Account">
                <MethodCard
                  active={selected?.group === "VA" && selected.method === "BCA"}
                  icon={<Banknote className="w-5 h-5 text-blue-600" />}
                  title="BCA"
                  subtitle="Transfer Bank"
                  onClick={() => setSelected({ group: "VA", method: "BCA" })}
                />
                <MethodCard
                  active={selected?.group === "VA" && selected.method === "BRI"}
                  icon={<Banknote className="w-5 h-5 text-indigo-600" />}
                  title="BRI"
                  subtitle="Transfer Bank"
                  onClick={() => setSelected({ group: "VA", method: "BRI" })}
                />
                <MethodCard
                  active={selected?.group === "VA" && selected.method === "MANDIRI"}
                  icon={<Banknote className="w-5 h-5 text-yellow-600" />}
                  title="Mandiri"
                  subtitle="Transfer Bank"
                  onClick={() => setSelected({ group: "VA", method: "MANDIRI" })}
                />
              </Group>
            </div>

            <div className="flex justify-end pt-4">
              <Button className="w-full md:w-auto h-12 md:h-14 rounded-xl px-10 text-base md:text-lg font-bold shadow-lg shadow-primary/20" onClick={startProcess} disabled={!selected}>
                Lanjutkan Pembayaran
              </Button>
            </div>
          </div>

          <SummaryCard coinAmount={trx.coinAmount} coinPrice={trx.coinPackage.price} adminFee={adminFee} total={total} />
        </div>
      )}

      {phase === "process" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {selected?.group === "QRIS" && (
              <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold">Bayar dengan QRIS</h3>
                  <div className="inline-flex items-center gap-2 text-sm font-bold text-emerald-600">
                    <Clock className="w-4 h-4" />
                    {timeText}
                  </div>
                </div>
                <div className="aspect-square bg-secondary rounded-2xl border border-border flex items-center justify-center overflow-hidden">
                  {!qrisLoadFailed && adminQrisUrl ? (
                    <img
                      src={adminQrisUrl}
                      alt="QRIS Admin"
                      className="w-full h-full object-contain p-6"
                      onError={() => setQrisLoadFailed(true)}
                    />
                  ) : (
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(serverQrisPayload || getQRPayload(trx))}`}
                      alt="QRIS"
                      className="w-full h-full object-contain p-6"
                    />
                  )}
                </div>
                <p className="text-sm text-muted-foreground text-center">Scan QR menggunakan aplikasi e-wallet Anda.</p>
              </div>
            )}

            {selected?.group === "EWALLET" && (
              <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
                <h3 className="text-lg font-bold">Bayar dengan {selected.method}</h3>
                <p className="text-sm text-muted-foreground">Klik tombol di bawah untuk membuka aplikasi. Jika tidak terbuka, Anda akan diarahkan ke toko aplikasi.</p>
                <div>
                  <Button
                    className="h-12 rounded-xl w-full font-bold"
                    onClick={() => {
                      if (serverRedirectUrl) {
                        window.open(serverRedirectUrl, "_blank");
                        return;
                      }
                      if (paymentUrl) {
                        window.open(paymentUrl, "_blank");
                        return;
                      }
                      if (selected.method === "SHOPEEPAY") openEwalletApp("SHOPEEPAY");
                      if (selected.method === "DANA") openEwalletApp("DANA");
                      if (selected.method === "OVO") openEwalletApp("OVO");
                    }}
                  >
                    Buka {selected.method}
                  </Button>
                </div>
              </div>
            )}

            {selected?.group === "VA" && (
              <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
                <h3 className="text-lg font-bold">Transfer Virtual Account {selected.method}</h3>
                  <div className="bg-secondary/50 border border-border rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Nomor VA</p>
                      <p className="text-xl font-bold tracking-widest">{serverVA || buildVANumber(trx, selected)}</p>
                  </div>
                  <Button variant="outline" className="rounded-xl" onClick={copyVA}>
                    <Copy className="w-4 h-4 mr-2" />
                    Salin
                  </Button>
                </div>
                <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
                  <li>Buka aplikasi bank Anda</li>
                  <li>Pilih menu pembayaran VA</li>
                  <li>Masukkan nomor VA di atas</li>
                  <li>Periksa nominal, lalu konfirmasi</li>
                </ol>
              </div>
            )}
          </div>
          <SummaryCard coinAmount={trx.coinAmount} coinPrice={trx.coinPackage.price} adminFee={adminFee} total={total} />
        </div>
      )}

      {phase === "success" && (
        <div className="max-w-2xl mx-auto bg-card border border-border rounded-2xl p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-50 inline-flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="text-2xl font-display font-bold">Pembayaran Berhasil!</h3>
          <p className="text-muted-foreground">+{trx.coinAmount} Koin berhasil ditambahkan.</p>
          <p className="text-sm">Total saldo sekarang: {balance !== null ? `${balance} koin` : "—"}</p>
          <div className="flex items-center justify-center gap-3 mt-4">
            <Button className="rounded-xl" onClick={() => navigate("/dashboard")}>
              Kembali ke Dashboard
            </Button>
            <Button variant="outline" className="rounded-xl" onClick={() => navigate("/dashboard/sell-item")}>
              Pasang Iklan Sekarang
            </Button>
          </div>
        </div>
      )}

      {phase === "failed" && (
        <div className="max-w-2xl mx-auto bg-card border border-border rounded-2xl p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-destructive/10 inline-flex items-center justify-center">
            <XCircle className="w-8 h-8 text-destructive" />
          </div>
          <h3 className="text-2xl font-display font-bold">Pembayaran Gagal</h3>
          <div className="flex items-center justify-center gap-3 mt-4">
            <Button className="rounded-xl" onClick={() => setPhase("select")}>
              Coba Lagi
            </Button>
            <Button variant="outline" className="rounded-xl" onClick={() => setPhase("select")}>
              Pilih Metode Lain
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: TransactionStatus }) {
  if (status === "success") {
    return <span className="text-xs font-bold px-2 py-1 rounded-full bg-emerald-50 text-emerald-600">Pembayaran Berhasil</span>;
  }
  if (status === "failed") {
    return <span className="text-xs font-bold px-2 py-1 rounded-full bg-rose-50 text-rose-600">Pembayaran Gagal</span>;
  }
  return <span className="text-xs font-bold px-2 py-1 rounded-full bg-amber-50 text-amber-600">Menunggu Pembayaran</span>;
}

function SectionTitle({ title }: { title: string }) {
  return <h2 className="text-lg font-bold text-foreground">{title}</h2>;
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{children}</div>
    </div>
  );
}

function MethodCard({
  active,
  icon,
  title,
  subtitle,
  onClick,
}: {
  active?: boolean;
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "p-4 rounded-2xl border-2 text-left transition-all hover:border-primary/50 bg-card",
        active ? "border-primary bg-primary/5" : "border-border",
      )}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center">{icon}</div>
        <div>
          <p className="font-bold">{title}</p>
          <p className="text-xs text-muted-foreground">{subtitle || "Instan"}</p>
        </div>
      </div>
    </button>
  );
}

function SummaryCard({ coinAmount, coinPrice, adminFee, total }: { coinAmount: number; coinPrice: number; adminFee: number; total: number }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6 h-fit">
      <h3 className="font-display font-semibold text-foreground mb-4">Ringkasan Pembayaran</h3>
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Jumlah koin</span>
          <span className="font-medium">{coinAmount} koin</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Harga koin</span>
          <span className="font-medium">Rp {coinPrice.toLocaleString("id-ID")}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Biaya admin</span>
          <span className="font-medium">Rp {adminFee.toLocaleString("id-ID")}</span>
        </div>
        <div className="pt-3 border-t border-border flex justify-between items-center">
          <span className="font-bold">Total Bayar</span>
          <span className="text-xl font-bold text-emerald-600">Rp {total.toLocaleString("id-ID")}</span>
        </div>
      </div>
    </div>
  );
}
