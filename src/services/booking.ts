import { supabase } from '@/lib/supabase';

export interface Booking {
  id: string;
  kosId: string;
  userId: string;
  ownerId: string;
  checkInDate: string;
  durationMonths: number;
  totalPrice: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed';
  message?: string;
  createdAt: string;
  kosTitle?: string;
  userName?: string;
  userPhone?: string;
  ownerName?: string;
  ownerPhone?: string;
}

export const createBooking = async (bookingData: Omit<Booking, 'id' | 'createdAt' | 'status'>) => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .insert({
        kos_id: bookingData.kosId,
        user_id: bookingData.userId,
        owner_id: bookingData.ownerId,
        check_in_date: bookingData.checkInDate,
        duration_months: bookingData.durationMonths,
        total_price: bookingData.totalPrice,
        message: bookingData.message,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error creating booking:', error);
    return { success: false, error };
  }
};

export const getStudentBookings = async (userId: string): Promise<Booking[]> => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        kos_listings (
          title
        ),
        profiles:owner_id (
          name,
          phone
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((b: any) => ({
      id: b.id,
      kosId: b.kos_id,
      userId: b.user_id,
      ownerId: b.owner_id,
      checkInDate: b.check_in_date,
      durationMonths: b.duration_months,
      totalPrice: b.total_price,
      status: b.status,
      message: b.message,
      createdAt: b.created_at,
      kosTitle: b.kos_listings?.title || 'Properti',
      ownerName: b.profiles?.name || 'Pemilik Kos',
      ownerPhone: b.profiles?.phone || ''
    }));
  } catch (error) {
    console.error('Error fetching student bookings:', error);
    return [];
  }
};

export const getOwnerBookings = async (ownerId: string): Promise<Booking[]> => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        kos_listings (
          title
        ),
        profiles:user_id (
          name,
          phone
        )
      `)
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((b: any) => ({
      id: b.id,
      kosId: b.kos_id,
      userId: b.user_id,
      ownerId: b.owner_id,
      checkInDate: b.check_in_date,
      durationMonths: b.duration_months,
      totalPrice: b.total_price,
      status: b.status,
      message: b.message,
      createdAt: b.created_at,
      kosTitle: b.kos_listings?.title || 'Properti',
      userName: b.profiles?.name || 'User',
      userPhone: b.profiles?.phone || ''
    }));
  } catch (error) {
    console.error('Error fetching owner bookings:', error);
    return [];
  }
};

export const updateBookingStatus = async (bookingId: string, status: Booking['status']) => {
  try {
    if (status === 'approved') {
      try {
        const { error: rpcError } = await supabase.rpc('approve_booking_transactional', { p_booking_id: bookingId });
        if (!rpcError) return { success: true };
      } catch {}
    }
    if (status === 'cancelled') {
      try {
        const { error: rpcError } = await supabase.rpc('cancel_booking_transactional', { p_booking_id: bookingId });
        if (!rpcError) return { success: true };
      } catch {}
    }
    const { error } = await supabase
      .from('bookings')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', bookingId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error updating booking status:', error);
    return { success: false, error };
  }
};
