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

export const notifyAdmins = async (title: string, message: string, link: string) => {
  try {
    // 1. Get all admin user IDs
    const { data: admins, error: adminError } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin');

    if (adminError) throw adminError;
    if (!admins || admins.length === 0) return;

    // 2. Create notification for each admin
    const notifications = admins.map(admin => ({
      user_id: admin.id,
      title,
      message,
      link,
      type: 'system',
    }));

    // 3. Insert notifications
    const { error: notificationError } = await supabase.from('notifications').insert(notifications);
    if (notificationError) throw notificationError;

  } catch (error) {
    console.error('Error sending admin notifications:', error);
    // We don't re-throw here because failing to notify shouldn't block the user action
  }
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
