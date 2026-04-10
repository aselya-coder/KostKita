import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getStudentBookings, getOwnerBookings, updateBookingStatus, type Booking } from "@/services/booking";
import { formatPrice } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Loader2,
  Building2,
  User,
  ExternalLink,
  MessageCircle
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { createNotification } from "@/services/notifications";

export default function BookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBookings = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const data = user.role === 'owner' 
        ? await getOwnerBookings(user.id)
        : await getStudentBookings(user.id);
      setBookings(data);
    } catch (error) {
      toast.error("Gagal memuat data pemesanan");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [user]);

  const handleUpdateStatus = async (booking: Booking, newStatus: Booking['status']) => {
    try {
      const result = await updateBookingStatus(booking.id, newStatus);
      if (result.success) {
        toast.success(`Pemesanan berhasil ${newStatus === 'approved' ? 'disetujui' : 'ditolak'}`);
        
        // Notify the student
        await createNotification(
          booking.userId,
          `Pemesanan ${newStatus === 'approved' ? 'Disetujui' : 'Ditolak'}`,
          `Pemesanan Anda untuk "${booking.kosTitle}" telah ${newStatus === 'approved' ? 'disetujui' : 'ditolak'} oleh pemilik.`,
          "booking",
          "/dashboard/bookings"
        );
        
        fetchBookings();
      } else {
        toast.error("Gagal memperbarui status");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    }
  };

  const getWhatsAppLink = (booking: Booking) => {
    const phone = user?.role === 'owner' ? booking.userPhone : booking.ownerPhone;
    const name = user?.role === 'owner' ? booking.userName : booking.ownerName;
    
    if (!phone) return null;

    let sanitizedPhone = phone.replace(/\D/g, '');
    if (sanitizedPhone.startsWith('0')) {
      sanitizedPhone = '62' + sanitizedPhone.slice(1);
    } else if (sanitizedPhone.startsWith('8')) {
      sanitizedPhone = '62' + sanitizedPhone;
    }

    if (sanitizedPhone.length < 10) return null;

    const message = user?.role === 'owner'
      ? `Halo ${name}, saya pemilik kos *${booking.kosTitle}* di KosKita. Saya ingin membicarakan mengenai pesanan booking Anda.`
      : `Halo ${name}, saya ingin menanyakan status booking saya untuk *${booking.kosTitle}* di KosKita.`;

    return `https://wa.me/${sanitizedPhone}?text=${encodeURIComponent(message)}`;
  };

  const getStatusBadge = (status: Booking['status']) => {
    switch (status) {
      case 'approved':
        return <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold uppercase">Disetujui</span>;
      case 'rejected':
        return <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-bold uppercase">Ditolak</span>;
      case 'cancelled':
        return <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs font-bold uppercase">Dibatalkan</span>;
      case 'completed':
        return <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase">Selesai</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold uppercase">Menunggu</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Pemesanan Saya</h1>
        <p className="text-muted-foreground mt-2">
          {user?.role === 'owner' 
            ? "Kelola permintaan pemesanan dari calon penghuni kos Anda."
            : "Pantau status pemesanan kos yang telah Anda ajukan."}
        </p>
      </div>

      {bookings.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {bookings.map((booking) => (
            <div key={booking.id} className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all">
              <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Building2 className="w-6 h-6 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg text-foreground">{booking.kosTitle}</h3>
                      {getStatusBadge(booking.status)}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        Masuk: {new Date(booking.checkInDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        Durasi: {booking.durationMonths} Bulan
                      </span>
                      {user?.role === 'owner' && (
                        <span className="flex items-center gap-1.5 text-primary font-medium">
                          <User className="w-4 h-4" />
                          Pemesan: {booking.userName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Total Pembayaran</p>
                    <p className="text-xl font-bold text-primary">{formatPrice(booking.totalPrice)}</p>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-2">
                    {getWhatsAppLink(booking) && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 rounded-lg"
                        onClick={() => window.open(getWhatsAppLink(booking)!, '_blank')}
                      >
                        <MessageCircle className="w-4 h-4 mr-1.5" /> Chat WA
                      </Button>
                    )}
                    {user?.role === 'owner' && booking.status === 'pending' && (
                      <>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-red-600 border-red-200 hover:bg-red-50 rounded-lg"
                          onClick={() => handleUpdateStatus(booking, 'rejected')}
                        >
                          <XCircle className="w-4 h-4 mr-1.5" /> Tolak
                        </Button>
                        <Button 
                          size="sm" 
                          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
                          onClick={() => handleUpdateStatus(booking, 'approved')}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1.5" /> Setujui
                        </Button>
                      </>
                    )}
                    <Button asChild variant="ghost" size="sm" className="rounded-lg">
                      <Link to={`/kos/${booking.kosId}`}>
                        Detail Properti <ExternalLink className="w-3 h-3 ml-1.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
              
              {booking.message && (
                <div className="px-6 py-3 bg-secondary/30 border-t border-border flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground italic">"{booking.message}"</p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-card border border-border border-dashed rounded-3xl p-12 text-center">
          <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-bold text-foreground">Belum ada pemesanan</h3>
          <p className="text-muted-foreground mt-2 max-w-xs mx-auto">
            {user?.role === 'owner' 
              ? "Anda belum menerima permintaan pemesanan untuk kos Anda."
              : "Anda belum melakukan pemesanan kos apapun."}
          </p>
          {user?.role !== 'owner' && (
            <Button asChild className="mt-6 rounded-xl">
              <Link to="/search">Cari Kos Sekarang</Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
