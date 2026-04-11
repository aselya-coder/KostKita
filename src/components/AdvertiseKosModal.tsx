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
import { Loader2, Zap, TrendingUp, CheckCircle2 } from "lucide-react";
import { getWalletBalance } from "@/services/coin";
import { supabase } from "@/lib/supabase";
import { getSystemConfigs } from "@/services/settings";

interface AdvertiseKosModalProps {
  isOpen: boolean;
  onClose: () => void;
  kosId: string;
  ownerId: string;
}

export const AdvertiseKosModal: React.FC<AdvertiseKosModalProps> = ({
  isOpen,
  onClose,
  kosId,
  ownerId,
}) => {
  const [walletBalance, setWalletBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [adDuration, setAdDuration] = useState(30);
  const [adCoinCost, setAdCoinCost] = useState(30);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [balance, configs] = await Promise.all([
        getWalletBalance(ownerId),
        getSystemConfigs()
      ]);
      setWalletBalance(balance);
      
      const duration = parseInt(configs['ad_active_duration'] || '30');
      const costPerDay = parseInt(configs['ad_cost_per_day'] || '1');
      
      setAdDuration(duration);
      setAdCoinCost(duration * costPerDay);
    } catch (err) {
      console.error("Failed to load modal data:", err);
      toast.error("Gagal memuat data koin dan konfigurasi");
    } finally {
      setIsLoading(false);
    }
  }, [ownerId]);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, loadData]);

  const handleAdvertise = async () => {
    if (walletBalance < adCoinCost) {
      toast.error(`Saldo koin tidak cukup. Minimal ${adCoinCost} koin diperlukan.`);
      return;
    }

    setIsSubmitting(true);
    try {
      // Deduct coins from wallet
      const { error: updateError } = await supabase
        .from('wallets')
        .update({ balance: walletBalance - adCoinCost })
        .eq('user_id', ownerId);

      if (updateError) throw updateError;

      // Record the advertising transaction
      const end_date = new Date();
      end_date.setDate(end_date.getDate() + adDuration);

      const { error: adError } = await supabase
        .from('kos_advertisements')
        .insert({
          kos_id: kosId,
          owner_id: ownerId,
          package_id: `boost-${adDuration}`,
          boost_level: 1,
          coin_cost: adCoinCost,
          duration_days: adDuration,
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
        amount: adCoinCost,
        description: `Promosi kos - Boost ${adDuration} Hari`
      });

      // Update kos listing status or metadata if needed
      await supabase
        .from('kos_listings')
        .update({ status: 'approved' }) 
        .eq('id', kosId);

      toast.success(`Promosi berhasil! Kos Anda akan mendapatkan prioritas tampilan selama ${adDuration} hari.`);
      setWalletBalance(walletBalance - adCoinCost);
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
      <DialogContent className="sm:max-w-[500px] rounded-2xl overflow-hidden p-0 border-none shadow-2xl">
        <div className="bg-primary p-8 text-primary-foreground relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <DialogTitle className="text-2xl font-display font-bold mb-2">
              Promosikan Kos Anda
            </DialogTitle>
            <DialogDescription className="text-primary-foreground/80 text-sm">
              Tingkatkan visibilitas kos Anda di hasil pencarian teratas selama {adDuration} hari ke depan.
            </DialogDescription>
          </div>
        </div>

        <div className="p-8 space-y-8 bg-card">
          {/* Wallet Balance */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-secondary/50 border border-border">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Saldo Anda</p>
              <p className="text-xl font-bold text-foreground flex items-center gap-1.5">
                {isLoading ? '...' : walletBalance.toLocaleString('id-ID')}
                <span className="text-sm text-primary">Koin</span>
              </p>
            </div>
            <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10 font-bold text-xs rounded-lg">
              TOP UP
            </Button>
          </div>

          {/* Single Promotion Package */}
          <div className="relative p-6 rounded-2xl border-2 border-primary bg-primary/5 shadow-sm">
            <div className="absolute -top-3 left-4 px-3 py-1 rounded-full bg-primary text-white text-[10px] font-bold uppercase tracking-wider">
              Rekomendasi
            </div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-lg text-foreground">Boost {adDuration} Hari</h3>
                <p className="text-xs text-muted-foreground">Visibilitas prioritas & posisi teratas</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">{adCoinCost}</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Koin</p>
              </div>
            </div>
            <div className="space-y-2">
              {[
                "Prioritas di hasil pencarian",
                "Badge khusus pada iklan",
                `Masa aktif ${adDuration} hari penuh`,
                "Statistik performa detail"
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                  {text}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-3">
            <Button 
              onClick={handleAdvertise} 
              disabled={isSubmitting || isLoading || walletBalance < adCoinCost}
              className="w-full py-7 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-lg shadow-xl shadow-primary/20 transition-all active:scale-[0.98]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  Aktifkan Promosi Sekarang
                  <TrendingUp className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
            <Button 
              variant="ghost" 
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full py-4 text-muted-foreground hover:text-foreground text-sm font-medium"
            >
              Nanti Saja
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
