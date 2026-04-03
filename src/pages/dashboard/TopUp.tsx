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
  ArrowRight,
  ArrowLeft,
  BadgeCheck,
  ExternalLink,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Gift,
  Repeat2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/BackButton";
import { useAuth } from "@/hooks/useAuth";
import { getCoinPackages, createTopupRequest, type CoinPackage } from "@/services/payment";
import { getWalletBalance, getCoinLogs, type CoinLog } from "@/services/wallet";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const toBackendRole = (role?: string): "USER" | "ADMIN" =>
  role === "admin" ? "ADMIN" : "USER";

const toBasePath = (role?: string) => {
  if (role === "owner") return "/owner-dashboard";
  if (role === "admin") return "/admin-dashboard";
  return "/dashboard";
};

const PACKAGE_FEATURES = (coinAmount: number) => [
  `${coinAmount} Koin`,
  "Masa Aktif Selamanya",
  "1 Koin per hari per iklan",
];

// ─── Types ────────────────────────────────────────────────────────────────────

type PendingResult = {
  transactionId: string;
  externalId: string;
  paymentUrl: string;
  packageName: string;
  coinAmount: number;
  amount: number;
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function BalanceCard({ balance, onRefresh, isRefreshing }: { balance: number | null; onRefresh: () => void; isRefreshing: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-primary to-primary/75 rounded-3xl p-6 md:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl shadow-primary/20"
    >
      <div className="flex items-center gap-5">
        <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
          <Wallet className="w-7 h-7 text-white" />
        </div>
        <div>
          <p className="text-white/70 text-sm font-medium mb-0.5">Saldo Koin Saat Ini</p>
          <p className="text-4xl font-display font-bold text-white leading-none">
            {balance !== null ? balance : "—"}
            <span className="text-2xl font-medium opacity-75 ml-2">Koin</span>
          </p>
          <p className="text-white/60 text-xs mt-1">
            ≈ {balance !== null ? formatCurrency(balance * 10000) : "—"}
          </p>
        </div>
      </div>
      <div className="flex flex-col items-end gap-3">
        <div className="flex items-center gap-3 bg-white/10 rounded-2xl px-5 py-4">
          <TrendingUp className="w-5 h-5 text-white/70" />
          <div className="text-right">
            <p className="text-white/70 text-xs uppercase tracking-wider font-bold mb-0.5">
              1 Koin =
            </p>
            <p className="text-xl font-bold text-white">Rp10.000</p>
          </div>
        </div>
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 text-white/70 hover:text-white text-xs font-medium transition-colors disabled:opacity-50"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin")} />
          Refresh saldo
        </button>
      </div>
    </motion.div>
  );
}

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({ step }: { step: 1 | 2 | 3 }) {
  const steps = [
    { label: "Pilih Paket", num: 1 },
    { label: "Konfirmasi", num: 2 },
    { label: "Pembayaran", num: 3 },
  ];
  return (
    <div className="flex items-center gap-2">
      {steps.map(({ label, num }, i) => (
        <div key={num} className="flex items-center gap-2">
          <div
            className={cn(
              "flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all duration-300",
              step > num
                ? "bg-emerald-500 text-white"
                : step === num
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground"
            )}
          >
            {step > num ? <Check className="w-3.5 h-3.5" /> : num}
          </div>
          <span
            className={cn(
              "text-xs font-medium hidden sm:inline transition-colors",
              step >= num ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {label}
          </span>
          {i < steps.length - 1 && (
            <div
              className={cn(
                "w-6 h-0.5 rounded-full transition-colors duration-300",
                step > num ? "bg-emerald-500" : "bg-border"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Step 1: Package Selection ────────────────────────────────────────────────

function PackageSelectionStep({
  packages,
  selected,
  onSelect,
  onContinue,
}: {
  packages: CoinPackage[];
  selected: CoinPackage | null;
  onSelect: (pkg: CoinPackage) => void;
  onContinue: () => void;
}) {
  const popularIndex = Math.floor(packages.length / 2);

  if (packages.length === 0) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        <Coins className="w-12 h-12 mx-auto mb-4 opacity-30" />
        <p className="font-medium">Belum ada paket tersedia.</p>
      </div>
    );
  }

  return (
    <motion.div
      key="step-1"
      initial={{ opacity: 0, x: -24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.22 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-xl font-display font-bold text-foreground">Pilih Paket</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Klik paket yang ingin Anda beli, lalu tekan Lanjutkan.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {packages.map((pkg, index) => {
          const isPopular = index === popularIndex;
          const isSelected = selected?.id === pkg.id;

          return (
            <motion.button
              key={pkg.id}
              type="button"
              onClick={() => onSelect(pkg)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className={cn(
                "relative flex flex-col p-6 bg-card border rounded-3xl text-left transition-all duration-200 hover:shadow-xl hover:-translate-y-1 focus:outline-none",
                isSelected
                  ? "border-primary ring-2 ring-primary shadow-xl shadow-primary/10"
                  : "border-border shadow-sm hover:border-primary/40"
              )}
            >
              {isPopular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-lg whitespace-nowrap">
                  <Star className="w-3 h-3 fill-current" />
                  Paling Laris
                </div>
              )}

              {isSelected && (
                <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-sm">
                  <Check className="w-3.5 h-3.5 text-primary-foreground" />
                </div>
              )}

              <div className="mb-5 w-fit">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold">
                  <Coins className="w-3.5 h-3.5" />
                  {pkg.coinAmount} Koin
                </span>
              </div>

              <h3 className="text-lg font-bold text-foreground mb-1">{pkg.name}</h3>
              <div className="flex items-baseline gap-1 mb-5">
                <span className="text-2xl font-bold text-foreground">
                  {formatCurrency(pkg.price)}
                </span>
              </div>

              <ul className="space-y-2.5">
                {PACKAGE_FEATURES(pkg.coinAmount).map((f) => (
                  <li key={f} className="flex items-center gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <Check className="w-2.5 h-2.5 text-emerald-500" />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>
            </motion.button>
          );
        })}
      </div>

      <div className="flex justify-end pt-2">
        <Button
          onClick={onContinue}
          disabled={!selected}
          size="lg"
          className="h-12 px-8 rounded-2xl font-bold shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
        >
          Lanjutkan
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </motion.div>
  );
}

// ─── Step 2: Confirmation ─────────────────────────────────────────────────────

function ConfirmationStep({
  pkg,
  isProcessing,
  onBack,
  onPay,
}: {
  pkg: CoinPackage;
  isProcessing: boolean;
  onBack: () => void;
  onPay: () => void;
}) {
  return (
    <motion.div
      key="step-2"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.22 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-xl font-display font-bold text-foreground">Konfirmasi Pembelian</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Periksa detail pesanan sebelum melanjutkan ke pembayaran.
        </p>
      </div>

      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
        {/* Package banner */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border px-6 py-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <Coins className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
              Paket yang Dipilih
            </p>
            <h3 className="text-lg font-bold text-foreground">{pkg.name}</h3>
          </div>
          <BadgeCheck className="w-6 h-6 text-primary ml-auto" />
        </div>

        {/* Detail rows */}
        <div className="divide-y divide-border">
          <div className="flex items-center justify-between px-6 py-4">
            <span className="text-sm text-muted-foreground font-medium">Jumlah Koin</span>
            <span className="text-sm font-bold text-foreground">{pkg.coinAmount} Koin</span>
          </div>
          <div className="flex items-center justify-between px-6 py-4">
            <span className="text-sm text-muted-foreground font-medium">Total Bayar</span>
            <span className="text-base font-bold text-primary">{formatCurrency(pkg.price)}</span>
          </div>

          {/* Payment method */}
          <div className="px-6 py-4 space-y-3">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Metode Pembayaran
            </p>
            <div className="flex items-center gap-3 p-3.5 rounded-2xl border border-primary/30 bg-primary/5">
              <CreditCard className="w-5 h-5 text-primary shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Midtrans</p>
                <p className="text-xs text-muted-foreground">Transfer Bank · QRIS · E-Wallet · Kartu Kredit</p>
              </div>
              <Check className="w-4 h-4 text-primary shrink-0" />
            </div>
          </div>
        </div>
      </div>

      {/* Note */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200 dark:bg-amber-900/10 dark:border-amber-800/30">
        <Gift className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700 dark:text-amber-400">
          Setelah klik <strong>Bayar Sekarang</strong>, Anda akan diarahkan ke halaman pembayaran Midtrans. Koin akan otomatis masuk setelah pembayaran dikonfirmasi.
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-3 justify-between">
        <button
          type="button"
          onClick={onBack}
          disabled={isProcessing}
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali Pilih Paket
        </button>

        <Button
          onClick={onPay}
          disabled={isProcessing}
          size="lg"
          className="w-full sm:w-auto h-14 px-10 rounded-2xl font-bold text-base shadow-lg shadow-primary/20 transition-all active:scale-95"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Memproses...
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5 mr-2" />
              Bayar Sekarang
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}

// ─── Step 3: Pending / Payment Initiated ─────────────────────────────────────

function PaymentPendingStep({
  result,
  basePath,
  onReset,
}: {
  result: PendingResult;
  basePath: string;
  onReset: () => void;
}) {
  return (
    <motion.div
      key="step-3"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* Status card */}
      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm text-center">
        <div className="bg-gradient-to-b from-amber-50 to-transparent dark:from-amber-900/10 px-6 pt-10 pb-6">
          <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-xl font-display font-bold text-foreground">
            Menunggu Pembayaran
          </h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            Transaksi berhasil dibuat. Selesaikan pembayaran untuk mendapatkan koin Anda.
          </p>
        </div>

        <div className="divide-y divide-border text-left">
          {[
            { label: "Paket", value: result.packageName },
            { label: "Jumlah Koin", value: `${result.coinAmount} Koin` },
            { label: "Total Bayar", value: formatCurrency(result.amount), highlight: true },
            { label: "ID Transaksi", value: result.externalId, mono: true },
            { label: "Status", value: "Menunggu Pembayaran", badge: "pending" as const },
          ].map(({ label, value, highlight, mono, badge }) => (
            <div key={label} className="flex items-center justify-between px-6 py-4">
              <span className="text-sm text-muted-foreground font-medium">{label}</span>
              {badge ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-600 dark:bg-amber-900/20 text-[10px] font-bold uppercase tracking-wider">
                  <Clock className="w-3 h-3" />
                  Pending
                </span>
              ) : (
                <span
                  className={cn(
                    "text-sm font-bold",
                    highlight ? "text-primary" : mono ? "font-mono text-xs text-muted-foreground" : "text-foreground"
                  )}
                >
                  {value}
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="p-6 space-y-3 bg-secondary/20">
          <Button
            asChild
            size="lg"
            className="w-full h-12 rounded-2xl font-bold shadow-lg shadow-primary/20"
          >
            <a href={result.paymentUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />
              Buka Halaman Pembayaran
            </a>
          </Button>
          <div className="flex gap-3">
            <Button asChild variant="outline" size="sm" className="flex-1 rounded-xl">
              <Link to={`${basePath}/transactions`}>
                Lihat Transaksi
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 rounded-xl text-muted-foreground"
              onClick={onReset}
            >
              <Repeat2 className="w-4 h-4 mr-1.5" />
              Top Up Lagi
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── How it Works ─────────────────────────────────────────────────────────────

function HowItWorks() {
  const steps = [
    {
      icon: Coins,
      title: "Pilih Paket Koin",
      desc: "Pilih paket yang sesuai kebutuhan Anda dari daftar paket yang tersedia.",
    },
    {
      icon: CreditCard,
      title: "Selesaikan Pembayaran",
      desc: "Bayar melalui Midtrans — Transfer Bank, QRIS, E-Wallet, atau Kartu Kredit.",
    },
    {
      icon: CheckCircle2,
      title: "Koin Masuk Otomatis",
      desc: "Setelah pembayaran dikonfirmasi, koin langsung masuk ke dompet Anda.",
    },
  ];
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
        Cara Kerja
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {steps.map(({ icon: Icon, title, desc }, i) => (
          <div
            key={title}
            className="bg-card border border-border rounded-2xl p-5 flex gap-4 items-start"
          >
            <div className="flex flex-col items-center gap-2 shrink-0">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <span className="text-xs font-bold text-muted-foreground/50">{String(i + 1).padStart(2, "0")}</span>
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">{title}</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Recent Coin Logs ─────────────────────────────────────────────────────────

function RecentLogs({ logs, basePath, isLoading }: { logs: CoinLog[]; basePath: string; isLoading: boolean }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
          Riwayat Koin Terakhir
        </h3>
        <Link
          to={`${basePath}/transactions`}
          className="text-xs font-bold text-primary hover:underline uppercase tracking-wider"
        >
          Lihat Semua
        </Link>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="py-10 flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <p className="text-xs">Memuat riwayat...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center space-y-2 text-muted-foreground">
            <Coins className="w-8 h-8 mx-auto opacity-20" />
            <p className="text-sm">Belum ada riwayat koin.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {logs.slice(0, 6).map((log) => (
              <div key={log.id} className="flex items-center gap-4 px-5 py-4 hover:bg-secondary/30 transition-colors">
                <div
                  className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                    log.type === "credit"
                      ? "bg-emerald-500/10"
                      : "bg-destructive/10"
                  )}
                >
                  {log.type === "credit" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-destructive" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {log.type === "credit" ? "Top Up Koin" : "Penggunaan Koin"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {log.description || "—"}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p
                    className={cn(
                      "text-sm font-bold",
                      log.type === "credit" ? "text-emerald-600" : "text-destructive"
                    )}
                  >
                    {log.type === "credit" ? "+" : "-"}{log.amount} Koin
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {formatDate(log.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TopUpPage() {
  const { user } = useAuth();
  const [packages, setPackages] = useState<CoinPackage[]>([]);
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshingBalance, setIsRefreshingBalance] = useState(false);
  const [selected, setSelected] = useState<CoinPackage | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingResult, setPendingResult] = useState<PendingResult | null>(null);
  const [coinLogs, setCoinLogs] = useState<CoinLog[]>([]);
  const [isLogsLoading, setIsLogsLoading] = useState(true);

  const basePath = toBasePath(user?.role);

  // Load packages + balance + logs
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      setIsLoading(true);
      setIsLogsLoading(true);
      try {
        const [pkgs, bal, logs] = await Promise.all([
          getCoinPackages(),
          getWalletBalance(user.id),
          getCoinLogs(user.id),
        ]);
        setPackages(pkgs);
        setBalance(bal);
        setCoinLogs(logs);
      } catch {
        toast.error("Gagal memuat data. Coba lagi.");
      } finally {
        setIsLoading(false);
        setIsLogsLoading(false);
      }
    };
    loadData();
  }, [user]);

  const handleRefreshBalance = async () => {
    if (!user) return;
    setIsRefreshingBalance(true);
    try {
      const [bal, logs] = await Promise.all([
        getWalletBalance(user.id),
        getCoinLogs(user.id),
      ]);
      setBalance(bal);
      setCoinLogs(logs);
      toast.success("Saldo diperbarui!");
    } catch {
      toast.error("Gagal memperbarui saldo.");
    } finally {
      setIsRefreshingBalance(false);
    }
  };

  const handlePay = async () => {
    if (!user || !selected) return;
    setIsProcessing(true);
    try {
      const result = await createTopupRequest(
        user.id,
        selected.id,
        toBackendRole(user.role)
      );

      const pending: PendingResult = {
        transactionId: result.transaction?.id ?? result.id ?? "",
        externalId: result.transaction?.externalId ?? result.externalId ?? "",
        paymentUrl: result.paymentUrl ?? "#",
        packageName: selected.name,
        coinAmount: selected.coinAmount,
        amount: selected.price,
      };

      setPendingResult(pending);
      setStep(3);

      // Open payment URL in new tab
      if (pending.paymentUrl && pending.paymentUrl !== "#") {
        window.open(pending.paymentUrl, "_blank", "noopener,noreferrer");
      }

      toast.success(`Pesanan "${selected.name}" berhasil dibuat!`, {
        description: `ID: ${pending.externalId}`,
        duration: 6000,
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Gagal memproses pembayaran.";
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setSelected(null);
    setPendingResult(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* ── Page header ── */}
      <div className="flex flex-col gap-4">
        <BackButton to={basePath} className="mb-0" />

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest">
              <Zap className="w-3 h-3 fill-current" />
              Coin Wallet
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground tracking-tight">
              Isi Saldo Koin
            </h1>
            <p className="text-muted-foreground max-w-lg">
              Pilih paket koin yang sesuai dan tambah saldo dompet Anda dengan
              cepat dan aman.
            </p>
          </div>
          <StepIndicator step={step} />
        </div>
      </div>

      {/* ── Loading ── */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-9 h-9 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* ── Balance card ── */}
          <BalanceCard
            balance={balance}
            onRefresh={handleRefreshBalance}
            isRefreshing={isRefreshingBalance}
          />

          {/* ── Step content ── */}
          <AnimatePresence mode="wait">
            {step === 1 && (
              <PackageSelectionStep
                key="step-1"
                packages={packages}
                selected={selected}
                onSelect={setSelected}
                onContinue={() => setStep(2)}
              />
            )}
            {step === 2 && selected && (
              <ConfirmationStep
                key="step-2"
                pkg={selected}
                isProcessing={isProcessing}
                onBack={() => setStep(1)}
                onPay={handlePay}
              />
            )}
            {step === 3 && pendingResult && (
              <PaymentPendingStep
                key="step-3"
                result={pendingResult}
                basePath={basePath}
                onReset={handleReset}
              />
            )}
          </AnimatePresence>

          {/* ── How it works (only on step 1) ── */}
          {step === 1 && <HowItWorks />}

          {/* ── Recent coin logs ── */}
          <RecentLogs
            logs={coinLogs}
            basePath={basePath}
            isLoading={isLogsLoading}
          />

          {/* ── Security strip ── */}
          <div className="bg-secondary/30 border border-border/50 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-background rounded-2xl flex items-center justify-center shadow-sm border border-border shrink-0">
                <ShieldCheck className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h4 className="font-bold text-foreground text-sm">
                  Pembayaran Aman &amp; Terverifikasi
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Kami bekerja sama dengan Midtrans untuk menjamin keamanan
                  transaksi Anda.
                </p>
              </div>
            </div>
            <div className="flex gap-3 grayscale opacity-40">
              <div className="h-6 w-16 bg-muted-foreground/30 rounded" />
              <div className="h-6 w-16 bg-muted-foreground/30 rounded" />
              <div className="h-6 w-16 bg-muted-foreground/30 rounded" />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
