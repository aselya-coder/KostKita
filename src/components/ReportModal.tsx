import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { submitReport, ReportType } from "@/services/reports";
import { toast } from "sonner";
import { Loader2, AlertTriangle } from "lucide-react";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetId: string;
  targetName: string;
  type: ReportType;
  reporterId: string;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  targetId,
  targetName,
  type,
  reporterId,
}) => {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error("Mohon berikan alasan pelaporan.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { success, error } = await submitReport(reporterId, targetId, type, reason);
      
      if (success) {
        toast.success("Laporan Anda telah terkirim. Terima kasih atas bantuannya.");
        setReason("");
        onClose();
      } else {
        throw error;
      }
    } catch (err) {
      console.error("Failed to submit report:", err);
      toast.error("Gagal mengirim laporan. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] rounded-2xl">
        <DialogHeader>
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4 mx-auto">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <DialogTitle className="text-center text-xl font-display font-bold">Laporkan {type === 'kos' ? 'Kos' : type === 'item' ? 'Barang' : 'Pengguna'}</DialogTitle>
          <DialogDescription className="text-center">
            Anda melaporkan <span className="font-bold text-foreground">{targetName}</span>. 
            Berikan alasan yang jelas mengapa konten ini melanggar ketentuan.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <label className="text-sm font-semibold mb-2 block ml-1">Alasan Pelaporan</label>
          <Textarea
            placeholder="Contoh: Deskripsi palsu, penipuan, konten tidak pantas, dll."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="min-h-[120px] rounded-xl focus:ring-red-500/20 focus:border-red-500"
            disabled={isSubmitting}
          />
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
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="rounded-xl bg-red-600 hover:bg-red-700 text-white flex-1 font-bold shadow-lg shadow-red-200"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Mengirim...
              </>
            ) : (
              "Kirim Laporan"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
