import { useState, useEffect } from "react";
import { type Notification, mockNotifications } from "@/data/mockData";
import { useAuth } from "@/context/AuthContext";

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Load and sync notifications
  useEffect(() => {
    if (!user) return;

    const savedStatus = localStorage.getItem(`koskita_notif_status_${user.id}`);
    const readIds = savedStatus ? JSON.parse(savedStatus) : [];
    
    // Filter notifs for current user and apply read status from localStorage
    const userNotifs = mockNotifications
      .filter(n => n.userId === user.id)
      .map(n => ({
        ...n,
        isRead: readIds.includes(n.id) || n.isRead
      }));

    setNotifications(userNotifs);
  }, [user]);

  const markAsRead = (id: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, isRead: true } : n);
      
      // Save read status to localStorage
      const readIds = updated.filter(n => n.isRead).map(n => n.id);
      if (user) {
        localStorage.setItem(`koskita_notif_status_${user.id}`, JSON.stringify(readIds));
      }
      
      return updated;
    });
  };

  const markAllAsRead = () => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, isRead: true }));
      
      const readIds = updated.map(n => n.id);
      if (user) {
        localStorage.setItem(`koskita_notif_status_${user.id}`, JSON.stringify(readIds));
      }
      
      return updated;
    });
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return { notifications, unreadCount, markAsRead, markAllAsRead, setNotifications };
}
