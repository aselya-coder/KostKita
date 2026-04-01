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
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2, ShieldCheck, Trash2, XCircle, AlertTriangle } from "lucide-react";
import { notifyAdmins } from "@/services/notifications";

interface FollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: any;
  onSuccess: () => void;
}

export const FollowUpModal: React.FC<FollowUpModalProps> = ({
  isOpen,
  onClose,
  report,
  onSuccess,
}) => {
  const [adminNote, setAdminNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAction = async (actionType: 'resolve' | 'dismiss' | 'delete_content') => {
    setIsSubmitting(true);
    try {
      if (actionType === 'delete_content') {
        const table = report.type === 'kos' ? 'kos_listings' : 
                     report.type === 'item' ? 'marketplace_items' : 'profiles';
        
        const { error: deleteError } = await supabase
          .from(table)
          .delete()
          .eq('id', report.target_id);
        
        if (deleteError) throw deleteError;
      }

      // Update report status
      const { error: reportError } = await supabase
        .from('reports')
        .update({ 
          status: actionType === 'dismiss' ? 'dismissed' : 'resolved',
        })
        .eq('id', report.id);

      if (reportError) throw reportError;

      // Notify reporter
      const message = actionType === 'delete_content' 
        ? `Laporan Anda mengenai ${report.targetName} telah ditindaklanjuti. Konten tersebut telah dihapus.`
        : actionType === 'resolve'
        ? `Laporan Anda mengenai ${report.targetName} telah ditinjau dan diselesaikan.`
        : `Laporan Anda mengenai ${report.targetName} telah ditinjau dan dinyatakan tidak melanggar ketentuan.`;

      await supabase.from('notifications').insert({
        user_id: report.reporter_id,
        title: 'Update Laporan',
        message,
        type: 'system',
        link: report.type === 'kos' ? '/dashboard/reports' : '/owner-dashboard/reports'
      });

      toast.success(actionType === 'dismiss' ? "Laporan diabaikan" : "Laporan berhasil ditindaklanjuti");
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Failed to process report:", err);
      toast.error("Gagal memproses laporan");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!report) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] rounded-2xl">
        <DialogHeader>
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 mx-auto">
            <ShieldCheck className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl font-display font-bold">Tindak Lanjuti Laporan</DialogTitle>
          <DialogDescription className="text-center">
            Laporan dari <span className="font-bold text-foreground">{report.reporterName}</span> mengenai <span className="font-bold text-foreground">{report.targetName}</span>.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <div className="p-4 rounded-xl bg-red-50 border border-red-100">
            <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-1 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Alasan Pelaporan:
            </p>
            <p className="text-sm text-red-700 leading-relaxed italic">"{report.reason}"</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold ml-1">Catatan Admin (Opsional)</label>
            <Textarea
              placeholder="Berikan catatan singkat mengenai tindakan yang diambil..."
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              className="min-h-[100px] rounded-xl focus:ring-primary/20"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => handleAction('dismiss')}
            disabled={isSubmitting}
            className="rounded-xl flex-1 border-border"
          >
            <XCircle className="w-4 h-4 mr-2" />
            Abaikan
          </Button>
          
          <Button
            type="button"
            variant="outline"
            onClick={() => handleAction('resolve')}
            disabled={isSubmitting}
            className="rounded-xl flex-1 border-primary text-primary hover:bg-primary/5"
          >
            <ShieldCheck className="w-4 h-4 mr-2" />
            Selesaikan
          </Button>

          {(report.type === 'kos' || report.type === 'item') && (
            <Button
              type="button"
              onClick={() => handleAction('delete_content')}
              disabled={isSubmitting}
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white flex-1 font-bold shadow-lg shadow-red-200"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Hapus Konten
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
