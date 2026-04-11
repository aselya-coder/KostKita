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
import { supabase } from "@/lib/supabase";
import { sanitizePhone, buildWaLink } from "@/utils/whatsapp";

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
    if (!user) return;
    const channel = supabase
      .channel(`bookings-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings', filter: user.role === 'owner' ? `owner_id=eq.${user.id}` : `user_id=eq.${user.id}` }, () => {
        fetchBookings();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleUpdateStatus = async (booking: Booking, newStatus: Booking['status']) => {
    try {
      if (newStatus === 'approved') {
        const { data: availability, error: availErr } = await supabase
          .from('kos_listings')
          .select('available_rooms')
          .eq('id', booking.kosId)
          .single();
        if (availErr || !availability || typeof availability.available_rooms !== 'number') {
          toast.error("Gagal memeriksa ketersediaan kamar");
          return;
        }
        if (availability.available_rooms <= 0) {
          toast.error("Kamar sudah penuh. Tidak dapat menyetujui pemesanan.");
          return;
        }
      }

      const result = await updateBookingStatus(booking.id, newStatus);
      if (result.success) {
        toast.success(`Pemesanan berhasil ${newStatus === 'approved' ? 'disetujui' : 'ditolak'}`);
        
        if (newStatus === 'approved') {
          const { data, error } = await supabase
            .from('kos_listings')
            .select('available_rooms')
            .eq('id', booking.kosId)
            .single();
          if (!error && data && typeof data.available_rooms === 'number' && data.available_rooms > 0) {
            await supabase
              .from('kos_listings')
              .update({ available_rooms: data.available_rooms - 1 })
              .eq('id', booking.kosId);
          }
        }
        
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

  const handleCancelBooking = async (booking: Booking) => {
    try {
      if (!confirm("Batalkan pemesanan ini?")) return;
      const result = await updateBookingStatus(booking.id, 'cancelled');
      if (result.success) {
        if (booking.status === 'approved') {
          const { data, error } = await supabase
            .from('kos_listings')
            .select('available_rooms')
            .eq('id', booking.kosId)
            .single();
          if (!error && data && typeof data.available_rooms === 'number') {
            await supabase
              .from('kos_listings')
              .update({ available_rooms: data.available_rooms + 1 })
              .eq('id', booking.kosId);
          }
        }
        await createNotification(
          booking.ownerId,
          "Pemesanan Dibatalkan",
          `Pemesanan untuk "${booking.kosTitle}" telah dibatalkan oleh pemesan.`,
          "booking",
          "/dashboard/bookings"
        );
        toast.success("Pemesanan dibatalkan");
        fetchBookings();
      } else {
        toast.error("Gagal membatalkan pemesanan");
      }
    } catch {
      toast.error("Terjadi kesalahan");
    }
  };

  const getWhatsAppLink = (booking: Booking) => {
    const phone = user?.role === 'owner' ? booking.userPhone : booking.ownerPhone;
    const name = user?.role === 'owner' ? booking.userName : booking.ownerName;
    
    if (!phone) return null;

    const p = sanitizePhone(phone);
    if (!p) return null;

    const message = user?.role === 'owner'
      ? `Halo ${name}, saya pemilik kos *${booking.kosTitle}* di KosKita. Saya ingin membicarakan mengenai pesanan booking Anda.`
      : `Halo ${name}, saya ingin menanyakan status booking saya untuk *${booking.kosTitle}* di KosKita.`;

    return buildWaLink(p, message);
  };

  const handleOpenWhatsApp = async (booking: Booking) => {
    const link = getWhatsAppLink(booking);
    if (!link || !user) return;
    try {
      const action = user.role === 'owner' ? 'Klik WhatsApp ke Pemesan' : 'Klik WhatsApp ke Pemilik';
      await import('@/services/activity').then(({ logUserActivity }) => 
        logUserActivity(user.id, action, booking.kosTitle, `/kos/${booking.kosId}`)
      );
    } catch {}
    window.open(link, '_blank');
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
            <div key={booking.id} className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 group">
              <div className="p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div className="flex items-start gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <Building2 className="w-8 h-8 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-bold text-xl text-foreground tracking-tight">{booking.kosTitle}</h3>
                      {getStatusBadge(booking.status)}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-2 bg-secondary/50 px-3 py-1 rounded-full">
                        <Calendar className="w-4 h-4 text-primary" />
                        Masuk: {new Date(booking.checkInDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                      <span className="flex items-center gap-2 bg-secondary/50 px-3 py-1 rounded-full">
                        <Clock className="w-4 h-4 text-primary" />
                        Durasi: {booking.durationMonths} Bulan
                      </span>
                      {user?.role === 'owner' && (
                        <span className="flex items-center gap-2 bg-primary/5 text-primary px-3 py-1 rounded-full font-bold">
                          <User className="w-4 h-4" />
                          Pemesan: {booking.userName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col lg:items-end gap-4 shrink-0">
                  <div className="lg:text-right">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">Total Pembayaran</p>
                    <p className="text-2xl font-display font-bold text-primary tracking-tight">{formatPrice(booking.totalPrice)}</p>
                  </div>
                  
                  <div className="flex items-center gap-3 flex-wrap">
                    {getWhatsAppLink(booking) && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 rounded-xl px-4 font-bold"
                        onClick={() => handleOpenWhatsApp(booking)}
                      >
                        <MessageCircle className="w-4 h-4 mr-2" /> Chat WA
                      </Button>
                    )}
                    {user?.role !== 'owner' && (booking.status === 'pending' || booking.status === 'approved') && (
                      <Button 
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50 rounded-xl px-4 font-bold"
                        onClick={() => handleCancelBooking(booking)}
                      >
                        <XCircle className="w-4 h-4 mr-2" /> Batalkan
                      </Button>
                    )}
                    {user?.role === 'owner' && booking.status === 'pending' && (
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-red-600 border-red-200 hover:bg-red-50 rounded-xl px-4 font-bold"
                          onClick={() => handleUpdateStatus(booking, 'rejected')}
                        >
                          <XCircle className="w-4 h-4 mr-2" /> Tolak
                        </Button>
                        <Button 
                          size="sm" 
                          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-4 shadow-lg shadow-emerald-200 font-bold"
                          onClick={() => handleUpdateStatus(booking, 'approved')}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" /> Setujui
                        </Button>
                      </div>
                    )}
                    <Button asChild variant="ghost" size="sm" className="rounded-xl px-4 text-xs font-bold hover:bg-secondary">
                      <Link to={`/kos/${booking.kosId}`}>
                        Detail Properti <ExternalLink className="w-3 h-3 ml-2" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
              
              {booking.message && (
                <div className="px-8 py-4 bg-secondary/30 border-t border-border flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center shrink-0 border border-border shadow-sm">
                    <AlertCircle className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Pesan Tambahan</p>
                    <p className="text-sm text-muted-foreground italic font-medium">"{booking.message}"</p>
                  </div>
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
