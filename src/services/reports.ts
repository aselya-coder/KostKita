import { supabase } from '@/lib/supabase';
import { notifyAdmins } from './notifications';

export type ReportType = 'user' | 'kos' | 'item';

export const submitReport = async (reporterId: string, targetId: string, type: ReportType, reason: string) => {
  const { data, error } = await supabase
    .from('reports')
    .insert([
      {
        reporter_id: reporterId,
        target_id: targetId,
        type,
        reason,
        status: 'new',
      },
    ])
    .select();

  if (error) {
    console.error('Error submitting report:', error);
    return { success: false, error };
  }

  // Notify admins
  await notifyAdmins(
    'Laporan Baru',
    `Ada laporan baru mengenai ${type}. Alasan: ${reason.substring(0, 50)}${reason.length > 50 ? '...' : ''}`,
    '/admin-dashboard/reports'
  );

  return { success: true, data: data?.[0] };
};
