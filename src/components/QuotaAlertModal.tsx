import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface QuotaAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
  role?: string;
}

export function QuotaAlertModal({ isOpen, onClose, message, role }: QuotaAlertModalProps) {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    onClose();
    navigate('/dashboard/topup');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] rounded-3xl border-border shadow-2xl">
        <DialogHeader className="flex flex-col items-center justify-center pt-4">
          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-4">
            <ShieldAlert className="w-8 h-8 text-amber-500" />
          </div>
          <DialogTitle className="text-2xl font-display font-bold text-center">
            Jatah Iklan Gratis Habis
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground pt-2">
            {message || "Anda hanya memiliki jatah 1 kali upload iklan GRATIS (Kos atau Barang). Karena Anda sudah menggunakannya, upload berikutnya wajib menggunakan Koin."}
          </DialogDescription>

        </DialogHeader>
        
        <div className="bg-secondary/30 rounded-2xl p-4 my-4 border border-border/50">
          <div className="flex items-start gap-3">
            <div className="mt-1">
              <Zap className="w-4 h-4 text-primary fill-primary" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground uppercase tracking-wider">Aturan Koin:</p>
              <ul className="text-[11px] text-muted-foreground mt-1 space-y-1">
                <li>• Biaya iklan: 1 Koin / Hari</li>
                <li>• Bebas pilih durasi (3, 7, 30 hari)</li>
                <li>• Iklan aktif otomatis selama durasi dipilih</li>
              </ul>
            </div>
          </div>
        </div>


        <DialogFooter className="flex flex-col sm:flex-row gap-3">
          <Button 
            variant="outline" 
            onClick={onClose} 
            className="flex-1 rounded-xl border-border"
          >
            Nanti Saja
          </Button>
          <Button 
            onClick={handleUpgrade} 
            className="flex-1 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20"
          >
            Top Up Koin Sekarang
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
