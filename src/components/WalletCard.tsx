import { Coins, TrendingUp, Wallet as WalletIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface WalletCardProps {
  balance: number;
  totalEarnings?: number;
  className?: string;
  onTopUp?: () => void;
}

export function WalletCard({ balance, totalEarnings, className, onTopUp }: WalletCardProps) {
  return (
    <div className={cn(
      "p-8 rounded-3xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-xl relative overflow-hidden group",
      className
    )}>
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl transition-all group-hover:bg-white/20" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/5 rounded-full translate-y-1/3 -translate-x-1/4 blur-xl" />

      <div className="relative flex flex-col h-full justify-between">
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <Coins className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-medium opacity-90 uppercase tracking-wider">Koin Saya</span>
          </div>
          
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-display font-bold">{balance}</span>
            <span className="text-xl font-medium opacity-80">KOIN</span>
          </div>
          
          {totalEarnings !== undefined && (
            <div className="mt-4 flex items-center gap-2 text-white/80">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs">Total Penghasilan: </span>
              <span className="text-sm font-semibold text-white">
                Rp {totalEarnings.toLocaleString('id-ID')}
              </span>
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center items-center">
          <Button 
            asChild
            className="w-full sm:flex-1 bg-white text-primary hover:bg-white/90 font-bold rounded-xl shadow-lg shadow-black/10 transition-all active:scale-95 border-none"
          >
            <Link to="/dashboard/topup">
              <WalletIcon className="w-4 h-4 mr-2" />
              Top Up Koin
            </Link>
          </Button>
          <Button 
            asChild
            variant="ghost"
            className="w-full sm:flex-1 bg-white/20 hover:bg-white/30 text-white font-bold rounded-xl backdrop-blur-md transition-all active:scale-95 border border-white/20"
          >
            <Link to="/dashboard/transactions">
              Riwayat
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
