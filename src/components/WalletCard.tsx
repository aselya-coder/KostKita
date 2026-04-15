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
      "p-6 md:p-8 rounded-2xl md:rounded-3xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-xl relative overflow-hidden group",
      className
    )}>
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl transition-all group-hover:bg-white/20" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/5 rounded-full translate-y-1/3 -translate-x-1/4 blur-xl" />

      <div className="relative flex flex-col h-full justify-between">
        <div>
          <div className="flex items-center gap-3 mb-4 md:mb-6">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <Coins className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <span className="text-xs md:text-sm font-medium opacity-90 uppercase tracking-wider">Koin Saya</span>
          </div>
          
          <div className="flex items-baseline gap-2">
            <span className="text-4xl md:text-5xl font-display font-bold">{balance}</span>
            <span className="text-lg md:text-xl font-medium opacity-80 uppercase">Koin</span>
          </div>
          
          {totalEarnings !== undefined && (
            <div className="mt-3 md:mt-4 flex items-center gap-2 text-white/80">
              <TrendingUp className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="text-[10px] md:text-xs">Total Penghasilan: </span>
              <span className="text-xs md:text-sm font-semibold text-white">
                Rp {totalEarnings.toLocaleString('id-ID')}
              </span>
            </div>
          )}
        </div>

        <div className="mt-6 md:mt-8 flex flex-row gap-3">
          <Button 
            asChild
            size="sm"
            className="flex-1 bg-white text-primary hover:bg-white/90 font-bold rounded-xl shadow-lg shadow-black/10 transition-all active:scale-95 border-none text-xs md:text-sm"
          >
            <Link to="/dashboard/topup">
              <WalletIcon className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2" />
              Top Up
            </Link>
          </Button>
          <Button 
            asChild
            variant="ghost"
            size="sm"
            className="flex-1 bg-white/20 hover:bg-white/30 text-white font-bold rounded-xl backdrop-blur-md transition-all active:scale-95 border border-white/20 text-xs md:text-sm"
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
