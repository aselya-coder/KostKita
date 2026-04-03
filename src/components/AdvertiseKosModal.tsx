import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Zap, TrendingUp } from "lucide-react";
import { getWalletBalance, CoinPackage } from "@/services/coin";
import { supabase } from "@/lib/supabase";

interface AdvertiseKosModalProps {
  isOpen: boolean;
  onClose: () => void;
  kosId: string;
  ownerId: string;
}

interface AdvertisePackage {
  id: string;
  name: string;
  duration_days: number;
  coin_cost: number;
  boost_level: number;
  description: string;
}

const ADVERTISE_PACKAGES: AdvertisePackage[] = [
  {
    id: '1',
    name: 'Boost Standar',
    duration_days: 7,
    coin_cost: 100,
    boost_level: 1,
    description: 'Tampilkan kos Anda di bagian atas selama 7 hari'
  },
  {
    id: '2',
    name: 'Boost Premium',
    duration_days: 30,
    coin_cost: 300,
    boost_level: 2,
    description: 'Tingkatkan visibilitas selama 1 bulan dengan badge premium'
  },
  {
    id: '3',
    name: 'Boost Eksklusif',
    duration_days: 60,
    coin_cost: 500,
    boost_level: 3,
    description: 'Promosi maksimal selama 2 bulan dengan featured placement'
  }
];

export const AdvertiseKosModal: React.FC<AdvertiseKosModalProps> = ({
  isOpen,
  onClose,
  kosId,
  ownerId,
}) => {
  const [walletBalance, setWalletBalance] = useState(0);
  const [selectedPackage, setSelectedPackage] = useState<AdvertisePackage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadWalletBalance = useCallback(async () => {
    setIsLoading(true);
    try {
      const balance = await getWalletBalance(ownerId);
      setWalletBalance(balance);
    } catch (err) {
      console.error("Failed to load wallet balance:", err);
      toast.error("Gagal memuat saldo koin");
    } finally {
      setIsLoading(false);
    }
  }, [ownerId]);

  useEffect(() => {
    if (isOpen) {
      loadWalletBalance();
    }
  }, [isOpen, loadWalletBalance]);

  const handleAdvertise = async () => {
    if (!selectedPackage) {
      toast.error("Pilih paket promosi terlebih dahulu");
      return;
    }

    if (walletBalance < selectedPackage.coin_cost) {
      toast.error("Saldo koin tidak cukup");
      return;
    }

    setIsSubmitting(true);
    try {
      // Deduct coins from wallet
      const { error: updateError } = await supabase
        .from('wallets')
        .update({ balance: walletBalance - selectedPackage.coin_cost })
        .eq('user_id', ownerId);

      if (updateError) throw updateError;

      // Record the advertising transaction
      const end_date = new Date();
      end_date.setDate(end_date.getDate() + selectedPackage.duration_days);

      const { error: adError } = await supabase
        .from('kos_advertisements')
        .insert({
          kos_id: kosId,
          owner_id: ownerId,
          package_id: selectedPackage.id,
          boost_level: selectedPackage.boost_level,
          coin_cost: selectedPackage.coin_cost,
          duration_days: selectedPackage.duration_days,
          start_date: new Date().toISOString(),
          end_date: end_date.toISOString(),
          is_active: true,
        });

      if (adError) {
        // Refund the coins if ad insertion fails
        await supabase
          .from('wallets')
          .update({ balance: walletBalance })
          .eq('user_id', ownerId);
        throw adError;
      }

      // Add coin transaction log
      await supabase.from('coin_logs').insert({
        user_id: ownerId,
        type: 'debit',
        amount: selectedPackage.coin_cost,
        description: `Promosi kos - ${selectedPackage.name} (${selectedPackage.duration_days} hari)`
      });

      toast.success(`Promosi ${selectedPackage.name} berhasil! Kos Anda akan ditampilkan di bagian atas.`);
      setWalletBalance(walletBalance - selectedPackage.coin_cost);
      setSelectedPackage(null);
      onClose();
    } catch (err) {
      console.error("Failed to advertise kos:", err);
      toast.error("Gagal memproses promosi. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center mb-4 mx-auto">
            <Zap className="w-6 h-6 text-yellow-600" />
          </div>
          <DialogTitle className="text-center text-xl font-display font-bold">
            Promosikan Kos Anda
          </DialogTitle>
          <DialogDescription className="text-center">
            Tingkatkan visibilitas kos dengan promosi berbayar menggunakan koin
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 space-y-6">
          {/* Wallet Balance */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Saldo Koin Anda
            </p>
            <p className="text-2xl font-bold text-primary">
              {isLoading ? '...' : walletBalance.toLocaleString('id-ID')} 💎
            </p>
            <Button
              variant="link"
              className="text-xs mt-2 h-auto p-0"
              onClick={() => {
                onClose();
                // Navigate to top up page
              }}
            >
              Tambah Koin →
            </Button>
          </div>

          {/* Advertising Packages */}
          <div className="space-y-3">
            <p className="text-sm font-semibold">Pilih Paket Promosi</p>
            <div className="grid grid-cols-1 gap-3">
              {ADVERTISE_PACKAGES.map((pkg) => {
                const isAffordable = walletBalance >= pkg.coin_cost;
                const isSelected = selectedPackage?.id === pkg.id;

                return (
                  <div
                    key={pkg.id}
                    onClick={() => isAffordable && setSelectedPackage(pkg)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/30'
                    } ${!isAffordable ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-sm">{pkg.name}</h3>
                          {pkg.boost_level === 3 && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                              TERBAIK
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{pkg.description}</p>
                        <div className="flex items-center gap-4 text-xs">
                          <span className="text-muted-foreground">
                            📅 {pkg.duration_days} hari
                          </span>
                          <span className="text-muted-foreground">
                            <TrendingUp className="w-3 h-3 inline mr-1" />
                            Level {pkg.boost_level}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-primary">
                          {pkg.coin_cost}
                        </p>
                        <p className="text-xs text-muted-foreground">💎 koin</p>
                        {!isAffordable && (
                          <p className="text-xs text-red-600 font-semibold mt-1">
                            Saldo kurang
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Benefits */}
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
            <p className="text-xs font-semibold text-blue-900 uppercase tracking-wider mb-2">
              Manfaat Promosi
            </p>
            <ul className="text-xs text-blue-900 space-y-1">
              <li>✓ Tampilkan di bagian atas daftar pencarian</li>
              <li>✓ Peningkatan visibilitas hingga 5x lebih tinggi</li>
              <li>✓ Mendapat badge "Promosi" di listing</li>
              <li>✓ Prioritas dalam hasil rekomendasi</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl flex-1"
          >
            Batal
          </Button>
          <Button
            type="button"
            onClick={handleAdvertise}
            disabled={isSubmitting || !selectedPackage || walletBalance < (selectedPackage?.coin_cost || Infinity)}
            className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground flex-1 font-bold shadow-lg shadow-primary/20"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Promosikan Sekarang
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
