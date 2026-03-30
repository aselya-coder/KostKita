import { supabase } from '@/lib/supabase';
import { type Inquiry } from '@/data/mockData';

export const getInquiries = async (ownerId: string): Promise<Inquiry[]> => {
  const { data, error } = await supabase
    .from('inquiries')
    .select(`
      *,
      kos_listings (
        title
      )
    `)
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching inquiries:', error);
    return [];
  }

  return (data || []).map((iq: any) => ({
    id: iq.id.toString(),
    ownerId: iq.owner_id,
    senderName: iq.sender_name || 'Tamu',
    senderPhone: iq.sender_phone || '',
    propertyName: iq.kos_listings?.title || 'Kos Kita',
    message: iq.message || '',
    time: new Date(iq.created_at).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
    status: iq.status
  })) as Inquiry[];
};

export const updateInquiryStatus = async (id: string, status: 'new' | 'replied' | 'archived') => {
  const { error } = await supabase
    .from('inquiries')
    .update({ status })
    .eq('id', id);

  if (error) {
    console.error('Error updating inquiry status:', error);
    return { success: false, error };
  }
  return { success: true };
};

export const deleteInquiry = async (id: string) => {
  const { error } = await supabase
    .from('inquiries')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting inquiry:', error);
    return { success: false, error };
  }
  return { success: true };
};
