import { supabase } from '@/lib/supabase';

export const getNotifications = async (userId: string) => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
  return data;
};

export const markNotificationAsRead = async (id: string) => {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id);

  if (error) {
    console.error('Error marking notification as read:', error);
    return { success: false, error };
  }
  return { success: true };
};

export const markAllNotificationsAsRead = async (userId: string) => {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId);

  if (error) {
    console.error('Error marking all notifications as read:', error);
    return { success: false, error };
  }
  return { success: true };
};

export const deleteNotification = async (id: string) => {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting notification:', error);
    return { success: false, error };
  }
  return { success: true };
};
