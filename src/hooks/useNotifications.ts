import { useState, useEffect } from "react";
import { type Notification } from "@/data/mockData";
import { useAuth } from "@/hooks/useAuth";
import { 
  getNotifications, 
  markNotificationAsRead as markAsReadService, 
  markAllNotificationsAsRead as markAllAsReadService,
  deleteNotification as deleteNotifService 
} from "@/services/notifications";
import { supabase } from "@/lib/supabase";

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load and sync notifications
  const fetchNotifications = async () => {
    if (!user) return;
    setIsLoading(true);
    const data = await getNotifications(user.id);
    // Map database fields to interface if needed
    const mappedData = data.map((n: any) => ({
      id: n.id,
      userId: n.user_id,
      title: n.title,
      message: n.message,
      time: new Date(n.created_at).toLocaleString(), // Simple formatting
      isRead: n.is_read,
      type: n.type,
      link: n.link
    }));
    setNotifications(mappedData);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
    if (!user) return;

    let mounted = true;
    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, () => {
        fetchNotifications();
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          if (!mounted && channel) {
            supabase.removeChannel(channel);
          }
        }
      });

    return () => {
      mounted = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [user]);

  const markAsRead = async (id: string) => {
    const { success } = await markAsReadService(id);
    if (success) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    const { success } = await markAllAsReadService(user.id);
    if (success) {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    }
  };

  const deleteNotif = async (id: string) => {
    const { success } = await deleteNotifService(id);
    if (success) {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return { notifications, unreadCount, isLoading, markAsRead, markAllAsRead, deleteNotif, fetchNotifications };
}
